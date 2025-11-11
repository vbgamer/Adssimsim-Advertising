

import React, { useState, useCallback, useEffect } from 'react';
import { Campaign, User, Role, UserGender } from './types';
import AdvertiserDashboard from './components/advertiser/AdvertiserDashboard';
import ViewerDashboard from './components/viewer/ViewerDashboard';
import AuthModal from './components/AuthModal';
import Button from './components/ui/Button';
import { LogoIcon } from './components/icons/LogoIcon';
import Footer from './components/Footer';
import { supabase } from './supabaseClient';
import Spinner from './components/ui/Spinner';
import Card from './components/ui/Card';
import { MegaphoneIcon } from './components/icons/MegaphoneIcon';
import ErrorDisplay from './components/ui/ErrorDisplay';

const VerificationSuccessToast = ({ show }: { show: boolean }) => {
  return (
    <div
      aria-live="assertive"
      className={`fixed top-5 right-5 z-50 transition-all duration-500 ease-in-out ${
        show ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
      }`}
    >
      {show && (
        <div className="bg-accent-500 text-black p-4 rounded-lg shadow-lg flex items-center gap-3 shadow-accent-500/40">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-bold">Email Verified!</p>
            <p className="text-sm">You have been successfully logged in.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [authRole, setAuthRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  
  useEffect(() => {
    // Check for verification redirect on initial load
    if (window.location.hash.includes('access_token')) {
      // Supabase's client will handle the hash, but we can use its presence
      // to show a one-time message.
      setShowVerificationMessage(true);
      setTimeout(() => {
        setShowVerificationMessage(false);
        // Clean the URL hash for a better user experience
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }, 5000);
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching profile:', error.message);
                setCurrentUser(null);
            } else if (data) {
                // FIX: Correct initial credit balance for new advertisers if backend trigger fails.
                const isNewlyCreated = (Date.now() - new Date(session.user.created_at).getTime()) < 60000; // Within 1 minute of creation
                if (data.role === 'advertiser' && (data.credit_balance === null || data.credit_balance === 0) && isNewlyCreated) {
                    const { data: updatedProfile, error: updateError } = await supabase
                        .from('profiles')
                        .update({ credit_balance: 500 })
                        .eq('id', session.user.id)
                        .select()
                        .single();

                    if (updateError) {
                        console.error("Failed to apply initial credit balance for new advertiser.", updateError);
                    } else if (updatedProfile) {
                        // Use the corrected data for the current session
                        data.credit_balance = updatedProfile.credit_balance;
                    }
                }
                
                const userProfile: User = {
                    id: data.id,
                    username: data.username,
                    email: data.email,
                    role: data.role,
                    gender: data.gender as UserGender | undefined,
                    city: data.city || undefined,
                    state: data.state || undefined,
                    country: data.country || undefined,
                    subscribers: data.subscribers,
                    bannerUrl: data.banner_url,
                    logoUrl: data.logo_url,
                    rewardPoints: data.reward_points,
                    creditBalance: data.credit_balance,
                };
                setCurrentUser(userProfile);
            } else {
                console.warn("User profile not found in 'profiles' table. Using session data as a fallback. This may be due to a missing database trigger for profile creation on user sign-up.");
                const sessionUser = session.user;
                const userProfile: User = {
                    id: sessionUser.id,
                    email: sessionUser.email!,
                    username: sessionUser.user_metadata.username || sessionUser.email!.split('@')[0],
                    role: sessionUser.user_metadata.role || 'viewer',
                    gender: sessionUser.user_metadata.gender,
                    city: sessionUser.user_metadata.city,
                    state: sessionUser.user_metadata.state,
                    country: sessionUser.user_metadata.country,
                    subscribers: sessionUser.user_metadata.subscribers,
                    bannerUrl: sessionUser.user_metadata.banner_url,
                    logoUrl: sessionUser.user_metadata.logo_url,
                    rewardPoints: 0,
                    creditBalance: sessionUser.user_metadata.credit_balance,
                };
                setCurrentUser(userProfile);
            }
        } else {
            setCurrentUser(null);
        }
        setIsLoading(false);
    });

    return () => {
        subscription?.unsubscribe();
    };
  }, []);
  
  const handleLogin = useCallback(() => {
    setAuthModalOpen(false);
    // onAuthStateChange will handle setting the user state
  }, []);

  const handleLogout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Logout Error:', error);
  }, []);

  const handleRewardClaimed = useCallback(async (campaign: Campaign, reward: number): Promise<void> => {
    if (!currentUser) return;

    // Optimistically update the user's points for a snappy UI.
    const originalPoints = currentUser.rewardPoints || 0;
    const newTotalPoints = originalPoints + reward;
    setCurrentUser(prevUser => prevUser ? { ...prevUser, rewardPoints: newTotalPoints } : null);

    try {
      // DEVELOPER NOTE: Reverted to client-side logic to resolve the "RPC function not found" error.
      // This approach is less secure and less reliable than an RPC call.
      // Specifically, updating the campaign's impression count may fail silently if blocked by
      // database Row Level Security (RLS) policies. The recommended long-term solution
      // is to implement the 'claim_reward' function on the backend.

      // Step 1: Record that the user has viewed the ad.
      const { error: viewError } = await supabase
        .from('ad_views')
        .insert({ campaign_id: campaign.id, user_id: currentUser.id });

      // If the user has already seen this ad, the insert will fail with a unique constraint violation.
      if (viewError) {
        if (viewError.code === '23505') { // unique_violation
          throw new Error('You have already claimed the reward for this ad.');
        }
        throw viewError; // For other errors, re-throw.
      }

      // Step 2: Update the user's profile with the new reward points.
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ reward_points: newTotalPoints })
        .eq('id', currentUser.id);
      
      if (profileError) throw profileError;

      // Step 3: Attempt to increment the campaign's impression count.
      // This is not transactional and may fail due to RLS.
      // Supabase does not support direct increment operations from the client,
      // so we have to do a read-then-write, which is prone to race conditions.
      const { data: campaignData, error: campaignSelectError } = await supabase
        .from('campaigns')
        .select('impressions')
        .eq('id', campaign.id)
        .single();
      
      if (campaignSelectError) {
          console.warn("Could not read campaign impressions before updating. This may be due to RLS. Impression count will not be updated.", campaignSelectError);
      } else if (campaignData) {
          const { error: campaignUpdateError } = await supabase
            .from('campaigns')
            .update({ impressions: (campaignData.impressions || 0) + 1 })
            .eq('id', campaign.id);

          if (campaignUpdateError) {
              console.warn(`Failed to update impression count for campaign ${campaign.id}. This is likely due to database Row Level Security (RLS) policies preventing viewers from modifying campaigns. The advertiser dashboard may not reflect this view. For a robust solution, a database function (RPC) should be used.`, campaignUpdateError);
          }
      }

    } catch (error: any) {
      // Revert the optimistic UI update on any failure.
      setCurrentUser(prevUser => prevUser ? { ...prevUser, rewardPoints: originalPoints } : null);
      
      const errorMessage = error.message || "An unknown error occurred.";
      console.error("Error claiming reward:", errorMessage, error);
      
      alert(`Failed to claim reward: ${errorMessage}`);
      throw error; // Re-throw to be handled by the caller if needed.
    }
  }, [currentUser]);

  const handleAuthRequest = (role: Role) => {
    setAuthRole(role);
    setAuthModalOpen(true);
  };

  const handleUserUpdated = useCallback((updatedData: Partial<User>) => {
    setCurrentUser(prevUser => prevUser ? { ...prevUser, ...updatedData } : null);
  }, []);

  const renderContent = () => {
    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Spinner className="h-16 w-16" />
            </div>
        );
    }

    if (!currentUser) {
        return <AdGalleryPage onViewerAuthRequest={() => handleAuthRequest('viewer')} onAdvertiserAuthRequest={() => handleAuthRequest('advertiser')} />;
    }
    
    switch (currentUser.role) {
      case 'advertiser':
        return <AdvertiserDashboard user={currentUser} onLogout={handleLogout} onUserUpdated={handleUserUpdated} />;
      case 'viewer':
        return <ViewerDashboard user={currentUser} onLogout={handleLogout} onRewardClaimed={handleRewardClaimed} />;
      default:
        return <AdGalleryPage onViewerAuthRequest={() => handleAuthRequest('viewer')} onAdvertiserAuthRequest={() => handleAuthRequest('advertiser')} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <VerificationSuccessToast show={showVerificationMessage} />
      <main className="flex-grow w-full">
        {renderContent()}
      </main>
      <Footer />
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        initialRole={authRole}
        onLogin={handleLogin}
      />
    </div>
  );
};

// --- Helper Components for Public Landing Page ---

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

const CampaignCard: React.FC<{ campaign: Campaign; onWatch: () => void; }> = ({ campaign, onWatch }) => {
    const displayImageUrl = campaign.thumbnailUrl || campaign.adCreativeUrl;
    
    return (
        <Card className="group overflow-hidden transition-all duration-300 hover:shadow-glow-primary cursor-pointer border-gray-800" onClick={onWatch}>
            <div className="relative aspect-video">
                <img src={displayImageUrl} alt={campaign.name} loading="lazy" className="w-full h-full object-cover" />
                
                {/* Company Name Overlay */}
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md">
                    {campaign.company.name}
                </div>

                {/* Category Overlay */}
                <div className="absolute bottom-3 left-4">
                    <p className="font-bold text-white text-3xl" style={{textShadow: '0 2px 4px rgba(0,0,0,0.7)'}}>{campaign.category || 'Featured'}</p>
                </div>
            </div>
            <div className="p-4 bg-charcoal">
                <h3 className="text-lg font-bold text-off-white">{campaign.name}</h3>
                <p className="text-sm text-gray-400 mt-1">
                    Experience an exclusive offer. Discover our cutting-edge solutions and learn more about this campaign.
                </p>
                <div className="mt-4 flex items-center justify-between">
                    <div className="font-bold text-accent-500 text-sm">
                        {campaign.reward} PTS Reward
                    </div>
                    <Button onClick={(e) => { e.stopPropagation(); onWatch(); }} variant="secondary" size="sm">
                        Watch Now
                    </Button>
                </div>
            </div>
        </Card>
    );
};

const AdGalleryPage = ({ onViewerAuthRequest, onAdvertiserAuthRequest }: { onViewerAuthRequest: () => void; onAdvertiserAuthRequest: () => void; }) => {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retryCounter, setRetryCounter] = useState(0);

    const handleRetry = () => setRetryCounter(c => c + 1);

    useEffect(() => {
        const fetchPublicCampaigns = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const { data, error: fetchError } = await supabase
                    .from('campaigns')
                    .select('*')
                    .eq('status', 'Active')
                    .order('created_at', { ascending: false })
                    .limit(12);

                if (fetchError) {
                    throw fetchError;
                }
                
                if (data) {
                    setCampaigns(formatCampaigns(data));
                }
            } catch (fetchError: any) {
                console.error("Error fetching active campaigns for gallery:", fetchError);
                const errorMessage = fetchError?.message || 'An unknown error occurred.';
                let userFriendlyError;

                if (errorMessage.toLowerCase().includes('failed to fetch')) {
                    userFriendlyError = `Network Error: Could not connect to the database. This is a common setup issue. Please check the following:
\n1. **Is your Supabase project running?** Free projects are paused after 1 week of inactivity. Please go to your Supabase dashboard to reactivate it.
\n2. **Is CORS configured correctly?** Your app's domain (${window.location.origin}) must be listed in your Supabase project's API settings under "CORS Configuration".
\n3. **Is your internet connection stable?**`;
                } else if (errorMessage.includes('violates row-level security policy')) {
                    userFriendlyError = `Database Security Error: Access to campaigns is blocked. Please ensure Row Level Security (RLS) is configured to allow public access to 'Active' campaigns.`;
                } else {
                    userFriendlyError = `An unexpected error occurred while fetching campaigns. Details: ${errorMessage}`;
                }
                setError(userFriendlyError);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPublicCampaigns();
    }, [retryCounter]);

    return (
        <div className="bg-dark">
            <header className="py-4 px-4 sm:px-6 lg:px-8">
                 <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <LogoIcon className="h-10 w-10 text-4xl" />
                        <span className="text-xl font-bold text-white">Adssimsim Advertising</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button onClick={onViewerAuthRequest} variant="secondary">Watch & Earn</Button>
                        <Button onClick={onAdvertiserAuthRequest} variant="primary">Launch Campaign</Button>
                    </div>
                </div>
            </header>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
                <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight">
                    <span className="block">Get Rewarded for Your Attention.</span>
                    <span className="block text-primary-500">Power Your Brand's Reach.</span>
                </h1>
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-24">
                {isLoading && (
                    <div className="flex justify-center"><Spinner className="h-12 w-12" /></div>
                )}
                {error && (
                    <ErrorDisplay
                        title="Could Not Load Campaigns"
                        message={error}
                        onRetry={handleRetry}
                    />
                )}
                {!isLoading && !error && (
                    campaigns.length > 0 ? (
                         <div className="max-w-3xl mx-auto space-y-8">
                            {campaigns.map(c => <CampaignCard key={c.id} campaign={c} onWatch={onViewerAuthRequest} />)}
                        </div>
                    ) : (
                        <Card className="p-8 text-center bg-charcoal/50 border border-gray-800 max-w-3xl mx-auto">
                            <MegaphoneIcon className="mx-auto h-12 w-12 text-gray-500" />
                            <h3 className="mt-4 text-xl font-bold text-white">No Active Campaigns</h3>
                            <p className="mt-2 text-gray-400">Check back soon for new content!</p>
                        </Card>
                    )
                )}
            </div>
        </div>
    );
};