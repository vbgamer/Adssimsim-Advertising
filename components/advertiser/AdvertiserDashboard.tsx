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
      ctaText: c.cta_text || 'Shop Now',
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
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [selectedCampaignForDiscount, setSelectedCampaignForDiscount] = useState<Campaign | null>(null);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const CAMPAIGNS_PER_PAGE = 10;
  
  // Use refs to avoid including them in useCallback dependencies, preventing stale closures.
  const isFetchingMoreRef = React.useRef(isFetchingMore);
  const hasMoreRef = React.useRef(hasMore);
  React.useEffect(() => {
      isFetchingMoreRef.current = isFetchingMore;
      hasMoreRef.current = hasMore;
  }, [isFetchingMore, hasMore]);

  // Effect for initial data load, real-time updates, and polling fallback
  useEffect(() => {
    // All fetching logic now lives inside this effect to guarantee stability
    // and prevent dependency-related re-subscriptions that were causing missed updates.
    const fetchAdvertiserCampaigns = async (pageNum: number, initialLoad = false) => {
        if (initialLoad) {
            setIsLoading(true);
            setFetchError(null);
        } else {
            if (isFetchingMoreRef.current || !hasMoreRef.current) return;
            setIsFetchingMore(true);
        }

        const from = (pageNum - 1) * CAMPAIGNS_PER_PAGE;
        const to = from + CAMPAIGNS_PER_PAGE - 1;
        
        try {
            const { data, error } = await supabase
              .from('campaigns')
              .select('*')
              .eq('advertiser_id', user.id)
              .order('created_at', { ascending: false })
              .range(from, to);

            if (error) throw error;

            if (data) {
              const newCampaigns = formatCampaigns(data);
              
              if (initialLoad) {
                  setCampaigns(prev => {
                      const freshCampaignsMap = new Map(newCampaigns.map(c => [c.id, c]));
                      const tempCampaigns = prev.filter(p => 
                          (p.status === 'Uploading' || p.status === 'Upload Failed') && !freshCampaignsMap.has(p.id)
                      );
                      return [...tempCampaigns, ...newCampaigns];
                  });
                  setPage(2);
                  setHasMore(data.length === CAMPAIGNS_PER_PAGE);
              } else {
                  setCampaigns(prev => {
                      const existingIds = new Set(prev.map(c => c.id));
                      const uniqueNewCampaigns = newCampaigns.filter(c => !existingIds.has(c.id));
                      return [...prev, ...uniqueNewCampaigns];
                  });
                  setPage(p => p + 1);
                  setHasMore(data.length === CAMPAIGNS_PER_PAGE);
              }
            }
        } catch (error: any) {
            console.error("Error fetching advertiser campaigns:", error);
            const errorMessage = error?.message || 'An unknown error occurred.';
            let userFriendlyError;

            if (errorMessage.toLowerCase().includes('failed to fetch')) {
                userFriendlyError = `Network Error: Could not connect to the database. This is a common setup issue. Please check the following:
\n1. **Is your Supabase project running?** Free projects are paused after 1 week of inactivity. Please go to your Supabase dashboard to reactivate it.
\n2. **Is CORS configured correctly?** Your app's domain (${window.location.origin}) must be listed in your Supabase project's API settings under "CORS Configuration".
\n3. **Is your internet connection stable?**`;
            } else if (errorMessage.includes('violates row-level security policy')) {
                userFriendlyError = `There's a database security policy blocking access to your campaigns. If you are the developer, please ensure Row Level Security (RLS) is configured to allow advertisers to view their own campaigns.`;
                console.error(`Hint: This error is commonly caused by a missing Row Level Security (RLS) policy on the 'campaigns' table. Advertisers need permission to view their own campaigns. Example: CREATE POLICY "Allow advertiser to read their own campaigns" ON public.campaigns FOR SELECT USING (auth.uid() = advertiser_id);`);
            } else {
                userFriendlyError = `An unexpected error occurred while fetching your campaigns. Details: ${errorMessage}`;
            }

            setFetchError(userFriendlyError);
            if (initialLoad) setCampaigns([]);
        } finally {
            if (initialLoad) setIsLoading(false);
            else setIsFetchingMore(false);
        }
    };

    const fetchInitialData = () => {
      fetchAdvertiserCampaigns(1, true);
    };
    
    fetchInitialData(); // Initial load

    const intervalId = setInterval(fetchInitialData, 30000); // Poll every 30s as a fallback

    const channel = supabase.channel(`campaigns-advertiser-${user.id}`)
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'campaigns', filter: `advertiser_id=eq.${user.id}` },
            (payload) => {
                console.log('Advertiser campaign change detected, refetching data.');
                fetchInitialData();
            }
        )
        .subscribe();

    return () => {
        clearInterval(intervalId);
        supabase.removeChannel(channel);
    };
  }, [user.id, retryCounter]); // The dependency array is now guaranteed stable.

  // Real-time subscription for the user's credit balance
  useEffect(() => {
    const channel = supabase
      .channel(`profile-updates-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          const updatedProfile = payload.new as { credit_balance?: number };
          if (updatedProfile.credit_balance !== undefined) {
            onUserUpdated({ creditBalance: updatedProfile.credit_balance });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id, onUserUpdated]);

  // Effect for fetching and subscribing to the live activity feed
  useEffect(() => {
    // Don't run if we don't have campaigns to filter by
    if (campaigns.length === 0) return;

    const campaignIds = campaigns.map(c => c.id);

    // Fetch initial recent activities to populate the feed on load
    const fetchInitialActivities = async () => {
      const { data, error } = await supabase
        .from('ad_views')
        .select('created_at, campaign_id')
        .in('campaign_id', campaignIds)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        if (error.message.includes('relation "public.ad_views" does not exist')) {
            console.warn("Activity feed disabled: 'ad_views' table not found. This is expected if the full DB schema is not applied.");
        } else if (error.message.includes('violates row-level security policy')) {
            console.warn(`Activity feed disabled: RLS policy on 'ad_views' is blocking access. Advertisers need SELECT permission on views for their own campaigns.`);
        } else {
            console.error('Error fetching initial activities:', error);
        }
        return;
      }

      if (data) {
        const initialActivities = data.map(view => {
          const campaign = campaigns.find(c => c.id === view.campaign_id);
          if (!campaign) return null;
          return {
            id: `view-${view.campaign_id}-${view.created_at}`,
            campaignName: campaign.name,
            reward: campaign.reward,
            timestamp: new Date(view.created_at),
          };
        }).filter((a): a is Activity => a !== null);
        setActivities(initialActivities);
      }
    };

    fetchInitialActivities();

    const channel = supabase.channel(`ad-views-advertiser-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ad_views' }, payload => {
          const newView = payload.new as { campaign_id: string; created_at: string };
          // Use a state setter with the `campaigns` variable to avoid stale closures.
          setCampaigns(currentCampaigns => {
            const campaign = currentCampaigns.find(c => c.id === newView.campaign_id);
            if (campaign) {
                const newActivity: Activity = {
                id: `view-${newView.campaign_id}-${newView.created_at}`,
                campaignName: campaign.name,
                reward: campaign.reward,
                timestamp: new Date(newView.created_at),
                };
                setActivities(prevActivities => [newActivity, ...prevActivities].slice(0, 10));
            }
            return currentCampaigns; // Return unchanged campaigns state
          });
        }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [campaigns, user.id]); // Re-run when the list of campaigns changes


  const handleLoadMore = () => {
    // Re-trigger the main effect to load the next page
    setPage(p => p + 1);
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
      
      // 4. On success, remove the temporary campaign. The real-time listener will handle the refresh.
      setCampaigns(prev => prev.filter(c => c.id !== tempId));

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
        
        let userFriendlyError = "The campaign upload failed due to a server or network issue. Please try again.";
        let developerHint = `Technical details: ${errorMessage}`;
        
        if (errorMessage.includes('violates row-level security policy') || errorMessage.includes('permission denied')) {
            userFriendlyError = "The campaign upload failed due to a database security policy.";
            developerHint = `Your request was blocked by Row Level Security (RLS). Please ensure policies exist to allow authenticated advertisers to INSERT into the 'campaigns' table and perform actions on the 'campaign_creatives' storage bucket.`;
        } else if (errorMessage.includes("column") && errorMessage.includes("does not exist") || errorMessage.includes("schema cache")) {
            userFriendlyError = "The campaign upload failed due to a database configuration problem.";
            developerHint = `Database Schema Mismatch: To fix this, please run the provided 'supabase_setup.sql' script in your Supabase project's SQL Editor to update your database schema.`;
        }
        
        const finalErrorMessage = `${userFriendlyError}\n\n[For Developers]\n${developerHint}`;
        
        // Update the temporary campaign to show failure status
        setCampaigns(prev => prev.map(c => c.id === tempId ? { ...c, status: 'Upload Failed', uploadError: finalErrorMessage } : c));
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
             <Button onClick={() => setIsModalOpen(true)} variant="primary">Create Campaign</Button>
             <Button onClick={onLogout} variant="secondary">Sign Out</Button>
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
                    onAdjustDiscount={handleOpenDiscountModal}
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
      
      {selectedCampaignForDiscount && (
        <AdjustDiscountModal
          isOpen={isDiscountModalOpen}
          onClose={() => setIsDiscountModalOpen(false)}
          campaign={selectedCampaignForDiscount}
          onSave={handleSaveDiscount}
        />
      )}
    </div>
  );
};

export default AdvertiserDashboard;