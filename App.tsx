

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
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

const App: React.FC = () => {
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

    // The primary goal is to award the user points. History tracking is secondary.
    // We will perform the critical user-facing updates first.
    
    try {
      // CRITICAL Step 1: Award points to the viewer.
      const newTotalPoints = (currentUser.rewardPoints || 0) + reward;
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ reward_points: newTotalPoints })
        .eq('id', currentUser.id);
      if (profileUpdateError) throw profileUpdateError;

      // Update local state immediately for a responsive UI.
      setCurrentUser(prevUser => prevUser ? { ...prevUser, rewardPoints: newTotalPoints } : null);

      // --- Post-Reward Operations (non-blocking for the user) ---

      // Attempt to record the ad view for history.
      const { error: adViewError } = await supabase
        .from('ad_views')
        .insert({ user_id: currentUser.id, campaign_id: campaign.id });
      
      if (adViewError) {
          console.warn(
`Could not save to watch history. The reward was successful, but this view won't appear in history.
This might be due to a missing 'ad_views' table. Error: ${adViewError.message}`
          );
      }

      // Update campaign and advertiser stats (background accounting).
      // These will only log warnings on failure.
      const newCampaignRewardedPoints = (campaign.rewardedPoints || 0) + reward;
      const newImpressionsCount = (campaign.impressions || 0) + 1;
      const { error: campaignUpdateError } = await supabase
        .from('campaigns')
        .update({ 
          rewarded_points: newCampaignRewardedPoints,
          impressions: newImpressionsCount,
        })
        .eq('id', campaign.id);
      if (campaignUpdateError) {
        console.warn("Non-critical error: Failed to update campaign stats.", campaignUpdateError);
      }

      const { data: advertiserProfile, error: advertiserFetchError } = await supabase
        .from('profiles')
        .select('credit_balance')
        .eq('id', campaign.advertiser_id)
        .single();
      
      if (advertiserFetchError) {
          console.warn("Non-critical error: Could not fetch advertiser profile to update balance.", advertiserFetchError);
      } else if (advertiserProfile) {
          const newAdvertiserBalance = (advertiserProfile.credit_balance || 0) - reward;
          const { error: advertiserUpdateError } = await supabase
            .from('profiles')
            .update({ credit_balance: newAdvertiserBalance })
            .eq('id', campaign.advertiser_id);
          
          if (advertiserUpdateError) {
              console.warn("Non-critical error: Failed to update advertiser balance.", advertiserUpdateError);
          } else if (currentUser.id === campaign.advertiser_id) {
              setCurrentUser(prev => prev ? {...prev, creditBalance: newAdvertiserBalance } : null);
          }
      }

    } catch (error: any) {
      // This will now only catch critical errors (failing to update user's points).
      const errorMessage = error.message || "An unknown error occurred.";
      console.error("Critical error claiming reward:", errorMessage, error);
      alert(`Failed to claim reward. Your points could not be updated: ${errorMessage}`);
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
        onLogin={handleLogin}
        initialRole={authRole}
      />
    </div>
  );
};

const AdCard: React.FC<{ campaign: Campaign; onClick: () => void }> = ({ campaign, onClick }) => {
    const isShort = campaign.type === 'Shortz';
    const displayImageUrl = campaign.thumbnailUrl || campaign.adCreativeUrl;
    const placeholderDescription = "Experience an exclusive offer. Discover our cutting-edge solutions and learn more about this campaign.";

    return (
        <Card className="group overflow-hidden cursor-pointer flex flex-col" onClick={onClick} aria-label={`Watch ad for ${campaign.name}`}>
            {/* Image container */}
            <div className={`relative`}>
                <img 
                    src={displayImageUrl} 
                    alt={campaign.name}
                    loading="lazy"
                    className={`${isShort ? 'aspect-[9/16]' : 'aspect-video'} w-full object-cover transition-transform duration-300 group-hover:scale-105`} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/10"></div>
                
                {/* Company Tag (Top Right) */}
                <div className="absolute top-3 right-3">
                    <span className="bg-black/50 text-white text-xs font-semibold px-2 py-1 rounded-md backdrop-blur-sm border border-white/10">
                        {campaign.company.name}
                    </span>
                </div>
                
                {/* Category on Image (Bottom Left) */}
                <div className="absolute bottom-3 left-4">
                    <h3 className="text-white text-xl font-bold" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                        {campaign.category}
                    </h3>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-4 flex flex-col flex-grow">
                <h2 className="text-lg font-bold text-white mb-2">{campaign.name}</h2>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2 flex-grow">
                    {placeholderDescription}
                </p>
                <div className="flex items-center justify-between mt-auto pt-4">
                    <span className="text-accent-500 font-bold text-base">
                        {campaign.reward} PTS Reward
                    </span>
                    <Button variant="secondary" size="sm" className="pointer-events-none group-hover:bg-secondary-500 group-hover:text-black group-hover:shadow-glow-primary">
                        Watch Now
                    </Button>
                </div>
            </div>
        </Card>
    );
};


interface AdGalleryPageProps {
    onViewerAuthRequest: () => void;
    onAdvertiserAuthRequest: () => void;
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

const AdGalleryPage: React.FC<AdGalleryPageProps> = ({ onViewerAuthRequest, onAdvertiserAuthRequest }) => {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const CAMPAIGNS_PER_PAGE = 8;

    const fetchCampaigns = useCallback(async (pageNum: number, initialLoad = false) => {
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
          userFriendlyError = `There's a database security policy blocking access to campaigns. If you are the developer, please ensure Row Level Security (RLS) is configured to allow public access to active campaigns.`;
          console.error(
`Hint: This error is commonly caused by a missing Row Level Security (RLS) policy on the 'campaigns' table. The public gallery needs to be able to read active campaigns.
Please go to your Supabase project's SQL Editor and run a command to create a policy for public access.

Example policy for allowing anyone to view active campaigns:
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
        const fetchInitialData = () => fetchCampaigns(1, true);
        fetchInitialData();

        const intervalId = setInterval(fetchInitialData, 15000);

        const channel = supabase.channel('campaigns-public-gallery')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'campaigns' },
                (payload) => {
                    console.log('Campaigns table change detected, refetching.');
                    clearInterval(intervalId);
                    fetchInitialData();
                }
            )
            .subscribe();

        return () => {
            clearInterval(intervalId);
            supabase.removeChannel(channel);
        };
    }, [fetchCampaigns]);


    return (
        <div className="container mx-auto px-4 py-8">
             <header className="flex justify-between items-center py-4">
                <div className="flex items-center gap-2 cursor-pointer">
                    <LogoIcon className="h-10 w-10 text-4xl" />
                    <h1 className="text-2xl font-bold text-white hidden sm:block">Adssimsim Advertising</h1>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                    <Button onClick={onViewerAuthRequest} variant="secondary">Watch & Earn</Button>
                    <Button onClick={onAdvertiserAuthRequest} variant="primary">Launch Campaign</Button>
                </div>
            </header>
            
            <div className="text-center my-12">
                 <h2 className="text-4xl md:text-5xl font-extrabold text-white leading-tight" style={{ textShadow: '0 0 8px rgba(46, 125, 50, 0.5)' }}>
                    Get Rewarded for Your Attention.
                    <br />
                    <span className="text-primary-500">Power Your Brand's Reach.</span>
                </h2>
            </div>
            
            {isLoading ? (
                <div className="flex justify-center items-center py-16">
                    <Spinner className="h-12 w-12" />
                </div>
            ) : fetchError ? (
                <div className="text-center py-16 bg-red-900/20 p-6 rounded-lg max-w-3xl mx-auto">
                    <h3 className="text-xl font-bold text-red-400">Could Not Load Campaigns</h3>
                    <p className="text-red-300 mt-2">{fetchError}</p>
                </div>
            ) : (
                <div>
                    {campaigns.length === 0 ? (
                        <div className="text-center p-8 mt-8 max-w-3xl mx-auto bg-charcoal/50 rounded-2xl border border-gray-800 shadow-xl">
                            <div className="relative w-24 h-24 mx-auto">
                                <div className="absolute inset-0 bg-primary-500 rounded-full animate-ping opacity-50"></div>
                                <div className="relative flex items-center justify-center h-full">
                                    <MegaphoneIcon className="h-16 w-16 text-primary-400 animate-pulse"/>
                                </div>
                            </div>
                            <h3 className="mt-6 text-3xl font-extrabold text-white bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-accent-500">
                                The Stage is Set for Greatness
                            </h3>
                            <p className="mt-4 text-gray-300 max-w-xl mx-auto">
                                This is where brands connect with their audience. Be the first to launch a campaign and captivate viewers, or sign up to earn rewards.
                            </p>
                            <div className="mt-8 flex justify-center gap-4">
                                <Button onClick={onAdvertiserAuthRequest} variant="primary" size="lg">Launch a Campaign</Button>
                                <Button onClick={onViewerAuthRequest} variant="secondary" size="lg">Watch & Earn</Button>
                            </div>
                            <details className="mt-10 text-xs text-gray-600 text-left bg-dark p-3 rounded-md max-w-xl mx-auto cursor-pointer">
                                <summary className="font-bold outline-none">First time setup? (Developer Info)</summary>
                                <div className="mt-2 space-y-1">
                                    <p>If this is a new deployment and you're expecting to see sample campaigns, please ensure:</p>
                                    <ul className="list-disc list-inside pl-2">
                                        <li>You have seeded your database with campaign data.</li>
                                        <li>Your Supabase Row Level Security (RLS) policies are active. A policy is required to allow public read access to campaigns where `status = 'Active'`.</li>
                                    </ul>
                                </div>
                            </details>
                        </div>
                    ) : (
                        <div className="max-w-2xl mx-auto space-y-8">
                           {campaigns.map((campaign, index) => (
                                <div 
                                    key={campaign.id} 
                                    className="animate-fade-in-up" 
                                    style={{ animationDelay: `${index * 100}ms`, opacity: 0 }}
                                >
                                    <AdCard campaign={campaign} onClick={onViewerAuthRequest} />
                                </div>
                            ))}
                        </div>
                    )}
                    {hasMore && (
                        <div className="text-center mt-8">
                            <Button onClick={() => fetchCampaigns(page)} isLoading={isFetchingMore}>
                                {isFetchingMore ? 'Loading...' : 'Load More'}
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default App;