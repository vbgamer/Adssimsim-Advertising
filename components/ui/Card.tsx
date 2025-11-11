import React from 'react';

// Fix: Extended CardProps with React.HTMLAttributes<HTMLDivElement> to allow passing standard div props like onClick.
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={`bg-charcoal rounded-xl shadow-lg overflow-hidden border border-gray-700 ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Card;