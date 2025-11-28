const express = require('express');
const compression = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./utils/logger');

const { loadConfig } = require('./config/env');
const createConfigRouter = require('./routes/configPublic');
const createHealthRouter = require('./routes/health');
const createAuthRouter = require('./routes/auth');
const createCustomersRouter = require('./routes/customers');
const createProductsRouter = require('./routes/products');
const createOrdersRouter = require('./routes/orders');
const createDocumentsRouter = require('./routes/documents');
const createInventoryRouter = require('./routes/inventory');
const { requireAuth } = require('./middleware/auth');
const { requestLogger } = require('./middleware/requestLogger');
const { errorHandler } = require('./middleware/errorHandler');

const config = loadConfig();
const app = express();

app.use(
  cors({
    origin: config.cors.origins.length ? config.cors.origins : '*',
    credentials: config.cors.origins.length > 0,
  })
);
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(requestLogger());

app.use('/api', createHealthRouter());
app.use('/api/config', createConfigRouter(config));
app.use('/api/auth', createAuthRouter());
app.use('/api/customers', requireAuth(), createCustomersRouter());
app.use('/api/products', requireAuth(), createProductsRouter());
app.use('/api/orders', requireAuth(), createOrdersRouter());
app.use('/api/documents', requireAuth(), createDocumentsRouter());
app.use('/api/inventory', requireAuth(), createInventoryRouter());

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found', requestId: req.requestId });
});

app.use(errorHandler);

if (require.main === module) {
  app.listen(config.port, () => {
    logger.info('server-start', {
      port: config.port,
      env: config.env,
      version: config.app.version,
    });
  });
}

module.exports = app;
