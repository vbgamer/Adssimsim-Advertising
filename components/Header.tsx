
import React from 'react';
import { View, User } from '../types';
import { SparklesIcon } from './icons/SparklesIcon';
import Button from './ui/Button';

interface HeaderProps {
  currentView: View;
  onNavigate: (view: View) => void;
  currentUser: User | null;
  onLoginClick: () => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, onNavigate, currentUser, onLoginClick, onLogout }) => {
  const getLinkClass = (view: View) => {
    return `px-4 py-2 rounded-md text-sm font-medium transition-colors ${
      currentView === view
        ? 'bg-primary-600 text-white'
        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
    }`;
  };

  return (
    <header className="bg-slate-900/80 backdrop-blur-sm sticky top-0 z-40">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center cursor-pointer" onClick={() => onNavigate(currentUser ? currentUser.role : 'landing')}>
            <SparklesIcon className="h-8 w-8 text-primary-400" />
            <span className="text-xl font-bold ml-2 text-white">Adssimsim Advertising</span>
          </div>
          <div className="flex items-center space-x-4">
            {currentUser && (
               <>
                <button onClick={() => onNavigate('advertiser')} className={getLinkClass('advertiser')}>
                  Advertiser
                </button>
                <button onClick={() => onNavigate('viewer')} className={getLinkClass('viewer')}>
                  Viewer
                </button>
              </>
            )}
            {currentUser ? (
              <div className="flex items-center space-x-4">
                <span className="text-slate-300 text-sm">Welcome, {currentUser.username}!</span>
                <Button onClick={onLogout} variant="secondary" size="sm">Sign Out</Button>
              </div>
            ) : (
              <Button onClick={onLoginClick}>Login / Sign Up</Button>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;