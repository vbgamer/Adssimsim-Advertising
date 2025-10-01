
import React from 'react';

interface SpinnerProps {
  className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ className = 'h-8 w-8' }) => {
  return (
    <div className={`animate-spin rounded-full border-4 border-gray-800 border-t-primary-500 ${className}`} role="status">
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Spinner;