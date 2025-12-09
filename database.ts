// CONCEPTUAL BACKEND FILE: database.ts
// This file represents the data access layer that connects to and queries a Microsoft SQL Server database.
// It is NOT part of the React frontend bundle.
// It would be used by the Express server (server.ts).
// To run this, you would need: npm install mssql

import sql from 'mssql';
import type { SyncJob, JobRunLog } from './types'; // Assuming types are shared

// --- DATABASE CONNECTION ---

const connectionString = process.env.DATABASE_URL || 'mssql://your_user:your_password@localhost/SheetSyncDB';
const pool = new sql.ConnectionPool(connectionString);
const poolConnect = pool.connect();

pool.on('error', err => {
    console.error('SQL Server Pool Error:', err);
});

// Example schema for tables in SQL Server (T-SQL):
/*
-- NEW TABLES FOR GROUP-BASED ACCESS CONTROL & AUTH CONFIG
CREATE TABLE app_settings (
    setting_key NVARCHAR(100) PRIMARY KEY,
    setting_value NVARCHAR(MAX) NOT NULL
);
-- Example: INSERT INTO app_settings (setting_key, setting_value) VALUES ('smtp_config', '{...json...}');
-- Example: INSERT INTO app_settings (setting_key, setting_value) VALUES ('auth_config', '{...json...}');

CREATE TABLE user_groups (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL UNIQUE,
    description NVARCHAR(1000),
    permissions NVARCHAR(MAX) NOT NULL -- Store as JSON array of strings
);
ALTER TABLE user_groups ADD CONSTRAINT chk_permissions_is_json CHECK (ISJSON(permissions) > 0);

CREATE TABLE users (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE user_group_assignments (
    user_id UNIQUEIDENTIFIER FOREIGN KEY REFERENCES users(id) ON DELETE CASCADE,
    group_id UNIQUEIDENTIFIER FOREIGN KEY REFERENCES user_groups(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, group_id)
);

-- UPDATED AND EXISTING TABLES
CREATE TABLE gcp_project_connections (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    project_id NVARCHAR(255) NOT NULL,
    staging_gcs_bucket NVARCHAR(255) NOT NULL,
    service_account_key_json_encrypted NVARCHAR(MAX) NOT NULL, -- Always encrypt secrets
    gcs_hmac_key_encrypted NVARCHAR(255) NULL,
    gcs_hmac_secret_encrypted NVARCHAR(MAX) NULL,
    added_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);

CREATE TABLE managed_ftp_sources ( ... ); -- Unchanged
CREATE TABLE managed_sheets ( ... ); -- Unchanged

CREATE TABLE sync_jobs (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    source_type NVARCHAR(50) NOT NULL,
    source_configuration NVARCHAR(MAX) NOT NULL,
    
    destination_id UNIQUEIDENTIFIER FOREIGN KEY REFERENCES gcp_project_connections(id),
    dataset_id NVARCHAR(255) NOT NULL,
    dataset_location NVARCHAR(100) NULL,
    final_table_name NVARCHAR(255) NOT NULL,

    config NVARCHAR(MAX) NOT NULL, -- Stores cron, service account, sync strategy, notifications etc.
    status NVARCHAR(50) NOT NULL,
    is_archived BIT NOT NULL DEFAULT 0,
    active_from DATE NULL,
    active_until DATE NULL,
    last_run_at DATETIMEOFFSET,
    last_run_status NVARCHAR(50),
    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
    CONSTRAINT chk_source_config_is_json CHECK (ISJSON(source_configuration) > 0),
    CONSTRAINT chk_config_is_json CHECK (ISJSON(config) > 0)
);

CREATE TABLE job_logs ( ... );
*/

// --- QUERY FUNCTIONS ---

export async function getJobs(): Promise<SyncJob[]> {
    await poolConnect;
    try {
        const request = pool.request();
        const result = await request.query`SELECT * FROM sync_jobs ORDER BY created_at DESC`;
        console.log("CONCEPTUAL: Fetched jobs from SQL Server.");
        return []; // Replace with actual data mapping
    } catch (err) {
        console.error('SQL error', err);
        throw err;
    }
}

export async function createJob(jobData: any): Promise<SyncJob> {
    await poolConnect;
    try {
        const { name, ...config } = jobData;
        const configJson = JSON.stringify(config);
        const request = pool.request();
        // ... build request with inputs ...
        const result = await request.query`INSERT INTO sync_jobs ...`;
        console.log("CONCEPTUAL: Created job in SQL Server.");
        return {} as SyncJob;
    } catch (err) {
        console.error('SQL error', err);
        throw err;
    }
}

export async function getJobLogs(jobId: string): Promise<JobRunLog[]> {
    await poolConnect;
    try {
        const request = pool.request();
        request.input('jobId', sql.UniqueIdentifier, jobId);
        const result = await request.query`SELECT run_details FROM job_logs WHERE job_id = @jobId ORDER BY created_at DESC`;
        console.log(`CONCEPTUAL: Fetched logs for job ${jobId} from SQL Server.`);
        return result.recordset.map(row => JSON.parse(row.run_details));
    } catch (err) {
        console.error('SQL error', err);
        throw err;
    }
}

export async function getUsers(): Promise<any[]> {
    console.log("CONCEPTUAL: Fetched users from SQL Server.");
    // Example: const result = await pool.request().query`SELECT u.*, STRING_AGG(uga.group_id, ',') as groupIds FROM users u LEFT JOIN user_group_assignments uga ON u.id = uga.user_id GROUP BY u.id, u.name, u.email`;
    return [];
}