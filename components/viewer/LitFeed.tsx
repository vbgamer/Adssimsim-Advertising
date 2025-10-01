


import React from 'react';
import { Campaign } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { MegaphoneIcon } from '../icons/MegaphoneIcon';

interface LitFeedProps {
  campaigns: Campaign[];
  onWatchAd: (campaign: Campaign) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
}

const LitFeed: React.FC<LitFeedProps> = ({ campaigns, onWatchAd, onLoadMore, hasMore, isLoadingMore }) => {
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

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {campaigns.map((campaign) => (
        <Card key={campaign.id} className="group overflow-hidden">
          <div className="relative cursor-pointer" onClick={() => onWatchAd(campaign)}>
            <img src={campaign.thumbnailUrl || campaign.adCreativeUrl} alt={campaign.name} loading="lazy" className="aspect-video w-full object-cover group-hover:scale-105 transition-transform duration-300" />
             <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
          </div>
          <div className="p-4">
             <div className="flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold text-white">{campaign.name}</h3>
                    <p className="text-sm text-gray-400 mt-1">from {campaign.company.name}</p>
                </div>
             </div>
             <p className="text-gray-300 mt-2 text-sm">{campaign.campaignGoal}</p>
             <Button onClick={() => onWatchAd(campaign)} className="mt-4 w-full" variant="secondary">
              Watch & Earn
            </Button>
          </div>
        </Card>
      ))}
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

export default LitFeed;