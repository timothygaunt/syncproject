import React, { useState, useEffect, useMemo } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { LoadingSpinner } from './LoadingSpinner';
import { SearchIcon } from './icons/SearchIcon';
import { discoverGoogleSheets } from '../services/apiClient';
import type { DiscoverableSheet } from '../types';
import { GoogleDriveIcon } from './icons/GoogleDriveIcon';

interface GoogleSheetPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectSheet: (sheet: DiscoverableSheet) => void;
}

export const GoogleSheetPickerModal: React.FC<GoogleSheetPickerModalProps> = ({ isOpen, onClose, onSelectSheet }) => {
    const [sheets, setSheets] = useState<DiscoverableSheet[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (isOpen) {
            const fetchSheets = async () => {
                setIsLoading(true);
                try {
                    const discoveredSheets = await discoverGoogleSheets();
                    setSheets(discoveredSheets);
                } catch (error) {
                    console.error("Failed to discover Google Sheets:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchSheets();
        }
    }, [isOpen]);

    const filteredSheets = useMemo(() => {
        if (!searchQuery) {
            return sheets;
        }
        return sheets.filter(sheet =>
            sheet.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [sheets, searchQuery]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl m-4 max-h-[80vh] flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Select a Google Sheet</h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Search for and select a sheet to use as a data source.
                    </p>
                    <div className="mt-4">
                        <Input
                            label=""
                            name="sheet-search"
                            placeholder="Search sheets..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            icon={<SearchIcon className="h-5 w-5 text-gray-400" />}
                        />
                    </div>
                </div>

                <div className="p-2 flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-full">
                            <LoadingSpinner />
                        </div>
                    ) : (
                        <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredSheets.map((sheet) => (
                                <li key={sheet.id}>
                                    <button
                                        type="button"
                                        onClick={() => onSelectSheet(sheet)}
                                        className="w-full text-left flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                    >
                                        <GoogleDriveIcon className="h-6 w-6 mr-4 text-gray-500 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{sheet.name}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{sheet.url}</p>
                                        </div>
                                    </button>
                                </li>
                            ))}
                             {filteredSheets.length === 0 && (
                                <li className="text-center py-10 text-gray-500 dark:text-gray-400">
                                    No sheets found.
                                </li>
                            )}
                        </ul>
                    )}
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                </div>
            </div>
        </div>
    );
};