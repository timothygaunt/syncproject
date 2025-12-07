import React, { useState } from 'react';
import type { User, ServiceAccount, ManagedSheet, GcpProjectConnection, FtpSource, SmtpConfig, AuthConfig, UserGroup } from '../types';
import { usePermissions } from '../hooks/usePermissions';
import UserManagement from '../components/management/UserManagement';
import ServiceAccountManagement from '../components/management/ServiceAccountManagement';
import ManagedSheetsManagement from '../components/management/ManagedSheetsManagement';
import FtpSourceManagement from '../components/management/FtpSourceManagement';
import DestinationManagement from '../components/management/DestinationManagement';
import EmailSettingsManagement from '../components/management/EmailSettingsManagement';
import AuthenticationManagement from '../components/management/AuthenticationManagement';
import UserGroupManagement from '../components/management/UserGroupManagement';
import { UsersIcon } from '../components/icons/UsersIcon';
import { KeyIcon } from '../components/icons/KeyIcon';
import { SheetIcon } from '../components/icons/SheetIcon';
import { FtpIcon } from '../components/icons/FtpIcon';
import { CloudIcon } from '../components/icons/BigQueryIcon';
import { CogIcon } from '../components/icons/CogIcon';
import { ShieldCheckIcon } from '../components/icons/ShieldCheckIcon';
import { UserGroupIcon } from '../components/icons/UserGroupIcon';


interface ManagementPageProps {
    users: User[];
    serviceAccounts: ServiceAccount[];
    managedSheets: ManagedSheet[];
    managedFtpSources: FtpSource[];
    gcpProjectConnections: GcpProjectConnection[];
    smtpConfig: SmtpConfig;
    authConfig: AuthConfig;
    userGroups: UserGroup[];
    refreshData: () => Promise<void>;
}

type ManagementTab = 'users' | 'groups' | 'serviceAccounts' | 'sources' | 'destinations' | 'settings' | 'authentication';
type SourceSubTab = 'googleSheets' | 'ftp';

const ManagementPage: React.FC<ManagementPageProps> = ({ 
    users, serviceAccounts, managedSheets, managedFtpSources, gcpProjectConnections, 
    smtpConfig, authConfig, userGroups, refreshData 
}) => {
    const [activeTab, setActiveTab] = useState<ManagementTab>('users');
    const [activeSourceTab, setActiveSourceTab] = useState<SourceSubTab>('googleSheets');
    const { hasPermission } = usePermissions();

    if (!hasPermission('VIEW_MANAGEMENT')) {
        return (
            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-lg shadow">
                <h2 className="text-xl font-bold text-red-600 dark:text-red-400">Access Denied</h2>
                <p className="mt-2 text-gray-600 dark:text-gray-300">You do not have permission to view this page.</p>
            </div>
        );
    }

    const navItems = [
        { id: 'users', label: 'Users', icon: UsersIcon, permission: 'MANAGE_USERS' },
        { id: 'groups', label: 'User Groups', icon: UserGroupIcon, permission: 'MANAGE_GROUPS' },
        { id: 'serviceAccounts', label: 'Service Accounts', icon: KeyIcon, permission: 'MANAGE_SERVICE_ACCOUNTS' },
        { id: 'sources', label: 'Sources', icon: SheetIcon, permission: 'MANAGE_SOURCES' },
        { id: 'destinations', label: 'Destinations', icon: CloudIcon, permission: 'MANAGE_DESTINATIONS' },
        { id: 'settings', label: 'Settings', icon: CogIcon, permission: 'MANAGE_SETTINGS' },
        { id: 'authentication', label: 'Authentication', icon: ShieldCheckIcon, permission: 'MANAGE_AUTHENTICATION' },
    ].filter(item => hasPermission(item.permission as any));
    
    const renderActiveTab = () => {
        switch (activeTab) {
            case 'users': return <UserManagement users={users} userGroups={userGroups} refreshData={refreshData} />;
            case 'groups': return <UserGroupManagement userGroups={userGroups} refreshData={refreshData} />;
            case 'serviceAccounts': return <ServiceAccountManagement serviceAccounts={serviceAccounts} refreshData={refreshData} />;
            case 'sources': return renderSourceManagement();
            case 'destinations': return <DestinationManagement gcpProjectConnections={gcpProjectConnections} refreshData={refreshData} />;
            case 'settings': return <EmailSettingsManagement currentConfig={smtpConfig} onSave={refreshData} />;
            case 'authentication': return <AuthenticationManagement currentConfig={authConfig} onSave={refreshData} />;
            default: return null;
        }
    }

    const renderSourceManagement = () => (
         <div>
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button onClick={() => setActiveSourceTab('googleSheets')} className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm ${activeSourceTab === 'googleSheets' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-200'}`}>
                        <SheetIcon className="-ml-0.5 mr-2 h-5 w-5" />
                        <span>Google Sheets</span>
                    </button>
                    <button onClick={() => setActiveSourceTab('ftp')} className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm ${activeSourceTab === 'ftp' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-200'}`}>
                        <FtpIcon className="-ml-0.5 mr-2 h-5 w-5" />
                        <span>FTP/SFTP Sites</span>
                    </button>
                </nav>
            </div>
            <div className="mt-6">
                {activeSourceTab === 'googleSheets' && <ManagedSheetsManagement managedSheets={managedSheets} refreshData={refreshData} />}
                {activeSourceTab === 'ftp' && <FtpSourceManagement ftpSources={managedFtpSources} refreshData={refreshData} />}
            </div>
        </div>
    );

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Management</h1>
                <p className="text-gray-500 dark:text-gray-400">Configure application settings, users, and connections.</p>
            </div>
            
            <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as ManagementTab)}
                            className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === item.id ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'}`}
                        >
                            <item.icon className={`-ml-0.5 mr-2 h-5 w-5 ${activeTab === item.id ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>
            </div>
            
            <div>
                {renderActiveTab()}
            </div>
        </div>
    );
};

export default ManagementPage;