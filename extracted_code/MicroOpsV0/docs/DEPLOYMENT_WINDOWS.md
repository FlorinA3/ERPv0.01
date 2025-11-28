# MicroOps ERP - Windows Deployment (On-Prem)

This guide covers how to package and install MicroOps ERP on a Windows machine using a ZIP, PostgreSQL, and the Node.js backend.

## 1) Prerequisites
- Windows 10/11 or Server 2019/2022 with PowerShell 5+.
- Node.js 18 LTS or 20 LTS installed to `C:\Program Files\nodejs\node.exe`.
- PostgreSQL 15+ with `psql` on the PATH.
- Service runner (recommended): [NSSM](https://nssm.cc/) installed to `C:\nssm\nssm.exe`.
- A non-admin service account for the backend (no interactive logon, local folder permissions only).

## 2) Packaging Model (ZIP)

**Backend ZIP contents**
- `package.json`, `package-lock.json`
- `server/` (includes `db/migrations`, routes, services)
- `.env.example`, `.env.production` template, `.env.development`, `.env.test`
- `scripts/install_service_windows.ps1`
- `docs/` (this file)

Exclude secrets and transient files: **no `.env` with real credentials**, no `node_modules/`.

**Frontend ZIP contents**
- `index.html`, `css/`, `js/`, `data/` (static SPA assets only)
- Do **not** include any `.env*` files or backend credentials.

## 3) Prepare the install ZIP
1. From the project root, remove any `node_modules` folder from the archive.
2. Keep `.env.*` templates, but **do not** add real secrets to the ZIP.
3. Create the archive (example PowerShell):  
   `Compress-Archive -Path .\package.json,.\package-lock.json,.\server,.\css,.\js,.\data,.\index.html,.\docs,.\scripts,.\.env.example,.\.env.development,.\.env.test,.\.env.production -DestinationPath MicroOpsERP-backend-frontend.zip`

## 4) Install on a new Windows machine
1. Install Node.js and PostgreSQL.
2. Create DB user/database (adjust names as needed):
   ```sql
   CREATE DATABASE microops_erp;
   CREATE USER microops_service WITH PASSWORD 'CHANGE_ME';
   GRANT ALL PRIVILEGES ON DATABASE microops_erp TO microops_service;
   ```
3. Unzip to a path without spaces, e.g. `D:\MicroOps\MicroOpsERP`.
4. Copy `.env.example` to `.env.production` in the unzip root and fill values:
   - DB: `DATABASE_URL` or `DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD`
   - Auth: `JWT_SECRET`, `JWT_EXPIRES_IN`
   - CORS: `CORS_ORIGINS`
   - Logging: `LOG_DIR`, `LOG_LEVEL`
   - Keep this file **off network shares** and lock NTFS permissions to the service account + admins.
5. Install dependencies (from the unzip root):  
   `npm ci --omit=dev`
6. Run migrations (uses `.env.production`):  
   `npm run migrate:db`
7. Start once in a console to verify:  
   `npm run start:prod`
8. Health check: browse to `http://localhost:4000/api/health`.

## 5) Run as a Windows service (NSSM template)
1. Ensure `.env.production` sits in the install directory with restricted permissions.
2. Create a log folder, e.g. `D:\MicroOps\Logs`.
3. Install the service via the template script (edit paths/user first):
   ```powershell
   pwsh -File .\scripts\install_service_windows.ps1 `
     -ServiceName "MicroOpsERP" `
     -InstallDir "D:\MicroOps\MicroOpsERP" `
     -LogDir "D:\MicroOps\Logs" `
     -ServiceUser ".\svc-microops"
   ```
   The script:
   - Points NSSM to `node.exe` + `server/index.js`
   - Sets `NODE_ENV=production`
   - Sends stdout/stderr to the log directory
   - Starts service automatically
4. After install: open Services, set **Recovery** to restart on failure.

## 6) Frontend on a network share (static files only)
- Place `index.html`, `css/`, `js/`, `data/` on a share like `\\server\MicroOpsFrontend`.
- NTFS/share permissions: read for users, write for the release owner only. **Do not** place `.env*` or backend logs on the share.
- Keep paths short (avoid long nested folders and spaces to reduce path length issues).
- Backend + PostgreSQL stay on the server; the share only hosts static assets.

## 7) Environment files
- Templates: `.env.example`, `.env.development`, `.env.test`, `.env.production`.
- For production, copy `.env.production`, fill secrets, and keep it beside `package.json`.
- For development, use `.env.development` or `.env` locally; never commit real secrets.

## 8) Operations checklist
- **First deploy**: set `.env.production`, `npm ci --omit=dev`, `npm run migrate:db`, `npm run start:prod` (or install service), confirm `/api/health`.
- **Updates**: stop service, replace code, `npm ci --omit=dev`, `npm run migrate:db` (if schema changed), start service.
- **Backups**: use PostgreSQL-native backups on the DB host; store them away from the shared frontend folder.

## 9) Database Backups (Task Scheduler)
- Configure backup settings in `.env.production`:
  - `BACKUP_ENABLED` (default `true`)
  - `BACKUP_DIR` (default `./backups` relative to install dir)
  - `BACKUP_RETENTION_DAYS` (default `14`)
- Run manual backup: `npm run backup:db` (set `NODE_ENV=production`).
- Schedule nightly via Task Scheduler:
  - Program: `powershell.exe`
  - Arguments: `-File "D:\MicroOps\MicroOpsERP\scripts\backup_db_windows.ps1" -InstallDir "D:\MicroOps\MicroOpsERP"`
  - Run with a service account that can access the backup directory and pg_dump on PATH.
- Restore & validation steps: see `docs/BACKUP_RESTORE_WINDOWS.md`.
- DR scenarios and RPO/RTO guidance: see `docs/DR_RUNBOOK_WINDOWS.md`.

## 10) Logs & Monitoring
- Logging:
  - JSON-per-line logs in `LOG_DIR` (default `./logs`); daily filenames `microops-YYYY-MM-DD.log`.
  - Configure `LOG_LEVEL` and `LOG_RETENTION_DAYS` in `.env.production`.
  - Each request includes `X-Request-Id` header; errors in API responses return `requestId` for log correlation.
- Health checks:
  - `GET /api/health` (fast) and `/api/health/deep` (heavier) report DB, env, and directory status; HTTP 503 when degraded/critical.
  - Task Scheduler example (every 5-15 minutes):
    - Program: `powershell.exe`
    - Arguments: `-File "D:\MicroOps\MicroOpsERP\scripts\check_health_windows.ps1" -HealthUrl "http://localhost:4000/api/health" -LogFile "D:\MicroOps\Logs\health-probe.log"`
  - Use Task Scheduler history or the optional log file to spot failing probes; configure alerts/restarts based on non-zero exit codes.
