import React, { useState } from 'react';
import type { FtpSource } from '../../types';
import { Button } from '../Button';
import { TrashIcon } from '../icons/TrashIcon';
import { PlusIcon } from '../icons/PlusIcon';
import AddFtpSourceModal from './AddFtpSourceModal';
import { deleteFtpSource } from '../../services/apiClient';
import { PencilIcon } from '../icons/PencilIcon';

interface FtpSourceManagementProps {
    ftpSources: FtpSource[];
    refreshData: () => Promise<void>;
}

const FtpSourceManagement: React.FC<FtpSourceManagementProps> = ({ ftpSources, refreshData }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [sourceToEdit, setSourceToEdit] = useState<FtpSource | null>(null);

    const handleOpenAddModal = () => {
        setSourceToEdit(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (source: FtpSource) => {
        setSourceToEdit(source);
        setIsModalOpen(true);
    };

    const handleDelete = async (sourceId: string, sourceName: string) => {
        if (window.confirm(`Are you sure you want to delete the FTP source "${sourceName}"? This action cannot be undone.`)) {
            try {
                await deleteFtpSource(sourceId);
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
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Managed FTP/SFTP Sites</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Add or remove FTP/SFTP connections available for sync jobs.</p>
                </div>
                <Button variant="primary" onClick={handleOpenAddModal}>
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add Connection
                </Button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Host</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Port</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {ftpSources.map((source) => (
                            <tr key={source.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{source.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">{source.host}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{source.port}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">{source.user}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                     <button
                                        onClick={() => handleOpenEditModal(source)}
                                        className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                                        aria-label={`Edit ${source.name}`}>
                                        <PencilIcon className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(source.id, source.name)}
                                        className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" 
                                        aria-label={`Delete ${source.name}`}>
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && (
                <AddFtpSourceModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={refreshData}
                    sourceToEdit={sourceToEdit}
                />
            )}
        </div>
    );
};

export default FtpSourceManagement;