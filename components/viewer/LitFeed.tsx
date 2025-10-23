import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Campaign } from '../../types';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { HeartIcon } from '../icons/HeartIcon';
import { ChatBubbleIcon } from '../icons/ChatBubbleIcon';
import { BookmarkIcon } from '../icons/BookmarkIcon';
import { ShareIcon } from '../icons/ShareIcon';
import { SearchIcon } from '../icons/SearchIcon';

const LitItem: React.FC<{
    campaign: Campaign;
    isActive: boolean;
    onRewardClaimed: (campaign: Campaign, reward: number) => void;
}> = ({ campaign, isActive, onRewardClaimed }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [progress, setProgress] = useState(0);
    const [isAdWatched, setIsAdWatched] = useState(false);
    const [reaction, setReaction] = useState<string | null>(null);
    const [isRewardClaimed, setIsRewardClaimed] = useState(false);
    const [showReactionUI, setShowReactionUI] = useState(false);

    useEffect(() => {
        const video = videoRef.current;
        if (video) {
            if (isActive) {
                video.play().catch(error => {
                    console.warn("Video autoplay failed:", error);
                });
            } else {
                video.pause();
                video.currentTime = 0;
            }
        }
    }, [isActive]);

    useEffect(() => {
        // Reset state when the campaign changes, as the component instance might be reused.
        setProgress(0);
        setIsAdWatched(false);
        setReaction(null);
        setIsRewardClaimed(false);
        setShowReactionUI(false);
        if (videoRef.current) {
            videoRef.current.currentTime = 0;
        }
    }, [campaign.id]);
    
    // Auto-claim reward effect
    useEffect(() => {
        if (isAdWatched && reaction && !isRewardClaimed) {
          onRewardClaimed(campaign, campaign.reward);
          setIsRewardClaimed(true);
        }
    }, [isAdWatched, reaction, isRewardClaimed, onRewardClaimed, campaign]);

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const { currentTime, duration } = videoRef.current;
            if (duration > 0) {
                setProgress((currentTime / duration) * 100);
            }
        }
    };
    
    const handleVideoEnd = () => {
        setIsAdWatched(true);
        setProgress(100);
        setShowReactionUI(true); // Show feedback UI when video finishes
    };

    const handleShare = async () => {
        if (!navigator.share) {
            try {
                await navigator.clipboard.writeText(window.location.origin);
                alert('Link copied to clipboard!');
            } catch (err) {
                console.error('Failed to copy: ', err);
                alert('Failed to copy link.');
            }
            return;
        }

        try {
            await navigator.share({
                title: `Check out this campaign on Adssimsim`,
                text: `Watch "${campaign.name}" and earn rewards!`,
                url: window.location.origin, // Use origin for a clean, shareable URL
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const reactions = [ { label: 'Impressed', emoji: '🔥' }, { label: 'Relatable', emoji: '💯' }, { label: 'Decent', emoji: '🙂' }];

    return (
        <div className="h-full w-full relative flex-shrink-0 scroll-snap-start bg-black flex items-center justify-center">
            <video
                ref={videoRef}
                src={campaign.adCreativeUrl}
                muted
                playsInline
                loop={false}
                className="w-full h-full object-contain"
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleVideoEnd}
            />
            {/* Overlays */}
            <div className="absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-t from-black/60 via-transparent to-transparent">
                <div></div>
                <div className="flex items-end gap-4">
                    <div className="flex-grow space-y-2">
                        <div className="flex items-center gap-2">
                            <img src={campaign.company.logoUrl} alt={campaign.company.name} className="h-10 w-10 rounded-full border-2 border-white/50" />
                            <p className="font-bold text-white text-shadow-lg">{campaign.company.name}</p>
                        </div>
                        <p className="text-white text-sm text-shadow-md">{campaign.name}</p>
                    </div>
                     <div className="flex flex-col items-center gap-4 text-white">
                        <button className="flex flex-col items-center"><HeartIcon className="w-8 h-8" /><span className="text-xs font-semibold">1.2k</span></button>
                        <button className="flex flex-col items-center"><ChatBubbleIcon className="w-8 h-8" /><span className="text-xs font-semibold">345</span></button>
                        <button className="flex flex-col items-center"><BookmarkIcon className="w-8 h-8" /><span className="text-xs font-semibold">102</span></button>
                        <button onClick={handleShare} className="flex flex-col items-center"><ShareIcon className="w-8 h-8" /><span className="text-xs font-semibold">Share</span></button>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                <div className="h-1 bg-primary-500 transition-all duration-150 ease-linear" style={{ width: `${progress}%` }}></div>
            </div>

             {/* Reward Claim overlay (shown after watching) */}
            {showReactionUI && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col justify-center items-center gap-6 p-4 animate-fade-in-up">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-accent-500">+{campaign.reward} Points</p>
                        <p className="text-white">React to claim your reward!</p>
                    </div>
                    <div className="flex items-center justify-center gap-3">
                         {reactions.map(({ label, emoji }) => (
                            <button
                                key={label}
                                onClick={() => setReaction(label)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all text-sm font-semibold active:scale-110 ${
                                    reaction === label
                                        ? 'bg-primary-500 text-off-white ring-2 ring-primary-500 scale-105 shadow-lg'
                                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                }`}
                                aria-pressed={reaction === label}
                                disabled={isRewardClaimed}
                            >
                                <span>{emoji}</span>
                                {label}
                            </button>
                        ))}
                    </div>
                     <div className="text-center text-sm pt-2 h-5">
                        {isRewardClaimed && <p className="font-semibold text-accent-500">Reward Claimed! Swipe up for more.</p>}
                     </div>
                     <Button onClick={() => window.open(campaign.landingPageUrl, '_blank')} variant="secondary">
                        {campaign.ctaText}
                     </Button>
                </div>
            )}
        </div>
    );
};


const LitFeed: React.FC<{
    campaigns: Campaign[];
    onRewardClaimed: (campaign: Campaign, reward: number) => void;
    onLoadMore: () => void;
    hasMore: boolean;
    isLoadingMore: boolean;
    searchQuery: string;
}> = ({ campaigns, onRewardClaimed, onLoadMore, hasMore, isLoadingMore, searchQuery }) => {
    const [activeCampaignId, setActiveCampaignId] = useState<string | null>(campaigns[0]?.id || null);
    const itemRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);

    const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
        entries.forEach(entry => {
            const campaignId = (entry.target as HTMLElement).dataset.campaignId;
            if (entry.isIntersecting && campaignId) {
                setActiveCampaignId(campaignId);
            }
        });
    }, []);
    
    useEffect(() => {
        observerRef.current = new IntersectionObserver(handleIntersection, {
            root: null, // observes intersections relative to the viewport
            rootMargin: '0px',
            threshold: 0.7, // 70% of the item must be visible
        });

        const currentObserver = observerRef.current;
        itemRefs.current.forEach(node => {
            if (node) currentObserver.observe(node);
        });

        return () => {
            currentObserver.disconnect();
        };
    }, [campaigns, handleIntersection]);
    
    // Observer for infinite scroll
    useEffect(() => {
      const loadMoreObserver = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
            onLoadMore();
          }
        },
        { threshold: 1.0 }
      );
    
      if (loadMoreRef.current) {
        loadMoreObserver.observe(loadMoreRef.current);
      }
    
      return () => {
        if (loadMoreRef.current) {
          loadMoreObserver.unobserve(loadMoreRef.current);
        }
      };
    }, [hasMore, isLoadingMore, onLoadMore]);

    if (campaigns.length === 0) {
        if (searchQuery) {
            return (
                <div className="h-full flex flex-col justify-center items-center text-center p-4">
                    <SearchIcon className="h-16 w-16 text-gray-600" />
                    <h3 className="mt-4 text-xl font-bold text-white">No Results Found</h3>
                    <p className="mt-2 text-gray-400">Your search for "{searchQuery}" did not match any campaigns.</p>
                </div>
            );
        }
        return (
            <div className="h-full flex flex-col justify-center items-center text-center p-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <h3 className="mt-4 text-xl font-bold text-white">No "Shortz" Campaigns Available</h3>
                <p className="mt-2 text-gray-400">Check back later for new vertical video ads!</p>
            </div>
        );
    }
    
    return (
        <div className="h-full max-w-md mx-auto bg-dark">
            <div className="h-full w-full overflow-y-auto snap-y snap-mandatory rounded-lg">
                {campaigns.map((campaign) => (
                    <div
                        key={campaign.id}
                        // FIX: The ref callback for a DOM element must return void.
                        // The Map.set() method returns the Map instance, causing a type error.
                        // Wrapping the call in curly braces ensures the arrow function returns undefined.
                        ref={el => { itemRefs.current.set(campaign.id, el); }}
                        data-campaign-id={campaign.id}
                        className="h-full w-full snap-start"
                    >
                        <LitItem
                            campaign={campaign}
                            isActive={campaign.id === activeCampaignId}
                            onRewardClaimed={onRewardClaimed}
                        />
                    </div>
                ))}
                {hasMore && (
                    <div ref={loadMoreRef} className="h-full w-full snap-start flex justify-center items-center">
                        {isLoadingMore && <Spinner className="h-12 w-12" />}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LitFeed;