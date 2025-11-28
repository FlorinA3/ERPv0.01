const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { loadConfig } = require('../config/env');

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function applyMigration(client, filePath, filename) {
  const sql = fs.readFileSync(filePath, 'utf8');
  console.log(`Applying ${filename}...`);

  await client.query('BEGIN');
  try {
    await client.query(sql);
    await client.query(
      'INSERT INTO schema_migrations (filename) VALUES ($1)',
      [filename]
    );
    await client.query('COMMIT');
    console.log(`Applied ${filename}`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw new Error(`Failed on ${filename}: ${err.message}`);
  }
}

async function main() {
  const config = loadConfig();

  if (!config.databaseUrl) {
    console.error(
      'DATABASE_URL is not set. Copy .env.example to .env and configure your Postgres connection.'
    );
    process.exit(1);
  }

  const client = new Client({ connectionString: config.databaseUrl });

  try {
    await client.connect();
  } catch (err) {
    console.error(
      'Could not connect to Postgres. Check DATABASE_URL, network access, and that the server is running.'
    );
    console.error(`Connection error: ${err.message}`);
    process.exit(1);
  }

  try {
    await ensureMigrationsTable(client);

    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    if (!files.length) {
      console.log('No migration files found. Nothing to do.');
      await client.end();
      return;
    }

    for (const filename of files) {
      const already = await client.query(
        'SELECT 1 FROM schema_migrations WHERE filename = $1',
        [filename]
      );
      if (already.rowCount > 0) {
        console.log(`Skipping ${filename} (already applied)`);
        continue;
      }

      const filePath = path.join(migrationsDir, filename);
      await applyMigration(client, filePath, filename);
    }

    console.log('Migrations complete.');
  } catch (err) {
    console.error(err.message || err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
