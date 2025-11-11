
import React from 'react';
import { User, WatchedAd } from '../../types';
import RewardBalance from './RewardBalance';
import ViewerHistory from './ViewerHistory';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface ProfilePageProps {
  user: User;
  onLogout: () => void;
  rewardPoints: number;
  watchedHistory: WatchedAd[];
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onLogout, rewardPoints, watchedHistory }) => {
  return (
    <div className="space-y-8">
        <Card className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="h-24 w-24 rounded-full bg-primary-500 flex items-center justify-center text-4xl font-bold text-white">
                    {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="text-center sm:text-left">
                    <h1 className="text-3xl font-bold text-white">{user.username}</h1>
                    <p className="text-gray-400">Welcome to your dashboard!</p>
                </div>
                <div className="sm:ml-auto">
                    <Button onClick={onLogout} variant="secondary">Sign Out</Button>
                </div>
            </div>
        </Card>

        <RewardBalance points={rewardPoints} />

        <div>
            <h2 className="text-2xl font-bold text-white mb-4">Viewing History</h2>
            <ViewerHistory history={watchedHistory} />
        </div>
    </div>
  );
};

export default ProfilePage;