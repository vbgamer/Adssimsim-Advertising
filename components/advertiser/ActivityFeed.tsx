import React from 'react';
import Card from '../ui/Card';
import { CoinsIcon } from '../icons/CoinsIcon';

export interface Activity {
  id: string;
  campaignName: string;
  reward: number;
  timestamp: Date;
}

interface ActivityFeedProps {
  activities: Activity[];
}

const formatDistanceToNow = (date: Date): string => {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return 'a while ago';
  }
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds} seconds ago`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
};


const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  return (
    <Card className="overflow-hidden">
      {activities.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          <p>Waiting for viewer activity...</p>
          <p className="text-xs mt-1">When a viewer watches your ad and claims a reward, it will appear here in real-time.</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-700 max-h-80 overflow-y-auto">
          {activities.map((activity, index) => (
            <li 
              key={activity.id} 
              className={`p-4 flex items-start gap-4 ${index === 0 ? 'animate-fade-in-up' : ''}`}
              style={{ opacity: index === 0 ? 0 : 1, animationFillMode: 'forwards' }}
            >
              <div className="flex-shrink-0 mt-1">
                <CoinsIcon className="h-5 w-5 text-accent-500" />
              </div>
              <div className="flex-grow">
                <div className="flex justify-between items-center">
                    <p className="text-sm font-semibold text-white">Reward Claimed</p>
                    <p className="text-xs text-gray-500">{formatDistanceToNow(activity.timestamp)}</p>
                </div>
                <p className="text-sm text-gray-300 mt-1">
                    <span className="font-medium text-gray-400">Campaign:</span> {activity.campaignName}
                </p>
                 <p className="text-sm text-gray-300">
                    <span className="font-medium text-gray-400">Amount:</span> <span className="font-bold text-accent-500">+{activity.reward} PTS</span>
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

export default ActivityFeed;
