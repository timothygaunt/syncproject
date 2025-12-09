import React, { useState } from 'react';
import { Button } from '../Button';
import { Input } from '../Input';
import type { UserGroup } from '../../types';
import { inviteUser } from '../../services/apiClient';

interface InviteUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onInvite: () => Promise<void>;
    userGroups: UserGroup[];
}

const InviteUserModal: React.FC<InviteUserModalProps> = ({ isOpen, onClose, onInvite, userGroups }) => {
    const [email, setEmail] = useState('');
    const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleGroupToggle = (groupId: string) => {
        setSelectedGroupIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(groupId)) {
                newSet.delete(groupId);
            } else {
                newSet.add(groupId);
            }
            return newSet;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (selectedGroupIds.size === 0) {
            setError("User must be assigned to at least one group.");
            return;
        }
        setIsSaving(true);
        try {
            await inviteUser(email, Array.from(selectedGroupIds));
            await onInvite();
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md m-4">
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Invite New User</h2>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Enter the user's email and assign them to one or more groups.
                        </p>
                    </div>

                    <div className="px-6 pb-6 space-y-4">
                        <Input 
                            label="Email Address" 
                            name="email" 
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="user@example.com"
                            required 
                        />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Assign to Groups</label>
                            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-md p-2">
                                {userGroups.map(group => (
                                    <div key={group.id} className="relative flex items-start">
                                        <div className="flex h-5 items-center">
                                            <input
                                                id={`group-${group.id}`}
                                                name="user-groups"
                                                type="checkbox"
                                                checked={selectedGroupIds.has(group.id)}
                                                onChange={() => handleGroupToggle(group.id)}
                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                                            />
                                        </div>
                                        <div className="ml-3 text-sm">
                                            <label htmlFor={`group-${group.id}`} className="font-medium text-gray-700 dark:text-gray-300">{group.name}</label>
                                            <p className="text-gray-500 dark:text-gray-400">{group.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <Button type="submit" variant="primary" disabled={isSaving}>
                            {isSaving ? 'Sending...' : 'Send Invite'}
                        </Button>
                        <Button type="button" variant="secondary" onClick={onClose} className="mr-3">Cancel</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InviteUserModal;