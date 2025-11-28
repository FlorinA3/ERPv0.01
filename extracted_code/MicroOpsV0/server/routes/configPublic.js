const express = require('express');
const { buildPublicConfig } = require('../config/publicConfig');

function createConfigRouter(config) {
  const router = express.Router();

  router.get('/public', (req, res) => {
    res.json(buildPublicConfig(config));
  });

  return router;
}

module.exports = createConfigRouter;
