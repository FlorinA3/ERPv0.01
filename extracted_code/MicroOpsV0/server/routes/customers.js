const express = require('express');
const { validateBody } = require('../validation/middleware');
const { customerSchema, customerUpdateSchema } = require('../validation/schemas');
const {
  listCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  softDeleteCustomer,
} = require('../repositories/customerRepository');
const { requireRole } = require('../middleware/auth');

function createCustomersRouter() {
  const router = express.Router();

  router.get('/', async (req, res) => {
    try {
      const { search, page, limit } = req.query;
      const customers = await listCustomers({ search, page, limit });
      res.json(customers);
    } catch (err) {
      console.error('List customers error:', err.message || err);
      res.status(500).json({ error: 'Failed to fetch customers' });
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      const customer = await getCustomerById(req.params.id);
      if (!customer || customer.deleted_at) {
        return res.status(404).json({ error: 'Customer not found' });
      }
      res.json(customer);
    } catch (err) {
      console.error('Get customer error:', err.message || err);
      res.status(500).json({ error: 'Failed to fetch customer' });
    }
  });

  router.post('/', requireRole(['admin', 'sales']), validateBody(customerSchema), async (req, res) => {
    try {
      const created = await createCustomer(req.validated);
      res.status(201).json(created);
    } catch (err) {
      console.error('Create customer error:', err.message || err);
      res.status(500).json({ error: 'Failed to create customer' });
    }
  });

  router.put(
    '/:id',
    requireRole(['admin', 'sales']),
    validateBody(customerUpdateSchema),
    async (req, res) => {
      try {
        const updated = await updateCustomer(req.params.id, req.validated, req.validated.row_version);
        if (!updated) {
          return res.status(404).json({ error: 'Customer not found' });
        }
        res.json(updated);
      } catch (err) {
        if (err.code === 'CONCURRENT_UPDATE') {
          return res.status(409).json({
            error: 'Conflict',
            code: 'CONCURRENT_UPDATE',
            message: 'This record was changed by another user. Reload to see the latest version.',
          });
        }
        if (err.code === 'MISSING_VERSION') {
          return res.status(400).json({ error: err.message, code: err.code });
        }
        console.error('Update customer error:', err.message || err);
        res.status(500).json({ error: 'Failed to update customer' });
      }
    }
  );

  router.delete('/:id', requireRole(['admin', 'sales']), async (req, res) => {
    try {
      const deleted = await softDeleteCustomer(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Customer not found' });
      }
      res.json({ success: true });
    } catch (err) {
      console.error('Delete customer error:', err.message || err);
      res.status(500).json({ error: 'Failed to delete customer' });
    }
  });

  return router;
}

module.exports = createCustomersRouter;
