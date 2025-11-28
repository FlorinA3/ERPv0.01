# MicroOps ERP - Backup & Restore (Windows)

This guide covers server-side PostgreSQL backups for MicroOps on Windows. It complements `docs/DEPLOYMENT_WINDOWS.md` and the disaster recovery runbook.

## Backup outputs
- Location: `BACKUP_DIR` from `.env.<env>` (default `./backups` relative to install root).
- Naming: `<database>_YYYYMMDD_HHmmss.sql` (plain SQL from `pg_dump`).
- Retention: `BACKUP_RETENTION_DAYS` (default 14) controls automatic pruning after each backup.

## Manual backup (command line)
From the install root (where `package.json` lives) with env configured:
```powershell
npm run backup:db        # uses NODE_ENV (defaults to development)
$env:NODE_ENV="production"; npm run backup:db
```
The script uses `pg_dump` on PATH and `BACKUP_DIR` / `BACKUP_RETENTION_DAYS` from `server/config/env.js`. If `BACKUP_ENABLED=false`, it exits without running.

## Scheduled backups (Task Scheduler)
- Use `scripts/backup_db_windows.ps1` to run nightly:
  - Program: `powershell.exe`
  - Arguments: `-File "D:\MicroOps\MicroOpsERP\scripts\backup_db_windows.ps1" -InstallDir "D:\MicroOps\MicroOpsERP"`
  - Start in: `D:\MicroOps\MicroOpsERP`
  - Set `NODE_ENV=production` if not using the provided script.
- Ensure `pg_dump` is on PATH (PostgreSQL bin).
- Check logs: Task Scheduler history and optional `-LogFile` output if configured.

## Restore to staging/test
1. Create a staging DB (example):
   ```sql
   CREATE DATABASE microops_staging;
   ```
2. Ensure `.env.development` or a dedicated `.env.staging` points to the staging DB.
3. Restore using `psql` or the helper script:
   - Direct: `psql -h <host> -p <port> -U <user> -d microops_staging -f <backup.sql>`
   - Script: `pwsh -File scripts/restore_db_windows.ps1 -BackupFile "C:\backups\microops_erp_20250101_020000.sql" -DatabaseName "microops_staging" -CreateDatabase`
4. Start backend against staging env and run migrations if needed.

## Post-restore validation checklist
- Login via UI succeeds with expected users.
- Recent orders/invoices present; document numbers remain unique.
- Inventory levels match expectation; no negative stock appears.
- Critical invariants hold (immutable posted docs, unique sequences).
- Health endpoint `/api/health` returns OK against staging DB.
