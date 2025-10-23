

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
    Active: 'bg-green-600 text-white',
    Pending: 'bg-yellow-600 text-white',
    Paused: 'bg-gray-600 text-white',
    Finished: 'bg-blue-600 text-white',
    Rejected: 'bg-red-600 text-white',
    Uploading: 'bg-sky-600 text-white',
    'Upload Failed': 'bg-red-700 text-white font-semibold',
  };

  return (
    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-md ${statusStyles[status] || statusStyles.Paused}`}>
      {status}
    </span>
  );
};

type CampaignType = 'Video' | 'Shortz';

const CampaignList: React.FC<CampaignListProps> = ({ campaigns, onAdjustDiscount, onLoadMore, hasMore, isLoadingMore, onCreateCampaignClick }) => {
  const [activeTab, setActiveTab] = useState<CampaignType>('Video');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [expandedErrorId, setExpandedErrorId] = useState<string | null>(null);

  const toggleError = (campaignId: string) => {
    setExpandedErrorId(prev => (prev === campaignId ? null : campaignId));
  };

  const filteredCampaigns = campaigns.filter(c => c.type === activeTab);

  const TabButton = ({ type, children }: { type: CampaignType, children: React.ReactNode }) => (
    <button
      onClick={() => setActiveTab(type)}
      className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${
        activeTab === type ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'
      }`}
    >
      {children}
    </button>
  );

  return (
    <Card>
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          {/* Fix: Added children to TabButton components to provide button text and satisfy type requirements. */}
          <TabButton type="Video">Videos</TabButton>
          <TabButton type="Shortz">Shortz</TabButton>
        </div>
      </div>
      
      {filteredCampaigns.length > 0 ? (
        <ul className="divide-y divide-gray-700">
          {filteredCampaigns.map(campaign => (
            <React.Fragment key={campaign.id}>
                <li className="p-4 flex items-center justify-between hover:bg-gray-800/50">
                <div className="flex items-center gap-4 flex-grow min-w-0">
                    <img src={campaign.thumbnailUrl || campaign.adCreativeUrl} alt={campaign.name} loading="lazy" className="h-10 w-10 object-cover rounded-md bg-gray-800 flex-shrink-0" />
                    <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-3">
                            <p className={`font-semibold text-white truncate ${campaign.status === 'Upload Failed' ? 'text-red-400' : ''}`}>{campaign.name}</p>
                            {campaign.status === 'Uploading' && <Spinner className="h-4 w-4" />}
                            <StatusBadge status={campaign.status} />
                        </div>
                        {campaign.status === 'Uploading' ? (
                            <p className="text-sm text-gray-400 mt-1">Uploading creative...</p>
                        ) : campaign.status === 'Upload Failed' ? (
                            <p className="text-xs text-red-500 mt-1 truncate">Upload failed. Click "View Error" for details.</p>
                        ) : (
                            <p className="text-sm text-gray-400 mt-1">{`${campaign.impressions.toLocaleString()} views`}</p>
                        )}
                    </div>
                </div>

                {campaign.status === 'Upload Failed' && (
                    <div className="flex-shrink-0 ml-4">
                        <Button onClick={() => toggleError(campaign.id)} variant="secondary" size="sm">
                            {expandedErrorId === campaign.id ? 'Hide Error' : 'View Error'}
                        </Button>
                    </div>
                )}

                {campaign.status !== 'Uploading' && campaign.status !== 'Upload Failed' && (
                    <div className="relative flex-shrink-0">
                    <button 
                        onClick={() => setOpenMenuId(openMenuId === campaign.id ? null : campaign.id)} 
                        className="p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white"
                    >
                        <DotsVerticalIcon className="h-5 w-5" />
                    </button>
                    {openMenuId === campaign.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg z-10 py-1 border border-gray-600">
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
                 {expandedErrorId === campaign.id && campaign.uploadError && (
                    <li className="bg-red-900/20 p-4 border-l-4 border-red-500">
                        <h5 className="font-bold text-red-300 text-sm mb-2">Upload Error Details</h5>
                        <p className="text-xs text-red-300 whitespace-pre-wrap font-mono">{campaign.uploadError}</p>
                    </li>
                )}
            </React.Fragment>
          ))}
        </ul>
      ) : (
        <div className="p-8 text-center">
            <MegaphoneIcon className="mx-auto h-12 w-12 text-gray-500" />
            <h3 className="mt-4 text-xl font-bold text-white">No {activeTab} Campaigns Yet</h3>
            <p className="mt-2 text-gray-400">Launch a new campaign to get started!</p>
            <Button onClick={onCreateCampaignClick} className="mt-6">Create Your First Campaign</Button>
        </div>
      )}

      {hasMore && filteredCampaigns.length > 0 && (
        <div className="p-4 text-center border-t border-gray-700">
          <Button onClick={onLoadMore} isLoading={isLoadingMore} variant="secondary">
            Load More
          </Button>
        </div>
      )}
    </Card>
  );
};

// FIX: Added default export to make the component importable.
export default CampaignList;