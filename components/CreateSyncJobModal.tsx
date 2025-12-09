import React, { useState, useEffect, useMemo } from 'react';
import type { SyncJob, SyncJobPayload, ServiceAccount, ManagedSheet, DiscoverableSheet, GcpProjectConnection, SourceType, FtpSource, SchemaMapping, GoogleSheetSourceConfig, FtpSourceConfig } from '../types';
import { SyncStrategy } from '../types';
import { Input } from './Input';
import { Select } from './Select';
import { Button } from './Button';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { fetchSourceSchema, addManagedSheet, createSyncJob, checkDatasetExists, createDataset } from '../services/apiClient';
import { generateSchemaMapping } from '../utils/columnUtils';
import { SchemaMappingReview } from './SchemaMappingReview';
import { LoadingSpinner } from './LoadingSpinner';
import { GoogleSheetPickerModal } from './GoogleSheetPickerModal';
import { SourceType as SourceTypeEnum } from '../types';

type DatasetCheckStatus = 'unchecked' | 'checking' | 'exists' | 'not_exists' | 'error' | 'creating' | 'created';

const getInitialState = (serviceAccounts: ServiceAccount[], gcpProjectConnections: GcpProjectConnection[]): SyncJobPayload => ({
    name: '',
    sourceType: SourceTypeEnum.GOOGLE_SHEET,
    sourceConfiguration: {
        managedSheetId: '',
        sources: [{ sheetName: '', range: '' }]
    },
    schemaMapping: [],
    destinationId: gcpProjectConnections[0]?.id || '',
    datasetId: '',
    datasetLocation: '',
    finalTableName: '',
    cronSchedule: '0 0 * * *',
    serviceAccountId: serviceAccounts[0]?.id || '',
    syncStrategy: SyncStrategy.REPLACE,
    notificationSettings: {
        enabled: true,
        recipients: 'data-team@example.com',
        subject: 'SheetSync Schema Change Alert: [JOB_NAME]'
    },
    activeFrom: '',
    activeUntil: '',
});

export const CreateSyncJobModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (job: SyncJobPayload) => void;
    job: SyncJob | null;
    serviceAccounts: ServiceAccount[];
    managedSheets: ManagedSheet[];
    managedFtpSources: FtpSource[];
    gcpProjectConnections: GcpProjectConnection[];
    initialStep?: number;
    refreshData: () => Promise<void>;
}> = ({ isOpen, onClose, onSave, job, serviceAccounts, managedSheets, managedFtpSources, gcpProjectConnections, initialStep = 1, refreshData }) => {
    const [step, setStep] = useState(initialStep);
    const [formData, setFormData] = useState<SyncJobPayload>(getInitialState(serviceAccounts, gcpProjectConnections));
    const [fetchingSchema, setFetchingSchema] = useState(false);
    const [schemaError, setSchemaError] = useState('');
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    // State for dataset creation workflow
    const [datasetCheckStatus, setDatasetCheckStatus] = useState<DatasetCheckStatus>('unchecked');
    const [datasetCheckError, setDatasetCheckError] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (job) {
                const jobPayload: SyncJobPayload = {
                    ...job,
                    activeFrom: job.activeFrom || '',
                    activeUntil: job.activeUntil || '',
                };
                setFormData(jobPayload);
                setDatasetCheckStatus('exists'); // Assume dataset exists for an existing job
            } else {
                setFormData(getInitialState(serviceAccounts, gcpProjectConnections));
                setDatasetCheckStatus('unchecked');
            }
            setStep(initialStep);
            setSchemaError('');
            setDatasetCheckError('');
            setFetchingSchema(false);
        }
    }, [job, isOpen, serviceAccounts, managedSheets, gcpProjectConnections, initialStep]);
    
    // Reset dataset check status if project or dataset ID changes
    useEffect(() => {
        if (!job) { // Only reset for new jobs
            setDatasetCheckStatus('unchecked');
        }
    }, [formData.destinationId, formData.datasetId, job]);

    if (!isOpen) return null;

    const handleFormValueChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : value 
        }));
    };
    
    const handleNotificationSettingChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            notificationSettings: {
                ...prev.notificationSettings!,
                [field]: value
            }
        }));
    };

    const handleSourceTypeChange = (newType: SourceType) => {
        setFormData(prev => {
            const newState: SyncJobPayload = {...prev, sourceType: newType, schemaMapping: []}; // Reset schema on type change
            if (newType === 'Google Sheet') {
                newState.sourceConfiguration = { managedSheetId: '', sources: [{ sheetName: '', range: '' }] };
            } else if (newType === 'FTP/SFTP') {
                newState.sourceConfiguration = { ftpSourceId: managedFtpSources[0]?.id || '', filePath: '', fileFormat: 'CSV' };
            }
            return newState;
        });
    };
    
    const handleSourceConfigChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            sourceConfiguration: {
                ...prev.sourceConfiguration,
                [field]: value
            }
        }));
    };

    const handleSheetSelected = async ({ id, name, url }: DiscoverableSheet) => {
        setIsPickerOpen(false);
        const newSheet = await addManagedSheet(name, url);
        await refreshData();
        handleSourceConfigChange('managedSheetId', newSheet.id);
    };

    const handleSchemaMappingChange = (index: number, newBigQueryName: string) => {
        const newMapping = [...formData.schemaMapping!];
        newMapping[index] = { ...newMapping[index], bigQueryName: newBigQueryName };
        setFormData(prev => ({ ...prev, schemaMapping: newMapping }));
    };

    const handleFetchSchema = async () => {
        setSchemaError('');
        setFetchingSchema(true);
        try {
            const headers = await fetchSourceSchema(formData.sourceType!, formData.sourceConfiguration!);
            const mapping = generateSchemaMapping(headers);
            setFormData(prev => ({ ...prev, schemaMapping: mapping }));
        } catch (error) {
            setSchemaError('Failed to fetch schema. Check source configuration.');
            console.error(error);
        } finally {
            setFetchingSchema(false);
        }
    };

    const handleCheckDataset = async () => {
        setDatasetCheckStatus('checking');
        setDatasetCheckError('');
        const project = gcpProjectConnections.find(p => p.id === formData.destinationId);
        if (!project || !formData.datasetId) {
            setDatasetCheckError('Project and Dataset ID are required.');
            setDatasetCheckStatus('error');
            return;
        }
        try {
            const { exists } = await checkDatasetExists(project.projectId, formData.datasetId);
            setDatasetCheckStatus(exists ? 'exists' : 'not_exists');
        } catch (error) {
            setDatasetCheckError('Failed to check dataset status.');
            setDatasetCheckStatus('error');
        }
    };

    const handleCreateDataset = async () => {
        setDatasetCheckStatus('creating');
        setDatasetCheckError('');
        const project = gcpProjectConnections.find(p => p.id === formData.destinationId);
        if (!project || !formData.datasetId || !formData.datasetLocation) {
            setDatasetCheckError('Project, Dataset ID, and Location are required.');
            setDatasetCheckStatus('error');
            return;
        }
        try {
            const { success } = await createDataset(project.projectId, formData.datasetId, formData.datasetLocation);
            if (success) {
                setDatasetCheckStatus('created');
            } else {
                throw new Error('Creation reported as unsuccessful.');
            }
        } catch (error) {
            setDatasetCheckError('Failed to create dataset.');
            setDatasetCheckStatus('not_exists'); // Revert to allow trying again
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };
    
    const selectedSheet = managedSheets.find(s => s.id === (formData.sourceConfiguration as GoogleSheetSourceConfig).managedSheetId);
    
    const isStep1Valid = formData.name && formData.serviceAccountId && 
        (formData.sourceType === 'Google Sheet' ? 
            (formData.sourceConfiguration as GoogleSheetSourceConfig).managedSheetId && (formData.sourceConfiguration as GoogleSheetSourceConfig).sources.every(s => s.sheetName && s.range) :
            (formData.sourceConfiguration as FtpSourceConfig).ftpSourceId && (formData.sourceConfiguration as FtpSourceConfig).filePath
        );

    const hasSchema = formData.schemaMapping && formData.schemaMapping.length > 0;
    const hasDuplicateColumns = hasSchema && new Set(formData.schemaMapping.map(m => m.bigQueryName.toLowerCase())).size !== formData.schemaMapping.length;


    const renderGoogleSheetConfig = () => {
        const config = formData.sourceConfiguration as GoogleSheetSourceConfig;
        
        const handleGSSourceChange = (index: number, field: 'sheetName' | 'range', value: string) => {
            const newSources = [...config.sources];
            newSources[index][field] = value;
            handleSourceConfigChange('sources', newSources);
        };
        const addGSSource = () => handleSourceConfigChange('sources', [...config.sources, {sheetName: '', range: ''}]);
        const removeGSSource = (index: number) => {
            if (config.sources.length > 1) {
                handleSourceConfigChange('sources', config.sources.filter((_, i) => i !== index));
            }
        };

        return (
             <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Google Sheet</label>
                    <div className="flex items-center justify-between p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700/50">
                        {selectedSheet ? (
                            <span className="font-semibold text-gray-800 dark:text-gray-200">{selectedSheet.name}</span>
                        ) : (
                            <span className="text-gray-500 dark:text-gray-400 italic">No sheet selected</span>
                        )}
                        <Button type="button" variant="secondary" onClick={() => setIsPickerOpen(true)}>
                            {selectedSheet ? 'Change' : 'Select'}
                        </Button>
                    </div>
                </div>
                
                {selectedSheet && (
                    <>
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tabs &amp; Ranges to Sync</label>
                            {config.sources.map((source, index) => (
                                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                    <div className="grid grid-cols-2 gap-2 flex-grow">
                                        <Input label="" aria-label="Sheet/Tab Name" name="sheetName" value={source.sheetName} onChange={(e) => handleGSSourceChange(index, 'sheetName', e.target.value)} placeholder="e.g., Sheet1" required />
                                        <Input label="" aria-label="Cell Range" name="range" value={source.range} onChange={(e) => handleGSSourceChange(index, 'range', e.target.value)} placeholder="e.g., A1:Z1000" required />
                                    </div>
                                    <button type="button" onClick={() => removeGSSource(index)} disabled={config.sources.length <= 1} className="p-2 text-gray-400 hover:text-red-500 rounded-full disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-400">
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <Button type="button" variant="secondary" onClick={addGSSource} className="w-auto"><PlusIcon className="h-4 w-4 mr-2" /> Add Range</Button>
                    </>
                )}
            </div>
        )
    };

    const renderFtpConfig = () => {
         const config = formData.sourceConfiguration as FtpSourceConfig;
         return (
             <div className="space-y-6">
                 <Select label="FTP/SFTP Connection" name="ftpSourceId" value={config.ftpSourceId} onChange={(e) => handleSourceConfigChange('ftpSourceId', e.target.value)} required>
                    {managedFtpSources.length === 0 ? <option disabled>No FTP sources configured</option> : managedFtpSources.map(s => <option key={s.id} value={s.id}>{s.name} ({s.host})</option>)}
                 </Select>
                 <Input label="File Path" name="filePath" value={config.filePath} onChange={(e) => handleSourceConfigChange('filePath', e.target.value)} placeholder="/path/to/your/file.csv" required />
                 <Select label="File Format" name="fileFormat" value={config.fileFormat} onChange={(e) => handleSourceConfigChange('fileFormat', e.target.value as FtpSourceConfig['fileFormat'])}>
                    <option value="CSV">CSV</option>
                    <option value="XLSX">XLSX</option>
                    <option value="XLS">XLS</option>
                 </Select>
             </div>
         )
    }

    const renderStepContent = () => {
        switch(step) {
            case 1:
                return (
                    <>
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">Job Configuration</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <Input label="Job Name" name="name" value={formData.name} onChange={handleFormValueChange} placeholder="e.g., Daily Sales Report Sync" required />
                                <Select label="Service Account to Use" name="serviceAccountId" value={formData.serviceAccountId} onChange={handleFormValueChange} required>
                                    {serviceAccounts.length === 0 ? <option disabled>No service accounts</option> : serviceAccounts.map(sa => <option key={sa.id} value={sa.id}>{sa.name}</option>)}
                                </Select>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">Source Configuration</h3>
                            <Select label="Source Type" name="sourceType" value={formData.sourceType} onChange={(e) => handleSourceTypeChange(e.target.value as SourceType)}>
                                <option value={SourceTypeEnum.GOOGLE_SHEET}>Google Sheet</option>
                                <option value={SourceTypeEnum.FTP}>FTP/SFTP</option>
                            </Select>
                            <div className="mt-6">
                                {formData.sourceType === SourceTypeEnum.GOOGLE_SHEET ? renderGoogleSheetConfig() : renderFtpConfig()}
                            </div>
                        </div>
                    </>
                );
            case 2:
                return (
                    <div>
                         <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">Schema Configuration</h3>
                         <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Fetch and review the source schema. You can edit the BigQuery column names. Column names must be unique.
                         </p>
                         <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                            <div className="flex justify-between items-center mb-4">
                                <p className="font-semibold text-gray-800 dark:text-gray-200">
                                    Source: <span className="font-mono text-indigo-600 dark:text-indigo-400 text-sm">{formData.name}</span>
                                </p>
                                <Button type="button" variant="secondary" onClick={handleFetchSchema} disabled={fetchingSchema}>
                                    {fetchingSchema ? <><LoadingSpinner/> Fetching...</> : hasSchema ? 'Re-fetch Schema' : 'Fetch Schema'}
                                </Button>
                            </div>
                            {schemaError && <p className="text-sm text-red-500 mb-2">{schemaError}</p>}
                            {hasSchema && (
                                <SchemaMappingReview
                                    schemaMapping={formData.schemaMapping!}
                                    onMappingChange={handleSchemaMappingChange}
                                />
                            )}
                         </div>
                         {hasDuplicateColumns && (
                             <p className="text-sm text-red-500 mt-4">Error: One or more sources have duplicate BigQuery column names. Please ensure all column names within a source are unique.</p>
                        )}
                    </div>
                );
            case 3:
                return (
                    <>
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">Destination &amp; Schedule</h3>
                            <div className="space-y-6">
                                <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">BigQuery Destination</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
                                        <Select label="GCP Project Connection" name="destinationId" value={formData.destinationId} onChange={handleFormValueChange} required>
                                            {gcpProjectConnections.length === 0 ? <option disabled>No projects configured</option> : gcpProjectConnections.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </Select>
                                        <Input label="Final Table Name" name="finalTableName" value={formData.finalTableName} onChange={handleFormValueChange} placeholder="e.g., my_final_table" required />
                                        
                                        <Input label="BigQuery Dataset ID" name="datasetId" value={formData.datasetId} onChange={handleFormValueChange} placeholder="e.g., my_dataset" required />
                                        <Button type="button" variant="secondary" onClick={handleCheckDataset} disabled={!formData.destinationId || !formData.datasetId || datasetCheckStatus === 'checking' || datasetCheckStatus === 'creating'}>
                                            Check Dataset Status
                                        </Button>
                                    </div>
                                    <div className="mt-4 text-sm">
                                        {datasetCheckStatus === 'checking' && <p className="text-gray-500">Checking...</p>}
                                        {datasetCheckStatus === 'exists' && <p className="text-green-600 font-semibold">Dataset exists.</p>}
                                        {datasetCheckStatus === 'created' && <p className="text-green-600 font-semibold">Dataset created successfully.</p>}
                                        {datasetCheckError && <p className="text-red-500">{datasetCheckError}</p>}
                                        {/* FIX: Changed condition to allow the block to render in both 'not_exists' and 'creating' states, which resolves the type error. */}
                                        {(datasetCheckStatus === 'not_exists' || datasetCheckStatus === 'creating') && (
                                            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg space-y-3">
                                                <p className="font-semibold text-yellow-800 dark:text-yellow-200">Dataset missing - do you want me to create it?</p>
                                                <div className="flex items-end gap-4">
                                                    <Input label="Data Location" name="datasetLocation" value={formData.datasetLocation} onChange={handleFormValueChange} placeholder="e.g., US, EU, us-central1" required />
                                                    <Button type="button" variant="primary" onClick={handleCreateDataset} disabled={!formData.datasetLocation || datasetCheckStatus === 'creating'}>
                                                        {datasetCheckStatus === 'creating' ? 'Creating...' : 'Create Dataset'}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Sync Options</h4>
                                     <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sync Strategy</label>
                                        <fieldset className="mt-2">
                                            <div className="flex items-center space-x-4">
                                                {Object.values(SyncStrategy).map((strategy) => (
                                                    <div key={strategy} className="flex items-center">
                                                        <input id={strategy} name="syncStrategy" type="radio" value={strategy} checked={formData.syncStrategy === strategy} onChange={handleFormValueChange} className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600" />
                                                        <label htmlFor={strategy} className="ml-2 block text-sm text-gray-900 dark:text-gray-200">{strategy}</label>
                                                    </div>
                                                ))}
                                            </div>
                                        </fieldset>
                                    </div>
                                </div>

                                <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Email Notifications on Schema Change</h4>
                                    <div className="flex items-start">
                                        <div className="flex items-center h-5">
                                            <input
                                                id="notifications-enabled"
                                                type="checkbox"
                                                checked={formData.notificationSettings?.enabled}
                                                onChange={(e) => handleNotificationSettingChange('enabled', e.target.checked)}
                                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                                            />
                                        </div>
                                        <div className="ml-3 text-sm">
                                            <label htmlFor="notifications-enabled" className="font-medium text-gray-700 dark:text-gray-300">Enable Notifications</label>
                                        </div>
                                    </div>
                                    {formData.notificationSettings?.enabled && (
                                        <div className="mt-4 space-y-4">
                                            <Input
                                                label="Recipient Email(s)"
                                                name="recipients"
                                                value={formData.notificationSettings.recipients}
                                                onChange={(e) => handleNotificationSettingChange('recipients', e.target.value)}
                                                placeholder="data-team@example.com, other@example.com"
                                            />
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Comma-separated list of email addresses.</p>
                                            <Input
                                                label="Email Subject"
                                                name="subject"
                                                value={formData.notificationSettings.subject}
                                                onChange={(e) => handleNotificationSettingChange('subject', e.target.value)}
                                            />
                                        </div>
                                    )}
                                </div>
                                
                                <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Schedule</h4>
                                    <Input label="Cron Schedule" name="cronSchedule" value={formData.cronSchedule} onChange={handleFormValueChange} placeholder="* * * * *" required />
                                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Use standard cron syntax. E.g., `0 2 * * *` for daily at 2 AM. <a href="https://crontab.guru/" target="_blank" rel="noopener noreferrer" className="ml-1 text-indigo-500 hover:underline">Need help?</a></p>
                                    
                                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <Input label="Active From (Optional)" name="activeFrom" type="date" value={formData.activeFrom || ''} onChange={handleFormValueChange} />
                                        <Input label="Active Until (Optional)" name="activeUntil" type="date" value={formData.activeUntil || ''} onChange={handleFormValueChange} />
                                    </div>
                                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">The job will be automatically paused if the current date is outside this range.</p>
                                </div>
                            </div>
                        </div>
                    </>
                );
            default:
                return null;
        }
    }

    const isStep3Valid = formData.destinationId && formData.finalTableName && (datasetCheckStatus === 'exists' || datasetCheckStatus === 'created');

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" aria-modal="true" role="dialog">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl m-4 max-h-[90vh] flex flex-col">
                    <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{job ? 'Edit' : 'Create'} Sync Job</h2>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                               Step {step} of 3: {step === 1 ? 'Source Setup' : step === 2 ? 'Schema Configuration' : 'Destination & Schedule'}
                            </p>
                        </div>

                        <div className="px-6 py-4 space-y-6 overflow-y-auto flex-1 min-h-0">
                           {renderStepContent()}
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 sm:px-6 flex items-center justify-between mt-auto flex-shrink-0">
                            <div>
                                <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                            </div>
                            <div className="flex items-center space-x-3">
                                {step > 1 && (
                                    <Button type="button" variant="secondary" onClick={() => setStep(s => s - 1)}>Back</Button>
                                )}
                                {step === 1 && (
                                    <Button type="button" variant="primary" onClick={() => setStep(2)} disabled={!isStep1Valid}>
                                        Continue to Schema
                                    </Button>
                                )}
                                {step === 2 && (
                                    <Button type="button" variant="primary" onClick={() => setStep(3)} disabled={!hasSchema || hasDuplicateColumns}>
                                        Continue to Destination
                                    </Button>
                                )}
                                {step === 3 && (
                                    <Button type="submit" variant="primary" disabled={!isStep3Valid}>{job ? 'Save Changes' : 'Create Job'}</Button>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
            </div>
            {isPickerOpen && (
                 <GoogleSheetPickerModal
                    isOpen={isPickerOpen}
                    onClose={() => setIsPickerOpen(false)}
                    onSelectSheet={handleSheetSelected}
                />
            )}
        </>
    );
};