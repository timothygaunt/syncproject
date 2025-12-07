import React from 'react';
import type { SyncJob } from '../types';
import { ClockIcon } from './icons/ClockIcon';
import { DatabaseIcon } from './icons/DatabaseIcon';
import { StopwatchIcon } from './icons/StopwatchIcon';

interface JobRunMetricsProps {
    job: SyncJob;
    onViewLogs: (event: React.MouseEvent) => void;
}

const MetricGraphic: React.FC = () => (
    <div className="flex items-end space-x-0.5 h-4" aria-hidden="true">
        <div className="w-1 bg-indigo-300 dark:bg-indigo-700 rounded-full" style={{height: '40%'}}></div>
        <div className="w-1 bg-indigo-400 dark:bg-indigo-600 rounded-full" style={{height: '70%'}}></div>
        <div className="w-1 bg-indigo-500 dark:bg-indigo-500 rounded-full" style={{height: '100%'}}></div>
    </div>
);

export const JobRunMetrics: React.FC<JobRunMetricsProps> = ({ job, onViewLogs }) => {

    const LastRunStatus = () => {
        if (!job.lastRun) return <span className="italic">Never run</span>;
        
        const statusText = job.lastRunStatus === 'FAILURE' ? 'Failed' : 'Success';
        const statusColor = job.lastRunStatus === 'FAILURE' ? 'text-red-500' : 'text-green-500';

        return (
            <button
                onClick={onViewLogs}
                className={`hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-sm p-0.5 -m-0.5 ${statusColor}`}
                title="View logs for this run"
            >
                {statusText} on {new Date(job.lastRun).toLocaleDateString()}
            </button>
        );
    }

    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1.5" title="Cron Schedule">
                <ClockIcon className="h-4 w-4 flex-shrink-0" />
                <code className="font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700/60 p-1 rounded text-xs">{job.cronSchedule}</code>
            </div>
            
            <div className="hidden sm:block border-l border-gray-200 dark:border-gray-700 h-4"></div>

            <div className="mt-2 sm:mt-0 flex items-center gap-4 sm:gap-6">
                <div className="flex items-center gap-2" title={`${job.lastRunRowsSynced?.toLocaleString() ?? 0} rows synced`}>
                    <DatabaseIcon className="h-4 w-4 flex-shrink-0"/>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{job.lastRunRowsSynced?.toLocaleString() ?? 'N/A'}</span>
                    <MetricGraphic />
                </div>
                <div className="flex items-center gap-2" title={`${job.lastRunDurationInSeconds ?? 0}s duration`}>
                    <StopwatchIcon className="h-4 w-4 flex-shrink-0"/>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{job.lastRunDurationInSeconds ?? 'N/A'}s</span>
                    <MetricGraphic />
                </div>
                <div className="hidden md:block">
                    Last Run: <LastRunStatus />
                </div>
            </div>
             <div className="mt-2 md:hidden">
                Last Run: <LastRunStatus />
            </div>
        </div>
    );
};