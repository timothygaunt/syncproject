import React, { useState, useEffect } from 'react';
import { Button } from '../Button';
import { Input } from '../Input';
import { addFtpSource, updateFtpSource } from '../../services/apiClient';
import type { FtpSource } from '../../types';

interface AddFtpSourceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => Promise<void>;
    sourceToEdit: FtpSource | null;
}

const AddFtpSourceModal: React.FC<AddFtpSourceModalProps> = ({ isOpen, onClose, onSave, sourceToEdit }) => {
    const [name, setName] = useState('');
    const [host, setHost] = useState('');
    const [port, setPort] = useState(22);
    const [user, setUser] = useState('');
    const [pass, setPass] = useState('');
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    
    const isEditMode = sourceToEdit !== null;

    useEffect(() => {
        if (sourceToEdit) {
            setName(sourceToEdit.name);
            setHost(sourceToEdit.host);
            setPort(sourceToEdit.port);
            setUser(sourceToEdit.user);
            setPass(sourceToEdit.pass); // In a real app, you wouldn't pre-fill the password for editing
        } else {
            setName('');
            setHost('');
            setPort(22);
            setUser('');
            setPass('');
        }
        setError('');
    }, [sourceToEdit, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSaving(true);
        try {
            const payload = { name, host, port, user, pass };
            if (isEditMode) {
                await updateFtpSource(sourceToEdit.id, payload);
            } else {
                await addFtpSource(payload);
            }
            await onSave();
            onClose();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsSaving(false);
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg m-4 max-h-[90vh] flex flex-col">
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{isEditMode ? 'Edit' : 'Add'} FTP/SFTP Connection</h2>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {isEditMode ? 'Update the connection details.' : 'Provide connection details for a new FTP/SFTP source.'}
                        </p>
                    </div>

                    <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1 min-h-0">
                        <Input label="Connection Name" name="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Marketing SFTP Server" required />
                        <div className="grid grid-cols-3 gap-4">
                             <div className="col-span-2">
                                <Input label="Host" name="host" value={host} onChange={(e) => setHost(e.target.value)} placeholder="ftp.example.com" required />
                             </div>
                             <Input label="Port" name="port" type="number" value={port} onChange={(e) => setPort(parseInt(e.target.value, 10))} required />
                        </div>
                        <Input label="Username" name="user" value={user} onChange={(e) => setUser(e.target.value)} placeholder="ftp_user" required />
                        <Input label="Password" name="pass" type="password" value={pass} placeholder={isEditMode ? 'Leave blank to keep unchanged' : ''} required={!isEditMode} />
                        
                        {error && <p className="text-sm text-red-500">{error}</p>}
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse mt-auto">
                        <Button type="submit" variant="primary" disabled={isSaving}>
                            {isSaving ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Add Connection')}
                        </Button>
                        <Button type="button" variant="secondary" onClick={onClose} className="mr-3">Cancel</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddFtpSourceModal;