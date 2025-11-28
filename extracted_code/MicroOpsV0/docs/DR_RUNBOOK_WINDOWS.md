# MicroOps ERP - Disaster Recovery Runbook (Windows)

**RPO/RTO targets**  
- Recommended RPO: 24h (nightly backups via Task Scheduler).  
- Recommended RTO: 1 working day (restore from last good backup to new/staging host).

## Preparation
- Nightly backups enabled (`BACKUP_ENABLED=true`, `BACKUP_RETENTION_DAYS` set appropriately).
- Backups stored off the primary disk if possible (e.g., secondary volume or network location with restricted access).
- `.env.production` stored with restricted NTFS permissions and offline copy.
- Verify restores quarterly using `docs/BACKUP_RESTORE_WINDOWS.md`.

## During an incident (quick checks)
- Call `GET /api/health` (or `/api/health/deep`) to confirm DB/log/backup directories; non-OK returns HTTP 503 and reason codes.
- Tail recent log file in `LOG_DIR` (daily `microops-YYYY-MM-DD.log`) using `Get-Content -Wait`.
- Note the `requestId` from API errors to match log entries.
- Only initiate restore after confirming impact scope; prefer staging restore first.

| Symptom | First actions | Follow-up |
| --- | --- | --- |
| Health endpoint degraded/critical | Check DB service and disk space; review latest log file | Restart service if needed; plan restore if DB corruption is suspected |
| Frequent 500s in API | Capture `requestId`, inspect log entry for stack/errorCode | Validate DB connectivity; roll back recent change if linked |
| Disk nearly full | Move/rotate logs and backups; free space on backup/log volumes | Increase retention only after confirming space; re-run health probe |
| Backup failures | Check `backupDb` log output and permissions on `BACKUP_DIR` | Re-run manual `npm run backup:db`; ensure Task Scheduler account has rights |

## Scenario playbooks

### 1) Disk failure (primary server)
**Detect:** Service down, disk not mounting, OS errors.  
**Actions:**
1. Provision/reimage a Windows host.
2. Install prerequisites (Node, PostgreSQL, NSSM) per `docs/DEPLOYMENT_WINDOWS.md`.
3. Copy latest backup set from backup location to the new host.
4. Deploy code ZIP, place `.env.production`, install deps (`npm ci --omit=dev`), run migrations if needed.
5. Restore DB to production database using latest backup.
6. Start service (NSSM) and verify `/api/health`.
**Validate:** Login works, recent data present, inventory correct, documents immutable/unique.

### 2) Ransomware / encrypted disk
**Detect:** Encrypted files, ransom notes, integrity errors.  
**Actions:**
1. Isolate infected machine from network immediately.
2. Prepare clean Windows host as above; do not reuse compromised disk.
3. Retrieve off-machine backups + `.env.production` from secure location.
4. Restore database to clean host; rotate credentials (DB password, JWT secret) and update `.env.production`.
5. Start service; monitor logs for anomalies.
**Validate:** Same as disk failure; confirm new credentials applied.

### 3) Accidental data deletion or DROP TABLE
**Detect:** Missing records, errors from missing tables.  
**Actions:**
1. Stop backend service to prevent further writes.
2. Restore most recent backup to a **staging** DB.
3. Validate data in staging; if acceptable, restore same backup to production DB (or swap connection to staging DB).
4. Restart service.
**Validate:** Key records restored, invariants hold, audit/logs reviewed.

### 4) Config loss (env files removed/corrupted)
**Detect:** Service fails to start; env warnings in logs.  
**Actions:**
1. Retrieve backup copy of `.env.production` (kept offline/secure).
2. Redeploy the file with correct permissions.
3. Restart service.
**Validate:** Service starts, `/api/health` OK, JWT/database connections work.

### 5) Hardware replacement / migration
**Detect:** Planned move to new hardware or cloud VM.  
**Actions:**
1. Take fresh manual backup (`npm run backup:db`).
2. Follow deployment guide on target host.
3. Restore backup to production DB on new host.
4. Update DNS/firewall as needed and start service.
**Validate:** Full regression smoke test (login, orders, documents, inventory).

## Post-recovery checklist (all scenarios)
- Health endpoint `/api/health` returns OK.
- Users can log in; roles enforced.
- Recent transactions/orders/invoices present; sequences unique.
- Inventory levels sensible; no negative stock.
- Backup job rescheduled and verified on new host.
- Document lessons learned; schedule follow-up backup/restore test.
