const express = require('express');
const { query, transaction } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  const { search, category, active, low_stock, limit = 100, offset = 0 } = req.query;

  try {
    let sql = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1`;
    const params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      sql += ` AND (p.name ILIKE $${paramCount} OR p.sku ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (category) {
      paramCount++;
      sql += ` AND p.category_id = $${paramCount}`;
      params.push(category);
    }

    if (active !== undefined) {
      paramCount++;
      sql += ` AND p.is_active = $${paramCount}`;
      params.push(active === 'true');
    }

    if (low_stock === 'true') {
      sql += ` AND p.current_stock <= p.min_stock`;
    }

    sql += ` ORDER BY p.name LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM categories ORDER BY name'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

router.post('/', authorize('admin', 'manager'), async (req, res) => {
  const {
    sku, name, description, category_id, unit, purchase_price,
    sale_price, vat_rate, min_stock, warehouse_location
  } = req.body;

  if (!sku || !name || !sale_price) {
    return res.status(400).json({ error: 'SKU, name, and sale price are required' });
  }

  try {
    const result = await query(
      `INSERT INTO products (
        sku, name, description, category_id, unit, purchase_price,
        sale_price, vat_rate, min_stock, warehouse_location, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        sku, name, description, category_id, unit || 'Stk', purchase_price || 0,
        sale_price, vat_rate || 20, min_stock || 0, warehouse_location, req.user.id
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'SKU already exists' });
    }
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.put('/:id', authorize('admin', 'manager'), async (req, res) => {
  const { id } = req.params;
  const {
    sku, name, description, category_id, unit, purchase_price,
    sale_price, vat_rate, min_stock, warehouse_location, is_active
  } = req.body;

  try {
    const result = await query(
      `UPDATE products SET
        sku = COALESCE($1, sku),
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        category_id = $4,
        unit = COALESCE($5, unit),
        purchase_price = COALESCE($6, purchase_price),
        sale_price = COALESCE($7, sale_price),
        vat_rate = COALESCE($8, vat_rate),
        min_stock = COALESCE($9, min_stock),
        warehouse_location = COALESCE($10, warehouse_location),
        is_active = COALESCE($11, is_active),
        updated_by = $12,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $13
      RETURNING *`,
      [
        sku, name, description, category_id, unit, purchase_price,
        sale_price, vat_rate, min_stock, warehouse_location, is_active,
        req.user.id, id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'SKU already exists' });
    }
    res.status(500).json({ error: 'Failed to update product' });
  }
});

router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const orderItems = await query(
      'SELECT COUNT(*) FROM order_items WHERE product_id = $1',
      [req.params.id]
    );

    if (parseInt(orderItems.rows[0].count) > 0) {
      return res.status(409).json({
        error: 'Cannot delete product with existing orders'
      });
    }

    const result = await query(
      'DELETE FROM products WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

router.post('/categories', authorize('admin', 'manager'), async (req, res) => {
  const { name, description, parent_id } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  try {
    const result = await query(
      'INSERT INTO categories (name, description, parent_id) VALUES ($1, $2, $3) RETURNING *',
      [name, description, parent_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Category already exists' });
    }
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.get('/:id/movements', async (req, res) => {
  try {
    const result = await query(
      `SELECT m.*, u.name as user_name
       FROM inventory_movements m
       JOIN users u ON m.user_id = u.id
       WHERE m.item_type = 'product' AND m.item_id = $1
       ORDER BY m.created_at DESC LIMIT 100`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch movements' });
  }
});

module.exports = router;
