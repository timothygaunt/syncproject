import React, { useMemo } from 'react';
import type { SyncJob } from '../types';
import { SyncStatus } from '../types';
import { ClipboardListIcon } from './icons/ClipboardListIcon';
import { PlayIcon } from './icons/PlayIcon';
import { PauseIcon } from './icons/PauseIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';
import { ArrowUpTrayIcon } from './icons/ArrowUpTrayIcon';

interface DashboardSummaryProps {
    jobs: SyncJob[];
}

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    colorClass: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, colorClass }) => (
    <div className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border-l-4 ${colorClass}`}>
        <div className="flex items-center">
            <div className={`p-2 rounded-full bg-gray-100 dark:bg-gray-700`}>
                {icon}
            </div>
            <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            </div>
        </div>
    </div>
);

export const DashboardSummary: React.FC<DashboardSummaryProps> = ({ jobs }) => {
    const summary = useMemo(() => {
        const totalJobs = jobs.length;
        const activeJobs = jobs.filter(j => j.status === SyncStatus.ACTIVE).length;
        const pausedJobs = jobs.filter(j => j.status === SyncStatus.PAUSED).length;
        const errorJobs = jobs.filter(j => j.status === SyncStatus.ERROR).length;
        const totalRowsSynced = jobs.reduce((acc, job) => acc + (job.lastRunRowsSynced || 0), 0);
        
        return {
            totalJobs,
            activeJobs,
            pausedJobs,
            errorJobs,
            totalRowsSynced,
        };
    }, [jobs]);

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Dashboard Overview</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                 <StatCard
                    title="Total Jobs"
                    value={summary.totalJobs}
                    icon={<ClipboardListIcon className="h-6 w-6 text-gray-500" />}
                    colorClass="border-gray-400"
                />
                <StatCard
                    title="Active"
                    value={summary.activeJobs}
                    icon={<PlayIcon className="h-6 w-6 text-green-500" />}
                    colorClass="border-green-500"
                />
                <StatCard
                    title="Paused"
                    value={summary.pausedJobs}
                    icon={<PauseIcon className="h-6 w-6 text-yellow-500" />}
                    colorClass="border-yellow-500"
                />
                <StatCard
                    title="Errors"
                    value={summary.errorJobs}
                    icon={<ExclamationTriangleIcon className="h-6 w-6 text-red-500" />}
                    colorClass="border-red-500"
                />
                <StatCard
                    title="Total Rows Synced (Last Run)"
                    value={summary.totalRowsSynced.toLocaleString()}
                    icon={<ArrowUpTrayIcon className="h-6 w-6 text-indigo-500" />}
                    colorClass="border-indigo-500"
                />
            </div>
        </div>
    );
};