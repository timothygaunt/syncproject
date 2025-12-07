import React from 'react';
import { SchemaStatus } from '../types';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';

interface SchemaStatusIndicatorProps {
    status?: SchemaStatus;
    onClick?: (event: React.MouseEvent) => void;
}

export const SchemaStatusIndicator: React.FC<SchemaStatusIndicatorProps> = ({ status, onClick }) => {
    if (status !== SchemaStatus.CHANGED) {
        return null;
    }
    
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex items-center gap-1.5 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full dark:bg-yellow-900/50 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900 transition-colors"
            title="The schema in the source Google Sheet has changed. Click to review."
        >
            <ExclamationTriangleIcon className="h-4 w-4" />
            <span className="text-xs font-semibold">Schema Changes Detected</span>
        </button>
    );
};