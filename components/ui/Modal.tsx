import React, { useState, useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title, subtitle }) => {
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    let timeoutId: number;
    if (isOpen) {
      setIsRendered(true);
    } else {
      // Wait for exit animation to complete before unmounting
      timeoutId = window.setTimeout(() => setIsRendered(false), 300);
    }
    return () => window.clearTimeout(timeoutId);
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  // Use 'isRendered' to control mounting, so the component isn't removed from the DOM immediately, allowing animations to play.
  if (!isRendered) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex justify-center items-center p-4 transition-all duration-300 ease-out ${isOpen ? 'bg-dark bg-opacity-80 backdrop-blur-sm' : 'bg-opacity-0'}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={handleBackdropClick}
    >
      <div 
        className={`bg-charcoal rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 ease-out flex flex-col max-h-[90vh] border-2 border-primary-500/50 shadow-glow-primary ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-shrink-0 flex justify-between items-start p-6 border-b border-gray-700">
          <div>
            <h2 id="modal-title" className="text-2xl font-bold text-primary-500">{title}</h2>
            {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" aria-label="Close modal">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;