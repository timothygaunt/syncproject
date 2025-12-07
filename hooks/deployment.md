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

This setup uses a single IIS site to serve both the static React frontend and the Node.js backend API.

1.  **Get Source Code:**
    -   Open PowerShell or Command Prompt.
    -   Navigate to the directory where you want to store the application (e.g., `cd C:\inetpub\wwwroot`).
    -   Clone the repository using the following command (replace the URL with your actual repository URL):
        ```powershell
        git clone https://your-repository-url.com/sheetsync.git sheetsync
        ```
    -   This will create a `C:\inetpub\wwwroot\sheetsync` folder with all the application code.

2.  **Install Dependencies:** Navigate into the new directory (`cd sheetsync`) and run `npm install`.

3.  **Build Frontend:** In the same PowerShell window, run `npm run build`. This will create a `dist` folder containing the static frontend files (`index.html`, etc.).

4.  **Set Environment Variable:** Create a system-level environment variable named `DATABASE_URL` with your SQL Server connection string.
    -   `mssql://SheetSyncUser:YourStrongPassword@localhost/SheetSyncDB`
    -   You will need to restart the server for this to take effect globally.

5.  **Create IIS Site:**
    -   In IIS Manager, right-click "Sites" and select "Add Website...".
    -   **Site name:** `SheetSyncApp`
    -   **Physical path:** `C:\inetpub\wwwroot\sheetsync\dist` (Point it to the build output folder).
    -   **Binding:** Choose a port (e.g., 80).

6.  **Create `web.config`:** Place the following `web.config` file in the root of your code directory (`C:\inetpub\wwwroot\sheetsync`). IIS will find it and use it to configure the site.

    ```xml
    <configuration>
      <system.webServer>
        <handlers>
          <!-- Indicates that the server.ts file is a node.js script to be handled by the iisnode module -->
          <add name="iisnode" path="server.ts" verb="*" modules="iisnode" />
        </handlers>
        <rewrite>
          <rules>
            <!-- All other URLs are mapped to the Node.js application -->
            <rule name="app">
              <match url="/*" />
              <action type="Rewrite" url="server.ts" />
            </rule>
            <!-- Route API requests to the Node.js backend -->
            <rule name="api" stopProcessing="true">
                <match url="^api/.*" />
                <action type="Rewrite" url="server.ts" />
            </rule>
            <!-- Serve static files from the 'dist' folder and handle client-side routing -->
            <rule name="static" stopProcessing="true">
                <match url="^.*$" />
                <conditions logicalGrouping="MatchAll">
                    <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
                    <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
                </conditions>
                <action type="Rewrite" url="index.html" />
            </rule>
          </rules>
        </rewrite>
        <!-- Increase logging for debugging iisnode issues -->
        <iisnode loggingEnabled="true" devErrorsEnabled="true" />
      </system.webServer>
    </configuration>
    ```

## 4. Data Mover Setup (Windows Task Scheduler)

The `dataMover.ts` script needs to be triggered for each job on its schedule.

1.  **Adapt the Script:** The conceptual `dataMover.ts` needs to be adapted into a runnable Node.js script that can accept a `jobId` as a command-line argument and connect to the SQL Server database to fetch its configuration.
2.  **Create a Task for Each Job:**
    -   Open **Task Scheduler** on the server.
    -   Click "Create Task...".
    -   **General Tab:** Give it a name that includes the job name (e.g., "SheetSync - Daily Sales Sync").
    -   **Triggers Tab:** Create a new trigger. Set the schedule according to the job's `cronSchedule`.
    -   **Actions Tab:** Create a new "Start a program" action.
        -   **Program/script:** `C:\Program Files\nodejs\node.exe` (or wherever node.exe is).
        -   **Add arguments:** `C:\inetpub\wwwroot\sheetsync\dist\dataMover.js JOB_ID_HERE` (replace `JOB_ID_HERE` with the actual job ID for this specific schedule).
    -   **Settings Tab:** Configure other settings as needed (e.g., "Run task as soon as possible after a scheduled start is missed").

Your application is now deployed and configured to run on your on-premise Windows Server environment.