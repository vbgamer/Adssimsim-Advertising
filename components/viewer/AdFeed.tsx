


import React from 'react';
import { Campaign } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { MegaphoneIcon } from '../icons/MegaphoneIcon';

interface AdFeedProps {
  campaigns: Campaign[];
  onWatchAd: (campaign: Campaign) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
}

const AdFeed: React.FC<AdFeedProps> = ({ campaigns, onWatchAd, onLoadMore, hasMore, isLoadingMore }) => {
  if (campaigns.length === 0) {
    return (
      <Card className="p-8 text-center bg-charcoal/50 border border-gray-800">
          <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 bg-primary-500 rounded-full blur-xl opacity-30"></div>
              <div className="relative flex items-center justify-center h-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                  </svg>
              </div>
          </div>
          <h3 className="mt-4 text-2xl font-bold text-white">The Feed is Quiet... For Now</h3>
          <p className="mt-2 text-gray-400 max-w-md mx-auto">Awesome new ad campaigns are on their way. Check back soon to watch, engage, and earn rewards!</p>
          <details className="mt-10 text-xs text-gray-600 text-left bg-dark p-3 rounded-md max-w-lg mx-auto cursor-pointer">
              <summary className="font-bold outline-none">First time setup? (Developer Info)</summary>
              <div className="mt-2 space-y-1">
                  <p>If you're a developer and expect to see ads, ensure your database has active campaigns and that your Row Level Security (RLS) policies allow authenticated users to view them.</p>
              </div>
          </details>
      </Card>
    );
  }
  
  const renderItem = (campaign: Campaign) => {
    const isShort = campaign.type === 'Shortz';
    const displayImageUrl = campaign.thumbnailUrl || campaign.adCreativeUrl;
    return (
        <div key={campaign.id} className="cursor-pointer group" onClick={() => onWatchAd(campaign)}>
            <div className={`relative overflow-hidden rounded-2xl bg-charcoal shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-glow-primary ${isShort ? 'aspect-[9/16]' : 'aspect-video'}`}>
                <img src={displayImageUrl} alt={campaign.name} loading="lazy" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0"></div>
                 <div className="absolute bottom-0 left-0 right-0 p-3">
                     <p className="font-bold text-white text-base truncate">{campaign.name}</p>
                 </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
                <img src={campaign.company.logoUrl} alt={campaign.company.name} className="h-8 w-8 rounded-full bg-gray-700 flex-shrink-0"/>
                <div>
                    <p className="text-sm font-semibold text-gray-300 truncate">{campaign.company.name}</p>
                </div>
            </div>
        </div>
    )
  }

  return (
    <div>
        <h2 className="text-2xl font-bold text-white mb-4">On Going Campaigns</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {campaigns.map((campaign) => renderItem(campaign))}
        </div>
        {hasMore && (
            <div className="text-center mt-8">
                <Button onClick={onLoadMore} isLoading={isLoadingMore}>
                    Load More
                </Button>
            </div>
        )}
    </div>
  );
};

export default AdFeed;