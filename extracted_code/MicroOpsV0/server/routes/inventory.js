const express = require('express');
const { validateBody } = require('../validation/middleware');
const { requireRole } = require('../middleware/auth');
const { shipmentCreateSchema } = require('../validation/schemas');
const inventoryRepository = require('../repositories/inventoryRepository');
const inventoryService = require('../services/inventoryService');

const router = express.Router();

const READ_ROLES = ['admin', 'sales', 'warehouse', 'production', 'readonly'];
const WRITE_ROLES = ['admin', 'warehouse', 'production'];

router.get(
  '/movements',
  requireRole(READ_ROLES),
  async (req, res) => {
    try {
      const { productId, orderId, documentId, page, limit } = req.query;
      const rows = await inventoryRepository.listMovements(
        { productId, orderId, documentId, page, limit }
      );
      res.json(rows);
    } catch (err) {
      console.error('List movements error:', err);
      res.status(500).json({ error: 'Failed to fetch movements' });
    }
  }
);

router.get(
  '/stock/:productId',
  requireRole(READ_ROLES),
  async (req, res) => {
    try {
      const snapshot = await inventoryService.getStockSnapshot(req.params.productId);
      res.json(snapshot);
    } catch (err) {
      console.error('Get stock error:', err);
      res.status(400).json({ error: err.message || 'Failed to fetch stock' });
    }
  }
);

router.post(
  '/shipments',
  requireRole(WRITE_ROLES),
  validateBody(shipmentCreateSchema),
  async (req, res) => {
    try {
      const result = await inventoryService.postShipment({
        document_id: req.validated.document_id,
        order_id: req.validated.order_id,
        lines: req.validated.lines,
        userId: req.user?.id,
      });
      res.json(result);
    } catch (err) {
      if (err.code === 'SHIPMENT_ALREADY_POSTED') {
        return res.status(409).json({
          error: err.message || 'Shipment already posted',
          code: 'SHIPMENT_ALREADY_POSTED',
          message: 'Shipment already posted for this document.',
        });
      }
      if (err.code === 'NEGATIVE_STOCK') {
        return res.status(409).json({ error: err.message });
      }
      if (err.code === 'NOT_FOUND' || err.code === 'ORDER_NOT_FOUND') {
        return res.status(404).json({ error: err.message });
      }
      if (err.code === 'INVALID_LINE' || err.code === 'INVALID_PAYLOAD') {
        return res.status(400).json({ error: err.message });
      }
      console.error('Post shipment error:', err);
      res.status(500).json({ error: 'Failed to post shipment' });
    }
  }
);

module.exports = router;
