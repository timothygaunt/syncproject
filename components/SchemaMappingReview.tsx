import React from 'react';
import type { SchemaMapping } from '../types';
import { ArrowRightIcon } from './icons/ArrowRightIcon';

interface SchemaMappingReviewProps {
    schemaMapping: SchemaMapping[];
    onMappingChange: (index: number, newName: string) => void;
}

export const SchemaMappingReview: React.FC<SchemaMappingReviewProps> = ({ schemaMapping, onMappingChange }) => {
    if (!schemaMapping || schemaMapping.length === 0) {
        return (
            <div className="text-center py-10 px-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-200">No Schema Data</h4>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Could not find any columns to map.</p>
            </div>
        );
    }

    const bigQueryNames = schemaMapping.map(m => m.bigQueryName);
    const isDuplicate = (name: string, currentIndex: number) => {
        if (!name) return false; // Don't flag empty inputs as duplicates
        return bigQueryNames.some((n, i) => n.toLowerCase() === name.toLowerCase() && i !== currentIndex);
    };


    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Original Header (from Sheet)
                            </th>
                            <th scope="col" className="w-12 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                <span className="sr-only">Arrow</span>
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                BigQuery Column Name (Editable)
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {schemaMapping.map((mapping, index) => {
                            const hasDuplicate = isDuplicate(mapping.bigQueryName, index);
                            return (
                                <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 truncate" title={mapping.originalName}>
                                        {mapping.originalName || <span className="italic text-gray-400">Empty Header</span>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-400">
                                        <ArrowRightIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mx-auto"/>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                        <input
                                            type="text"
                                            value={mapping.bigQueryName}
                                            onChange={(e) => onMappingChange(index, e.target.value)}
                                            className={`w-full px-2 py-1 border rounded-md text-sm bg-gray-50 dark:bg-gray-700
                                                ${hasDuplicate 
                                                    ? 'border-red-500 text-red-600 focus:ring-red-500 focus:border-red-500' 
                                                    : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500'
                                                }`}
                                            aria-label={`BigQuery column name for ${mapping.originalName}`}
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};