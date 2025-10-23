import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Campaign, WatchedAd, User } from '../../types';
import AdFeed from './AdFeed';
import LitFeed from './LitFeed';
import AdPlayer from './AdPlayer';
import ViewerHeader from './ViewerHeader';
import BottomNavBar, { ViewerTab } from './BottomNavBar';
import ProfilePage from './ProfilePage';
import { supabase } from '../../supabaseClient';
import Spinner from '../ui/Spinner';
import Card from '../ui/Card';
import ErrorDisplay from '../ui/ErrorDisplay';

interface ViewerDashboardProps {
  user: User;
  onLogout: () => void;
  onRewardClaimed: (campaign: Campaign, reward: number) => Promise<void>;
}

// Fix: Made the data formatting more robust to prevent crashes from malformed data.
const formatCampaigns = (data: any[]): Campaign[] => {
    return data.map((c): Campaign => ({
      id: c.id,
      advertiser_id: c.advertiser_id,
      name: c.name || "Untitled Campaign",
      budget: c.budget || 0,
      impressions: c.impressions || 0,
      clicks: c.clicks || 0,
      status: c.status as Campaign['status'] || 'Pending',
      adCreativeUrl: c.ad_creative_url || '',
      thumbnailUrl: c.thumbnail_url ?? undefined,
      reward: c.reward || 0,
      rewardedPoints: c.rewarded_points ?? 0,
      campaignGoal: c.campaign_goal || 'Brand Awareness',
      ctaText: c.cta_text || 'Learn More',
      landingPageUrl: c.landing_page_url || '#',
      category: c.category || 'General',
      type: c.type || 'Video',
      company: (c.company && typeof c.company === 'object') 
        ? {
            name: c.company.name || 'Unknown Company',
            logoUrl: c.company.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.company.name || 'A')}&background=333&color=fff`,
            subscriberCount: c.company.subscriberCount || 0
          }
        : { name: 'Unknown Company', logoUrl: `https://ui-avatars.com/api/?name=U&background=333&color=fff`, subscriberCount: 0 },
      duration: c.duration || 0,
      uploadError: c.upload_error ?? undefined,
      discount: c.discount ?? undefined,
    }));
};

const ViewerDashboard: React.FC<ViewerDashboardProps> = ({ user, onLogout, onRewardClaimed }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeAd, setActiveAd] = useState<Campaign | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [watchedHistory, setWatchedHistory] = useState<WatchedAd[]>([]);
  const [activeTab, setActiveTab] = useState<ViewerTab>('Lit');
  const [searchQuery, setSearchQuery] = useState('');
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [retryCounter, setRetryCounter] = useState(0);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const CAMPAIGNS_PER_PAGE = 10;

  const handleRetry = () => setRetryCounter(c => c + 1);

  const fetchCampaignsByPage = useCallback(async (pageNum: number, initialLoad = false) => {
    if (initialLoad) {
        setIsLoading(true);
        setFetchError(null);
    } else {
        if (isFetchingMore || !hasMore) return;
        setIsFetchingMore(true);
    }
    
    const from = (pageNum - 1) * CAMPAIGNS_PER_PAGE;
    const to = from + CAMPAIGNS_PER_PAGE - 1;

    try {
        const { data, error } = await supabase
          .from('campaigns')
          .select('*')
          .eq('status', 'Active')
          .order('created_at', { ascending: false })
          .range(from, to);

        if (error) {
            throw error;
        }
        
        if (data) {
          const newCampaigns = formatCampaigns(data);
          if (initialLoad) {
              setCampaigns(newCampaigns);
              setPage(2);
          } else {
              setCampaigns(prev => [...prev, ...newCampaigns]);
              setPage(p => p + 1);
          }
          setHasMore(data.length === CAMPAIGNS_PER_PAGE);
        }
    } catch (error: any) {
        console.error("Error fetching active campaigns:", error);
        const errorMessage = error?.message || 'An unknown error occurred.';
        let userFriendlyError;

        if (errorMessage.toLowerCase().includes('failed to fetch')) {
            userFriendlyError = `Network Error: Could not connect to the database. This is a common setup issue. Please check the following:
\n1. **Is your Supabase project running?** Free projects are paused after 1 week of inactivity. Please go to your Supabase dashboard to reactivate it.
\n2. **Is CORS configured correctly?** Your app's domain (${window.location.origin}) must be listed in your Supabase project's API settings under "CORS Configuration".
\n3. **Is your internet connection stable?**`;
        } else if (errorMessage.includes('violates row-level security policy')) {
            userFriendlyError = `There's a database security policy blocking access to campaigns. If you are the developer, please ensure Row Level Security (RLS) is configured to allow authenticated users to view active campaigns.`;
            console.error(`Hint: This error is commonly caused by a missing Row Level Security (RLS) policy on the 'campaigns' table. Example: CREATE POLICY "Allow public read access to active campaigns" ON public.campaigns FOR SELECT USING (status = 'Active'::text);`);
        } else {
            userFriendlyError = `An unexpected error occurred while fetching campaigns. Details: ${errorMessage}`;
        }

        setFetchError(userFriendlyError);
        if (initialLoad) setCampaigns([]);
    } finally {
        if (initialLoad) setIsLoading(false);
        else setIsFetchingMore(false);
    }
  }, [isFetchingMore, hasMore]);

  useEffect(() => {
    const fetchInitialData = () => fetchCampaignsByPage(1, true);
    fetchInitialData();

    const intervalId = setInterval(fetchInitialData, 15000);

    const channel = supabase.channel(`campaigns-viewer-${user.id}`)
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'campaigns' },
            (payload) => {
                console.log('Campaigns table change detected for viewer, refetching.');
                clearInterval(intervalId);
                fetchInitialData();
            }
        )
        .subscribe();

    return () => {
        clearInterval(intervalId);
        supabase.removeChannel(channel);
    };
  }, [fetchCampaignsByPage, user.id, retryCounter]);

  const handleLoadMore = () => {
    fetchCampaignsByPage(page, false);
  };


  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      
      try {
        // Step 1: Fetch the user's last 50 ad views.
        const { data: viewsData, error: viewsError } = await supabase
          .from('ad_views')
          .select('created_at, campaign_id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (viewsError) throw viewsError;
        
        if (!viewsData || viewsData.length === 0) {
          setWatchedHistory([]);
          return;
        }

        // Step 2: Fetch details for all watched campaigns in a single query.
        const campaignIds = viewsData.map(v => v.campaign_id);
        const { data: campaignsData, error: campaignsError } = await supabase
          .from('campaigns')
          .select('*')
          .in('id', campaignIds);

        if (campaignsError) throw campaignsError;

        if (campaignsData) {
          const formattedCampaignsList = formatCampaigns(campaignsData);
          const campaignsMap = new Map(formattedCampaignsList.map(c => [c.id, c]));
          
          const history = viewsData.map(view => {
            const campaignData = campaignsMap.get(view.campaign_id);
            if (!campaignData) return null;
            
            return {
              ...campaignData,
              watchedOn: new Date(view.created_at),
            };
          }).filter((item): item is WatchedAd => item !== null);

          setWatchedHistory(history);
        }
      } catch (error: any) {
        // Gracefully handle cases where the 'ad_views' table might be missing.
        if (error.message && (error.message.includes("does not exist") || error.message.includes("schema cache"))) {
          console.warn(
`Watch History feature is disabled because the 'ad_views' table was not found in the database.
This is expected if you haven't run the full database setup script.
To enable history, please ensure your Supabase schema is up to date.`
          );
        } else {
          console.error("An unexpected error occurred while fetching watch history:", error.message || error);
        }
        setWatchedHistory([]); // Gracefully degrade by showing an empty history.
      }
    };

    fetchHistory();
  }, [user]);

  const handleWatchAd = useCallback((ad: Campaign) => {
    setActiveAd(ad);
    setIsPlayerOpen(true);
  }, []);

  const handleClaimReward = useCallback(async (ad: Campaign, reward: number) => {
    try {
        await onRewardClaimed(ad, reward);
        // Update history for immediate UI feedback on success
        setWatchedHistory(prevHistory => [{ ...ad, watchedOn: new Date() }, ...prevHistory]);
    } catch (error: any) {
        // Error is already handled and alerted in onRewardClaimed (App.tsx)
        // We just log it here for dashboard-specific context.
        console.error("Failed to claim reward from dashboard context:", error.message || error);
    }
  }, [onRewardClaimed]);

  const handleClosePlayer = useCallback(() => {
    setIsPlayerOpen(false);
  }, []);
  
  // Filter out campaigns that have already been watched
  const watchedCampaignIds = new Set(watchedHistory.map(h => h.id));
  const availableCampaigns = campaigns.filter(c => !watchedCampaignIds.has(c.id));

  const searchedCampaigns = availableCampaigns.filter(campaign => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true; // Show all if search is empty
    return (
      campaign.name.toLowerCase().includes(query) ||
      (campaign.category && campaign.category.toLowerCase().includes(query)) ||
      campaign.company.name.toLowerCase().includes(query)
    );
  });

  const exploreCampaigns = useMemo(() => {
    return [...searchedCampaigns].sort((a, b) => a.name.localeCompare(b.name));
  }, [searchedCampaigns]);

  const litCampaigns = useMemo(() => {
      return [...searchedCampaigns]
          .filter(c => c.type === 'Shortz')
          .sort((a, b) => b.impressions - a.impressions);
  }, [searchedCampaigns]);

  const mainContentClass = activeTab === 'Lit'
    ? 'flex-grow h-full overflow-hidden' // Let LitFeed handle its own scrolling and layout
    : 'flex-grow container mx-auto px-4 py-8 pb-24';

  const renderContent = () => {
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Spinner className="h-12 w-12" />
            </div>
        );
    }

    if (fetchError) {
        return (
            <div className="flex justify-center items-center h-full p-4">
              <ErrorDisplay
                title="Could Not Load Campaigns"
                message={fetchError}
                onRetry={handleRetry}
              />
            </div>
        );
    }
    
    switch(activeTab) {
      case 'Explore':
        return <AdFeed 
                  campaigns={exploreCampaigns} 
                  onWatchAd={handleWatchAd} 
                  onLoadMore={handleLoadMore}
                  hasMore={hasMore && !searchQuery}
                  isLoadingMore={isFetchingMore}
               />;
      case 'Lit':
        return <LitFeed 
                  campaigns={litCampaigns} 
                  onRewardClaimed={handleClaimReward} 
                  onLoadMore={handleLoadMore}
                  hasMore={hasMore && !searchQuery}
                  isLoadingMore={isFetchingMore}
                  searchQuery={searchQuery}
               />;
      case 'You':
        return <ProfilePage user={user} onLogout={onLogout} watchedHistory={watchedHistory} rewardPoints={user.rewardPoints || 0} />;
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-dark text-off-white">
      <ViewerHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      
      <main className={mainContentClass}>
         {renderContent()}
      </main>
      
      <BottomNavBar activeTab={activeTab} onTabChange={setActiveTab} />

      {activeAd && (
        <AdPlayer 
          ad={activeAd} 
          isOpen={isPlayerOpen}
          onClaimReward={handleClaimReward} 
          onClose={handleClosePlayer} 
        />
      )}
    </div>
  );
};

export default ViewerDashboard;