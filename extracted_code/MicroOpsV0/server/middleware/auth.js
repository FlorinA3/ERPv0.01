const { getUserFromToken } = require('../services/authService');

function extractToken(req) {
  const authHeader = req.headers['authorization'] || '';
  const [, token] = authHeader.split(' ');
  return token;
}

function requireAuth() {
  return async (req, res, next) => {
    try {
      const token = extractToken(req);
      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const user = await getUserFromToken(token);
      if (!user) {
        return res.status(401).json({ error: 'Invalid or inactive user' });
      }

      req.user = user;
      next();
    } catch (err) {
      const message = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
      return res.status(401).json({ error: message });
    }
  };
}

function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (allowedRoles.length && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
