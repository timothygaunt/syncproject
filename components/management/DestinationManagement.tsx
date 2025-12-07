import React, { useState } from 'react';
import type { GcpProjectConnection } from '../../types';
import { Button } from '../Button';
import { TrashIcon } from '../icons/TrashIcon';
import { PlusIcon } from '../icons/PlusIcon';
import { deleteGcpProjectConnection } from '../../services/apiClient';
import AddDestinationModal from './AddDestinationModal';
import { PencilIcon } from '../icons/PencilIcon';

interface DestinationManagementProps {
    gcpProjectConnections: GcpProjectConnection[];
    refreshData: () => Promise<void>;
}

const DestinationManagement: React.FC<DestinationManagementProps> = ({ gcpProjectConnections, refreshData }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [projectToEdit, setProjectToEdit] = useState<GcpProjectConnection | null>(null);

    const handleOpenAddModal = () => {
        setProjectToEdit(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (project: GcpProjectConnection) => {
        setProjectToEdit(project);
        setIsModalOpen(true);
    };

    const handleDelete = async (projId: string, projName: string) => {
        if (window.confirm(`Are you sure you want to delete the Destination "${projName}"? This cannot be undone.`)) {
            try {
                await deleteGcpProjectConnection(projId);
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
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">BigQuery Destinations</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage reusable BigQuery project and service account configurations.</p>
                </div>
                <Button variant="primary" onClick={handleOpenAddModal}>
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add Destination
                </Button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Project ID</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Staging GCS Bucket</th>
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {gcpProjectConnections.map((proj) => (
                            <tr key={proj.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{proj.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">{proj.projectId}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">{proj.stagingGcsBucket}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                     <button
                                        onClick={() => handleOpenEditModal(proj)}
                                        className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                                        aria-label={`Edit ${proj.name}`}>
                                        <PencilIcon className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(proj.id, proj.name)}
                                        className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                                        aria-label={`Delete ${proj.name}`}>
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && (
                <AddDestinationModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={refreshData}
                    projectToEdit={projectToEdit}
                />
            )}
        </div>
    );
};

export default DestinationManagement;