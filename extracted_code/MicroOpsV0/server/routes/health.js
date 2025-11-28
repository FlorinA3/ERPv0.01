const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { pool } = require('../config/database');
const { loadConfig } = require('../config/env');
const logger = require('../utils/logger');

function resolvePath(p, projectRoot) {
  if (path.isAbsolute(p)) return p;
  return path.resolve(projectRoot, p);
}

async function checkDb() {
  const started = Date.now();
  try {
    await pool.query('SELECT 1');
    return { status: 'ok', latencyMs: Date.now() - started };
  } catch (err) {
    return { status: 'critical', error: err.message };
  }
}

function checkDirectory(dirPath, label) {
  try {
    fs.mkdirSync(dirPath, { recursive: true });
    fs.accessSync(dirPath, fs.constants.W_OK);
    return { status: 'ok', path: dirPath };
  } catch (err) {
    return { status: 'degraded', path: dirPath, error: `${label}: ${err.message}` };
  }
}

function checkEnv(config) {
  const missing = [];
  if (!config.jwtSecret) missing.push('JWT_SECRET');
  if (!config.databaseUrl) missing.push('DATABASE_URL/DB_*');
  return {
    status: missing.length ? 'degraded' : 'ok',
    missing,
  };
}

function overallStatus(checks) {
  if (
    Object.values(checks).some(
      (c) => c && c.status && c.status.toLowerCase() === 'critical'
    )
  ) {
    return 'critical';
  }
  if (
    Object.values(checks).some(
      (c) => c && c.status && c.status.toLowerCase() === 'degraded'
    )
  ) {
    return 'degraded';
  }
  return 'ok';
}

function createHealthRouter() {
  const router = express.Router();
  const config = loadConfig();
  const projectRoot = path.resolve(__dirname, '../..');
  const logDir = resolvePath(config.log.directory, projectRoot);
  const backupDir = resolvePath(config.backup.directory, projectRoot);

  router.get('/health', async (req, res) => {
    const checks = {};
    checks.db = await checkDb();
    checks.env = checkEnv(config);
    checks.logDir = checkDirectory(logDir, 'Log dir');
    checks.backupDir = checkDirectory(backupDir, 'Backup dir');

    const status = overallStatus(checks);
    const response = {
      status,
      checks,
      uptimeSec: Math.round(process.uptime()),
      version: config.app.version,
      env: config.env,
      node: process.version,
      host: os.hostname(),
      requestId: req.requestId,
    };

    if (status !== 'ok') {
      logger.warn('health-check-failed', {
        requestId: req.requestId,
        status,
        checks,
      });
    }

    res.status(status === 'ok' ? 200 : 503).json(response);
  });

  router.get('/health/deep', async (req, res) => {
    const checks = {};
    checks.db = await checkDb();
    checks.env = checkEnv(config);
    checks.logDir = checkDirectory(logDir, 'Log dir');
    checks.backupDir = checkDirectory(backupDir, 'Backup dir');

    // Deep check: run a lightweight table existence query
    try {
      const started = Date.now();
      await pool.query('SELECT table_name FROM information_schema.tables LIMIT 1;');
      checks.schema = { status: 'ok', latencyMs: Date.now() - started };
    } catch (err) {
      checks.schema = { status: 'degraded', error: err.message };
    }

    const status = overallStatus(checks);
    const response = {
      status,
      checks,
      uptimeSec: Math.round(process.uptime()),
      version: config.app.version,
      env: config.env,
      node: process.version,
      host: os.hostname(),
      requestId: req.requestId,
    };

    if (status !== 'ok') {
      logger.warn('health-deep-failed', {
        requestId: req.requestId,
        status,
        checks,
      });
    }

    res.status(status === 'ok' ? 200 : 503).json(response);
  });

  return router;
}

module.exports = createHealthRouter;
