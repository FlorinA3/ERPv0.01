const express = require('express');
const {
  orderCreateSchema,
  orderUpdateSchema,
  orderTransitionSchema,
} = require('../validation/schemas');
const { validateBody } = require('../validation/middleware');
const { requireRole } = require('../middleware/auth');
const orderRepository = require('../repositories/orderRepository');
const orderService = require('../services/orderService');

const router = express.Router();

const READ_ROLES = ['admin', 'sales', 'warehouse', 'production', 'readonly'];
const WRITE_ROLES = ['admin', 'sales'];

router.get(
  '/',
  requireRole(READ_ROLES),
  async (req, res) => {
    try {
      const { status, search, page, limit } = req.query;
      const orders = await orderRepository.listOrders({ status, search, page, limit });
      res.json(orders);
    } catch (err) {
      console.error('List orders error:', err);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  }
);

router.get(
  '/:id',
  requireRole(READ_ROLES),
  async (req, res) => {
    try {
      const order = await orderService.getOrderWithItems(req.params.id);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      res.json(order);
    } catch (err) {
      console.error('Get order error:', err);
      res.status(500).json({ error: 'Failed to fetch order' });
    }
  }
);

router.post(
  '/',
  requireRole(WRITE_ROLES),
  validateBody(orderCreateSchema),
  async (req, res) => {
    try {
      const created = await orderService.createDraftOrder({
        ...req.validated,
        created_by: req.user?.id,
      });
      res.status(201).json(created);
    } catch (err) {
      console.error('Create order error:', err);
      res.status(400).json({ error: err.message || 'Failed to create order' });
    }
  }
);

router.patch(
  '/:id',
  requireRole(WRITE_ROLES),
  validateBody(orderUpdateSchema),
  async (req, res) => {
    try {
      const updated = await orderService.updateDraftOrder(req.params.id, {
        ...req.validated,
        updated_by: req.user?.id,
      });
      res.json(updated);
    } catch (err) {
      if (err.message && err.message.includes('Only draft orders')) {
        return res.status(409).json({ error: err.message });
      }
      if (err.message === 'Order not found') {
        return res.status(404).json({ error: err.message });
      }
      console.error('Update order error:', err);
      res.status(400).json({ error: err.message || 'Failed to update order' });
    }
  }
);

router.post(
  '/:id/transition',
  requireRole(WRITE_ROLES),
  validateBody(orderTransitionSchema),
  async (req, res) => {
    try {
      const updated = await orderService.transitionOrder(
        req.params.id,
        req.validated.action,
        req.user?.id
      );
      res.json(updated);
    } catch (err) {
      if (err.code === 'NOT_FOUND') {
        return res.status(404).json({ error: err.message });
      }
      if (err.code === 'INVALID_TRANSITION' || err.code === 'INVALID_ACTION') {
        return res.status(409).json({ error: err.message });
      }
      console.error('Transition order error:', err);
      res.status(400).json({ error: err.message || 'Failed to transition order' });
    }
  }
);

module.exports = router;
