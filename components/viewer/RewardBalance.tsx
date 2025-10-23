
import React from 'react';
import Card from '../ui/Card';
import { CoinsIcon } from '../icons/CoinsIcon';

interface RewardBalanceProps {
  points: number;
}

const RewardBalance: React.FC<RewardBalanceProps> = ({ points }) => {
  return (
    <Card className="p-6 bg-gradient-to-r from-primary-500 to-accent-500 shadow-lg shadow-primary-500/30">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-off-white/80 text-lg font-medium">Your Balance</h3>
          <p className="text-4xl font-bold text-off-white">{points.toLocaleString()} Points</p>
        </div>
        <CoinsIcon className="h-16 w-16 text-off-white/30" />
      </div>
    </Card>
  );
};

export default RewardBalance;