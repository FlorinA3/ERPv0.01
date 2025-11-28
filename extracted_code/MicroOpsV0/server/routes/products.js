const express = require('express');
const { validateBody } = require('../validation/middleware');
const { productSchema, productUpdateSchema } = require('../validation/schemas');
const {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  softDeleteProduct,
} = require('../repositories/productRepository');
const { requireRole } = require('../middleware/auth');

function createProductsRouter() {
  const router = express.Router();

  router.get('/', async (req, res) => {
    try {
      const { search, page, limit } = req.query;
      const products = await listProducts({ search, page, limit });
      res.json(products);
    } catch (err) {
      console.error('List products error:', err.message || err);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      const product = await getProductById(req.params.id);
      if (!product || product.deleted_at) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json(product);
    } catch (err) {
      console.error('Get product error:', err.message || err);
      res.status(500).json({ error: 'Failed to fetch product' });
    }
  });

  router.post(
    '/',
    requireRole(['admin', 'sales', 'warehouse']),
    validateBody(productSchema),
    async (req, res) => {
      try {
        const created = await createProduct(req.validated);
        res.status(201).json(created);
      } catch (err) {
        console.error('Create product error:', err.message || err);
        res.status(500).json({ error: 'Failed to create product' });
      }
    }
  );

  router.put(
    '/:id',
    requireRole(['admin', 'sales', 'warehouse']),
    validateBody(productUpdateSchema),
    async (req, res) => {
      try {
        const updated = await updateProduct(req.params.id, req.validated, req.validated.row_version);
        if (!updated) {
          return res.status(404).json({ error: 'Product not found' });
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
        console.error('Update product error:', err.message || err);
        res.status(500).json({ error: 'Failed to update product' });
      }
    }
  );

  router.delete(
    '/:id',
    requireRole(['admin', 'sales', 'warehouse']),
    async (req, res) => {
      try {
        const deleted = await softDeleteProduct(req.params.id);
        if (!deleted) {
          return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ success: true });
      } catch (err) {
        console.error('Delete product error:', err.message || err);
        res.status(500).json({ error: 'Failed to delete product' });
      }
    }
  );

  return router;
}

module.exports = createProductsRouter;
