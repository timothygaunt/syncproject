# Deployment Guide: Windows Server 2022, IIS & SQL Server

This guide provides comprehensive instructions for deploying the SheetSync Scheduler application stack on a Windows Server 2022 environment.

## 1. Server Prerequisites

Before deploying, ensure the following components are installed and configured on your server.

### a. SQL Server
- Install an edition of **SQL Server** (e.g., Express for testing, or Standard/Enterprise for production).
- Install **SQL Server Management Studio (SSMS)** for database administration.

### b. IIS (Internet Information Services)
- Install IIS using the "Add Roles and Features" wizard in Server Manager.
- Ensure the following features are enabled under `Web Server (IIS) -> Application Development`:
  - **ASP.NET 4.8** (or higher) - this installs many core dependencies.
- **Install the [URL Rewrite Module](https://www.iis.net/downloads/microsoft/url-rewrite)**.
- **Install [iisnode](https://github.com/Azure/iisnode/releases)** (choose the `x64` installer). This module allows IIS to host Node.js applications.

### c. Node.js
- Install the latest LTS version of **Node.js** from the official website.

### d. Git
- **Installation:**
  1.  Navigate to the [Git for Windows](https://git-scm.com/download/win) official website.
  2.  Download the "64-bit Git for Windows Setup" installer.
  3.  Run the installer on your server. It is safe to accept the default options for all steps in the installation wizard.
  4.  After installation, you can verify it by opening a new PowerShell or Command Prompt window and running `git --version`.

## 2. Database Setup (SQL Server)

1.  **Create Database:**
    -   Open SSMS and connect to your SQL Server instance.
    -   Right-click "Databases" and select "New Database".
    -   Name it `SheetSyncDB` and click OK.

2.  **Create SQL Login:**
    -   In SSMS, navigate to "Security" -> "Logins".
    -   Right-click "Logins" and select "New Login...".
    -   Choose "SQL Server authentication".
    -   Enter a login name (e.g., `SheetSyncUser`) and a strong password.
    -   **Uncheck** "Enforce password policy" for simplicity in dev/test environments.
    -   In the "User Mapping" page, check the box for `SheetSyncDB` and grant it the `db_owner` role.

3.  **Create Tables:**
    -   Open a "New Query" window in SSMS, ensuring it's targeting your `SheetSyncDB`.
    -   Execute the following complete T-SQL script to create all necessary tables:
    ```sql
    -- Application Settings (for SMTP, Auth, etc.)
    CREATE TABLE app_settings (
        setting_key NVARCHAR(100) PRIMARY KEY,
        setting_value NVARCHAR(MAX) NOT NULL
    );
    ALTER TABLE app_settings ADD CONSTRAINT chk_setting_value_is_json CHECK (ISJSON(setting_value) > 0);

    -- User Groups and Permissions
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

    -- Managed Resources
    CREATE TABLE service_accounts (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        name NVARCHAR(255) NOT NULL,
        email NVARCHAR(255) NOT NULL UNIQUE,
        created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
    );

    CREATE TABLE managed_sheets (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        name NVARCHAR(255) NOT NULL,
        url NVARCHAR(1000) NOT NULL,
        added_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
    );

    CREATE TABLE managed_ftp_sources (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        name NVARCHAR(255) NOT NULL,
        host NVARCHAR(255) NOT NULL,
        port INT NOT NULL,
        username NVARCHAR(255) NOT NULL,
        password_encrypted NVARCHAR(MAX) NOT NULL, -- Always encrypt secrets
        added_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
    );

    CREATE TABLE gcp_project_connections (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        name NVARCHAR(255) NOT NULL,
        project_id NVARCHAR(255) NOT NULL,
        staging_gcs_bucket NVARCHAR(255) NOT NULL,
        service_account_key_json_encrypted NVARCHAR(MAX) NOT NULL,
        gcs_hmac_key_encrypted NVARCHAR(255) NULL,
        gcs_hmac_secret_encrypted NVARCHAR(MAX) NULL,
        added_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
    );

    -- Core Sync Jobs and Logs
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
        created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
    );
    ALTER TABLE sync_jobs ADD CONSTRAINT chk_sync_source_config_is_json CHECK (ISJSON(source_configuration) > 0);
    ALTER TABLE sync_jobs ADD CONSTRAINT chk_sync_config_is_json CHECK (ISJSON(config) > 0);

    CREATE TABLE job_logs (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        job_id UNIQUEIDENTIFIER FOREIGN KEY REFERENCES sync_jobs(id) ON DELETE CASCADE,
        run_details NVARCHAR(MAX) NOT NULL,
        created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
    );
    ALTER TABLE job_logs ADD CONSTRAINT chk_job_logs_details_is_json CHECK (ISJSON(run_details) > 0);
    ```

## 3. Backend API & Frontend Deployment (IIS)

This setup uses a single IIS site to serve both the static React frontend and the Node.js backend API, allowing both to run on port 80.

### a. Get Source Code (Private Repository)
You must authenticate to clone a private repository. The recommended method is a Personal Access Token (PAT).

1.  **Generate a PAT:**
    -   Go to your GitHub account settings: `Settings -> Developer settings -> Personal access tokens -> Tokens (classic)`.
    -   Click "Generate new token". Give it a name (e.g., "Windows Server Deploy"), set an expiration, and check the `repo` scope.
    -   Click "Generate token" and **copy the token immediately**.
2.  **Clone the Repository:**
    -   Open PowerShell or Command Prompt on your server.
    -   Navigate to `cd C:\inetpub\wwwroot`.
    -   Run the clone command, replacing `<YOUR_PAT>` with the token you just copied:
        ```powershell
        git clone https://timothygaunt:<YOUR_PAT>@github.com/timothygaunt/syncproject.git sheetsync
        ```

### b. Install and Configure
1.  **Install Dependencies:** Navigate into the new directory (`cd sheetsync`) and run `npm install`.
2.  **Set Environment Variable:** Create a system-level environment variable named `DATABASE_URL` with your SQL Server connection string.
    -   `mssql://SheetSyncUser:YourStrongPassword@localhost/SheetSyncDB`
    -   You will need to restart the server for this to take effect globally.
3.  **Create Application Pool (Crucial for Isolation):**
    -   In IIS Manager, right-click on "Application Pools" and select "Add Application Pool...".
    -   **Name:** `SheetSyncAppPool`
    -   **.NET CLR version:** Select **"No Managed Code"**. This is important as iisnode runs outside the .NET runtime.
    -   **Managed pipeline mode:** "Integrated". Click OK.
4.  **Create IIS Site:**
    -   In IIS Manager, right-click "Sites" and select "Add Website...".
    -   **Site name:** `SheetSyncApp`
    -   **Application pool:** Click "Select..." and choose the `SheetSyncAppPool` you just created.
    -   **Physical path:** `C:\inetpub\wwwroot\sheetsync` (Point it to the code root).
    -   **Binding:** Choose port `80`.
5.  **Confirm `web.config`:** The `web.config` file is the most critical piece for routing. This file is included in the project repository and must exist in the root of your code directory (`C:\inetpub\wwwroot\sheetsync`).

## 4. Data Mover Setup: The Master Scheduler (Efficient Method)

Instead of creating a separate task for every job, we will create a **single master task** that runs a scheduler script every minute. This script will dynamically check the database and trigger any jobs that are due. This is far more scalable and requires no manual intervention when new jobs are added.

### a. Master Scheduler Script
The `services/scheduler.ts` script is the heart of this system. It fetches all active jobs from the database and runs the ones whose cron schedule matches the current time.

### b. Create a Single Windows Task
1.  Open **Task Scheduler** on the server.
2.  In the "Actions" pane, click "Create Task...".
3.  **General Tab:**
    -   **Name:** `SheetSync Master Scheduler`
    -   **Description:** `Runs every minute to trigger due sync jobs from the database.`
    -   Select "Run whether user is logged on or not".
4.  **Triggers Tab:**
    -   Click "New...".
    -   **Begin the task:** "On a schedule".
    -   Select "Daily".
    -   Under "Advanced settings", check **"Repeat task every:"** and choose **"1 minute"**.
    -   For a duration of: **"Indefinitely"**.
    -   Ensure "Enabled" is checked at the bottom. Click OK.
5.  **Actions Tab:**
    -   Click "New...".
    -   **Action:** "Start a program".
    -   **Program/script:** `C:\Program Files\nodejs\node.exe` (or the full path to your `node.exe`).
    -   **Add arguments (optional):** `C:\inetpub\wwwroot\sheetsync\services\scheduler.js` (Use the path to the compiled `.js` file if using TypeScript, or `.ts` if using `ts-node`).
    -   **Start in (optional):** `C:\inetpub\wwwroot\sheetsync\services\`
6.  **Settings Tab:**
    -   Check "Allow task to be run on demand".
    -   Check "Run task as soon as possible after a scheduled start is missed".
    -   **If the task is already running...:** Select "Do not start a new instance".
7.  Click OK. You may be prompted to enter the password for the user account the task will run as.

Your application is now deployed and configured with an efficient, automated scheduling system on your on-premise Windows Server environment.
