import React, { useState, useEffect, useRef } from 'react';
import { Campaign } from '../../types';
import Button from '../ui/Button';
import { CoinsIcon } from '../icons/CoinsIcon';
import { ShareIcon } from '../icons/ShareIcon';
import RewardAnimation from '../ui/RewardAnimation';

interface AdPlayerProps {
  ad: Campaign;
  isOpen: boolean; // Controls the visibility and animation
  onClaimReward: (ad: Campaign, reward: number) => void;
  onClose: () => void;
}

const AdPlayer: React.FC<AdPlayerProps> = ({ ad, isOpen, onClaimReward, onClose }) => {
  const [reaction, setReaction] = useState<string | null>(null);
  const [isAdWatched, setIsAdWatched] = useState(false);
  const [isRewardClaimed, setIsRewardClaimed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0); // For timer
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isRendered, setIsRendered] = useState(false);
  const [showRewardAnimation, setShowRewardAnimation] = useState(false);

  useEffect(() => {
    let timeoutId: number;
    if (isOpen) {
      setIsRendered(true);
    } else {
      // Wait for exit animation to complete before unmounting
      timeoutId = window.setTimeout(() => setIsRendered(false), 300);
    }
    return () => window.clearTimeout(timeoutId);
  }, [isOpen]);

  const isVideo = ad.adCreativeUrl.toLowerCase().endsWith('.mp4') || ad.adCreativeUrl.toLowerCase().endsWith('.webm');

  // Reset state when ad changes
  useEffect(() => {
    setIsAdWatched(false);
    setProgress(0);
    setReaction(null);
    setIsRewardClaimed(false);
    setShowRewardAnimation(false);
    setCurrentTime(0);

    const durationMs = ad.duration * 1000;
    
    if (isVideo) {
      // Video progress is handled by onTimeUpdate
    } else {
      // Image progress timer
      if (durationMs > 0) {
        const startTime = Date.now();
        let animationFrameId: number;

        const updateImageProgress = () => {
          const elapsedTime = Date.now() - startTime;
          const currentProgress = Math.min((elapsedTime / durationMs) * 100, 100);
          setProgress(currentProgress);
          setCurrentTime(elapsedTime / 1000);

          if (elapsedTime < durationMs) {
            animationFrameId = requestAnimationFrame(updateImageProgress);
          } else {
            setIsAdWatched(true);
            setCurrentTime(ad.duration);
          }
        };
        animationFrameId = requestAnimationFrame(updateImageProgress);
        return () => cancelAnimationFrame(animationFrameId);
      } else {
        setIsAdWatched(true);
        setProgress(100);
        setCurrentTime(ad.duration);
      }
    }
  }, [ad.id, ad.duration, isVideo]);

  // Auto-claim reward effect
  useEffect(() => {
    if (isAdWatched && reaction && !isRewardClaimed) {
      onClaimReward(ad, ad.reward);
      setIsRewardClaimed(true);
      setShowRewardAnimation(true);
    }
  }, [isAdWatched, reaction, isRewardClaimed, onClaimReward, ad]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const { currentTime, duration } = videoRef.current;
      if (duration > 0) {
        setProgress((currentTime / duration) * 100);
        setCurrentTime(currentTime);
      }
    }
  };

  const handleVideoEnd = () => {
    setIsAdWatched(true);
    setProgress(100);
    if(videoRef.current) {
        setCurrentTime(videoRef.current.duration);
    }
  };

  const handleCTAClick = () => {
    window.open(ad.landingPageUrl, '_blank', 'noopener,noreferrer');
  };

  const handleShare = async () => {
    if (!navigator.share) {
        // Fallback for browsers that don't support the Web Share API
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
            text: `Watch "${ad.name}" and earn rewards!`,
            url: window.location.origin, // Use origin for a clean, shareable URL
        });
    } catch (error) {
        console.error('Error sharing:', error);
    }
  };
  
  const reactions = [
    { label: 'Impressed', emoji: '🔥' },
    { label: 'Decent', emoji: '🙂' },
    { label: 'Boring', emoji: '🥱' },
  ];

  const formatTime = (totalSeconds: number) => {
    const seconds = Math.floor(totalSeconds % 60);
    const minutes = Math.floor(totalSeconds / 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const formattedTime = formatTime(currentTime);
  
  if (!isRendered) return null;

  return (
    <>
      {showRewardAnimation && <RewardAnimation amount={ad.reward} onAnimationEnd={() => setShowRewardAnimation(false)} />}
      <div className={`fixed inset-0 z-50 flex justify-center items-center p-4 transition-all duration-300 ease-out ${isOpen ? 'bg-dark bg-opacity-70 backdrop-blur-md' : 'bg-opacity-0 backdrop-blur-none'}`} onClick={onClose}>
        <div className={`bg-dark rounded-2xl shadow-2xl w-full max-w-md mx-auto aspect-[9/16] flex flex-col relative overflow-hidden transform transition-all duration-300 ease-out ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} onClick={(e) => e.stopPropagation()}>
          
          {/* Ad Content is now the main background */}
          <div className="absolute inset-0 bg-black flex items-center justify-center -z-10">
              {isVideo ? (
                  <video 
                      ref={videoRef}
                      src={ad.adCreativeUrl} 
                      autoPlay 
                      muted 
                      playsInline
                      className="w-full h-full object-contain"
                      onTimeUpdate={handleTimeUpdate}
                      onEnded={handleVideoEnd}
                  >
                      Your browser does not support the video tag.
                  </video>
              ) : (
                  <img src={ad.adCreativeUrl} alt={ad.name} className="w-full h-full object-contain" />
              )}
          </div>
          <div className="flex flex-col h-full justify-between bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4">
              {/* Header section with Close Button */}
              <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 p-2 bg-black/40 rounded-lg backdrop-blur-sm">
                      <img src={ad.company.logoUrl} alt={ad.company.name} className="h-10 w-10 rounded-full bg-gray-700" />
                      <div>
                          <p className="font-bold text-white text-sm">{ad.company.name}</p>
                          <p className="text-xs text-gray-300">{ad.company.subscriberCount.toLocaleString()} subscribers</p>
                      </div>
                  </div>
                  <div className="flex items-center gap-2">
                      <button onClick={handleShare} className="text-white/80 hover:text-white transition-colors z-10 p-2 bg-black/40 rounded-full backdrop-blur-sm" aria-label="Share ad">
                          <ShareIcon className="h-6 w-6" />
                      </button>
                      <button onClick={onClose} className="text-white/80 hover:text-white transition-colors z-10 p-2 bg-black/40 rounded-full backdrop-blur-sm" aria-label="Close player">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                      </button>
                  </div>
              </div>
              
              {/* Action Panel */}
              <div className="space-y-3">
                  {/* Progress & Reward Section */}
                  <div className="bg-black/50 backdrop-blur-md p-3 rounded-xl space-y-2 border border-gray-700/50">
                      <div className="flex justify-between items-center text-xs font-semibold text-gray-300">
                          <span className="tabular-nums">Time: {formattedTime}</span>
                          <div className="flex items-center gap-1.5">
                              <span className="font-bold text-accent-500">+{ad.reward} Points</span>
                              <CoinsIcon className="h-4 w-4 text-accent-500" />
                          </div>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Ad progress">
                          <div 
                              className="bg-primary-500 h-2 rounded-full transition-all duration-150 ease-linear"
                              style={{ width: `${progress}%` }}
                          ></div>
                      </div>
                  </div>
              
                  {/* Feedback Section */}
                  <div className="space-y-2 bg-black/50 backdrop-blur-md p-3 rounded-xl border border-gray-700/50">
                      <p className="text-center text-xs font-semibold text-white">How was this ad?</p>
                      <div className="flex items-center justify-center gap-3">
                          {reactions.map(({ label, emoji }) => (
                              <button
                                  key={label}
                                  onClick={() => setReaction(label)}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-xs font-semibold active:scale-110 ${
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
                      <div className="text-center text-xs pt-1 h-4">
                          {!isAdWatched && <p className="text-yellow-400">Watch the ad completely to claim your reward.</p>}
                          {isAdWatched && !reaction && <p className="text-gray-400">Please react to claim your reward.</p>}
                          {isRewardClaimed && !showRewardAnimation && <p className="font-semibold text-accent-500">Reward Claimed! Your history is updated.</p>}
                          {isRewardClaimed && showRewardAnimation && <p className="font-semibold text-accent-500/80 animate-pulse">Collecting reward...</p>}
                      </div>
                  </div>
                  
                  {/* CTA Button shows after ad is watched */}
                  {isAdWatched && (
                      <div className="pt-1">
                          <Button 
                              onClick={handleCTAClick} 
                              className="w-full animate-fade-in-up" 
                              size="md"
                              variant="success"
                          >
                              Shop Now
                          </Button>
                      </div>
                  )}
              </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdPlayer;
