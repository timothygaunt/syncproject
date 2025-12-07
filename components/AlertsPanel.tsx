import React from 'react';
import type { SyncJob } from '../types';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';
import { XCircleIcon } from './icons/XCircleIcon';

interface AlertsPanelProps {
    failedJobs: SyncJob[];
    onDismiss: () => void;
    onJobClick: (job: SyncJob) => void;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ failedJobs, onDismiss, onJobClick }) => {
    if (failedJobs.length === 0) {
        return null;
    }

    return (
        <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-400 p-4 mb-6 rounded-r-lg shadow">
            <div className="flex">
                <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3 flex-1 md:flex md:justify-between">
                    <div>
                        <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                            {failedJobs.length} {failedJobs.length === 1 ? 'Job requires' : 'Jobs require'} attention
                        </h3>
                        <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                            <p>
                                The following jobs are in an error state. Click a job name to view its logs.
                            </p>
                            <ul role="list" className="list-disc pl-5 space-y-1 mt-2">
                                {failedJobs.map(job => (
                                    <li key={job.id}>
                                        <button
                                            onClick={() => onJobClick(job)}
                                            className="font-semibold text-red-800 dark:text-red-200 hover:underline focus:outline-none focus:ring-2 focus:ring-red-500 rounded-sm"
                                        >
                                            {job.name}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                     <div className="mt-3 md:mt-0 md:ml-6">
                        <button
                            type="button"
                            onClick={onDismiss}
                            className="p-1.5 rounded-md text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                        >
                            <span className="sr-only">Dismiss</span>
                            <XCircleIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};