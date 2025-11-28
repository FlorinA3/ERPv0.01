const { Pool } = require('pg');
const { loadConfig } = require('../config/env');

const config = loadConfig();

if (!config.database.connectionString) {
  console.warn(
    '[db] Database connection not set. Configure DATABASE_URL or DB_HOST/DB_NAME/DB_USER/DB_PASSWORD.'
  );
}

const pool =
  config.database.connectionString &&
  new Pool({
    connectionString: config.database.connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
  });

async function getClient() {
  if (!pool) {
    throw new Error(
      'DATABASE_URL is not configured. Set it in .env before using the database.'
    );
  }
  return pool.connect();
}

module.exports = { pool, getClient };
