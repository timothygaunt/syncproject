import React, { useState } from 'react';
import { Button } from '../Button';
import { Input } from '../Input';
import { addServiceAccount } from '../../services/apiClient';

interface AddServiceAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: () => Promise<void>;
}

const AddServiceAccountModal: React.FC<AddServiceAccountModalProps> = ({ isOpen, onClose, onAdd }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSaving(true);
        try {
            await addServiceAccount(name, email);
            await onAdd();
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md m-4">
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add Service Account</h2>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Register a new service account to be used by sync jobs.
                        </p>
                    </div>

                    <div className="px-6 pb-6 space-y-4">
                        <Input 
                            label="Account Name" 
                            name="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Primary Analytics Account"
                            required 
                        />
                         <Input 
                            label="Service Account Email" 
                            name="email" 
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="...iam.gserviceaccount.com"
                            required 
                        />
                        {error && <p className="text-sm text-red-500">{error}</p>}
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <Button type="submit" variant="primary" disabled={isSaving}>
                            {isSaving ? 'Adding...' : 'Add Account'}
                        </Button>
                        <Button type="button" variant="secondary" onClick={onClose} className="mr-3">Cancel</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddServiceAccountModal;