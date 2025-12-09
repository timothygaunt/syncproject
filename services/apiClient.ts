// This file represents the client-side API layer.
// In a real application, it would make network requests to a backend server (like the one in server.ts).
// For this conceptual implementation, it will simulate API calls with delays and return mock data.

import type { 
    SyncJob, SyncJobPayload, User, ServiceAccount, SchemaMapping, ManagedSheet, 
    DiscoverableSheet, JobRunLog, GcpProjectConnection, FtpSource, SourceType, 
    SourceConfiguration, DailySyncMetric, SiteConfig, SmtpConfig, AuthConfig, UserGroup, Permission
} from '../types';
import { SyncStatus, SyncStrategy, SchemaStatus, SourceType as SourceTypeEnum } from '../types';

// --- MOCK DATABASE ---

let authConfig: AuthConfig = {
    method: 'OAuth',
    adConfig: {
        ldapUrl: 'ldap://your-dc.example.com',
        baseDN: 'DC=example,DC=com',
        username: 'binduser',
        password: ''
    }
};

const permissions: Record<string, Permission> = {
    VIEW_DASHBOARD: 'VIEW_DASHBOARD',
    CREATE_JOB: 'CREATE_JOB',
    EDIT_JOB: 'EDIT_JOB',
    DELETE_JOB: 'DELETE_JOB',
    ARCHIVE_JOB: 'ARCHIVE_JOB',
    VIEW_JOB_LOGS: 'VIEW_JOB_LOGS',
    MANAGE_SCHEMA: 'MANAGE_SCHEMA',
    VIEW_MANAGEMENT: 'VIEW_MANAGEMENT',
    MANAGE_USERS: 'MANAGE_USERS',
    MANAGE_GROUPS: 'MANAGE_GROUPS',
    MANAGE_SERVICE_ACCOUNTS: 'MANAGE_SERVICE_ACCOUNTS',
    MANAGE_SOURCES: 'MANAGE_SOURCES',
    MANAGE_DESTINATIONS: 'MANAGE_DESTINATIONS',
    MANAGE_SETTINGS: 'MANAGE_SETTINGS',
    MANAGE_AUTHENTICATION: 'MANAGE_AUTHENTICATION',
};

const allPermissions = Object.values(permissions);

let userGroups: UserGroup[] = [
    {
        id: 'group_admin', name: 'Admins', description: 'Has all permissions across the application.',
        permissions: allPermissions,
    },
    {
        id: 'group_config', name: 'Job Configurators', description: 'Can create, edit, and manage all aspects of sync jobs.',
        permissions: ['VIEW_DASHBOARD', 'CREATE_JOB', 'EDIT_JOB', 'DELETE_JOB', 'ARCHIVE_JOB', 'VIEW_JOB_LOGS', 'MANAGE_SCHEMA']
    },
    {
        id: 'group_user', name: 'Job Users', description: 'Can view jobs and logs, but cannot make changes.',
        permissions: ['VIEW_DASHBOARD', 'VIEW_JOB_LOGS']
    },
    {
        id: 'group_readonly', name: 'Read Only', description: 'Can only view the dashboard.',
        permissions: ['VIEW_DASHBOARD']
    }
];

let users: User[] = [
    { id: 'user_1', name: 'Alice (Admin)', email: 'alice@example.com', groupIds: ['group_admin'] },
    { id: 'user_2', name: 'Bob (Configurator)', email: 'bob@example.com', groupIds: ['group_config'] },
    { id: 'user_3', name: 'Charlie (User)', email: 'charlie@example.com', groupIds: ['group_user'] },
    { id: 'user_4', name: 'Diane (Read Only)', email: 'diane@example.com', groupIds: ['group_readonly'] },
];

let currentUser: User = users[0];

let smtpConfig: SmtpConfig = { host: 'smtp.example.com', port: 587, secure: false, user: 'notifications@example.com', pass: 'your-smtp-password', fromName: 'SheetSync Notifier', fromEmail: 'noreply@example.com' };
let serviceAccounts: ServiceAccount[] = [ { id: 'sa_1', name: 'Primary Analytics SA', email: 'analytics@my-gcp-project.iam.gserviceaccount.com', createdAt: new Date() }, { id: 'sa_2', name: 'Marketing Data SA', email: 'marketing-loader@my-gcp-project.iam.gserviceaccount.com', createdAt: new Date() }, ];
let managedSheets: ManagedSheet[] = [ { id: 'sheet_1', name: 'Q4 Company Sales Data', url: 'https://docs.google.com/spreadsheets/d/abc123xyz', addedAt: new Date() }, { id: 'sheet_2', name: 'Weekly User Feedback Report', url: 'https://docs.google.com/spreadsheets/d/def456uvw', addedAt: new Date() }, ];
let managedFtpSources: FtpSource[] = [ { id: 'ftp_1', name: 'Main Sales FTP', host: 'ftp.example.com', port: 22, user: 'salesuser', pass: 'securepass', addedAt: new Date() } ];
const mockServiceAccountKey = `{"type": "service_account", ...}`;
let gcpProjectConnections: GcpProjectConnection[] = [ { id: 'proj_1', name: 'Primary DWH Project', projectId: 'my-gcp-project', stagingGcsBucket: 'gs://my-sheetsync-staging-bucket', serviceAccountKeyJson: mockServiceAccountKey, addedAt: new Date() }, { id: 'proj_2', name: 'Marketing Analytics Project', projectId: 'marketing-analytics-proj', stagingGcsBucket: 'gs://my-sheetsync-staging-bucket', serviceAccountKeyJson: mockServiceAccountKey, gcsHmacKey: 'GOOG_MOCK_HMAC_KEY', gcsHmacSecret: 'mock_secret_value', addedAt: new Date() }, ];
const discoverableSheets: DiscoverableSheet[] = [ { id: 'abc123xyz', name: 'Q4 Company Sales Data', url: 'https://docs.google.com/spreadsheets/d/abc123xyz' }, { id: 'def456uvw', name: 'Weekly User Feedback Report', url: 'https://docs.google.com/spreadsheets/d/def456uvw' }, { id: 'ghi789rst', name: 'Hourly Marketing Campaign Spend', url: 'https://docs.google.com/spreadsheets/d/ghi789rst' }, { id: 'jkl012mno', name: 'Project Phoenix - Sprint Planning', url: 'https://docs.google.com/spreadsheets/d/jkl012mno' }, ];
let syncJobs: SyncJob[] = [ /* ... existing job data ... */ ];
const mockLogs: Record<string, JobRunLog[]> = { /* ... existing log data ... */ };


const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- API Function Implementations ---

// AUTH & GROUPS
export async function getAuthConfig(): Promise<AuthConfig> { await simulateDelay(150); return authConfig; }
export async function updateAuthConfig(config: AuthConfig): Promise<AuthConfig> { await simulateDelay(400); authConfig = { ...config }; console.log("[MOCK API] Auth config updated."); return authConfig; }
export async function getUserGroups(): Promise<UserGroup[]> { await simulateDelay(200); return [...userGroups]; }
export async function createUserGroup(group: Omit<UserGroup, 'id'>): Promise<UserGroup> { await simulateDelay(300); const newGroup: UserGroup = { ...group, id: `group_${Date.now()}` }; userGroups.push(newGroup); return newGroup; }
export async function updateUserGroup(id: string, group: Omit<UserGroup, 'id'>): Promise<UserGroup> { await simulateDelay(300); const i = userGroups.findIndex(g => g.id === id); if (i === -1) throw new Error("Group not found"); userGroups[i] = { ...userGroups[i], ...group }; return userGroups[i]; }
export async function deleteUserGroup(id: string): Promise<void> { await simulateDelay(300); if (users.some(u => u.groupIds.includes(id))) throw new Error("Cannot delete a group that is in use by users."); userGroups = userGroups.filter(g => g.id !== id); }


// USERS & AUTH
export async function getCurrentUser(): Promise<User> { await simulateDelay(100); return currentUser; }
export async function getUsers(): Promise<User[]> { await simulateDelay(200); return [...users]; }
export async function inviteUser(email: string, groupIds: string[]): Promise<User> { await simulateDelay(300); if (users.some(u => u.email === email)) throw new Error("User already exists."); const newUser: User = { id: `user_${Date.now()}`, name: email.split('@')[0], email, groupIds, }; users.push(newUser); return newUser; }
export async function updateUserGroups(userId: string, groupIds: string[]): Promise<User> { await simulateDelay(300); const i = users.findIndex(u => u.id === userId); if (i === -1) throw new Error("User not found"); users[i].groupIds = groupIds; return users[i]; }
export async function deleteUser(userId: string): Promise<void> { await simulateDelay(300); users = users.filter(u => u.id !== userId); }

// SETTINGS
export async function getSmtpConfig(): Promise<SmtpConfig> { await simulateDelay(150); return smtpConfig; }
export async function updateSmtpConfig(config: SmtpConfig): Promise<SmtpConfig> { await simulateDelay(400); smtpConfig = { ...config }; console.log("[MOCK API] SMTP settings updated."); return smtpConfig; }

// ... other existing functions (getSyncJobs, createSyncJob, etc.) remain largely the same ...
export async function getSyncJobs(): Promise<SyncJob[]> { await simulateDelay(500); return syncJobs.filter(j => j != null); }
export async function createSyncJob(payload: SyncJobPayload): Promise<SyncJob> { await simulateDelay(300); const newJob: any = { ...payload, id: `job_${Date.now()}`, status: SyncStatus.ACTIVE, lastRun: null, createdAt: new Date(), schemaStatus: SchemaStatus.UNCHECKED, isArchived: false, name: payload.name }; syncJobs.push(newJob); return newJob; }
export async function updateSyncJob(id: string, payload: Partial<SyncJobPayload>): Promise<SyncJob> { await simulateDelay(300); const i = syncJobs.findIndex(j => j.id === id); if (i === -1) throw new Error('Job not found'); syncJobs[i] = { ...syncJobs[i], ...payload }; return syncJobs[i]; }
export async function deleteSyncJob(id: string): Promise<void> { await simulateDelay(300); syncJobs = syncJobs.filter(j => j.id !== id); }
export async function updateJobStatusBulk(jobIds: string[], status: SyncStatus): Promise<void> { await simulateDelay(400); syncJobs = syncJobs.map(j => (jobIds.includes(j.id) ? { ...j, status } : j)); }
export async function archiveJob(id: string): Promise<void> { await simulateDelay(200); const i = syncJobs.findIndex(j => j.id === id); if (i !== -1) { syncJobs[i].isArchived = true; syncJobs[i].status = SyncStatus.PAUSED } }
export async function unarchiveJob(id: string): Promise<void> { await simulateDelay(200); const i = syncJobs.findIndex(j => j.id === id); if (i !== -1) { syncJobs[i].isArchived = false; syncJobs[i].status = SyncStatus.ACTIVE } }

export async function getDailySyncMetrics(): Promise<DailySyncMetric[]> { await simulateDelay(350); const metrics: DailySyncMetric[] = []; for (let i = 6; i >= 0; i--) { const date = new Date(); date.setDate(date.getDate() - i); const dateString = date.toISOString().split('T')[0]; const dayOfWeek = date.getDay(); const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; const randomFactor = isWeekend ? 0.4 : 0.8 + Math.random() * 0.4; const totalRowsSynced = Math.floor((20000 + Math.random() * 10000) * randomFactor); metrics.push({ date: dateString, totalRowsSynced }); } return metrics; }
export async function getJobRunLogs(jobId: string): Promise<JobRunLog[]> { await simulateDelay(400); return mockLogs[jobId] || []; }
export async function fetchSourceSchema(sourceType: SourceType, config: SourceConfiguration): Promise<string[]> { await simulateDelay(700); if (sourceType === 'Google Sheet') { return ['Column A', 'Column B']; } return ['ftp_col_1', 'ftp_col_2']; }
export async function getServiceAccounts(): Promise<ServiceAccount[]> { await simulateDelay(200); return [...serviceAccounts]; }
export async function addServiceAccount(name: string, email: string): Promise<ServiceAccount> { await simulateDelay(300); if (serviceAccounts.some(sa => sa.email === email)) throw new Error("Service account already exists."); const newAccount: ServiceAccount = { id: `sa_${Date.now()}`, name, email, createdAt: new Date(), }; serviceAccounts.push(newAccount); return newAccount; }
export async function deleteServiceAccount(id: string): Promise<void> { await simulateDelay(300); if (syncJobs.some(j => j.serviceAccountId === id)) throw new Error("Cannot delete service account in use."); serviceAccounts = serviceAccounts.filter(sa => sa.id !== id); }
export async function getManagedSheets(): Promise<ManagedSheet[]> { await simulateDelay(200); return [...managedSheets]; }
export async function discoverGoogleSheets(): Promise<DiscoverableSheet[]> { await simulateDelay(600); return [...discoverableSheets]; }
export async function addManagedSheet(name: string, url: string): Promise<ManagedSheet> { await simulateDelay(300); const existing = managedSheets.find(s => s.url === url); if (existing) return existing; const newSheet: ManagedSheet = { id: `sheet_${Date.now()}`, name, url, addedAt: new Date(), }; managedSheets.push(newSheet); return newSheet; }
export async function updateManagedSheet(id: string, payload: { name: string; url: string }): Promise<ManagedSheet> { await simulateDelay(300); const i = managedSheets.findIndex(s => s.id === id); if (i === -1) throw new Error("Sheet not found."); managedSheets[i] = { ...managedSheets[i], ...payload }; return managedSheets[i]; }
export async function deleteManagedSheet(id: string): Promise<void> { await simulateDelay(300); const isUsed = syncJobs.some(j => j.sourceType === 'Google Sheet' && (j.sourceConfiguration as import('./types').GoogleSheetSourceConfig).managedSheetId === id); if (isUsed) throw new Error("Cannot delete sheet in use."); managedSheets = managedSheets.filter(s => s.id !== id); }
export async function getFtpSources(): Promise<FtpSource[]> { await simulateDelay(200); return [...managedFtpSources]; }
export async function addFtpSource(payload: Omit<FtpSource, 'id' | 'addedAt'>): Promise<FtpSource> { await simulateDelay(300); const newSource: FtpSource = { ...payload, id: `ftp_${Date.now()}`, addedAt: new Date() }; managedFtpSources.push(newSource); return newSource; }
export async function updateFtpSource(id: string, payload: Omit<FtpSource, 'id' | 'addedAt'>): Promise<FtpSource> { await simulateDelay(300); const i = managedFtpSources.findIndex(s => s.id === id); if (i === -1) throw new Error("FTP source not found."); managedFtpSources[i] = { ...managedFtpSources[i], ...payload }; return managedFtpSources[i]; }
export async function deleteFtpSource(id: string): Promise<void> { await simulateDelay(300); const isUsed = syncJobs.some(j => j.sourceType === 'FTP/SFTP' && (j.sourceConfiguration as import('./types').FtpSourceConfig).ftpSourceId === id); if (isUsed) throw new Error("Cannot delete FTP source in use."); managedFtpSources = managedFtpSources.filter(s => s.id !== id); }
export async function getGcpProjectConnections(): Promise<GcpProjectConnection[]> { await simulateDelay(200); return [...gcpProjectConnections]; }
export async function addGcpProjectConnection(payload: Omit<GcpProjectConnection, 'id' | 'addedAt'>): Promise<GcpProjectConnection> { await simulateDelay(300); const newDest: GcpProjectConnection = { ...payload, id: `proj_${Date.now()}`, addedAt: new Date() }; gcpProjectConnections.push(newDest); return newDest; }
export async function updateGcpProjectConnection(id: string, payload: Omit<GcpProjectConnection, 'id' | 'addedAt'>): Promise<GcpProjectConnection> { await simulateDelay(300); const i = gcpProjectConnections.findIndex(d => d.id === id); if (i === -1) throw new Error("Project connection not found."); gcpProjectConnections[i] = { ...gcpProjectConnections[i], ...payload }; return gcpProjectConnections[i]; }
export async function deleteGcpProjectConnection(id: string): Promise<void> { await simulateDelay(300); if (syncJobs.some(j => j.destinationId === id)) throw new Error("Cannot delete a project connection that is in use by a sync job."); gcpProjectConnections = gcpProjectConnections.filter(d => d.id !== id); }
export async function checkDatasetExists(projectId: string, datasetId: string): Promise<{ exists: boolean }> { await simulateDelay(600); return { exists: true }; }
export async function createDataset(projectId: string, datasetId: string, location: string): Promise<{ success: boolean }> { await simulateDelay(1000); return { success: true }; }
export async function getSiteConfig(): Promise<SiteConfig> { await simulateDelay(600); return { users, userGroups, serviceAccounts, managedSheets, managedFtpSources, gcpProjectConnections, syncJobs, smtpConfig, authConfig, }; }
export async function importSiteConfig(config: SiteConfig): Promise<void> { await simulateDelay(500); users = config.users || []; userGroups = config.userGroups || []; serviceAccounts = config.serviceAccounts || []; managedSheets = config.managedSheets || []; managedFtpSources = config.managedFtpSources || []; gcpProjectConnections = config.gcpProjectConnections || []; syncJobs = config.syncJobs || []; smtpConfig = config.smtpConfig || smtpConfig; authConfig = config.authConfig || authConfig; }