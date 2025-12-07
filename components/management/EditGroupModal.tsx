import React, { useState, useEffect } from 'react';
import { Button } from '../Button';
import { Input } from '../Input';
import type { UserGroup, Permission } from '../../types';
import { createUserGroup, updateUserGroup } from '../../services/apiClient';

const ALL_PERMISSIONS: { id: Permission, description: string }[] = [
    { id: 'VIEW_DASHBOARD', description: 'Can view the main jobs dashboard' },
    { id: 'CREATE_JOB', description: 'Can create new sync jobs' },
    { id: 'EDIT_JOB', description: 'Can edit existing sync jobs' },
    { id: 'DELETE_JOB', description: 'Can permanently delete sync jobs' },
    { id: 'ARCHIVE_JOB', description: 'Can archive and un-archive sync jobs' },
    { id: 'VIEW_JOB_LOGS', description: 'Can view the execution logs for jobs' },
    { id: 'MANAGE_SCHEMA', description: 'Can manage and update job schemas' },
    { id: 'VIEW_MANAGEMENT', description: 'Can view the Management section' },
    { id: 'MANAGE_USERS', description: 'Can invite, edit, and delete users' },
    { id: 'MANAGE_GROUPS', description: 'Can create, edit, and delete user groups' },
    { id: 'MANAGE_SERVICE_ACCOUNTS', description: 'Can manage service accounts' },
    { id: 'MANAGE_SOURCES', description: 'Can manage all data sources (Sheets, FTP)' },
    { id: 'MANAGE_DESTINATIONS', description: 'Can manage all data destinations' },
    { id: 'MANAGE_SETTINGS', description: 'Can manage application settings (e.g., SMTP)' },
    { id: 'MANAGE_AUTHENTICATION', description: 'Can manage authentication settings (e.g., AD)' },
];

interface EditGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => Promise<void>;
    groupToEdit: UserGroup | null;
}

export const EditGroupModal: React.FC<EditGroupModalProps> = ({ isOpen, onClose, onSave, groupToEdit }) => {
    // FIX: Explicitly type useState to prevent `any` inference.
    const [name, setName] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [selectedPermissions, setSelectedPermissions] = useState<Set<Permission>>(new Set());
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const isEditMode = groupToEdit !== null;

    useEffect(() => {
        if (groupToEdit) {
            setName(groupToEdit.name);
            setDescription(groupToEdit.description);
            setSelectedPermissions(new Set(groupToEdit.permissions));
        } else {
            setName('');
            setDescription('');
            setSelectedPermissions(new Set());
        }
        setError('');
    }, [groupToEdit, isOpen]);

    const handlePermissionToggle = (permission: Permission) => {
        setSelectedPermissions(prev => {
            const newSet = new Set(prev);
            if (newSet.has(permission)) {
                newSet.delete(permission);
            } else {
                newSet.add(permission);
            }
            return newSet;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSaving(true);
        try {
            // FIX: Use spread syntax for better type inference from Set to Array.
            const payload = { name, description, permissions: [...selectedPermissions] };
            if (isEditMode) {
                await updateUserGroup(groupToEdit.id, payload);
            } else {
                await createUserGroup(payload);
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
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{isEditMode ? 'Edit' : 'Create'} User Group</h2>
                    </div>

                    <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1 min-h-0">
                        <Input label="Group Name" name="name" value={name} onChange={(e) => setName(e.target.value)} required />
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                            <textarea id="description" name="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"/>
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Permissions</label>
                             <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 border border-gray-200 dark:border-gray-600 rounded-md p-4">
                                {ALL_PERMISSIONS.map(p => (
                                    <div key={p.id} className="relative flex items-start">
                                        <div className="flex h-5 items-center">
                                            <input
                                                id={`perm-${p.id}`}
                                                type="checkbox"
                                                checked={selectedPermissions.has(p.id)}
                                                onChange={() => handlePermissionToggle(p.id)}
                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                                            />
                                        </div>
                                        <div className="ml-3 text-sm">
                                            <label htmlFor={`perm-${p.id}`} className="font-medium text-gray-700 dark:text-gray-300">{p.id.replace(/_/g, ' ')}</label>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse mt-auto">
                        <Button type="submit" variant="primary" disabled={isSaving}>
                            {isSaving ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Group')}
                        </Button>
                        <Button type="button" variant="secondary" onClick={onClose} className="mr-3">Cancel</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};