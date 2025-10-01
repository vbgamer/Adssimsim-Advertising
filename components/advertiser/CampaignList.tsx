

import React, { useState } from 'react';
import { Campaign } from '../../types';
import Card from '../ui/Card';
import { DotsVerticalIcon } from '../icons/DotsVerticalIcon';
import Spinner from '../ui/Spinner';
import Button from '../ui/Button';
import { MegaphoneIcon } from '../icons/MegaphoneIcon';

interface CampaignListProps {
  campaigns: Campaign[];
  onAdjustDiscount: (campaign: Campaign) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
  onCreateCampaignClick: () => void;
}

const StatusBadge: React.FC<{ status: Campaign['status'] }> = ({ status }) => {
  const statusStyles: Record<Campaign['status'], string> = {
    Active: 'bg-emerald-500/20 text-emerald-400',
    Pending: 'bg-amber-500/20 text-amber-400',
    Paused: 'bg-gray-500/20 text-gray-400',
    Finished: 'bg-blue-500/20 text-blue-400',
    Rejected: 'bg-red-500/20 text-red-400',
    Uploading: 'bg-sky-500/20 text-sky-400',
    'Upload Failed': 'bg-red-600/20 text-red-500 font-semibold',
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusStyles[status] || statusStyles.Paused}`}>
      {status}
    </span>
  );
};

type CampaignType = 'Video' | 'Shortz';

const CampaignList: React.FC<CampaignListProps> = ({ campaigns, onAdjustDiscount, onLoadMore, hasMore, isLoadingMore, onCreateCampaignClick }) => {
  const [activeTab, setActiveTab] = useState<CampaignType>('Video');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const filteredCampaigns = campaigns.filter(c => c.type === activeTab);

  const TabButton = ({ type, children }: { type: CampaignType, children: React.ReactNode }) => (
    <button
      onClick={() => setActiveTab(type)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        activeTab === type ? 'bg-primary-500 text-off-white' : 'text-gray-300 hover:bg-gray-800'
      }`}
    >
      {children}
    </button>
  );

  return (
    <Card>
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          {/* Fix: Added missing children prop to TabButton components to resolve type error. */}
          <TabButton type="Video">Videos</TabButton>
          <TabButton type="Shortz">Shortz</TabButton>
        </div>
      </div>
      
      {filteredCampaigns.length > 0 ? (
        <ul className="divide-y divide-gray-700">
          {filteredCampaigns.map(campaign => (
            <li key={campaign.id} className="p-4 flex items-center justify-between hover:bg-gray-800/50">
              <div className="flex items-center gap-4">
                <img src={campaign.thumbnailUrl || campaign.adCreativeUrl} alt={campaign.name} loading="lazy" className="h-12 w-20 object-cover rounded-md bg-gray-800" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className={`font-semibold text-white ${campaign.status === 'Upload Failed' ? 'text-red-400' : ''}`}>{campaign.name}</p>
                    {campaign.status === 'Uploading' && <Spinner className="h-4 w-4" />}
                    <StatusBadge status={campaign.status} />
                  </div>
                  <div className="text-sm mt-1">
                    {campaign.status === 'Uploading' && <p className="text-gray-400">Uploading creative... This can take a few minutes for large videos.</p>}
                    {campaign.status === 'Upload Failed' && (
                      <pre className="text-red-500 whitespace-pre-wrap font-sans text-xs">
                        {campaign.uploadError || 'Something went wrong.'}
                      </pre>
                    )}
                    {campaign.status !== 'Uploading' && campaign.status !== 'Upload Failed' && (
                      <p className="text-gray-400">{`${campaign.impressions.toLocaleString()} views`}</p>
                    )}
                  </div>
                </div>
              </div>
              {campaign.status !== 'Uploading' && campaign.status !== 'Upload Failed' && (
                <div className="relative">
                  <button 
                      onClick={() => setOpenMenuId(openMenuId === campaign.id ? null : campaign.id)} 
                      className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white"
                  >
                    <DotsVerticalIcon className="h-5 w-5" />
                  </button>
                  {openMenuId === campaign.id && (
                    <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg z-10 py-1">
                      <button className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700">Hide</button>
                      <button 
                        onClick={() => {
                          onAdjustDiscount(campaign);
                          setOpenMenuId(null);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
                      >
                        Adjust Cashback
                      </button>
                      <button className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700">Delete</button>
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="p-8 text-center text-gray-400">
            <svg className="mx-auto h-16 w-16 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-4 text-2xl font-bold text-white">Your Dashboard is Ready</h3>
            <p className="mt-2 max-w-md mx-auto">You haven't launched any '{activeTab}' campaigns yet. Let's get your first ad in front of thousands of viewers!</p>
            <div className="mt-6">
                <Button onClick={onCreateCampaignClick} variant="primary" size="lg">
                    Create Your First Campaign
                </Button>
            </div>
            <details className="mt-10 text-xs text-gray-600 text-left bg-dark p-3 rounded-md max-w-lg mx-auto cursor-pointer">
                <summary className="font-bold outline-none">First time setup? (Developer Info)</summary>
                <div className="mt-2 space-y-1">
                    <p>If you have created campaigns and they are not appearing, check your Row Level Security (RLS) policies. Advertisers need permission to `SELECT` campaigns where their ID matches the `advertiser_id`.</p>
                </div>
            </details>
        </div>
      )}

      {hasMore && (
        <div className="p-4 text-center border-t border-gray-700">
            <Button onClick={onLoadMore} isLoading={isLoadingMore}>
                Load More Campaigns
            </Button>
        </div>
      )}
    </Card>
  );
};

export default CampaignList;