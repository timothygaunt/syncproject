import React, { useState, useEffect } from 'react';
import type { AuthConfig } from '../../types';
import { updateAuthConfig } from '../../services/apiClient';
import { Button } from '../Button';
import { Input } from '../Input';

interface AuthenticationManagementProps {
    currentConfig: AuthConfig;
    onSave: () => Promise<void>;
}

const AuthenticationManagement: React.FC<AuthenticationManagementProps> = ({ currentConfig, onSave }) => {
    const [config, setConfig] = useState<AuthConfig>(currentConfig);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        setConfig(currentConfig);
    }, [currentConfig]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'method') {
            setConfig(prev => ({ ...prev, method: value as AuthConfig['method'] }));
        } else {
            setConfig(prev => ({
                ...prev,
                adConfig: { ...prev.adConfig!, [name]: value }
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');
        setSuccess('');
        try {
            await updateAuthConfig(config);
            setSuccess('Authentication settings saved successfully.');
            await onSave();
        } catch (err) {
            setError('Failed to save settings.');
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-lg rounded-lg">
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Authentication Settings</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Configure how users authenticate with the application.</p>
            </div>
            <div className="p-4 sm:p-6 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Authentication Method</label>
                    <fieldset className="mt-2">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center">
                                <input id="oauth" name="method" type="radio" value="OAuth" checked={config.method === 'OAuth'} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600" />
                                <label htmlFor="oauth" className="ml-2 block text-sm text-gray-900 dark:text-gray-200">OAuth (e.g., Google)</label>
                            </div>
                            <div className="flex items-center">
                                <input id="ad" name="method" type="radio" value="ActiveDirectory" checked={config.method === 'ActiveDirectory'} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600" />
                                <label htmlFor="ad" className="ml-2 block text-sm text-gray-900 dark:text-gray-200">Active Directory</label>
                            </div>
                        </div>
                    </fieldset>
                </div>

                {config.method === 'ActiveDirectory' && (
                    <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg space-y-4">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200">Active Directory Configuration</h4>
                         <Input label="LDAP URL" name="ldapUrl" value={config.adConfig?.ldapUrl || ''} onChange={handleChange} placeholder="ldap://your-dc.example.com" required />
                         <Input label="Base DN" name="baseDN" value={config.adConfig?.baseDN || ''} onChange={handleChange} placeholder="DC=example,DC=com" required />
                         <Input label="Bind Username" name="username" value={config.adConfig?.username || ''} onChange={handleChange} placeholder="CN=BindUser,OU=Users,DC=example,DC=com" required />
                         <Input label="Bind Password" name="password" type="password" placeholder="Leave blank to keep unchanged" onChange={handleChange} />
                    </div>
                )}
                
                {error && <p className="text-sm text-red-500">{error}</p>}
                {success && <p className="text-sm text-green-600">{success}</p>}
            </div>
             <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 sm:px-6 text-right">
                <Button type="submit" variant="primary" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Settings'}
                </Button>
            </div>
        </form>
    );
};

export default AuthenticationManagement;