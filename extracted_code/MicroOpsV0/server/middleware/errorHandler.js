const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const message =
    status >= 500 ? 'Internal server error' : err.message || 'Request failed';

  logger.error(message, {
    requestId: req.requestId,
    userId: req.user ? req.user.id : undefined,
    method: req.method,
    path: req.originalUrl || req.url,
    status,
    errorCode: err.code,
    errorStack: err.stack,
  });

  res.status(status).json({
    error: message,
    code: err.code,
    requestId: req.requestId,
  });
}

module.exports = { errorHandler };
