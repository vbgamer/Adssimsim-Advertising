



import React from 'react';
import { LogoIcon } from '../icons/LogoIcon';
import { SearchIcon } from '../icons/SearchIcon';

interface ViewerHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const ViewerHeader: React.FC<ViewerHeaderProps> = ({ searchQuery, onSearchChange }) => {
    return (
        <header className="bg-dark/80 backdrop-blur-sm sticky top-0 z-30 border-b border-gray-700">
            <div className="container mx-auto px-4">
                <div className="flex items-center h-16 gap-4">
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <LogoIcon className="h-10 w-10 text-4xl" />
                        <span className="text-xl font-bold text-white hidden sm:inline">Adssimsim</span>
                    </div>
                    <div className="flex-1 flex justify-center px-4">
                        <div className="relative w-full max-w-lg">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <SearchIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="search"
                                name="search"
                                id="search"
                                placeholder="Search by category, company, or name..."
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="block w-full bg-charcoal border border-gray-700 rounded-full py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all duration-200"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default ViewerHeader;