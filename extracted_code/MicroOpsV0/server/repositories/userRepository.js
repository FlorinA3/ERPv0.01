const bcrypt = require('bcrypt');
const { pool } = require('../db/client');

function requirePool() {
  if (!pool) {
    throw new Error(
      'DATABASE_URL is not configured. Set it in .env before using authentication endpoints.'
    );
  }
}

async function findUserByUsername(username) {
  requirePool();
  const query = `
    SELECT u.id, u.username, u.password_hash, u.name, u.email, u.is_active, u.deleted_at,
           r.name AS role
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE LOWER(u.username) = LOWER($1)
    LIMIT 1
  `;
  const result = await pool.query(query, [username]);
  return result.rows[0] || null;
}

async function createSession(userId, tokenHash, metadata) {
  requirePool();
  const { ip, userAgent, expiresAt } = metadata;
  await pool.query(
    `INSERT INTO sessions (user_id, token_hash, ip_address, user_agent, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, tokenHash, ip || null, userAgent || null, expiresAt]
  );
}

async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

module.exports = {
  findUserByUsername,
  createSession,
  verifyPassword,
};
