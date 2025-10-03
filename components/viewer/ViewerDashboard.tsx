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

  // Debug: Log user object for troubleshooting
  useEffect(() => {
    console.log("ViewerDashboard user object:", user);
  }, [user]);

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

    let userFriendlyError = "";
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('status', 'Active')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error("Error fetching active campaigns:", error.message);
        userFriendlyError = "Could not load campaigns. Please try again later.";
        if (error.message.includes('violates row-level security policy')) {
          userFriendlyError = `There's a database security policy blocking access to campaigns. Make sure Row Level Security (RLS) is configured to allow viewers to see active campaigns.`;
          console.error(
`Hint: Missing Row Level Security (RLS) policy on 'campaigns' table. 
CREATE POLICY "Allow public read access to active campaigns" ON public.campaigns FOR SELECT USING (status = 'Active');
`
          );
        }
        setFetchError(userFriendlyError);
        if (initialLoad) setCampaigns([]);
        setIsLoading(false); // Ensure spinner turns off on error
        setIsFetchingMore(false);
        return;
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
        setFetchError(null);
      }
    } catch (err) {
      console.error("Exception in fetchCampaignsByPage:", err);
      setFetchError("Unexpected error loading campaigns. See console for details.");
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
  }, [fetchCampaignsByPage, user.id]);

  const handleLoadMore = () => {
    fetchCampaignsByPage(page, false);
  };

  // ...rest of your dashboard logic remains unchanged...

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
  };

  // ...rest of the file (handleWatchAd, handleClaimReward, etc) unchanged...

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
