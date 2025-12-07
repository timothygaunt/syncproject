import React from 'react';
import { Button } from './Button';
import { PlayIcon } from './icons/PlayIcon';
import { PauseIcon } from './icons/PauseIcon';

interface BulkActionsBarProps {
    selectedCount: number;
    onSetActive: () => void;
    onSetPaused: () => void;
    onClearSelection: () => void;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
    selectedCount,
    onSetActive,
    onSetPaused,
    onClearSelection
}) => {
    return (
        <div className="sticky top-16 z-30 bg-indigo-600 dark:bg-indigo-800 shadow-lg rounded-b-lg mb-4 -mx-4 sm:-mx-6 lg:-mx-8">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-14">
                    <div className="flex items-center space-x-4">
                        <span className="text-white font-semibold">
                            {selectedCount} {selectedCount === 1 ? 'job' : 'jobs'} selected
                        </span>
                        <Button variant="secondary" onClick={onClearSelection} className="!w-auto !py-1 !px-3 !text-xs">
                            Clear selection
                        </Button>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={onSetActive}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-green-500/80 border border-transparent rounded-md shadow-sm hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-600 focus:ring-green-400 transition-colors"
                        >
                            <PlayIcon className="h-5 w-5" />
                            Set Active
                        </button>
                         <button
                            onClick={onSetPaused}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-yellow-500/80 border border-transparent rounded-md shadow-sm hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-600 focus:ring-yellow-400 transition-colors"
                        >
                            <PauseIcon className="h-5 w-5" />
                            Set Paused
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};