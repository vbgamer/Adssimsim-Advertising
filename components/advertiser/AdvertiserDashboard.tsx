

import React, { useState, useEffect, useCallback } from 'react';
import { Campaign, User } from '../../types';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import CreateCampaignForm from './CreateCampaignForm';
import CampaignList from './CampaignList';
import Card from '../ui/Card';
import { supabase } from '../../supabaseClient';
import EditProfileModal from './EditProfileModal';
import AudienceAnalytics from './AudienceAnalytics';
import Spinner from '../ui/Spinner';
import AdjustDiscountModal from './AdjustDiscountModal';

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
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <p className="font-bold">Campaign Submitted!</p>
                        <p className="text-sm">{message}</p>
                    </div>
                     <button onClick={onClose} className="-mt-2 -mr-2 p-1 rounded-full hover:bg-primary-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
};

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
      uploadError: c.upload_error ?? undefined,
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

  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [selectedCampaignForDiscount, setSelectedCampaignForDiscount] = useState<Campaign | null>(null);

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

    const from = (pageNum - 1) * CAMPAIGNS_PER_PAGE;
    const to = from + CAMPAIGNS_PER_PAGE - 1;

    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('advertiser_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error fetching advertiser campaigns:", error.message);
      let userFriendlyError = "Could not load your campaigns. Please try again later.";
      if (error.message.includes('violates row-level security policy')) {
          userFriendlyError = "There's a database security policy blocking access to your campaigns. If you are the developer, please ensure Row Level Security (RLS) is configured to allow advertisers to view their own campaigns.";
          console.error(
`Hint: This error is commonly caused by a missing Row Level Security (RLS) policy on the 'campaigns' table. Advertisers need permission to view their own campaigns.
Please go to your Supabase project's SQL Editor and ensure a policy exists for this.

Example policy for allowing an advertiser to see their own campaigns:
CREATE POLICY "Allow advertiser to read their own campaigns" ON public.campaigns FOR SELECT USING (auth.uid() = advertiser_id);
`
          );
      }
      setFetchError(userFriendlyError);
      if (initialLoad) setCampaigns([]);
    } else if (data) {
      const newCampaigns = formatCampaigns(data);
      const uniqueNewCampaigns = newCampaigns.filter(nc => !campaigns.some(c => c.id === nc.id && c.status !== 'Uploading'));
      
      if (initialLoad) {
        setCampaigns(prev => [...prev.filter(c => c.status === 'Uploading' || c.status === 'Upload Failed'), ...newCampaigns]);
        setPage(2);
      } else {
        setCampaigns(prev => [...prev, ...uniqueNewCampaigns]);
        setPage(p => p + 1);
      }
      setHasMore(data.length === CAMPAIGNS_PER_PAGE);
    }
    
    if (initialLoad) setIsLoading(false);
    else setIsFetchingMore(false);
  }, [user.id, campaigns, isFetchingMore, hasMore]);

  useEffect(() => {
    const fetchInitialData = () => {
      setCampaigns(prev => prev.filter(c => c.status === 'Uploading' || c.status === 'Upload Failed'));
      fetchAdvertiserCampaigns(1, true);
    }
    fetchInitialData();

    const intervalId = setInterval(fetchInitialData, 15000);

    const channel = supabase.channel(`campaigns-advertiser-${user.id}`)
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'campaigns', filter: `advertiser_id=eq.${user.id}` },
            (payload) => {
                console.log('Advertiser campaign change detected, refetching.');
                clearInterval(intervalId);
                fetchInitialData();
            }
        )
        .subscribe();

    return () => {
        clearInterval(intervalId);
        supabase.removeChannel(channel);
    };
  }, [user.id]); // Removed fetchAdvertiserCampaigns from deps to control it manually

  const handleLoadMore = () => {
    fetchAdvertiserCampaigns(page, false);
  };

  const handleCampaignSubmit = async (
    newCampaignData: Omit<Campaign, 'id' | 'impressions' | 'clicks' | 'status' | 'advertiser_id' | 'thumbnailUrl'>,
    creativeFile: File,
    thumbnailFile: File | null
  ) => {
    setIsModalOpen(false); // Close modal immediately for a responsive feel

    const tempId = `temp-${Date.now()}`;
    
    const tempCampaign: Campaign = {
      ...newCampaignData,
      id: tempId,
      advertiser_id: user.id,
      impressions: 0,
      clicks: 0,
      status: 'Uploading',
      adCreativeUrl: URL.createObjectURL(creativeFile), // Temporary local URL for preview
      thumbnailUrl: thumbnailFile ? URL.createObjectURL(thumbnailFile) : undefined,
      rewardedPoints: 0,
    };

    setCampaigns(prev => [tempCampaign, ...prev]);
    setUploadingCampaignName(newCampaignData.name);

    try {
      // 1. Upload creative
      const filePath = `public/${user.id}/${Date.now()}-${creativeFile.name.replace(/\s/g, '_')}`;
      const { error: uploadError } = await supabase.storage
        .from('campaign_creatives')
        .upload(filePath, creativeFile);
      
      if (uploadError) throw uploadError;

      const { data: { publicUrl: creativePublicUrl } } = supabase.storage
        .from('campaign_creatives')
        .getPublicUrl(filePath);

      // 2. Upload thumbnail if it exists
      let thumbnailPublicUrl: string | null = null;
      if (thumbnailFile) {
        const thumbnailPath = `public/${user.id}/thumbnails/${Date.now()}-${thumbnailFile.name.replace(/\s/g, '_')}`;
        const { error: thumbnailUploadError } = await supabase.storage
          .from('campaign_creatives')
          .upload(thumbnailPath, thumbnailFile);
        
        if (thumbnailUploadError) throw thumbnailUploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('campaign_creatives')
          .getPublicUrl(thumbnailPath);
        thumbnailPublicUrl = publicUrl;
      }
      
      // 3. Insert campaign into database
      const { error: insertError } = await supabase
        .from('campaigns')
        .insert({
          name: newCampaignData.name,
          budget: newCampaignData.budget,
          reward: newCampaignData.reward,
          ad_creative_url: creativePublicUrl,
          thumbnail_url: thumbnailPublicUrl,
          campaign_goal: newCampaignData.campaignGoal,
          cta_text: newCampaignData.ctaText,
          landing_page_url: newCampaignData.landingPageUrl,
          type: newCampaignData.type,
          category: newCampaignData.category,
          company: newCampaignData.company,
          duration: newCampaignData.duration,
          advertiser_id: user.id,
          status: 'Active', // Set status to Active for immediate visibility
        });

      if (insertError) {
        throw insertError; // Propagate the original error
      }
      
      // 4. Refresh campaign list from DB
      await fetchAdvertiserCampaigns(1, true);

      // 5. Show success notification
      setUploadingCampaignName(null);
      setSuccessToastMessage(`Your campaign "${newCampaignData.name}" has been launched and is now live! An email confirmation has been sent from ${user.email} to bhosalevedant333@gmail.com.`);
      setShowSuccessToast(true);

    } catch (error: any) {
        setUploadingCampaignName(null);
        console.error("Error creating campaign background task:", error); // Log the full object for better debugging

        const getErrorMessage = (e: any): string => {
            if (typeof e === 'string') return e;
            if (e && typeof e.message === 'string') return e.message;
            try {
                // Try to stringify, but gracefully handle circular references or other issues.
                return JSON.stringify(e, Object.getOwnPropertyNames(e));
            } catch {
                return 'An unexpected and non-serializable error occurred.';
            }
        };

        const errorMessage = getErrorMessage(error);
        
        let detailedErrorMessage = `An unexpected error occurred: ${errorMessage}`; // Default detailed message

        if (errorMessage.includes('violates row-level security policy') || errorMessage.includes('permission denied')) {
            detailedErrorMessage = `Database Security Error: Your request was blocked. This usually means Row Level Security (RLS) is enabled but no policy allows this action.

Please check your Supabase dashboard and ensure policies exist to allow authenticated advertisers to INSERT into the 'campaigns' table and INSERT/UPDATE into the 'campaign_creatives' storage bucket. Refer to supabase_setup.sql for the required policies.`;
        } else if (errorMessage.includes("column") && errorMessage.includes("does not exist") || errorMessage.includes("schema cache")) {
             detailedErrorMessage = `Database Schema Mismatch: The application tried to use a database column that doesn't exist.
Error details: ${errorMessage}

This is the most common error when setting up the project. To fix it, please run the provided 'supabase_setup.sql' script in your Supabase project's SQL Editor. This will update your database schema to the latest version.`;
        }
        
        // Update the temporary campaign to show failure status
        setCampaigns(prev => prev.map(c => c.id === tempId ? { ...c, status: 'Upload Failed', uploadError: detailedErrorMessage } : c));
    }
  }

  const handleProfileUpdate = async (updatedData: { username: string; logoFile?: File; bannerFile?: File }) => {
    try {
        const updates: { username: string; logo_url?: string; banner_url?: string } = {
            username: updatedData.username,
        };

        const uploadFile = async (file: File, folder: string) => {
            const filePath = `public/profiles/${user.id}/${folder}/${Date.now()}-${file.name.replace(/\s/g, '_')}`;
            const { error: uploadError } = await supabase.storage
                .from('campaign_creatives')
                .upload(filePath, file);
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = await supabase.storage
                .from('campaign_creatives')
                .getPublicUrl(filePath);
            return publicUrl;
        };
        
        if (updatedData.logoFile) {
            updates.logo_url = await uploadFile(updatedData.logoFile, 'logos');
        }

        if (updatedData.bannerFile) {
            updates.banner_url = await uploadFile(updatedData.bannerFile, 'banners');
        }

        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id)
            .select()
            .single();

        if (error) throw error;
        
        if (data) {
            onUserUpdated({
                username: data.username,
                logoUrl: data.logo_url || undefined,
                bannerUrl: data.banner_url || undefined,
            });
        }

        setIsEditProfileModalOpen(false);
    } catch (error: any) {
        console.error('Error updating profile:', error);
        throw new Error(error.message || 'Failed to update profile. Please try again.');
    }
  };

  const handleOpenDiscountModal = (campaign: Campaign) => {
    setSelectedCampaignForDiscount(campaign);
    setIsDiscountModalOpen(true);
  };

  const handleSaveDiscount = async (campaignId: string, newReward: number) => {
    const originalCampaigns = campaigns;
    // Optimistic UI update
    setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, reward: newReward } : c));

    const { error } = await supabase
      .from('campaigns')
      .update({ reward: newReward })
      .eq('id', campaignId);

    if (error) {
      console.error("Error updating campaign reward:", error);
      setCampaigns(originalCampaigns); // Revert on failure
      throw error; // Propagate error to modal
    }
  };
  
  const totalRewardedPoints = campaigns.reduce((sum, c) => sum + (c.rewardedPoints || 0), 0);
  const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);

  return (
    <div className="min-h-screen text-white">
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
      <header className="bg-dark/80 backdrop-blur-sm sticky top-0 z-40 border-b border-gray-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
           <span className="text-xl font-bold text-white">Advertiser Hub</span>
           <div className="flex items-center gap-4">
             <Button onClick={() => setIsModalOpen(true)} variant="primary">Create Campaign</Button>
             <Button onClick={onLogout} variant="secondary">Sign Out</Button>
           </div>
        </div>
      </header>

      {/* Profile Section */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mt-8">
          <div className="h-48 md:h-64 bg-charcoal rounded-2xl overflow-hidden">
            {user.bannerUrl ? <img src={user.bannerUrl} alt="Company banner" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-charcoal"></div>}
          </div>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 sm:-mt-20">
            <div className="flex items-end space-x-5">
              <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-full ring-4 ring-dark overflow-hidden bg-gray-800">
                {user.logoUrl && <img src={user.logoUrl} alt="Company logo" className="h-full w-full object-cover" />}
              </div>
              <div className="pb-4 sm:pb-6 flex-grow flex items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">{user.username}</h1>
                  <p className="text-sm text-gray-400">{user.subscribers?.toLocaleString() ?? 0} Subscribers</p>
                </div>
                <Button variant="secondary" onClick={() => setIsEditProfileModalOpen(true)}>Edit Profile</Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="mt-12 space-y-12">
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <Spinner className="h-12 w-12" />
            </div>
          ) : fetchError ? (
            <Card className="p-6 bg-red-900/20">
                <h4 className="font-semibold text-red-400">Error Loading Campaigns</h4>
                <p className="text-red-300/80 text-sm mt-2 whitespace-pre-wrap">{fetchError}</p>
            </Card>
          ) : (
            <>
              {/* Analytics Section */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Key Metrics</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="p-6">
                    <h3 className="text-gray-400 text-sm font-medium">Credit Balance</h3>
                    <p className="text-3xl font-semibold text-white">{(user.creditBalance ?? 0).toLocaleString()} PTS</p>
                  </Card>
                  <Card className="p-6">
                    <h3 className="text-gray-400 text-sm font-medium">Points Rewarded</h3>
                    <p className="text-3xl font-semibold text-white mt-1">{totalRewardedPoints.toLocaleString()}</p>
                  </Card>
                  <Card className="p-6">
                    <h3 className="text-gray-400 text-sm font-medium">Total Views</h3>
                    <p className="text-3xl font-semibold text-white mt-1">{totalImpressions.toLocaleString()}</p>
                  </Card>
                </div>
              </div>

              <div>
                  <h2 className="text-2xl font-bold text-white mb-4">Platform Audience Demographics</h2>
                  <AudienceAnalytics />
              </div>

              {/* Manage Campaigns Section */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Manage Your Campaigns</h2>
                <CampaignList 
                  campaigns={campaigns} 
                  onAdjustDiscount={handleOpenDiscountModal}
                  onLoadMore={handleLoadMore}
                  hasMore={hasMore}
                  isLoadingMore={isFetchingMore}
                  onCreateCampaignClick={() => setIsModalOpen(true)}
                />
              </div>
            </>
          )}
        </div>
      </div>
      
      <div className="pb-16"></div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Campaign">
        <CreateCampaignForm 
          onCampaignSubmit={handleCampaignSubmit}
          onClose={() => setIsModalOpen(false)}
          company={{
            name: user.username,
            logoUrl: user.logoUrl || `https://picsum.photos/seed/${user.username}logo/100`,
            subscriberCount: user.subscribers || 0,
          }}
        />
      </Modal>

      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        user={user}
        onProfileUpdate={handleProfileUpdate}
      />

      <AdjustDiscountModal
        isOpen={isDiscountModalOpen}
        onClose={() => setIsDiscountModalOpen(false)}
        campaign={selectedCampaignForDiscount}
        onSave={handleSaveDiscount}
      />

    </div>
  );
};

export default AdvertiserDashboard;