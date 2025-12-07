import React, { useState } from 'react';
import type { User, UserGroup } from '../../types';
import { Button } from '../Button';
import { TrashIcon } from '../icons/TrashIcon';
import { PlusIcon } from '../icons/PlusIcon';
import InviteUserModal from './InviteUserModal';
import { deleteUser } from '../../services/apiClient';
import { usePermissions } from '../../hooks/usePermissions';

interface UserManagementProps {
    users: User[];
    userGroups: UserGroup[];
    refreshData: () => Promise<void>;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, userGroups, refreshData }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { hasPermission } = usePermissions();

    const groupMap = new Map(userGroups.map(g => [g.id, g]));

    const handleDelete = async (userId: string, userName: string) => {
        if (window.confirm(`Are you sure you want to delete user ${userName}?`)) {
            try {
                await deleteUser(userId);
                await refreshData();
            } catch (error) {
                console.error(error);
                alert((error as Error).message);
            }
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg">
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Users</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage who can access the application and their group assignments.</p>
                </div>
                {hasPermission('MANAGE_USERS') && (
                    <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Invite User
                    </Button>
                )}
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Groups</th>
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{user.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    <div className="flex flex-wrap gap-1">
                                        {/* FIX: Refactored to be more type-safe and use a stable key. */}
                                        {user.groupIds
                                            .map(id => groupMap.get(id))
                                            .filter((g): g is UserGroup => !!g)
                                            .map(group => (
                                                <span key={group.id} className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 rounded-full dark:bg-gray-700 dark:text-gray-300">{group.name}</span>
                                            ))
                                        }
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {hasPermission('MANAGE_USERS') && (
                                        <button 
                                            onClick={() => handleDelete(user.id, user.name)}
                                            className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" 
                                            aria-label={`Delete ${user.name}`}>
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && (
                <InviteUserModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onInvite={refreshData}
                    userGroups={userGroups}
                />
            )}
        </div>
    );
};

export default UserManagement;