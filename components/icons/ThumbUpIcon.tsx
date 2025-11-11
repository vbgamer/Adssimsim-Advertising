import React from 'react';

export const ThumbUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M7 10v12" />
        <path d="M17 10V4a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v6" />
        <path d="M22 10h-5.21a2 2 0 0 0-1.95 1.45l-1.39 4.18a2 2 0 0 1-1.95 1.45H2" />
    </svg>
);
