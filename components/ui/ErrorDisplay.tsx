import React from 'react';
import Card from './Card';
import Button from './Button';

interface ErrorDisplayProps {
  title: string;
  message: string;
  onRetry?: () => void;
  retryText?: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ title, message, onRetry, retryText = "Try Again" }) => (
  <Card className="p-6 bg-red-900/20 border-red-700/50 max-w-3xl mx-auto">
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 mt-1">
         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
         </svg>
      </div>
      <div>
        <h4 className="font-semibold text-red-400">{title}</h4>
        <p className="text-red-300/80 text-sm mt-2 whitespace-pre-wrap">{message}</p>
        {onRetry && (
          <Button onClick={onRetry} className="mt-4" variant="secondary" size="sm">
            {retryText}
          </Button>
        )}
      </div>
    </div>
  </Card>
);

export default ErrorDisplay;
