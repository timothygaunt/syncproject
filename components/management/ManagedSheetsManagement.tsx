import React, { useState } from 'react';
import type { ManagedSheet } from '../../types';
import { Button } from '../Button';
import { TrashIcon } from '../icons/TrashIcon';
import { PlusIcon } from '../icons/PlusIcon';
import AddManagedSheetModal from './AddManagedSheetModal';
import { deleteManagedSheet } from '../../services/apiClient';
import { PencilIcon } from '../icons/PencilIcon';

interface ManagedSheetsManagementProps {
    managedSheets: ManagedSheet[];
    refreshData: () => Promise<void>;
}

const ManagedSheetsManagement: React.FC<ManagedSheetsManagementProps> = ({ managedSheets, refreshData }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [sheetToEdit, setSheetToEdit] = useState<ManagedSheet | null>(null);

    const handleOpenAddModal = () => {
        setSheetToEdit(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (sheet: ManagedSheet) => {
        setSheetToEdit(sheet);
        setIsModalOpen(true);
    };

    const handleDelete = async (sheetId: string, sheetName: string) => {
        if (window.confirm(`Are you sure you want to delete the Google Sheet "${sheetName}"? This action cannot be undone.`)) {
            try {
                await deleteManagedSheet(sheetId);
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
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Managed Google Sheets</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Add or remove Google Sheets available as data sources for sync jobs.</p>
                </div>
                <Button variant="primary" onClick={handleOpenAddModal}>
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add Sheet
                </Button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">URL</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date Added</th>
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {managedSheets.map((sheet) => (
                            <tr key={sheet.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{sheet.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                     <a href={sheet.url} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline truncate">{sheet.url}</a>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(sheet.addedAt).toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                    <button
                                        onClick={() => handleOpenEditModal(sheet)}
                                        className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                                        aria-label={`Edit ${sheet.name}`}>
                                        <PencilIcon className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(sheet.id, sheet.name)}
                                        className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" 
                                        aria-label={`Delete ${sheet.name}`}>
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && (
                <AddManagedSheetModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={refreshData}
                    sheetToEdit={sheetToEdit}
                />
            )}
        </div>
    );
};

export default ManagedSheetsManagement;