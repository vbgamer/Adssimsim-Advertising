
import React, { useState, useCallback, useEffect } from 'react';
import { Campaign, WatchedAd, User } from '../../types';
import AdFeed from './AdFeed';
import LitFeed from './LitFeed';
import AdPlayer from './AdPlayer';
import ViewerHeader from './ViewerHeader';
import BottomNavBar, { ViewerTab } from './BottomNavBar';
import ProfilePage from './ProfilePage';
import { supabase } from '../../supabaseClient';
import Spinner from '../ui/Spinner';

interface ViewerDashboardProps {
  user: User;
  onLogout: () => void;
  onRewardClaimed: (campaign: Campaign, reward: number) => Promise<void>;
}

const formatCampaigns = (data: any[]): Campaign[] => {
    return data.map((c): Campaign => ({
      id: c.id,
      advertiser_id: c.advertiser_id,
      name: c.name,
      budget: c.budget,
      impressions: c.impressions,
      clicks: c.clicks,
      status: c.status as Campaign['status'],
      adCreativeUrl: c.ad_creative_url,
      thumbnailUrl: c.thumbnail_url ?? undefined,
      reward: c.reward,
      rewardedPoints: c.rewarded_points ?? 0,
      campaignGoal: c.campaign_goal,
      ctaText: c.cta_text,
      // Fix: Corrected property name from snake_case to camelCase to match the Campaign type.
      landingPageUrl: c.landing_page_url,
      category: c.category,
      type: c.type,
      company: c.company as Campaign['company'],
      duration: c.duration,
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

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const CAMPAIGNS_PER_PAGE = 10;

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

    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('status', 'Active')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error fetching active campaigns:", error.message);
      let userFriendlyError = "Could not load campaigns. Please try again later.";
      if (error.message.includes('violates row-level security policy')) {
        userFriendlyError = `There's a database security policy blocking access to campaigns. If you are the developer, please ensure Row Level Security (RLS) is configured to allow authenticated users to view active campaigns.`;
        console.error(
`Hint: This error is commonly caused by a missing Row Level Security (RLS) policy on the 'campaigns' table. Logged-in viewers need permission to read active campaigns.
Please go to your Supabase project's SQL Editor and ensure a policy exists for authenticated users to view active campaigns.

Example policy for allowing anyone to view active campaigns (if not already present):
CREATE POLICY "Allow public read access to active campaigns" ON public.campaigns FOR SELECT USING (status = 'Active'::text);
`
        );
      }
      setFetchError(userFriendlyError);
      if (initialLoad) setCampaigns([]);
    } else if (data) {
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

    if (initialLoad) setIsLoading(false);
    else setIsFetchingMore(false);
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
                
                clearInterval(intervalId);
                fetchInitialData();
            }
        )
        .subscribe();

    return () => {
        clearInterval(intervalId);
        supabase.removeChannel(channel);
    };
  }, [fetchCampaignsByPage, user.id]);

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
            <div className="text-center py-16 bg-red-900/20 p-6 rounded-lg max-w-3xl mx-auto">
                <h3 className="text-xl font-bold text-red-400">Could Not Load Campaigns</h3>
                <p className="text-red-300 mt-2">{fetchError}</p>
            </div>
        );
    }
    
    switch(activeTab) {
      case 'Explore':
        return <AdFeed 
                  campaigns={searchedCampaigns} 
                  onWatchAd={handleWatchAd} 
                  onLoadMore={handleLoadMore}
                  hasMore={hasMore && !searchQuery}
                  isLoadingMore={isFetchingMore}
               />;
      case 'Lit':
        return <LitFeed 
                  campaigns={searchedCampaigns.filter(c => c.type === 'Video')} 
                  onWatchAd={handleWatchAd} 
                  onLoadMore={handleLoadMore}
                  hasMore={hasMore && !searchQuery}
                  isLoadingMore={isFetchingMore}
               />;
      case 'You':
        return <ProfilePage user={user} onLogout={onLogout} watchedHistory={watchedHistory} rewardPoints={user.rewardPoints || 0} />;
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <ViewerHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      
      <main className="flex-grow container mx-auto px-4 py-8 pb-24">
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
