const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { loadConfig } = require('../config/env');

function resolveProjectRoot() {
  return path.resolve(__dirname, '../..');
}

function resolveDbConfig(database) {
  if (database.connectionString) {
    try {
      const url = new URL(database.connectionString);
      return {
        host: url.hostname || database.host,
        port: url.port ? Number(url.port) : database.port,
        database: (url.pathname || '').replace(/^\//, '') || database.name,
        user: url.username || database.user,
        password: url.password || database.password,
      };
    } catch (err) {
      // Fall through to explicit fields
    }
  }
  return {
    host: database.host,
    port: database.port,
    database: database.name,
    user: database.user,
    password: database.password,
  };
}

function ensureDirectory(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function formatTimestamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mi = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `${yyyy}${mm}${dd}_${hh}${mi}${ss}`;
}

function parseBackupTimestamp(fileName, dbName) {
  const escapedDb = dbName.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&');
  const match = new RegExp(`^${escapedDb}_(\\d{8})_(\\d{6})\\.sql$`).exec(
    fileName
  );
  if (!match) return null;
  const datePart = match[1];
  const timePart = match[2];
  const iso = `${datePart.slice(0, 4)}-${datePart.slice(
    4,
    6
  )}-${datePart.slice(6, 8)}T${timePart.slice(0, 2)}:${timePart.slice(
    2,
    4
  )}:${timePart.slice(4, 6)}Z`;
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function runPgDump(db, backupPath) {
  return new Promise((resolve, reject) => {
    const args = [
      '-h',
      db.host,
      '-p',
      String(db.port),
      '-U',
      db.user,
      '-F',
      'p',
      '-f',
      backupPath,
      db.database,
    ];

    const child = spawn('pg_dump', args, {
      stdio: 'inherit',
      env: db.password
        ? { ...process.env, PGPASSWORD: db.password }
        : process.env,
    });

    child.on('error', (err) => {
      reject(err);
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`pg_dump exited with code ${code}`));
      }
    });
  });
}

function pruneBackups(dir, dbName, retentionDays) {
  const now = Date.now();
  const cutoff = now - retentionDays * 24 * 60 * 60 * 1000;
  const removed = [];

  const files = fs.readdirSync(dir);
  for (const file of files) {
    const ts = parseBackupTimestamp(file, dbName);
    if (!ts) continue;
    if (ts.getTime() < cutoff) {
      fs.rmSync(path.join(dir, file));
      removed.push(file);
    }
  }

  return removed;
}

async function main() {
  const projectRoot = resolveProjectRoot();
  const config = loadConfig();

  if (!config.backup.enabled) {
    console.log('[backup] BACKUP_ENABLED=false, skipping backup.');
    process.exit(0);
  }

  const db = resolveDbConfig(config.database);

  if (!db.database || !db.user || !db.host) {
    console.error(
      '[backup] Database configuration is incomplete. Check DATABASE_URL or DB_* vars.'
    );
    process.exit(1);
  }

  const backupDir = path.isAbsolute(config.backup.directory)
    ? config.backup.directory
    : path.resolve(projectRoot, config.backup.directory);

  ensureDirectory(backupDir);

  const timestamp = formatTimestamp();
  const filename = `${db.database}_${timestamp}.sql`;
  const backupPath = path.join(backupDir, filename);

  try {
    console.log(
      `[backup] Starting pg_dump for ${db.database} -> ${backupPath}`
    );
    await runPgDump(db, backupPath);
    console.log('[backup] Backup completed.');

    const removed = pruneBackups(
      backupDir,
      db.database,
      config.backup.retentionDays
    );
    if (removed.length) {
      console.log(
        `[backup] Pruned ${removed.length} old backup(s): ${removed.join(', ')}`
      );
    } else {
      console.log('[backup] No backups pruned (within retention).');
    }
    process.exit(0);
  } catch (err) {
    console.error('[backup] Backup failed:', err.message || err);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
