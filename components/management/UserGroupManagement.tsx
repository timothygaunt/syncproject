import React, { useState } from 'react';
import type { UserGroup } from '../../types';
import { Button } from '../Button';
import { PlusIcon } from '../icons/PlusIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { PencilIcon } from '../icons/PencilIcon';
import { deleteUserGroup } from '../../services/apiClient';
import { EditGroupModal } from './EditGroupModal';

interface UserGroupManagementProps {
    userGroups: UserGroup[];
    refreshData: () => Promise<void>;
}

const UserGroupManagement: React.FC<UserGroupManagementProps> = ({ userGroups, refreshData }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [groupToEdit, setGroupToEdit] = useState<UserGroup | null>(null);

    const handleOpenAddModal = () => {
        setGroupToEdit(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (group: UserGroup) => {
        setGroupToEdit(group);
        setIsModalOpen(true);
    };

    const handleDelete = async (groupId: string, groupName: string) => {
        if (window.confirm(`Are you sure you want to delete the group "${groupName}"? This action cannot be undone.`)) {
            try {
                await deleteUserGroup(groupId);
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
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">User Groups</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Create and manage groups to control user permissions.</p>
                </div>
                <Button variant="primary" onClick={handleOpenAddModal}>
                    <PlusIcon className="h-5 w-5 mr-2" />
                    New Group
                </Button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Group Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {userGroups.map((group) => (
                            <tr key={group.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{group.name}</td>
                                <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 dark:text-gray-400">{group.description}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                    <button
                                        onClick={() => handleOpenEditModal(group)}
                                        className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                                        aria-label={`Edit ${group.name}`}>
                                        <PencilIcon className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(group.id, group.name)}
                                        className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" 
                                        aria-label={`Delete ${group.name}`}>
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && (
                <EditGroupModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={refreshData}
                    groupToEdit={groupToEdit}
                />
            )}
        </div>
    );
};

export default UserGroupManagement;
