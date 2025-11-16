import React, { useEffect } from 'react';
import AnimatedCounter from './AnimatedCounter';

interface RewardAnimationProps {
  amount: number;
  onAnimationEnd: () => void;
}

const RewardAnimation: React.FC<RewardAnimationProps> = ({ amount, onAnimationEnd }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onAnimationEnd();
    }, 4000); // Animation duration is roughly 4s
    return () => clearTimeout(timer);
  }, [onAnimationEnd]);

  const coins = Array.from({ length: 30 }); // Create 30 coins

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-start items-center pt-20 pointer-events-none overflow-hidden">
      {/* Coin Jar */}
      <div className="absolute top-0 transform -translate-y-1/2 animate-jar-pour" style={{ animationFillMode: 'forwards' }}>
        <svg width="100" height="100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 8H19V5C19 3.89543 18.1046 3 17 3H7C5.89543 3 5 3.89543 5 5V8Z" fill="#a0522d"/>
            <path d="M5 8H19L17 21H7L5 8Z" fill="#cd853f"/>
        </svg>
      </div>

      {/* Reward Text */}
      <div className="text-center mt-20 z-10" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
        <p className="text-4xl font-bold text-accent-500">
            +<AnimatedCounter endValue={amount} duration={3000} /> Points
        </p>
      </div>

      {/* Falling Coins */}
      <div className="absolute top-10">
        {coins.map((_, i) => (
          <div
            key={i}
            className="absolute animate-coin-fall"
            style={{
              left: `${Math.random() * 100 - 50}px`, // Spread them out horizontally
              animationDelay: `${i * 0.05}s`, // Stagger the start time
              animationDuration: `${2 + Math.random()}s`,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="#FFD700" stroke="#DAA520" strokeWidth="1"/>
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RewardAnimation;
