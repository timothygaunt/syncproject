import React, { useState, useRef, useEffect } from 'react';
import type { SyncJob, ServiceAccount, GcpProjectConnection, ManagedSheet, FtpSource, GoogleSheetSourceConfig, FtpSourceConfig } from '../types';
import { SyncJobItem } from './SyncJobItem';
import { PlusIcon } from './icons/PlusIcon';
import { SourceType } from '../types';
import { usePermissions } from '../hooks/usePermissions';

interface SyncJobListProps {
    jobs: SyncJob[];
    serviceAccounts: ServiceAccount[];
    gcpProjectConnections: GcpProjectConnection[];
    onEdit: (job: SyncJob) => void;
    onDelete: (jobId: string) => void;
    onNewSyncClick: () => void;
    onPreviewSchema: (job: SyncJob) => void;
    onViewLogs: (job: SyncJob) => void;
    onArchive: (jobId: string) => void;
    onUnarchive: (jobId: string) => void;
    selectedJobIds: Set<string>;
    onToggleSelection: (jobId: string) => void;
    onSelectAll: (select: boolean) => void;
    isArchivedView: boolean;
    managedSheetMap: Map<string, ManagedSheet>;
    ftpSourceMap: Map<string, FtpSource>;
}

export const SyncJobList: React.FC<SyncJobListProps> = ({ 
    jobs, serviceAccounts, gcpProjectConnections,
    onEdit, onDelete, onNewSyncClick, onPreviewSchema,
    onViewLogs, onArchive, onUnarchive, selectedJobIds,
    onToggleSelection, onSelectAll, isArchivedView,
    managedSheetMap, ftpSourceMap,
}) => {
    const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
    const selectAllCheckboxRef = useRef<HTMLInputElement>(null);
    const { hasPermission } = usePermissions();

    const canCreate = hasPermission('CREATE_JOB');
    const canSelect = hasPermission('EDIT_JOB');

    useEffect(() => {
        if (selectAllCheckboxRef.current) {
            const numSelected = selectedJobIds.size;
            const numJobs = jobs.length;
            if (numJobs > 0 && numSelected === numJobs) {
                selectAllCheckboxRef.current.checked = true;
                selectAllCheckboxRef.current.indeterminate = false;
            } else if (numSelected > 0) {
                selectAllCheckboxRef.current.checked = false;
                selectAllCheckboxRef.current.indeterminate = true;
            } else {
                selectAllCheckboxRef.current.checked = false;
                selectAllCheckboxRef.current.indeterminate = false;
            }
        }
    }, [selectedJobIds, jobs.length]);

    const handleToggleExpand = (jobId: string) => {
        setExpandedJobId(prevId => (prevId === jobId ? null : jobId));
    };

    if (jobs.length === 0) {
        return (
            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-lg shadow">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-200">{isArchivedView ? 'No archived jobs' : 'No sync jobs'}</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{isArchivedView ? 'You have not archived any jobs yet.' : 'Get started by creating a new sync job.'}</p>
                {canCreate && !isArchivedView && (
                    <div className="mt-6">
                        <button
                            type="button"
                            onClick={onNewSyncClick}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                            New Sync Job
                        </button>
                    </div>
                )}
            </div>
        )
    }
    
    const serviceAccountMap = new Map(serviceAccounts.map(sa => [sa.id, sa]));
    const projectConnectionMap = new Map(gcpProjectConnections.map(p => [p.id, p]));

    return (
        <div className="space-y-3">
            {canSelect && !isArchivedView && (
                 <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <div className="relative flex items-start">
                        <div className="flex h-5 items-center">
                            <input
                                id="select-all"
                                name="select-all"
                                type="checkbox"
                                ref={selectAllCheckboxRef}
                                onChange={(e) => onSelectAll(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="select-all" className="font-medium text-gray-700 dark:text-gray-300">
                                Select all jobs
                            </label>
                        </div>
                    </div>
                </div>
            )}
            {jobs.map(job => (
                <SyncJobItem 
                    key={job.id} 
                    job={job} 
                    onEdit={onEdit} 
                    onDelete={onDelete} 
                    onPreviewSchema={onPreviewSchema}
                    onViewLogs={onViewLogs}
                    onArchive={onArchive}
                    onUnarchive={onUnarchive}
                    serviceAccount={serviceAccountMap.get(job.serviceAccountId)}
                    gcpProjectConnection={projectConnectionMap.get(job.destinationId)}
                    isExpanded={job.id === expandedJobId}
                    onToggleExpand={() => handleToggleExpand(job.id)}
                    isSelected={selectedJobIds.has(job.id)}
                    onToggleSelection={() => onToggleSelection(job.id)}
                    isArchivedView={isArchivedView}
                    managedSheet={job.sourceType === SourceType.GOOGLE_SHEET ? managedSheetMap.get((job.sourceConfiguration as GoogleSheetSourceConfig).managedSheetId) : undefined}
                    ftpSource={job.sourceType === SourceType.FTP ? ftpSourceMap.get((job.sourceConfiguration as FtpSourceConfig).ftpSourceId) : undefined}
                />
            ))}
        </div>
    );
};
