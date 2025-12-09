// CONCEPTUAL BACKEND FILE: services/dataMover.ts
// This file represents the code that would run in a Google Cloud Function or as a standalone Node.js process.
// It is NOT part of the React frontend bundle.
// It is executed by the scheduler.ts script.

// FIX: Declare Node.js globals to resolve TypeScript errors in non-Node environments.
declare const process: any;
declare const require: any;
declare const module: any;

import { BigQuery, Table, Job } from '@google-cloud/bigquery';
import { Storage } from '@google-cloud/storage';
import { google } from 'googleapis';
import { Buffer } from 'buffer';
import { SyncStrategy, type SyncJob, type GcpProjectConnection, SourceType, GoogleSheetSourceConfig, FtpSourceConfig, FtpSource } from '../types'; // Assuming types are shared
import { Client } from 'basic-ftp';
import { parse } from 'csv-parse/sync';
import * as xlsx from 'xlsx';
import { Writable } from 'stream';


/**
 * Main execution function for the data mover script.
 * It is invoked with a job ID as a command-line argument.
 */
async function main() {
    const jobId = process.argv[2]; // Get jobId from command line: `node dataMover.js <jobId>`
    if (!jobId) {
        console.error('[FATAL] No Job ID provided. Exiting.');
        process.exit(1);
    }
    console.log(`[INFO] Starting sync for job ID: ${jobId}`);

    let tempGcsFile: any = null;
    let tempBqTable: Table | null = null;
    
    try {
        // In a real app, this would fetch from the SQL Server database.
        // For this conceptual file, we'll assume a function `getJobAndDestinationConfig` exists in a shared DB layer.
        const { job, projectConnection } = await getJobAndDestinationConfig(jobId);
        console.log(`[INFO] Fetched configuration for job: ${job.name}`);

        // --- CRITICAL: AUTHENTICATION FROM DESTINATION CONFIG ---
        const credentials = JSON.parse(projectConnection.serviceAccountKeyJson);
        const authOptions = {
            credentials,
            projectId: projectConnection.projectId,
            scopes: [
                'https://www.googleapis.com/auth/spreadsheets.readonly',
                'https://www.googleapis.com/auth/cloud-platform',
            ],
        };
        
        const bigquery = new BigQuery(authOptions);
        const storage = new Storage(authOptions);
        // --- END AUTHENTICATION ---
        
        let allData: any[] = [];
        if (job.sourceType === SourceType.GOOGLE_SHEET) {
            allData = await fetchAllGoogleSheetData(job, authOptions.credentials);
        } else if (job.sourceType === SourceType.FTP) {
            allData = await fetchAllFtpData(job);
        } else {
            throw new Error(`Unsupported source type: ${job.sourceType}`);
        }
        
        if (allData.length === 0) {
            console.log(`[SUCCESS] No data found in sources. Sync for job ${job.name} completed without loading.`);
            process.exit(0);
        }

        const bucket = storage.bucket(projectConnection.stagingGcsBucket.replace('gs://', ''));
        const timestamp = new Date().getTime();
        const gcsFileName = `staging/${job.id}/${timestamp}.json`;
        tempGcsFile = bucket.file(gcsFileName);
        
        await uploadToGcs(tempGcsFile, allData);

        await ensureDatasetExists(bigquery, job.datasetId, job.datasetLocation);

        const stagingTableName = `staging_${job.id}_${timestamp}`;
        tempBqTable = bigquery.dataset(job.datasetId).table(stagingTableName);
        
        await loadGcsToBqStaging(tempBqTable, tempGcsFile);

        const finalTable = bigquery.dataset(job.datasetId).table(job.finalTableName);
        await mergeStagingToFinal(bigquery, tempBqTable, finalTable, job.syncStrategy);

        console.log(`[SUCCESS] Successfully completed sync for job: ${job.name}`);
        // In a real app, update the job's last_run status in the database here.
        process.exit(0);

    } catch (error) {
        console.error(`[ERROR] Sync failed for job ID: ${jobId}`, error);
        // In a real app, update the job's last_run status to 'FAILURE' in the database here.
        process.exit(1);
    } finally {
        await cleanup(tempGcsFile, tempBqTable);
    }
}

// --- Helper Functions ---

async function getJobAndDestinationConfig(jobId: string): Promise<{ job: SyncJob; projectConnection: GcpProjectConnection }> {
    console.log(`[INFO] Getting job and destination config for ${jobId}`);
    // In a real app, this would fetch from the SQL Server database via an API call or direct connection.
    // This requires a separate database connection logic file.
    const mockJob: SyncJob = {} as any; 
    const mockProjectConnection: GcpProjectConnection = {} as any;
    if (!mockJob || !mockProjectConnection) throw new Error(`Config not found for job ID ${jobId}.`);
    return { job: mockJob, projectConnection: mockProjectConnection };
}

async function fetchAllGoogleSheetData(job: SyncJob, credentials: any): Promise<any[]> {
    const auth = new google.auth.JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    const sheetsApi = google.sheets({ version: 'v4', auth });
    
    let combinedData: any[] = [];
    const config = job.sourceConfiguration as GoogleSheetSourceConfig;
    // In a real app, you would fetch the sheet URL from the database.
    const sheetUrl = (await getManagedSheet(config.managedSheetId)).url;
    const spreadsheetId = sheetUrl.split('/d/')[1].split('/')[0];
    
    for (const source of config.sources) {
        console.log(`[INFO] Fetching data from sheet: ${spreadsheetId}, range: ${source.sheetName}!${source.range}`);
        // Implementation for fetching sheet data...
    }
    return combinedData;
}

async function fetchAllFtpData(job: SyncJob): Promise<any[]> {
    const config = job.sourceConfiguration as FtpSourceConfig;
    // In a real app, you would fetch the FTP source details from the database.
    const ftpSource = await getFtpSource(config.ftpSourceId);

    console.log(`[INFO] Connecting to FTP host: ${ftpSource.host}`);
    const client = new Client();
    await client.access({
        host: ftpSource.host,
        user: ftpSource.user,
        password: ftpSource.pass,
        port: ftpSource.port,
        secure: true // Assume SFTP, adjust as needed
    });

    console.log(`[INFO] Downloading file from path: ${config.filePath}`);
    const chunks: Buffer[] = [];
    const writableStream = new Writable({
      write(chunk, encoding, callback) {
        chunks.push(chunk);
        callback();
      },
    });

    await client.downloadTo(writableStream, config.filePath);
    client.close();
    const fileBuffer = Buffer.concat(chunks);
    console.log(`[SUCCESS] Downloaded file. Size: ${fileBuffer.byteLength} bytes.`);

    console.log(`[INFO] Parsing file format: ${config.fileFormat}`);
    let data: any[];
    if (config.fileFormat === 'CSV') {
        const records = parse(fileBuffer, { columns: true, skip_empty_lines: true });
        data = records;
    } else if (config.fileFormat === 'XLSX' || config.fileFormat === 'XLS') {
        const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        data = xlsx.utils.sheet_to_json(worksheet);
    } else {
        throw new Error(`Unsupported file format: ${config.fileFormat}`);
    }

    console.log(`[SUCCESS] Parsed ${data.length} rows from file.`);
    return data.map(row => {
        const obj: Record<string, any> = {};
        job.schemaMapping.forEach(mapping => {
            obj[mapping.bigQueryName] = row[mapping.originalName] || null;
        });
        return obj;
    });
}

async function uploadToGcs(gcsFile: any, data: any[]): Promise<void> {
    console.log(`[INFO] Uploading ${data.length} rows to GCS at ${gcsFile.name}`);
    const dataBuffer = Buffer.from(data.map(row => JSON.stringify(row)).join('\n'));
    await gcsFile.save(dataBuffer);
    console.log(`[SUCCESS] Uploaded to GCS.`);
}

async function ensureDatasetExists(bigquery: BigQuery, datasetId: string, location?: string): Promise<void> {
    const dataset = bigquery.dataset(datasetId);
    const [exists] = await dataset.exists();
    if (!exists) {
        console.log(`[INFO] Dataset '${datasetId}' not found. Creating in location '${location || 'default'}'.`);
        const options = location ? { location } : {};
        await dataset.create(options);
        console.log(`[SUCCESS] Dataset '${datasetId}' created.`);
    }
}

async function loadGcsToBqStaging(stagingTable: Table, gcsFile: any): Promise<void> {
    console.log(`[INFO] Loading from GCS file ${gcsFile.name} to staging table ${stagingTable.id}`);
    const metadata = {
        sourceFormat: 'NEWLINE_DELIMITED_JSON',
        autodetect: true,
    };
    const [job] = await stagingTable.load(gcsFile, metadata);
    await waitForJob(job);
    console.log(`[SUCCESS] Loaded data into staging table ${stagingTable.id}`);
}

async function mergeStagingToFinal(bigquery: BigQuery, stagingTable: Table, finalTable: Table, strategy: SyncStrategy): Promise<void> {
    console.log(`[INFO] Merging data from ${stagingTable.id} to ${finalTable.id} with strategy: ${strategy}`);
    const query = strategy === SyncStrategy.REPLACE
        ? `CREATE OR REPLACE TABLE \`${finalTable.dataset.id}.${finalTable.id}\` AS SELECT * FROM \`${stagingTable.dataset.id}.${stagingTable.id}\``
        : `INSERT INTO \`${finalTable.dataset.id}.${finalTable.id}\` SELECT * FROM \`${stagingTable.dataset.id}.${stagingTable.id}\``;

    const [job] = await bigquery.createQueryJob({ query });
    await waitForJob(job);
    console.log(`[SUCCESS] Merged data into final table ${finalTable.id}`);
}

async function cleanup(gcsFile: any | null, bqTable: Table | null): Promise<void> {
    console.log('[INFO] Starting cleanup...');
    if (gcsFile) {
        try {
            await gcsFile.delete();
            console.log(`[INFO] Deleted temporary GCS file: ${gcsFile.name}`);
        } catch (e) { console.error(`[WARN] Failed to delete GCS file ${gcsFile.name}`, e); }
    }
    if (bqTable) {
        try {
            await bqTable.delete();
            console.log(`[INFO] Deleted temporary BQ table: ${bqTable.id}`);
        } catch (e) { console.error(`[WARN] Failed to delete BQ table ${bqTable.id}`, e); }
    }
    console.log('[INFO] Cleanup complete.');
}

async function waitForJob(job: Job): Promise<void> {
    console.log(`[INFO] Waiting for BQ job ${job.id} to complete...`);
    const [apiResponse] = await job.get();
    if (apiResponse.status.errorResult) {
        throw new Error(`BigQuery job failed: ${JSON.stringify(apiResponse.status.errors)}`);
    }
}

// Mocked helper functions to get source details
async function getManagedSheet(id: string): Promise<{url: string}> { return {url: 'https://docs.google.com/spreadsheets/d/abc123xyz'}; }
async function getFtpSource(id: string): Promise<FtpSource> { return {id: 'ftp_1', name: 'Main Sales FTP', host: 'ftp.example.com', port: 22, user: 'salesuser', pass: 'securepass', addedAt: new Date()}; }

// Run the main function if the script is executed directly
if (require.main === module) {
    main();
}