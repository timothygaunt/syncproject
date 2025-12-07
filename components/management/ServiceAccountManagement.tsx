import React, { useState } from 'react';
import type { ServiceAccount } from '../../types';
import { Button } from '../Button';
import { TrashIcon } from '../icons/TrashIcon';
import { PlusIcon } from '../icons/PlusIcon';
import AddServiceAccountModal from './AddServiceAccountModal';
import { deleteServiceAccount } from '../../services/apiClient';

interface ServiceAccountManagementProps {
    serviceAccounts: ServiceAccount[];
    refreshData: () => Promise<void>;
}

const ServiceAccountManagement: React.FC<ServiceAccountManagementProps> = ({ serviceAccounts, refreshData }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleDelete = async (saId: string, saName: string) => {
        if (window.confirm(`Are you sure you want to delete service account ${saName}? This action cannot be undone.`)) {
            try {
                await deleteServiceAccount(saId);
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
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Service Accounts</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">These accounts are used to authenticate with Google services.</p>
                </div>
                <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add Account
                </Button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date Added</th>
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {serviceAccounts.map((sa) => (
                            <tr key={sa.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{sa.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">{sa.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(sa.createdAt).toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => handleDelete(sa.id, sa.name)}
                                        className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" 
                                        aria-label={`Delete ${sa.name}`}>
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && (
                <AddServiceAccountModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onAdd={refreshData}
                />
            )}
        </div>
    );
};

export default ServiceAccountManagement;