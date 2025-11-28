const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { loadConfig } = require('../config/env');
const { findUserByUsername, createSession, verifyPassword } = require('../repositories/userRepository');

const config = loadConfig();

function issueToken(user) {
  if (!config.jwtSecret) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      username: user.username,
    },
    config.jwtSecret,
    { expiresIn: config.auth.tokenExpiresIn || '2h' }
  );
}

async function verifyCredentials(username, password) {
  const user = await findUserByUsername(username);
  if (!user) {
    return null;
  }
  if (!user.is_active || user.deleted_at) {
    return null;
  }

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  };
}

async function recordSession(userId, token, metadata = {}) {
  const tokenHash = await bcrypt.hash(token.slice(-20), 8);
  const expiresAt =
    metadata.expiresAt ||
    new Date(Date.now() + parseExpiresInMs(config.auth.tokenExpiresIn || '2h'));

  await createSession(userId, tokenHash, {
    ip: metadata.ip || null,
    userAgent: metadata.userAgent || null,
    expiresAt,
  });
}

function parseExpiresInMs(expr) {
  // Very small parser for "1h", "30m" etc.
  const match = /^(\d+)([smhd])$/.exec(String(expr).trim());
  if (!match) return 2 * 60 * 60 * 1000; // default 2h
  const value = Number(match[1]);
  const unit = match[2];
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return value * (multipliers[unit] || 3600000);
}

async function getUserFromToken(token) {
  if (!config.jwtSecret) {
    throw new Error('JWT_SECRET is not configured');
  }

  const decoded = jwt.verify(token, config.jwtSecret);
  const user = await findUserByUsername(decoded.username);

  if (!user || !user.is_active || user.deleted_at) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  };
}

module.exports = {
  verifyCredentials,
  issueToken,
  getUserFromToken,
  recordSession,
};
