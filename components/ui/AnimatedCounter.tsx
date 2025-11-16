import React, { useState, useEffect } from 'react';

const AnimatedCounter: React.FC<{ endValue: number; duration?: number; }> = ({ endValue, duration = 2000 }) => {
  const [count, setCount] = useState(0.00);

  useEffect(() => {
    let startTime: number | undefined;
    let animationFrameId: number;

    const animate = (timestamp: number) => {
      if (startTime === undefined) startTime = timestamp;
      const elapsedTime = timestamp - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      
      const currentVal = progress * endValue;
      setCount(parseFloat(currentVal.toFixed(2)));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setCount(endValue);
      }
    };
    
    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [endValue, duration]);

  return <span>{count.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
};

export default AnimatedCounter;
