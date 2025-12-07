import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, name, icon, ...props }) => {
    return (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {label}
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
                {icon && (
                    <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                        {icon}
                    </div>
                )}
                <input
                    id={name}
                    name={name}
                    className={`block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white ${icon ? 'pl-10' : ''}`}
                    {...props}
                />
            </div>
        </div>
    );
};