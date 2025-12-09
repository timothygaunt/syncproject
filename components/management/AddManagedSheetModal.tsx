import React, { useState, useEffect } from 'react';
import { Button } from '../Button';
import { Input } from '../Input';
import { addManagedSheet, updateManagedSheet } from '../../services/apiClient';
import type { ManagedSheet } from '../../types';

interface AddManagedSheetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => Promise<void>;
    sheetToEdit: ManagedSheet | null;
}

const AddManagedSheetModal: React.FC<AddManagedSheetModalProps> = ({ isOpen, onClose, onSave, sheetToEdit }) => {
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const isEditMode = sheetToEdit !== null;

    useEffect(() => {
        if (sheetToEdit) {
            setName(sheetToEdit.name);
            setUrl(sheetToEdit.url);
        } else {
            setName('');
            setUrl('');
        }
        setError('');
    }, [sheetToEdit, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSaving(true);
        try {
            if (isEditMode) {
                await updateManagedSheet(sheetToEdit.id, { name, url });
            } else {
                await addManagedSheet(name, url);
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md m-4 max-h-[90vh] flex flex-col">
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{isEditMode ? 'Edit' : 'Add'} Google Sheet</h2>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {isEditMode ? 'Update the details for this Google Sheet.' : 'Register a new Google Sheet to make it available as a data source.'}
                        </p>
                    </div>

                    <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1 min-h-0">
                        <Input 
                            label="Sheet Name" 
                            name="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Q1 Sales Data"
                            required 
                        />
                         <Input 
                            label="Google Sheet URL" 
                            name="url" 
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://docs.google.com/spreadsheets/d/..."
                            required 
                        />
                        {error && <p className="text-sm text-red-500">{error}</p>}
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 sm:px-6 flex flex-row-reverse mt-auto flex-shrink-0">
                        <Button type="submit" variant="primary" disabled={isSaving}>
                            {isSaving ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Add Sheet')}
                        </Button>
                        <Button type="button" variant="secondary" onClick={onClose} className="mr-3">Cancel</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddManagedSheetModal;