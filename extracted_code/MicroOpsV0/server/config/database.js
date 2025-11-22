const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'microops_erp',
  user: process.env.DB_USER || 'microops',
  password: process.env.DB_PASSWORD || 'microops_secure_pwd',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
  process.exit(-1);
});

async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (duration > 100) {
    console.log('Slow query:', { text, duration, rows: res.rowCount });
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
