import React from 'react';
import type { SyncJob, ServiceAccount, GcpProjectConnection, ManagedSheet, FtpSource, GoogleSheetSourceConfig, FtpSourceConfig } from '../types';
import { SyncStatus, SourceType } from '../types';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { KeyIcon } from './icons/KeyIcon';
import { StatusIndicator } from './StatusIndicator';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { TableIcon } from './icons/TableIcon';
import { SchemaStatusIndicator } from './SchemaStatusIndicator';
import { JobRunMetrics } from './JobRunMetrics';
import { SheetIcon } from './icons/SheetIcon';
import { FtpIcon } from './icons/FtpIcon';
import { ArchiveIcon } from './icons/ArchiveIcon';
import { UnarchiveIcon } from './icons/UnarchiveIcon';
import { ExportIcon } from './icons/ExportIcon';
import { usePermissions } from '../hooks/usePermissions';

interface SyncJobItemProps {
    job: SyncJob;
    onEdit: (job: SyncJob) => void;
    onDelete: (jobId: string) => void;
    onPreviewSchema: (job: SyncJob) => void;
    onViewLogs: (job: SyncJob) => void;
    onArchive: (jobId: string) => void;
    onUnarchive: (jobId: string) => void;
    serviceAccount?: ServiceAccount;
    gcpProjectConnection?: GcpProjectConnection;
    managedSheet?: ManagedSheet;
    ftpSource?: FtpSource;
    isExpanded: boolean;
    onToggleExpand: () => void;
    isSelected: boolean;
    onToggleSelection: () => void;
    isArchivedView: boolean;
}

// FIX: Implemented the SourceDetails component to return valid JSX, resolving the type error.
const SourceDetails: React.FC<{ job: SyncJob, managedSheet?: ManagedSheet, ftpSource?: FtpSource }> = ({ job, managedSheet, ftpSource }) => {
    if (job.sourceType === SourceType.GOOGLE_SHEET) {
        const config = job.sourceConfiguration as GoogleSheetSourceConfig;
        return (
            <div className="space-y-1">
                <p><strong>Type:</strong> Google Sheet</p>
                <p><strong>Sheet:</strong> {managedSheet?.name || 'N/A'}</p>
                <div>
                    <strong>Ranges:</strong>
                    <ul className="list-disc list-inside pl-2">
                        {config.sources.map((s, i) => <li key={i} className="font-mono text-xs">{s.sheetName}!{s.range}</li>)}
                    </ul>
                </div>
            </div>
        );
    }

    if (job.sourceType === SourceType.FTP) {
        const config = job.sourceConfiguration as FtpSourceConfig;
        return (
            <div className="space-y-1">
                 <p><strong>Type:</strong> FTP/SFTP</p>
                <p><strong>Connection:</strong> {ftpSource?.name || 'N/A'}</p>
                <p><strong>Path:</strong> <span className="font-mono text-xs">{config.filePath}</span></p>
                <p><strong>Format:</strong> {config.fileFormat}</p>
            </div>
        );
    }
    return <p>Unknown source type</p>;
};


export const SyncJobItem: React.FC<SyncJobItemProps> = ({ 
    job, onEdit, onDelete, onPreviewSchema, onViewLogs,
    onArchive, onUnarchive, serviceAccount, gcpProjectConnection,
    managedSheet, ftpSource, isExpanded, onToggleExpand,
    isSelected, onToggleSelection, isArchivedView
}) => {
    const { hasPermission } = usePermissions();

    const canEdit = hasPermission('EDIT_JOB');
    const canDelete = hasPermission('DELETE_JOB');
    const canArchive = hasPermission('ARCHIVE_JOB');
    const canManageSchema = hasPermission('MANAGE_SCHEMA');
    
    const handleActionClick = (e: React.MouseEvent, action: () => void) => {
        e.stopPropagation();
        action();
    }

    const handleExport = () => {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(job, null, 2))}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = `sheetsync-job-${job.name.replace(/\s+/g, '_')}-${job.id}.json`;
        link.click();
    };
    
    const SourceIcon = job.sourceType === SourceType.GOOGLE_SHEET ? SheetIcon : FtpIcon;

    return (
        <div className={`shadow-lg rounded-lg transition-all duration-300 ease-in-out border dark:border-gray-700
            ${isArchivedView ? 'bg-gray-100 dark:bg-gray-800/50 opacity-70' : ''}
            ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700' : 'bg-white dark:bg-gray-800 border-gray-200 hover:shadow-xl'}`
        }>
            <div className="p-4 cursor-pointer" onClick={onToggleExpand}>
                <div className="flex justify-between items-center gap-4">
                     {canEdit && !isArchivedView && (
                        <div className="flex-shrink-0 flex items-center">
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={onToggleSelection}
                                onClick={(e) => e.stopPropagation()}
                                className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                                aria-label={`Select job ${job.name}`}
                            />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                           <StatusIndicator status={job.status} />
                           <SourceIcon className="h-5 w-5 text-gray-400" />
                            <h3 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 truncate" title={job.name}>
                                {job.name}
                            </h3>
                            {!isArchivedView && <SchemaStatusIndicator status={job.schemaStatus} onClick={(e) => canManageSchema && handleActionClick(e, () => onPreviewSchema(job))} />}
                        </div>
                        <div className="mt-2">
                             <JobRunMetrics job={job} onViewLogs={(e) => hasPermission('VIEW_JOB_LOGS') && handleActionClick(e, () => onViewLogs(job))} />
                        </div>
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-2 ml-4">
                        <button onClick={(e) => handleActionClick(e, handleExport)} className="p-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                            <ExportIcon className="h-5 w-5" />
                        </button>
                        {!isArchivedView && (
                            <>
                                {canManageSchema && <button onClick={(e) => handleActionClick(e, () => onPreviewSchema(job))} className="p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Preview Schema"><TableIcon className="h-5 w-5" /></button>}
                                {canArchive && <button onClick={(e) => handleActionClick(e, () => onArchive(job.id))} className="p-2 text-gray-500 hover:text-yellow-600 dark:text-gray-400 dark:hover:text-yellow-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Archive job"><ArchiveIcon className="h-5 w-5" /></button>}
                                {canEdit && <button onClick={(e) => handleActionClick(e, () => onEdit(job))} className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Edit job"><PencilIcon className="h-5 w-5" /></button>}
                            </>
                        )}
                        {isArchivedView && canArchive && (
                            <button onClick={(e) => handleActionClick(e, () => onUnarchive(job.id))} className="p-2 text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Unarchive job">
                                <UnarchiveIcon className="h-5 w-5" />
                            </button>
                        )}
                        {canDelete && <button onClick={(e) => handleActionClick(e, () => onDelete(job.id))} className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Delete job"><TrashIcon className="h-5 w-5" /></button>}
                         <ChevronDownIcon className={`h-6 w-6 text-gray-400 transition-transform duration-300 ${isExpanded ? 'transform rotate-180' : ''}`} />
                    </div>
                </div>
            </div>

            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[30rem]' : 'max-h-0'}`}>
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* FIX: Populated the expandable section with the correct SourceDetails component and other job details, making it informative. */}
                    <div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Source Details</h4>
                        <SourceDetails job={job} managedSheet={managedSheet} ftpSource={ftpSource} />
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Destination Details</h4>
                        <p><strong>Project:</strong> {gcpProjectConnection?.name || 'N/A'}</p>
                        <p><strong>Dataset:</strong> {job.datasetId}</p>
                        <p><strong>Table:</strong> {job.finalTableName}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Configuration</h4>
                        <p><strong>Service Acct:</strong> <span className="font-mono text-xs">{serviceAccount?.email || 'N/A'}</span></p>
                        <p><strong>Strategy:</strong> {job.syncStrategy}</p>
                        {job.activeFrom && <p><strong>Active From:</strong> {job.activeFrom}</p>}
                        {job.activeUntil && <p><strong>Active Until:</strong> {job.activeUntil}</p>}
                        {job.notificationSettings?.enabled && <p><strong>Notifies:</strong> <span className="font-mono text-xs">{job.notificationSettings.recipients}</span></p>}
                    </div>
                </div>
            </div>
        </div>
    );
};
