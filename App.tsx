import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { LoadingSpinner } from './components/LoadingSpinner';
import { LoginPage } from './components/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ManagementPage from './pages/ManagementPage';
import { getCurrentUser, getSyncJobs, getServiceAccounts, getUsers, getManagedSheets, getGcpProjectConnections, getFtpSources, getDailySyncMetrics, getSiteConfig, importSiteConfig, getSmtpConfig, getAuthConfig, getUserGroups } from './services/apiClient';
import type { SiteConfig, SyncJob, User, ServiceAccount, ManagedSheet, GcpProjectConnection, FtpSource, DailySyncMetric, SmtpConfig, AuthConfig, UserGroup } from './types';
import { PermissionsProvider } from './hooks/usePermissions';

type Page = 'dashboard' | 'management';

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [currentPage, setCurrentPage] = useState<Page>('dashboard');
    
    const [jobs, setJobs] = useState<SyncJob[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [serviceAccounts, setServiceAccounts] = useState<ServiceAccount[]>([]);
    const [managedSheets, setManagedSheets] = useState<ManagedSheet[]>([]);
    const [managedFtpSources, setManagedFtpSources] = useState<FtpSource[]>([]);
    const [gcpProjectConnections, setGcpProjectConnections] = useState<GcpProjectConnection[]>([]);
    const [dailyMetrics, setDailyMetrics] = useState<DailySyncMetric[]>([]);
    const [smtpConfig, setSmtpConfig] = useState<SmtpConfig | null>(null);
    const [authConfig, setAuthConfig] = useState<AuthConfig | null>(null);
    const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
    
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [
                fetchedUser, fetchedJobs, fetchedUsers, fetchedAccounts, 
                fetchedSheets, fetchedDestinations, fetchedFtpSources, 
                fetchedMetrics, fetchedSmtpConfig, fetchedAuthConfig, fetchedUserGroups
            ] = await Promise.all([
                getCurrentUser(),
                getSyncJobs(),
                getUsers(),
                getServiceAccounts(),
                getManagedSheets(),
                getGcpProjectConnections(),
                getFtpSources(),
                getDailySyncMetrics(),
                getSmtpConfig(),
                getAuthConfig(),
                getUserGroups(),
            ]);

            setCurrentUser(fetchedUser);
            setJobs(fetchedJobs);
            setUsers(fetchedUsers);
            setServiceAccounts(fetchedAccounts);
            setManagedSheets(fetchedSheets);
            setGcpProjectConnections(fetchedDestinations);
            setManagedFtpSources(fetchedFtpSources);
            setDailyMetrics(fetchedMetrics);
            setSmtpConfig(fetchedSmtpConfig);
            setAuthConfig(fetchedAuthConfig);
            setUserGroups(fetchedUserGroups);

        } catch (error) {
            console.error("Failed to fetch initial data:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            fetchData();
        } else {
            // When not authenticated, ensure loading is false.
            setIsLoading(false);
        }
    }, [isAuthenticated, fetchData]);
    
    const handleLogin = () => {
        setIsAuthenticated(true);
        setCurrentPage('dashboard');
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setCurrentUser(null);
        // Clear all state on logout
        setJobs([]);
        setUsers([]);
        setServiceAccounts([]);
        setManagedSheets([]);
        setGcpProjectConnections([]);
        setManagedFtpSources([]);
        setDailyMetrics([]);
        setSmtpConfig(null);
        setAuthConfig(null);
        setUserGroups([]);
    };

    const handleExportSiteConfig = async () => {
        try {
            const config = await getSiteConfig();
            const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(config, null, 2))}`;
            const link = document.createElement("a");
            link.href = jsonString;
            link.download = `sheetsync-config-backup-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
        } catch (error) {
            console.error("Failed to export site config", error);
            alert("Could not export site configuration.");
        }
    };

    const handleImportSiteConfig = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        const config = JSON.parse(event.target?.result as string) as SiteConfig;
                        if (window.confirm('Are you sure you want to import this configuration? This will overwrite all existing jobs, sources, and settings.')) {
                            await importSiteConfig(config);
                            await fetchData(); // Refresh all data
                            alert('Site configuration imported successfully.');
                        }
                    } catch (err) {
                        alert('Failed to parse or import the configuration file. Please ensure it is a valid backup.');
                        console.error(err);
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    };


    if (isLoading && !isAuthenticated) {
        return <div />; // Render nothing or a minimal loader if needed before login state is confirmed
    }

    if (!isAuthenticated) {
        return <LoginPage onLogin={handleLogin} />;
    }

    return (
        <PermissionsProvider currentUser={currentUser} userGroups={userGroups}>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
                <Header 
                    onLogout={handleLogout}
                    onNavigate={setCurrentPage}
                    currentPage={currentPage}
                    onExportSiteConfig={handleExportSiteConfig}
                    onImportSiteConfig={handleImportSiteConfig}
                />
                <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <LoadingSpinner />
                        </div>
                    ) : (
                        <>
                            {currentPage === 'dashboard' && (
                                <DashboardPage 
                                    jobs={jobs}
                                    serviceAccounts={serviceAccounts}
                                    managedSheets={managedSheets}
                                    managedFtpSources={managedFtpSources}
                                    gcpProjectConnections={gcpProjectConnections}
                                    dailyMetrics={dailyMetrics}
                                    refreshData={fetchData}
                                />
                            )}
                            {currentPage === 'management' && smtpConfig && authConfig && (
                                 <ManagementPage 
                                    users={users}
                                    serviceAccounts={serviceAccounts}
                                    managedSheets={managedSheets}
                                    managedFtpSources={managedFtpSources}
                                    gcpProjectConnections={gcpProjectConnections}
                                    smtpConfig={smtpConfig}
                                    authConfig={authConfig}
                                    userGroups={userGroups}
                                    refreshData={fetchData}
                                />
                            )}
                        </>
                    )}
                </main>
            </div>
        </PermissionsProvider>
    );
};

export default App;
