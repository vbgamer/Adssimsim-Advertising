
import React, { useState } from 'react';
import Card from '../ui/Card';
import { CoinsIcon } from '../icons/CoinsIcon';
import Button from '../ui/Button';

interface RewardBalanceProps {
  points: number;
}

const RewardBalance: React.FC<RewardBalanceProps> = ({ points }) => {
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const handleWithdraw = () => {
    if (points < 15) {
      setMessageType('error');
      setMessage('You need at least 15 points to withdraw.');
    } else {
      setMessageType('success');
      setMessage('Withdrawal request submitted!');
      // In a real app, you would call an API here.
    }
    setTimeout(() => {
        setMessage('');
        setMessageType('');
    }, 4000);
  };

  const messageColor = messageType === 'error' ? 'text-red-400' : 'text-green-400';

  return (
    <Card className="p-6 bg-gradient-to-r from-primary-500 to-accent-500 shadow-lg shadow-primary-500/30">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-off-white/80 text-lg font-medium">Your Balance</h3>
          <p className="text-4xl font-bold text-off-white">{points.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Points</p>
        </div>
        <div className="flex flex-col items-end gap-2">
            <CoinsIcon className="h-16 w-16 text-off-white/30" />
            <Button onClick={handleWithdraw} variant="secondary" size="sm" className="bg-white/20 text-white hover:bg-white/30 border-none">Withdraw</Button>
        </div>
      </div>
       {message && (
          <p className={`text-sm font-semibold mt-4 text-center ${messageColor} animate-fade-in-up`}>{message}</p>
      )}
    </Card>
  );
};

export default RewardBalance;
