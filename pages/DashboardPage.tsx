import React, { useState, useMemo } from 'react';
import { SyncJobList } from '../components/SyncJobList';
import { CreateSyncJobModal } from '../components/CreateSyncJobModal';
import { SchemaPreviewModal } from '../components/SchemaPreviewModal';
import { JobLogsModal } from '../components/JobLogsModal';
import { createSyncJob, updateSyncJob, deleteSyncJob, updateJobStatusBulk, archiveJob, unarchiveJob } from '../services/apiClient';
import type { SyncJob, SyncJobPayload, ServiceAccount, ManagedSheet, GcpProjectConnection, FtpSource, DailySyncMetric } from '../types';
import { SyncStatus } from '../types';
import { PlusIcon } from '../components/icons/PlusIcon';
import { ImportIcon } from '../components/icons/ImportIcon';
import { Input } from '../components/Input';
import { SearchIcon } from '../components/icons/SearchIcon';
import { BulkActionsBar } from '../components/BulkActionsBar';
import { AlertsPanel } from '../components/AlertsPanel';
import { DashboardSummary } from '../components/DashboardSummary';
import { DailyThroughputChart } from '../components/DailyThroughputChart';
import { usePermissions } from '../hooks/usePermissions';

interface DashboardPageProps {
    jobs: SyncJob[];
    serviceAccounts: ServiceAccount[];
    managedSheets: ManagedSheet[];
    managedFtpSources: FtpSource[];
    gcpProjectConnections: GcpProjectConnection[];
    dailyMetrics: DailySyncMetric[];
    refreshData: () => Promise<void>;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ jobs, serviceAccounts, managedSheets, managedFtpSources, gcpProjectConnections, dailyMetrics, refreshData }) => {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingJob, setEditingJob] = useState<SyncJob | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [initialModalStep, setInitialModalStep] = useState(1);
    const [isAlertsVisible, setIsAlertsVisible] = useState(true);
    const [showArchived, setShowArchived] = useState(false);

    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [jobForPreview, setJobForPreview] = useState<SyncJob | null>(null);

    const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
    const [jobForLogs, setJobForLogs] = useState<SyncJob | null>(null);

    const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());
    
    const importJobInputRef = React.useRef<HTMLInputElement>(null);
    const { hasPermission } = usePermissions();

    const filteredJobs = useMemo(() => {
        const jobsByArchiveState = jobs.filter(job => job.isArchived === showArchived);
        if (!searchQuery) {
            return jobsByArchiveState;
        }
        return jobsByArchiveState.filter(job =>
            job.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [jobs, searchQuery, showArchived]);
    
    const failedJobs = useMemo(() => jobs.filter(job => !job.isArchived && job.status === SyncStatus.ERROR), [jobs]);


    const handleToggleJobSelection = (jobId: string) => {
        setSelectedJobIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(jobId)) {
                newSet.delete(jobId);
            } else {
                newSet.add(jobId);
            }
            return newSet;
        });
    };

    const handleSelectAll = (select: boolean) => {
        if (select) {
            setSelectedJobIds(new Set(filteredJobs.map(job => job.id)));
        } else {
            setSelectedJobIds(new Set());
        }
    };

    const handleBulkUpdateStatus = async (status: SyncStatus) => {
        if (showArchived || !hasPermission('EDIT_JOB')) return;
        try {
            await updateJobStatusBulk(Array.from(selectedJobIds), status);
            await refreshData();
            setSelectedJobIds(new Set());
        } catch (error) {
            console.error('Failed to perform bulk update:', error);
            alert('Could not update jobs. Please try again.');
        }
    };

    const handleOpenEditModal = (job: SyncJob | null = null, step: number = 1) => {
        setEditingJob(job);
        setInitialModalStep(step);
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setEditingJob(null);
        setIsEditModalOpen(false);
    };

    const handleOpenSchemaPreview = (job: SyncJob) => {
        setJobForPreview(job);
        setIsPreviewModalOpen(true);
    };

    const handleCloseSchemaPreview = () => {
        setJobForPreview(null);
        setIsPreviewModalOpen(false);
    };
    
    const handleOpenLogsModal = (job: SyncJob) => {
        setJobForLogs(job);
        setIsLogsModalOpen(true);
    };

    const handleCloseLogsModal = () => {
        setJobForLogs(null);
        setIsLogsModalOpen(false);
    };

    const handleGoToEditFromPreview = (jobToEdit: SyncJob) => {
        handleCloseSchemaPreview();
        handleOpenEditModal(jobToEdit, 2);
    };

    const handleSaveJob = async (jobData: SyncJobPayload) => {
        if (editingJob) {
            await updateSyncJob(editingJob.id, jobData);
        } else {
            await createSyncJob(jobData);
        }
        await refreshData();
        handleCloseEditModal();
    };

    const handleDeleteJob = async (jobId: string) => {
        if (window.confirm('Are you sure you want to permanently delete this sync job? This action cannot be undone.')) {
            await deleteSyncJob(jobId);
            setSelectedJobIds(prev => { const newSet = new Set(prev); newSet.delete(jobId); return newSet; });
            await refreshData();
        }
    };
    
    const handleArchive = async (jobId: string) => {
        if (window.confirm('Are you sure you want to archive this job? It will be hidden from the main view and its schedule will be disabled.')) {
            await archiveJob(jobId);
            await refreshData();
        }
    };
    
    const handleUnarchive = async (jobId: string) => {
        await unarchiveJob(jobId);
        await refreshData();
    };

    const handleImportJobClick = () => {
        importJobInputRef.current?.click();
    };

    const handleImportJob = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const importedJob = JSON.parse(event.target?.result as string) as SyncJob;
                    const { id, ...payload } = importedJob;
                    const newPayload: SyncJobPayload = { ...payload, name: `${payload.name} (Imported)` };

                    if (window.confirm(`Create a new job from the imported file "${file.name}"?`)) {
                        await createSyncJob(newPayload);
                        await refreshData();
                        alert('Job imported successfully.');
                    }
                } catch (err) { alert('Failed to parse or import the job file.'); console.error(err); }
            };
            reader.readAsText(file);
        }
        if (importJobInputRef.current) { importJobInputRef.current.value = ''; }
    };

    const canCreate = hasPermission('CREATE_JOB');
    const canPerformBulkActions = hasPermission('EDIT_JOB') && selectedJobIds.size > 0 && !showArchived;

    const managedSheetMap = useMemo(() => new Map(managedSheets.map(s => [s.id, s])), [managedSheets]);
    const ftpSourceMap = useMemo(() => new Map(managedFtpSources.map(s => [s.id, s])), [managedFtpSources]);

    return (
        <div className="space-y-6">
            <DashboardSummary jobs={jobs.filter(j => !j.isArchived)} />
            <DailyThroughputChart data={dailyMetrics} />

            {isAlertsVisible && failedJobs.length > 0 && (
                <AlertsPanel
                    failedJobs={failedJobs}
                    onDismiss={() => setIsAlertsVisible(false)}
                    onJobClick={handleOpenLogsModal}
                />
            )}
            
            {canPerformBulkActions && (
                 <BulkActionsBar
                    selectedCount={selectedJobIds.size}
                    onSetActive={() => handleBulkUpdateStatus(SyncStatus.ACTIVE)}
                    onSetPaused={() => handleBulkUpdateStatus(SyncStatus.PAUSED)}
                    onClearSelection={() => setSelectedJobIds(new Set())}
                />
            )}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                        {showArchived ? 'Archived Jobs' : 'Sync Job Details'}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{showArchived ? 'View and restore archived jobs.' : 'View and manage your individual data synchronization tasks.'}</p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="flex-grow sm:flex-grow-0 sm:w-64">
                         <Input label="" name="search" placeholder="Search jobs..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} icon={<SearchIcon className="h-5 w-5 text-gray-400" />} />
                    </div>
                    {canCreate && !showArchived && (
                         <div className="flex items-center gap-2">
                            <input type="file" ref={importJobInputRef} onChange={handleImportJob} className="hidden" accept=".json" />
                             <button onClick={handleImportJobClick} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-100 rounded-md hover:bg-indigo-200 focus:outline-none dark:bg-indigo-900/50 dark:text-indigo-300 dark:hover:bg-indigo-900">
                                <ImportIcon className="h-5 w-5" />
                            </button>
                            <button onClick={() => handleOpenEditModal()} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none">
                                <PlusIcon className="h-5 w-5" />
                                <span className="hidden sm:inline">New Job</span>
                            </button>
                         </div>
                    )}
                </div>
            </div>

            <div className="flex justify-end">
                 <div className="relative flex items-start">
                    <div className="flex items-center h-5">
                        <input id="showArchived" name="showArchived" type="checkbox" checked={showArchived} onChange={(e) => { setShowArchived(e.target.checked); setSelectedJobIds(new Set()); }} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div className="ml-3 text-sm">
                        <label htmlFor="showArchived" className="font-medium text-gray-700 dark:text-gray-300">Show Archived</label>
                    </div>
                </div>
            </div>

            <SyncJobList 
                jobs={filteredJobs}
                serviceAccounts={serviceAccounts}
                gcpProjectConnections={gcpProjectConnections}
                onEdit={handleOpenEditModal} 
                onDelete={handleDeleteJob} 
                onNewSyncClick={() => handleOpenEditModal()}
                onPreviewSchema={handleOpenSchemaPreview}
                onViewLogs={handleOpenLogsModal}
                selectedJobIds={selectedJobIds}
                onToggleSelection={handleToggleJobSelection}
                onSelectAll={handleSelectAll}
                onArchive={handleArchive}
                onUnarchive={handleUnarchive}
                isArchivedView={showArchived}
                managedSheetMap={managedSheetMap}
                ftpSourceMap={ftpSourceMap}
            />
            {isEditModalOpen && (
                <CreateSyncJobModal
                    isOpen={isEditModalOpen}
                    onClose={handleCloseEditModal}
                    onSave={handleSaveJob}
                    job={editingJob}
                    serviceAccounts={serviceAccounts}
                    managedSheets={managedSheets}
                    managedFtpSources={managedFtpSources}
                    gcpProjectConnections={gcpProjectConnections}
                    initialStep={initialModalStep}
                    refreshData={refreshData}
                />
            )}
            {isPreviewModalOpen && jobForPreview && (
                <SchemaPreviewModal
                    isOpen={isPreviewModalOpen}
                    onClose={handleCloseSchemaPreview}
                    job={jobForPreview}
                    refreshData={refreshData}
                    onGoToEdit={handleGoToEditFromPreview}
                />
            )}
            {isLogsModalOpen && jobForLogs && (
                <JobLogsModal
                    isOpen={isLogsModalOpen}
                    onClose={handleCloseLogsModal}
                    job={jobForLogs}
                />
            )}
        </div>
    );
};

export default DashboardPage;
