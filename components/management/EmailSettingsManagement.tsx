import React, { useState, useEffect } from 'react';
import type { SmtpConfig } from '../../types';
import { updateSmtpConfig } from '../../services/apiClient';
import { Button } from '../Button';
import { Input } from '../Input';

interface EmailSettingsManagementProps {
    currentConfig: SmtpConfig;
    onSave: () => Promise<void>;
}

const EmailSettingsManagement: React.FC<EmailSettingsManagementProps> = ({ currentConfig, onSave }) => {
    const [config, setConfig] = useState<SmtpConfig>(currentConfig);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        setConfig(currentConfig);
    }, [currentConfig]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setConfig(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value, 10) : value)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');
        setSuccess('');
        try {
            await updateSmtpConfig(config);
            setSuccess('SMTP settings saved successfully.');
            await onSave();
        } catch (err) {
            setError('Failed to save settings. Please try again.');
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-lg rounded-lg">
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Email (SMTP) Settings</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Configure the server used to send email notifications for schema changes.</p>
            </div>
            <div className="p-4 sm:p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Input label="SMTP Host" name="host" value={config.host} onChange={handleChange} required />
                    <Input label="SMTP Port" name="port" type="number" value={config.port} onChange={handleChange} required />
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Input label="SMTP User" name="user" value={config.user} onChange={handleChange} required />
                    <Input label="SMTP Password" name="pass" type="password" placeholder="Leave blank to keep unchanged" value={config.pass} onChange={handleChange} />
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Input label="From Name" name="fromName" value={config.fromName} onChange={handleChange} placeholder="e.g., SheetSync Notifier" required />
                    <Input label="From Email" name="fromEmail" type="email" value={config.fromEmail} onChange={handleChange} placeholder="e.g., noreply@example.com" required />
                </div>
                <div className="relative flex items-start">
                    <div className="flex items-center h-5">
                        <input
                            id="secure"
                            name="secure"
                            type="checkbox"
                            checked={config.secure}
                            onChange={handleChange}
                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                        />
                    </div>
                    <div className="ml-3 text-sm">
                        <label htmlFor="secure" className="font-medium text-gray-700 dark:text-gray-300">Use SSL/TLS</label>
                        <p className="text-gray-500 dark:text-gray-400">Enable for secure connections (e.g., port 465).</p>
                    </div>
                </div>

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

export default EmailSettingsManagement;