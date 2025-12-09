import React, { useState, useEffect } from 'react';
import type { SyncJob, JobRunLog } from '../types';
import { Button } from './Button';
import { getJobRunLogs } from '../services/apiClient';
import { LoadingSpinner } from './LoadingSpinner';

interface JobLogsModalProps {
    isOpen: boolean;
    onClose: () => void;
    job: SyncJob;
}

const LogLevelIndicator: React.FC<{ level: 'INFO' | 'ERROR' | 'SUCCESS' }> = ({ level }) => {
    const levelConfig = {
        INFO: { text: 'INFO', color: 'bg-blue-500' },
        ERROR: { text: 'ERROR', color: 'bg-red-500' },
        SUCCESS: { text: 'SUCCESS', color: 'bg-green-500' },
    };
    const config = levelConfig[level];
    return (
        <span className={`px-2 py-0.5 text-xs font-semibold text-white rounded-full ${config.color}`}>
            {config.text}
        </span>
    );
}

export const JobLogsModal: React.FC<JobLogsModalProps> = ({ isOpen, onClose, job }) => {
    const [logs, setLogs] = useState<JobRunLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            const fetchLogs = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const fetchedLogs = await getJobRunLogs(job.id);
                    setLogs(fetchedLogs);
                } catch (err) {
                    setError('Failed to fetch job logs.');
                    console.error(err);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchLogs();
        }
    }, [isOpen, job.id]);

    if (!isOpen) return null;

    const latestRun = logs[0];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl m-4 max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Job Run Logs</h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                       Logs for job: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{job.name}</span>
                    </p>
                </div>

                <div className="p-6 overflow-y-auto flex-1 min-h-0">
                    {isLoading && (
                        <div className="flex justify-center items-center h-full">
                            <LoadingSpinner />
                        </div>
                    )}
                    {error && <p className="text-red-500 text-center">{error}</p>}
                    {!isLoading && !error && !latestRun && (
                         <p className="text-gray-500 dark:text-gray-400 text-center py-10">No logs found for this job.</p>
                    )}
                    
                    {latestRun && (
                        <div>
                            <div className={`p-4 rounded-lg mb-4 ${latestRun.status === 'SUCCESS' ? 'bg-green-50 dark:bg-green-900/30' : 'bg-red-50 dark:bg-red-900/30'}`}>
                                <h3 className={`text-lg font-bold ${latestRun.status === 'SUCCESS' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                                    Run {latestRun.status}
                                </h3>
                                <p className={`mt-1 text-sm ${latestRun.status === 'SUCCESS' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                                    {latestRun.summary}
                                </p>
                                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                    Started: {new Date(latestRun.startTime).toLocaleString()} | Finished: {new Date(latestRun.endTime).toLocaleString()}
                                </p>
                            </div>

                            <div className="font-mono text-sm bg-gray-900 text-white rounded-lg p-4 overflow-x-auto">
                                <h4 className="text-lg font-semibold text-gray-300 mb-2 border-b border-gray-600 pb-2">Execution Details</h4>
                                {latestRun.details.map((entry, index) => (
                                    <div key={index} className="flex items-start mb-1">
                                        <span className="text-gray-500 mr-4">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                                        <LogLevelIndicator level={entry.level} />
                                        <p className="ml-4 flex-1 break-words">{entry.message}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 sm:px-6 flex flex-row-reverse flex-shrink-0">
                    <Button type="button" variant="primary" onClick={onClose}>Close</Button>
                </div>
            </div>
        </div>
    );
};