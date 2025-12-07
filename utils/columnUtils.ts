import type { SchemaMapping } from '../types';

/**
 * Cleans a single column name to be BigQuery compatible.
 * - Converts to lowercase
 * - Replaces spaces and non-alphanumeric characters with underscores
 * - Ensures it doesn't start with a number
 * - Handles empty or invalid names
 * @param name The original column header string.
 * @returns A cleaned, BigQuery-safe column name.
 */
export const cleanColumnName = (name: string): string => {
    if (!name || name.trim() === '') {
        return 'unnamed_column';
    }

    let cleaned = name
        .trim()
        // Replace spaces and other separator-like characters with a single underscore
        .replace(/[\s\W-]+/g, '_')
        // Remove any character that is not a letter, number, or underscore
        .replace(/[^a-zA-Z0-9_]/g, '')
        // Convert to lowercase
        .toLowerCase();
    
    // Remove leading/trailing underscores that might have been created
    cleaned = cleaned.replace(/^_+|_+$/g, '');

    // BigQuery columns cannot start with a number
    if (/^[0-9]/.test(cleaned)) {
        cleaned = `col_${cleaned}`;
    }

    // Handle cases where the name becomes empty after cleaning (e.g., "!!")
    if (cleaned === '') {
        return 'unnamed_column';
    }
    
    return cleaned;
};

/**
 * Takes an array of raw header names and generates a schema mapping,
 * handling potential duplicate names after cleaning.
 * @param headers An array of original header strings from the Google Sheet.
 * @returns An array of SchemaMapping objects with unique bigQueryName properties.
 */
export const generateSchemaMapping = (headers: string[]): SchemaMapping[] => {
    const nameCounts: Record<string, number> = {};
    return headers.map(originalName => {
        let bigQueryName = cleanColumnName(originalName);
        
        // Check for duplicates and append a suffix if necessary
        if (nameCounts[bigQueryName] !== undefined) {
            nameCounts[bigQueryName]++;
            bigQueryName = `${bigQueryName}_${nameCounts[bigQueryName]}`;
        } else {
            nameCounts[bigQueryName] = 0;
        }
        
        return { originalName, bigQueryName };
    });
};
