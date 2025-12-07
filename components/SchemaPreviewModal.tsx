import React, { useState, useEffect } from 'react';
import type { SyncJob, SchemaMapping, GoogleSheetSourceConfig } from '../types';
import { SourceType } from '../types';
import { Button } from './Button';
import { updateSyncJob, fetchSourceSchema } from '../services/apiClient';
import { generateSchemaMapping } from '../utils/columnUtils';
import { LoadingSpinner } from './LoadingSpinner';
import { SchemaComparisonView } from './SchemaComparisonView';
import { ArrowRightIcon } from './icons/ArrowRightIcon';

interface SchemaComparisonState {
    newSchema: SchemaMapping[];
    added: SchemaMapping[];
    removed: SchemaMapping[];
    unchanged: SchemaMapping[];
}

interface SchemaPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    job: SyncJob;
    refreshData: () => Promise<void>;
    onGoToEdit: (job: SyncJob) => void;
}

export const SchemaPreviewModal: React.FC<SchemaPreviewModalProps> = ({ isOpen, onClose, job, refreshData, onGoToEdit }) => {
    const [comparison, setComparison] = useState<SchemaComparisonState | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setComparison(null);
            setIsLoading(false);
            setError('');
        }
    }, [isOpen, job]);
    
    if (!isOpen) return null;

    const handleCheckForChanges = async () => {
        setIsLoading(true);
        setError('');
        setComparison(null);

        try {
            const currentHeaders = await fetchSourceSchema(job.sourceType, job.sourceConfiguration);
            const newSchema = generateSchemaMapping(currentHeaders);
            
            const oldSchemaMap = new Map(job.schemaMapping.map(m => [m.originalName, m]));
            const newSchemaMap = new Map(newSchema.map(m => [m.originalName, m]));

            const added = newSchema.filter(m => !oldSchemaMap.has(m.originalName));
            const removed = job.schemaMapping.filter(m => !newSchemaMap.has(m.originalName));
            const unchanged = newSchema.filter(m => oldSchemaMap.has(m.originalName)).map(m => {
                // Fix: Cast to SchemaMapping to resolve an issue where oldMapping was inferred as 'unknown'.
                // The filter before this map ensures the value from .get() is not undefined.
                const oldMapping = oldSchemaMap.get(m.originalName) as SchemaMapping;
                return { ...m, bigQueryName: oldMapping.bigQueryName };
            });

            if(added.length === 0 && removed.length === 0) {
                 setError('No changes detected in the schema.');
            } else {
                setComparison({ newSchema, added, removed, unchanged });
            }

        } catch (err) {
            setError('Failed to fetch or compare schema.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApplyChanges = async () => {
        if (!comparison) return;

        const finalSchema = [...comparison.unchanged, ...comparison.added];
        
        try {
            await updateSyncJob(job.id, { schemaMapping: finalSchema });
            if (job.notificationSettings?.enabled) {
                alert(`Schema changes applied. An email notification would be sent to "${job.notificationSettings.recipients}" with subject "${job.notificationSettings.subject}".`);
            } else {
                alert('Schema changes applied.');
            }
            await refreshData();
            setComparison(null);
            onClose();
        } catch (err) {
            setError('Failed to apply changes.');
            console.error(err);
        }
    };

    const handleModifyManually = () => {
        onGoToEdit(job);
    };

    const renderSourcesList = () => {
        if (job.sourceType === SourceType.GOOGLE_SHEET) {
            const config = job.sourceConfiguration as GoogleSheetSourceConfig;
            return config.sources.map((source, index) => (
                <p key={index} className="font-semibold text-gray-800 dark:text-gray-200">
                    Source: <code className="font-mono text-indigo-600 dark:text-indigo-400 text-sm">{source.sheetName}!{source.range}</code>
                </p>
            ));
        }
        return (
             <p className="font-semibold text-gray-800 dark:text-gray-200">
                Source: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{job.name}</span>
            </p>
        );
    }
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl m-4 max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Schema Preview</h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                       Viewing schema for job: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{job.name}</span>
                    </p>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto flex-1 min-h-0">
                        <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                             <div className="flex justify-between items-center mb-4">
                                <div>
                                    {renderSourcesList()}
                                </div>
                                <Button type="button" variant="secondary" onClick={handleCheckForChanges} disabled={isLoading}>
                                    {isLoading ? <><LoadingSpinner/> Checking...</> : 'Check for Changes'}
                                </Button>
                            </div>

                            {error && <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-2">{error}</p>}
                            
                            {comparison ? (
                                <SchemaComparisonView
                                    comparison={comparison}
                                    onApply={handleApplyChanges}
                                    onCancel={() => setComparison(null)}
                                    onModifyManually={handleModifyManually}
                                />
                            ) : (
                                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                    <div className="max-h-96 overflow-y-auto">
                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                            <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Original Header</th>
                                                    <th className="w-8"></th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">BigQuery Column</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                                {job.schemaMapping.map((m, i) => (
                                                    <tr key={i}>
                                                        <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">{m.originalName}</td>
                                                        <td><ArrowRightIcon className="h-4 w-4 text-gray-400 mx-auto"/></td>
                                                        <td className="px-4 py-2 text-sm font-mono text-gray-800 dark:text-gray-200">{m.bigQueryName}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <Button type="button" variant="primary" onClick={onClose}>Close</Button>
                </div>
            </div>
        </div>
    );
};