const crypto = require('crypto');
const logger = require('../utils/logger');

function requestLogger() {
  return (req, res, next) => {
    const start = Date.now();
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();
    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);

    res.on('finish', () => {
      logger.info('request', {
        requestId,
        userId: req.user ? req.user.id : undefined,
        method: req.method,
        path: req.originalUrl || req.url,
        status: res.statusCode,
        durationMs: Date.now() - start,
      });
    });

    next();
  };
}

module.exports = { requestLogger };
