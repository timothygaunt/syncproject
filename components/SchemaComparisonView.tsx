import React from 'react';
import type { SchemaMapping } from '../types';
import { Button } from './Button';
import { ArrowRightIcon } from './icons/ArrowRightIcon';

interface SchemaComparisonState {
    added: SchemaMapping[];
    removed: SchemaMapping[];
    unchanged: SchemaMapping[];
}

interface SchemaComparisonViewProps {
    comparison: SchemaComparisonState;
    onApply: () => void;
    onCancel: () => void;
    onModifyManually: () => void;
}

const renderRow = (mapping: SchemaMapping, status: 'added' | 'removed' | 'unchanged') => {
    let rowClass = '';
    let statusIndicator = '';

    switch(status) {
        case 'added':
            rowClass = 'bg-green-50 dark:bg-green-900/30';
            statusIndicator = '+ Added';
            break;
        case 'removed':
            rowClass = 'bg-red-50 dark:bg-red-900/30 line-through';
            statusIndicator = '- Removed';
            break;
        case 'unchanged':
        default:
            rowClass = 'bg-white dark:bg-gray-800';
            statusIndicator = 'Unchanged'
            break;
    }

    return (
        <tr key={mapping.originalName} className={rowClass}>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                {mapping.originalName}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-400">
                <ArrowRightIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mx-auto" />
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                {mapping.bigQueryName}
            </td>
            <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                status === 'added' ? 'text-green-600 dark:text-green-400' :
                status === 'removed' ? 'text-red-600 dark:text-red-400' :
                'text-gray-500 dark:text-gray-400'
            }`}>
                {statusIndicator}
            </td>
        </tr>
    );
};

export const SchemaComparisonView: React.FC<SchemaComparisonViewProps> = ({ comparison, onApply, onCancel, onModifyManually }) => {
    const { added, removed, unchanged } = comparison;

    return (
        <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">
                Schema Change Detection
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                The schema in your Google Sheet has changed. Review the differences below and choose to apply them to your job configuration.
            </p>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="max-h-80 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Original Header
                                </th>
                                <th scope="col" className="w-12"><span className="sr-only">Arrow</span></th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    BigQuery Column Name
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {added.map(m => renderRow(m, 'added'))}
                            {removed.map(m => renderRow(m, 'removed'))}
                            {unchanged.map(m => renderRow(m, 'unchanged'))}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="mt-4 flex justify-end space-x-3">
                <Button variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button variant="secondary" onClick={onModifyManually}>Modify Manually</Button>
                <Button variant="primary" onClick={onApply}>Apply Changes</Button>
            </div>
        </div>
    );
};