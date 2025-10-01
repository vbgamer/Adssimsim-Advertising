import React from 'react';

export const LogoIcon: React.FC<React.HTMLAttributes<HTMLSpanElement>> = (props) => (
  <span
    {...props}
    className={`inline-flex items-center justify-center font-black animate-logo-pulse border-2 rounded-md ${props.className}`}
  >
    A
  </span>
);
