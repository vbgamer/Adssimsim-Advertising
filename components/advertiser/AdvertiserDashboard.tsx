
import React, { useState, useEffect, useCallback } from 'react';
import { Campaign, User } from '../../types';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import CreateCampaignForm from './CreateCampaignForm';
import CampaignList from './CampaignList';
import Card from '../ui/Card';
import { authService, campaignService, analyticsService, historyService } from '../../services/api';
import EditProfileModal from './EditProfileModal';
import AudienceAnalytics from './AudienceAnalytics';
import Spinner from '../ui/Spinner';
import ActivityFeed, { Activity } from './ActivityFeed';
import ErrorDisplay from '../ui/ErrorDisplay';

interface AdvertiserDashboardProps {
  user: User;
  onLogout: () => void;
  onUserUpdated: (updatedData: Partial<User>) => void;
}

const SubmissionSuccessToast = ({ show, message, onClose }: { show: boolean; message: string; onClose: () => void; }) => {
    useEffect(() => {
        if (show) {
            const timer = setTimeout(() => {
                onClose();
            }, 8000); // Auto-hide after 8 seconds
            return () => clearTimeout(timer);
        }
    }, [show, onClose]);

    return (
        <div
            aria-live="assertive"
            className={`fixed top-5 right-5 z-50 transition-all duration-500 ease-in-out ${
                show ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
            }`}
        >
            {show && (
                <div className="bg-primary-500 text-off-white p-4 rounded-lg shadow-lg flex items-start gap-3 max-w-sm shadow-primary-500/40">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <p className="font-bold">Campaign Submitted!</p>
                        <p className="text-sm">{message}</p>
                    </div>
                     <button onClick={onClose} className="-mt-2 -mr-2 p-1 rounded-full hover:bg-primary-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
};

const UploadingToast = ({ campaignName, onClose }: { campaignName: string | null; onClose: () => void; }) => {
    const show = !!campaignName;
    return (
        <div
            aria-live="assertive"
            className={`fixed top-5 right-5 z-50 transition-all duration-500 ease-in-out ${
                show ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
            }`}
        >
            {show && (
                <div className="bg-sky-500 text-off-white p-4 rounded-lg shadow-lg flex items-start gap-3 max-w-sm shadow-sky-500/40">
                    <Spinner className="h-6 w-6 flex-shrink-0 mt-0.5 border-t-white" />
                    <div>
                        <p className="font-bold">Upload in Progress</p>
                        <p className="text-sm">Your campaign "{campaignName}" is uploading. This may take a few minutes for large files.</p>
                    </div>
                     <button onClick={onClose} className="-mt-2 -mr-2 p-1 rounded-full hover:bg-sky-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
};

// This function remains useful for ensuring data consistency from the API.
const formatCampaigns = (data: any[]): Campaign[] => {
    return data.map((c): Campaign => ({
      id: c.id,
      // FIX: Changed advertiserId to advertiser_id to match the Campaign type.
      advertiser_id: c.advertiserId,
      name: c.name || "Untitled Campaign",
      budget: c.budget || 0,
      impressions: c.impressions || 0,
      clicks: c.clicks || 0,
      status: c.status as Campaign['status'] || 'Pending',
      adCreativeUrl: c.adCreativeUrl || '',
      thumbnailUrl: c.thumbnailUrl ?? undefined,
      reward: c.reward || 0,
      rewardedPoints: c.rewardedPoints ?? 0,
      campaignGoal: c.campaignGoal || 'Brand Awareness',
      ctaText: c.ctaText || 'Shop Now',
      landingPageUrl: c.landingPageUrl || '#',
      category: c.category || 'General',
      type: c.type || 'Video',
      company: (c.advertiserProfile && typeof c.advertiserProfile === 'object') 
        ? {
            name: c.advertiserProfile.name || 'Unknown Company',
            logoUrl: c.advertiserProfile.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.advertiserProfile.name || 'A')}&background=333&color=fff`,
            subscriberCount: c.advertiserProfile.subscriberCount || 0
          }
        : { name: 'Unknown Company', logoUrl: `https://ui-avatars.com/api/?name=U&background=333&color=fff`, subscriberCount: 0 },
      duration: c.duration || 0,
      uploadError: c.uploadError ?? undefined,
      discount: c.discount ?? undefined,
    }));
};

const AdvertiserDashboard: React.FC<AdvertiserDashboardProps> = ({ user, onLogout, onUserUpdated }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successToastMessage, setSuccessToastMessage] = useState('');
  const [uploadingCampaignName, setUploadingCampaignName] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [retryCounter, setRetryCounter] = useState(0);

  const [activities, setActivities] = useState<Activity[]>([]);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const CAMPAIGNS_PER_PAGE = 10;

  const fetchAdvertiserCampaigns = useCallback(async (pageNum: number, initialLoad = false) => {
    if (initialLoad) {
        setIsLoading(true);
        setFetchError(null);
    } else {
        if (isFetchingMore || !hasMore) return;
        setIsFetchingMore(true);
    }
    
    try {
        const response = await campaignService.getCampaigns({ 
            advertiser_id: user.id, 
            page: pageNum, 
            page_size: CAMPAIGNS_PER_PAGE 
        });

        if (response.results) {
          const newCampaigns = formatCampaigns(response.results);
          if (initialLoad) {
              setCampaigns(prev => {
                  const freshCampaignsMap = new Map(newCampaigns.map(c => [c.id, c]));
                  const tempCampaigns = prev.filter(p => (p.status === 'Uploading' || p.status === 'Upload Failed') && !freshCampaignsMap.has(p.id));
                  return [...tempCampaigns, ...newCampaigns];
              });
          } else {
              setCampaigns(prev => [...prev, ...newCampaigns]);
          }
          setPage(pageNum + 1);
          setHasMore(!!response.next);
        }
    } catch (error: any) {
        console.error("Error fetching advertiser campaigns:", error);
        setFetchError(error.message || 'An unexpected error occurred while fetching your campaigns.');
        if (initialLoad) setCampaigns([]);
    } finally {
        if (initialLoad) setIsLoading(false);
        else setIsFetchingMore(false);
    }
  }, [user.id, isFetchingMore, hasMore]);


  useEffect(() => {
    fetchAdvertiserCampaigns(1, true);

    // Polling as a fallback for real-time updates
    const intervalId = setInterval(() => fetchAdvertiserCampaigns(1, true), 30000);

    return () => {
        clearInterval(intervalId);
    };
  }, [user.id, retryCounter, fetchAdvertiserCampaigns]);


  // Effect for fetching and subscribing to the live activity feed
  useEffect(() => {
    if (campaigns.length === 0) return;
    const campaignIds = campaigns.map(c => c.id);

    const fetchInitialActivities = async () => {
      try {
        // FIX: Changed historyService to analyticsService to call the correct function.
        const data = await analyticsService.getAdvertiserActivity({ campaign_ids: campaignIds });
        const initialActivities = data.map((view: any) => {
          const campaign = campaigns.find(c => c.id === view.campaignId);
          if (!campaign) return null;
          return {
            id: `view-${view.campaignId}-${view.createdAt}`,
            campaignName: campaign.name,
            reward: campaign.reward,
            timestamp: new Date(view.createdAt),
          };
        }).filter((a): a is Activity => a !== null);
        setActivities(initialActivities);
      } catch (error) {
          console.warn("Could not fetch activity feed:", error);
      }
    };
    fetchInitialActivities();
  }, [campaigns, user.id]); 


  const handleLoadMore = () => {
    fetchAdvertiserCampaigns(page, false);
  };

  const handleCampaignSubmit = async (
    newCampaignData: Omit<Campaign, 'id' | 'impressions' | 'clicks' | 'status' | 'advertiser_id' | 'thumbnailUrl'>,
    creativeFile: File,
    thumbnailFile: File | null
  ) => {
    setIsModalOpen(false);

    const tempId = `temp-${Date.now()}`;
    const tempCampaign: Campaign = {
      ...newCampaignData,
      id: tempId,
      advertiser_id: user.id,
      impressions: 0,
      clicks: 0,
      status: 'Uploading',
      adCreativeUrl: URL.createObjectURL(creativeFile),
      thumbnailUrl: thumbnailFile ? URL.createObjectURL(thumbnailFile) : undefined,
      rewardedPoints: 0,
    };
    setCampaigns(prev => [tempCampaign, ...prev]);
    setUploadingCampaignName(newCampaignData.name);

    const formData = new FormData();
    formData.append('name', newCampaignData.name);
    formData.append('budget', String(newCampaignData.budget));
    formData.append('reward', String(newCampaignData.reward));
    formData.append('campaign_goal', newCampaignData.campaignGoal);
    formData.append('cta_text', newCampaignData.ctaText);
    formData.append('landing_page_url', newCampaignData.landingPageUrl);
    formData.append('type', newCampaignData.type);
    formData.append('category', newCampaignData.category);
    formData.append('company', JSON.stringify(newCampaignData.company));
    formData.append('duration', String(newCampaignData.duration));
    formData.append('status', 'Active'); // Set status to Active for immediate visibility
    formData.append('ad_creative_file', creativeFile);
    if (thumbnailFile) {
        formData.append('thumbnail_file', thumbnailFile);
    }
    
    try {
        await campaignService.createCampaign(formData);
        
        setCampaigns(prev => prev.filter(c => c.id !== tempId));
        setUploadingCampaignName(null);
        setSuccessToastMessage(`Your campaign "${newCampaignData.name}" has been launched and is now live!`);
        setShowSuccessToast(true);
        setRetryCounter(c => c + 1); // Trigger a refetch

    } catch (error: any) {
        setUploadingCampaignName(null);
        console.error("Error creating campaign:", error);
        const finalErrorMessage = `The campaign upload failed. Details: ${error.message}`;
        setCampaigns(prev => prev.map(c => c.id === tempId ? { ...c, status: 'Upload Failed', uploadError: finalErrorMessage } : c));
    }
  }

  const handleProfileUpdate = async (updatedData: { username: string; logoFile?: File; bannerFile?: File }) => {
    try {
        const formData = new FormData();
        formData.append('username', updatedData.username);
        if (updatedData.logoFile) {
            formData.append('logo_file', updatedData.logoFile);
        }
        if (updatedData.bannerFile) {
            formData.append('banner_file', updatedData.bannerFile);
        }

        const updatedUser = await authService.updateProfile(formData);
        onUserUpdated(updatedUser);
        setIsEditProfileModalOpen(false);
    } catch (error: any) {
        console.error('Error updating profile:', error);
        throw new Error(error.message || 'Failed to update profile. Please try again.');
    }
  };

  return (
    <div className="min-h-screen text-white bg-dark">
      <SubmissionSuccessToast 
        show={showSuccessToast}
        message={successToastMessage}
        onClose={() => setShowSuccessToast(false)}
      />
      <UploadingToast
        campaignName={uploadingCampaignName}
        onClose={() => setUploadingCampaignName(null)}
      />
      {/* Header */}
      <header className="bg-charcoal/80 backdrop-blur-sm sticky top-0 z-40 border-b border-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
           <span className="text-xl font-bold text-white">Advertiser Dashboard</span>
           <div className="flex items-center gap-4">
             <Button onClick={() => setIsEditProfileModalOpen(true)} variant="secondary">Edit Profile</Button>
             <Button onClick={() => setIsModalOpen(true)} variant="primary">Create Campaign</Button>
             <Button onClick={onLogout}>Sign Out</Button>
           </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <Spinner className="h-12 w-12" />
            </div>
          ) : fetchError ? (
            <ErrorDisplay
              title="Could Not Load Your Campaigns"
              message={fetchError}
              onRetry={() => setRetryCounter(c => c + 1)}
            />
          ) : (
            <div className="space-y-12">
              {/* Live Activity Section */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    Live Activity
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                </h2>
                <ActivityFeed activities={activities} />
              </div>

              {/* Campaigns Section */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Your Campaigns</h2>
                <CampaignList 
                    campaigns={campaigns} 
                    onLoadMore={handleLoadMore}
                    hasMore={hasMore}
                    isLoadingMore={isFetchingMore}
                    onCreateCampaignClick={() => setIsModalOpen(true)}
                />
              </div>

               {/* Audience Analytics */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Audience Analytics</h2>
                <AudienceAnalytics />
              </div>
            </div>
          )}
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create a New Campaign" subtitle="Fill in the details to launch your ad to thousands of viewers.">
          <CreateCampaignForm onCampaignSubmit={handleCampaignSubmit} onClose={() => setIsModalOpen(false)} company={{ name: user.username, logoUrl: user.logoUrl || '', subscriberCount: user.subscribers || 0 }} />
      </Modal>

      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        user={user}
        onProfileUpdate={handleProfileUpdate}
      />
    </div>
  );
};

export default AdvertiserDashboard;
