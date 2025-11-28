const fs = require('fs');
const path = require('path');
const { loadConfig } = require('../config/env');

const LEVELS = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

let configCache = null;
let lastPruneDay = null;

function loadLoggerConfig() {
  if (configCache) return configCache;
  const config = loadConfig();
  const projectRoot = path.resolve(__dirname, '../..');
  const logDir = path.isAbsolute(config.log.directory)
    ? config.log.directory
    : path.resolve(projectRoot, config.log.directory);

  const retentionDays =
    typeof config.log.retentionDays === 'number'
      ? config.log.retentionDays
      : 30;

  const levelKey = String(config.log.level || 'info').toLowerCase();
  const minLevel = LEVELS[levelKey] ?? LEVELS.info;

  configCache = {
    env: config.env,
    appVersion: config.app.version,
    logDir,
    retentionDays,
    minLevel,
  };
  return configCache;
}

function ensureLogDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function pruneOldLogs(dir, retentionDays) {
  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);
  if (lastPruneDay === todayKey) return;
  lastPruneDay = todayKey;

  const cutoff = now.getTime() - retentionDays * 24 * 60 * 60 * 1000;
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (!/^microops-\d{4}-\d{2}-\d{2}\.log$/.test(file)) continue;
      const datePart = file.slice(9, 19);
      const parsed = new Date(`${datePart}T00:00:00Z`);
      if (Number.isNaN(parsed.getTime())) continue;
      if (parsed.getTime() < cutoff) {
        fs.rmSync(path.join(dir, file));
      }
    }
  } catch (err) {
    // Avoid throwing during prune; log later when logger is used.
  }
}

function shouldLog(level) {
  const cfg = loadLoggerConfig();
  const numeric = LEVELS[level] ?? LEVELS.info;
  return numeric >= cfg.minLevel;
}

function log(level, message, meta = {}) {
  if (!shouldLog(level)) return;
  const cfg = loadLoggerConfig();
  ensureLogDir(cfg.logDir);
  pruneOldLogs(cfg.logDir, cfg.retentionDays);

  const dateStr = new Date().toISOString();
  const fileName = `microops-${dateStr.slice(0, 10)}.log`;
  const filePath = path.join(cfg.logDir, fileName);

  const entry = {
    timestamp: dateStr,
    level,
    message,
    env: cfg.env,
    appVersion: cfg.appVersion,
    ...meta,
  };

  const line = JSON.stringify(entry);

  try {
    fs.appendFileSync(filePath, `${line}\n`, { encoding: 'utf8' });
  } catch (err) {
    // Best effort: fallback to console if file write fails
    console.error('Logger write failed:', err.message || err);
  }

  if (cfg.env !== 'production') {
    if (level === 'error') {
      console.error(line);
    } else if (level === 'warn') {
      console.warn(line);
    } else {
      console.log(line);
    }
  }
}

module.exports = {
  debug: (message, meta) => log('debug', message, meta),
  info: (message, meta) => log('info', message, meta),
  warn: (message, meta) => log('warn', message, meta),
  error: (message, meta) => log('error', message, meta),
};
