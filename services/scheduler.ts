// CONCEPTUAL BACKEND FILE: services/scheduler.ts
// This file represents a master scheduler script.
// It is designed to be run by a single Windows Task every minute.
// It is NOT part of the React frontend bundle.

// To run this, you would need: npm install cron-parser

// FIX: Declare Node.js globals to resolve TypeScript errors in non-Node environments.
declare const process: any;
declare const require: any;

import { spawn } from 'child_process';
import { parseExpression } from 'cron-parser';
import * as db from '../database'; // Our conceptual database layer
import type { SyncJob } from '../types';

/**
 * The main function for the scheduler.
 * Fetches all active jobs and triggers the ones that are due.
 */
async function main() {
    console.log(`[Scheduler] Running at: ${new Date().toISOString()}`);

    let activeJobs: SyncJob[] = [];
    try {
        // In a real app, this would be a more targeted query
        const allJobs = await db.getJobs(); 
        activeJobs = allJobs.filter(job => job.status === 'Active' && !job.isArchived);
    } catch (error) {
        console.error('[Scheduler] FATAL: Could not fetch jobs from database.', error);
        return; // Exit if we can't get jobs
    }

    console.log(`[Scheduler] Found ${activeJobs.length} active jobs to check.`);

    const now = new Date();

    for (const job of activeJobs) {
        try {
            // Check if job is within its active date range
            if (job.activeFrom && new Date(job.activeFrom) > now) {
                continue; // Job hasn't started yet
            }
            if (job.activeUntil && new Date(job.activeUntil) < now) {
                continue; // Job has expired
            }

            const interval = parseExpression(job.cronSchedule);
            const nextRun = interval.next().toDate();
            
            // Check if the job should have run in the last minute.
            // This is a simple way to check if it's "due now".
            const timeSinceLastExpectedRun = now.getTime() - nextRun.getTime() + 60000; // Add a minute to look back

            if (timeSinceLastExpectedRun >= 0 && timeSinceLastExpectedRun < 60000) {
                console.log(`[Scheduler] Triggering job: ${job.name} (ID: ${job.id})`);
                triggerJob(job.id);
            }

        } catch (err) {
            console.error(`[Scheduler] ERROR: Could not parse cron schedule "${job.cronSchedule}" for job ${job.id}.`, err);
        }
    }

    console.log(`[Scheduler] Finished check.`);
}

/**
 * Spawns the dataMover script as a new, non-blocking process.
 * @param jobId The ID of the job to run.
 */
function triggerJob(jobId: string) {
    // These paths should be configured based on your deployment structure
    const nodePath = process.execPath; // Use the same Node.js executable
    const scriptPath = require.resolve('./dataMover.js'); // Assumes dataMover.ts is compiled to dataMover.js
    
    // Spawn the data mover as a detached child process
    const child = spawn(nodePath, [scriptPath, jobId], {
        detached: true,
        stdio: 'inherit' // Pipe child's output to the scheduler's output
    });

    child.on('error', (err) => {
        console.error(`[Scheduler] Failed to start dataMover for job ${jobId}:`, err);
    });

    child.on('exit', (code) => {
        console.log(`[Scheduler] dataMover for job ${jobId} exited with code ${code}.`);
    });

    // Unreference the child process to allow the scheduler to exit independently
    child.unref();
}

// Run the scheduler
main().catch(err => {
    console.error('[Scheduler] An unexpected error occurred:', err);
});