const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

function loadEnvFiles() {
  const env = process.env.NODE_ENV || 'development';
  const projectRoot = path.resolve(__dirname, '../..');
  const baseEnv = path.join(projectRoot, '.env');
  const envSpecific = path.join(projectRoot, `.env.${env}`);

  // Load base first, then environment-specific overrides if present
  if (fs.existsSync(baseEnv)) {
    dotenv.config({ path: baseEnv });
  }
  if (fs.existsSync(envSpecific)) {
    dotenv.config({ path: envSpecific, override: true });
  }
  // Fallback to default dotenv search if nothing was loaded
  if (!fs.existsSync(baseEnv) && !fs.existsSync(envSpecific)) {
    dotenv.config();
  }
}

loadEnvFiles();

function parseBool(value, defaultValue = false) {
  if (value === undefined || value === null) return defaultValue;
  return ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase());
}

function parseOrigins(raw) {
  if (!raw) return [];
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function parseIntDefault(value, defaultValue) {
  const num = Number.parseInt(value, 10);
  if (Number.isNaN(num)) return defaultValue;
  return num;
}

function loadConfig() {
  const env = process.env.NODE_ENV || 'development';
  const port = Number(process.env.PORT) || 4000;

  const database = {
    url: process.env.DATABASE_URL || '',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME || 'microops_erp',
    user: process.env.DB_USER || 'microops',
    password: process.env.DB_PASSWORD || '',
  };

  if (!database.url && database.user && database.name) {
    const encodedPassword =
      database.password !== undefined && database.password !== null
        ? encodeURIComponent(database.password)
        : '';
    const auth =
      encodedPassword || encodedPassword === ''
        ? `${database.user}${encodedPassword ? `:${encodedPassword}` : ''}`
        : database.user;
    database.connectionString = `postgres://${auth}@${database.host}:${database.port}/${database.name}`;
  } else {
    database.connectionString = database.url;
  }

  const config = {
    env,
    port,
    databaseUrl: database.connectionString,
    database,
    jwtSecret: process.env.JWT_SECRET || '',
    cors: {
      origins: parseOrigins(
        process.env.CORS_ORIGINS ||
          'http://localhost:4000,http://localhost:5173'
      ),
    },
    app: {
      name: process.env.APP_NAME || 'MicroOps ERP',
      version: process.env.APP_VERSION || '0.5.0-dev',
      environmentLabel: process.env.APP_ENV || env,
      demoMode: parseBool(process.env.APP_DEMO_MODE, false),
    },
    log: {
      level: process.env.LOG_LEVEL || 'info',
      directory:
        process.env.LOG_DIR || path.resolve(__dirname, '../../logs'),
      retentionDays: parseIntDefault(process.env.LOG_RETENTION_DAYS, 30),
    },
    backup: {
      enabled: parseBool(process.env.BACKUP_ENABLED, true),
      directory:
        process.env.BACKUP_DIR || path.resolve(__dirname, '../../backups'),
      retentionDays: parseIntDefault(process.env.BACKUP_RETENTION_DAYS, 14),
    },
    auth: {
      tokenExpiresIn: process.env.JWT_EXPIRES_IN || '2h',
    },
  };

  if (!config.jwtSecret) {
    console.warn(
      '[config] JWT_SECRET is empty. Set a strong secret in .env before production.'
    );
  }

  if (!config.databaseUrl) {
    console.warn(
      '[config] Database connection is not configured. Set DATABASE_URL or DB_HOST/DB_NAME/DB_USER/DB_PASSWORD in .env before enabling DB operations.'
    );
  }

  return config;
}

module.exports = { loadConfig };
