const { Pool } = require('pg');
const { loadConfig } = require('./env');
const logger = require('../utils/logger');

const config = loadConfig();

const connectionOptions = config.database.connectionString
  ? { connectionString: config.database.connectionString }
  : {
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      user: config.database.user,
      password: config.database.password,
    };

const pool = new Pool({
  ...connectionOptions,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  logger.error('Unexpected database error', { errorStack: err.stack, errorCode: err.code });
  process.exit(-1);
});

async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (duration > 100) {
    logger.warn('slow-query', { text, duration, rows: res.rowCount });
  }
  return res;
}

async function getClient() {
  const client = await pool.connect();
  const originalQuery = client.query.bind(client);
  const originalRelease = client.release.bind(client);

  let released = false;
  const timeout = setTimeout(() => {
    if (!released) {
      console.error('Client checkout timeout - forcing release');
      client.release();
    }
  }, 30000);

  client.query = (...args) => originalQuery(...args);
  client.release = () => {
    clearTimeout(timeout);
    released = true;
    return originalRelease();
  };

  return client;
}

async function transaction(callback) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, getClient, transaction };
