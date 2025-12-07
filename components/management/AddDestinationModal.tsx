import React, { useState, useEffect } from 'react';
import { Button } from '../Button';
import { Input } from '../Input';
import { addGcpProjectConnection, updateGcpProjectConnection } from '../../services/apiClient';
import type { GcpProjectConnection } from '../../types';

interface AddDestinationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => Promise<void>;
    projectToEdit: GcpProjectConnection | null;
}

const AddDestinationModal: React.FC<AddDestinationModalProps> = ({ isOpen, onClose, onSave, projectToEdit }) => {
    const [formData, setFormData] = useState({
        name: '',
        projectId: '',
        stagingGcsBucket: '',
        serviceAccountKeyJson: '',
        gcsHmacKey: '',
        gcsHmacSecret: '',
    });
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const isEditMode = projectToEdit !== null;

    useEffect(() => {
        if (projectToEdit) {
            setFormData({
                name: projectToEdit.name,
                projectId: projectToEdit.projectId,
                stagingGcsBucket: projectToEdit.stagingGcsBucket,
                serviceAccountKeyJson: projectToEdit.serviceAccountKeyJson,
                gcsHmacKey: projectToEdit.gcsHmacKey || '',
                gcsHmacSecret: projectToEdit.gcsHmacSecret || '',
            });
        } else {
            setFormData({ name: '', projectId: '', stagingGcsBucket: '', serviceAccountKeyJson: '', gcsHmacKey: '', gcsHmacSecret: '' });
        }
        setError('');
    }, [projectToEdit, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            JSON.parse(formData.serviceAccountKeyJson);
        } catch (jsonError) {
            setError('Service Account Key JSON is not valid JSON.');
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                ...formData,
                gcsHmacKey: formData.gcsHmacKey || undefined,
                gcsHmacSecret: formData.gcsHmacSecret || undefined,
            };
            if (isEditMode) {
                await updateGcpProjectConnection(projectToEdit.id, payload);
            } else {
                await addGcpProjectConnection(payload);
            }
            await onSave();
            onClose();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsSaving(false);
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl m-4 max-h-[90vh] flex flex-col">
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{isEditMode ? 'Edit' : 'Add'} Destination</h2>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {isEditMode ? 'Update the configuration for this destination.' : 'Configure a reusable destination for your sync jobs.'}
                        </p>
                    </div>

                    <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1 min-h-0">
                        <Input 
                            label="Destination Name" 
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g., Production Data Warehouse"
                            required 
                        />
                         <Input 
                            label="GCP Project ID" 
                            name="projectId" 
                            value={formData.projectId}
                            onChange={handleChange}
                            placeholder="your-gcp-project-id"
                            required 
                        />
                         <Input 
                            label="GCS Staging Bucket" 
                            name="stagingGcsBucket" 
                            value={formData.stagingGcsBucket}
                            onChange={handleChange}
                            placeholder="gs://your-staging-bucket-name"
                            required 
                        />
                        <div>
                            <label htmlFor="serviceAccountKeyJson" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Service Account Key JSON
                            </label>
                            <textarea
                                id="serviceAccountKeyJson"
                                name="serviceAccountKeyJson"
                                rows={6}
                                value={formData.serviceAccountKeyJson}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white font-mono"
                                placeholder='{ "type": "service_account", ... }'
                                required
                            />
                             <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Paste the entire contents of your service account JSON key file here.</p>
                        </div>
                        <div className="p-4 border border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
                            <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">Optional: GCS HMAC Credentials</h4>
                            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1 mb-3">
                                Provide these only if you need to use HMAC keys for GCS authentication (less common).
                            </p>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input 
                                    label="HMAC Access Key" 
                                    name="gcsHmacKey" 
                                    value={formData.gcsHmacKey}
                                    onChange={handleChange}
                                />
                                <Input 
                                    label="HMAC Secret" 
                                    name="gcsHmacSecret" 
                                    type="password"
                                    value={formData.gcsHmacSecret}
                                    placeholder={isEditMode ? 'Leave blank to keep unchanged' : ''}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {error && <p className="text-sm text-red-500">{error}</p>}
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse mt-auto">
                        <Button type="submit" variant="primary" disabled={isSaving}>
                            {isSaving ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Add Destination')}
                        </Button>
                        <Button type="button" variant="secondary" onClick={onClose} className="mr-3">Cancel</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddDestinationModal;