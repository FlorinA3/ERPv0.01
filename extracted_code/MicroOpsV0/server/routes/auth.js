const express = require('express');
const { validateBody } = require('../validation/middleware');
const { loginSchema } = require('../validation/schemas');
const {
  verifyCredentials,
  issueToken,
  recordSession,
  getUserFromToken,
} = require('../services/authService');
const { requireAuth } = require('../middleware/auth');

function createAuthRouter() {
  const router = express.Router();

  router.post('/login', validateBody(loginSchema), async (req, res) => {
    try {
      const { username, password } = req.validated;
      const user = await verifyCredentials(username, password);

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = issueToken(user);
      await recordSession(user.id, token, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.json({
        token,
        user,
      });
    } catch (err) {
      console.error('Login error:', err.message || err);
      return res.status(500).json({ error: 'Login failed' });
    }
  });

  router.get('/me', requireAuth(), async (req, res) => {
    // req.user is set by requireAuth
    res.json(req.user);
  });

  return router;
}

module.exports = createAuthRouter;
