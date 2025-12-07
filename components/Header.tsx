import React, { useState, useEffect, useRef } from 'react';
import { LogoutIcon } from './icons/LogoutIcon';
import { ExportIcon } from './icons/ExportIcon';
import { ImportIcon } from './icons/ImportIcon';
import type { User } from '../types';
import { usePermissions } from '../hooks/usePermissions';

interface HeaderProps {
    onLogout: () => void;
    onNavigate: (page: 'dashboard' | 'management') => void;
    currentPage: 'dashboard' | 'management';
    onExportSiteConfig: () => void;
    onImportSiteConfig: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLogout, onNavigate, currentPage, onExportSiteConfig, onImportSiteConfig }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { currentUser, hasPermission } = usePermissions();

    const showManagement = hasPermission('VIEW_MANAGEMENT');
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-40">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center space-x-3">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                         </svg>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
                            SheetSync Scheduler
                        </h1>
                    </div>
                     <div className="flex items-center space-x-2">
                        <nav className="flex items-center space-x-1 sm:space-x-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                           <button 
                                onClick={() => onNavigate('dashboard')}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${currentPage === 'dashboard' ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                           >
                               Dashboard
                           </button>
                           {showManagement && (
                            <button 
                                onClick={() => onNavigate('management')}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${currentPage === 'management' ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                            >
                                Management
                            </button>
                           )}
                        </nav>
                        
                        <div className="h-8 border-l border-gray-200 dark:border-gray-600 mx-2"></div>

                        <div className="relative" ref={menuRef}>
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">{currentUser?.name}</span>
                                <div className="h-8 w-8 bg-indigo-200 dark:bg-indigo-900 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold">
                                    {currentUser?.name.charAt(0)}
                                </div>
                            </button>
                             {isMenuOpen && (
                                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none">
                                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                                        {hasPermission('MANAGE_SETTINGS') && (
                                            <>
                                                <button
                                                    onClick={() => { onImportSiteConfig(); setIsMenuOpen(false); }}
                                                    className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                    role="menuitem"
                                                >
                                                    <ImportIcon className="h-5 w-5 mr-3" />
                                                    Import Site Config
                                                </button>
                                                <button
                                                    onClick={() => { onExportSiteConfig(); setIsMenuOpen(false); }}
                                                    className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                    role="menuitem"
                                                >
                                                    <ExportIcon className="h-5 w-5 mr-3" />
                                                    Export Site Config
                                                </button>
                                            </>
                                        )}
                                        <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                                        <button
                                            onClick={() => { onLogout(); setIsMenuOpen(false); }}
                                            className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                            role="menuitem"
                                        >
                                            <LogoutIcon className="h-5 w-5 mr-3" />
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                     </div>
                </div>
            </div>
        </header>
    );
};
