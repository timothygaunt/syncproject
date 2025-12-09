export enum SyncStatus {
    ACTIVE = 'Active',
    PAUSED = 'Paused',
    ERROR = 'Error',
    COMPLETED = 'Completed',
}

// DEPRECATED AND REMOVED - Replaced by UserGroup with permissions
// export enum Role { ... }

export enum SyncStrategy {
    REPLACE = 'Replace (Overwrite)',
    APPEND = 'Append',
}

export enum SchemaStatus {
    UNCHECKED = 'Unchecked',
    SYNCED = 'Synced',
    CHANGED = 'Changed',
}

export enum SourceType {
    GOOGLE_SHEET = 'Google Sheet',
    FTP = 'FTP/SFTP',
}

// --- NEW AUTHENTICATION & PERMISSION MODEL ---

export type Permission =
  | 'VIEW_DASHBOARD'
  | 'CREATE_JOB'
  | 'EDIT_JOB'
  | 'DELETE_JOB'
  | 'ARCHIVE_JOB'
  | 'VIEW_JOB_LOGS'
  | 'MANAGE_SCHEMA'
  | 'VIEW_MANAGEMENT'
  | 'MANAGE_USERS'
  | 'MANAGE_GROUPS'
  | 'MANAGE_SERVICE_ACCOUNTS'
  | 'MANAGE_SOURCES'
  | 'MANAGE_DESTINATIONS'
  | 'MANAGE_SETTINGS'
  | 'MANAGE_AUTHENTICATION';

export interface UserGroup {
    id: string;
    name: string;
    description: string;
    permissions: Permission[];
}

export interface User {
    id: string;
    name: string;
    email: string;
    groupIds: string[];
}

export type AuthMethod = 'OAuth' | 'ActiveDirectory';

export interface AuthConfig {
    method: AuthMethod;
    adConfig?: {
        ldapUrl: string;
        baseDN: string;
        username: string;
        password?: string; // Should be handled securely
    };
}


// --- EXISTING MODELS ---

export interface ServiceAccount {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
}

export interface ManagedSheet {
    id: string;
    name: string;
    url: string;
    addedAt: Date;
}

export interface FtpSource {
    id: string;
    name: string;
    host: string;
    port: number;
    user: string;
    pass: string; // Stored securely in a real backend
    addedAt: Date;
}

export interface DiscoverableSheet {
    id: string;
    name: string;
    url: string;
}

export interface GcpProjectConnection {
    id: string;
    name: string;
    projectId: string;
    stagingGcsBucket: string;
    serviceAccountKeyJson: string; 
    gcsHmacKey?: string;
    gcsHmacSecret?: string;
    addedAt: Date;
}

export interface SchemaMapping {
    originalName: string;
    bigQueryName: string;
}

export interface GoogleSheetSourceConfig {
    managedSheetId: string;
    sources: {
        sheetName: string;
        range: string;
    }[];
}

export interface FtpSourceConfig {
    ftpSourceId: string;
    filePath: string;
    fileFormat: 'CSV' | 'XLSX' | 'XLS';
}

export type SourceConfiguration = GoogleSheetSourceConfig | FtpSourceConfig;

export interface LogEntry {
    timestamp: string;
    message: string;
    level: 'INFO' | 'ERROR' | 'SUCCESS';
}

export interface JobRunLog {
    runId: string;
    jobId: string;
    startTime: string;
    endTime: string;
    status: 'SUCCESS' | 'FAILURE';
    summary: string;
    details: LogEntry[];
    rowsSynced?: number;
    durationInSeconds?: number;
}

export interface DailySyncMetric {
    date: string; // YYYY-MM-DD
    totalRowsSynced: number;
}

export interface NotificationSettings {
    enabled: boolean;
    recipients: string; // Comma-separated emails
    subject: string;
}

export interface SyncJob {
    id: string;
    name: string;
    
    sourceType: SourceType;
    sourceConfiguration: SourceConfiguration;
    schemaMapping: SchemaMapping[];

    destinationId: string;
    datasetId: string;
    datasetLocation?: string;
    finalTableName: string;

    cronSchedule: string;
    status: SyncStatus;
    lastRun: Date | null;
    lastRunStatus?: 'SUCCESS' | 'FAILURE';
    lastRunRowsSynced?: number;
    lastRunDurationInSeconds?: number;
    createdAt: Date;
    serviceAccountId: string;
    syncStrategy: SyncStrategy;
    notificationSettings: NotificationSettings;
    schemaStatus?: SchemaStatus;
    logs?: JobRunLog[];
    isArchived: boolean;
    activeFrom?: string; // YYYY-MM-DD
    activeUntil?: string; // YYYY-MM-DD
}

export type SyncJobPayload = Partial<Omit<SyncJob, 'id' | 'status' | 'lastRun' | 'lastRunStatus' | 'createdAt' | 'schemaStatus' | 'logs' | 'lastRunRowsSynced' | 'lastRunDurationInSeconds'>> & {
    name: string;
};

export interface SmtpConfig {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    fromName: string;
    fromEmail: string;
}

export interface SiteConfig {
    users: User[];
    userGroups: UserGroup[];
    serviceAccounts: ServiceAccount[];
    managedSheets: ManagedSheet[];
    managedFtpSources: FtpSource[];
    gcpProjectConnections: GcpProjectConnection[];
    syncJobs: SyncJob[];
    smtpConfig?: SmtpConfig;
    authConfig?: AuthConfig;
}
