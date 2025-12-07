
import React from 'react';
import { SyncStatus } from '../types';

interface StatusIndicatorProps {
    status: SyncStatus;
}

const statusConfig: Record<SyncStatus, { color: string, text: string }> = {
    [SyncStatus.ACTIVE]: { color: 'bg-green-500', text: 'Active' },
    [SyncStatus.PAUSED]: { color: 'bg-yellow-500', text: 'Paused' },
    [SyncStatus.ERROR]: { color: 'bg-red-500', text: 'Error' },
    [SyncStatus.COMPLETED]: { color: 'bg-blue-500', text: 'Completed' },
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status }) => {
    const config = statusConfig[status];
    
    return (
        <div className="flex items-center gap-2" title={config.text}>
            <span className={`h-3 w-3 rounded-full ${config.color}`}></span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">{config.text}</span>
        </div>
    );
};
