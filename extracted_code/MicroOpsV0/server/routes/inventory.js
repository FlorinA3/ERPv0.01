const express = require('express');
const { query, transaction } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/products', async (req, res) => {
  const { low_stock, search } = req.query;

  try {
    let sql = `
      SELECT id, sku, name, unit, current_stock, min_stock, warehouse_location
      FROM products WHERE is_active = true`;
    const params = [];

    if (low_stock === 'true') {
      sql += ` AND current_stock <= min_stock`;
    }

    if (search) {
      sql += ` AND (name ILIKE $1 OR sku ILIKE $1)`;
      params.push(`%${search}%`);
    }

    sql += ` ORDER BY name`;

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

router.get('/components', async (req, res) => {
  const { low_stock, search } = req.query;

  try {
    let sql = `
      SELECT id, sku, name, unit, current_stock, min_stock, warehouse_location, supplier
      FROM components WHERE is_active = true`;
    const params = [];

    if (low_stock === 'true') {
      sql += ` AND current_stock <= min_stock`;
    }

    if (search) {
      sql += ` AND (name ILIKE $1 OR sku ILIKE $1)`;
      params.push(`%${search}%`);
    }

    sql += ` ORDER BY name`;

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch components' });
  }
});

router.post('/adjust', authorize('admin', 'manager', 'warehouse'), async (req, res) => {
  const { item_type, item_id, quantity, movement_type, reason, lot_number } = req.body;

  if (!item_type || !item_id || quantity === undefined || !movement_type) {
    return res.status(400).json({ error: 'Item type, ID, quantity and movement type required' });
  }

  if (!['product', 'component'].includes(item_type)) {
    return res.status(400).json({ error: 'Invalid item type' });
  }

  if (!['in', 'out', 'adjustment', 'loss'].includes(movement_type)) {
    return res.status(400).json({ error: 'Invalid movement type' });
  }

  try {
    const result = await transaction(async (client) => {
      const table = item_type === 'product' ? 'products' : 'components';
      const item = await client.query(
        `SELECT current_stock FROM ${table} WHERE id = $1 FOR UPDATE`,
        [item_id]
      );

      if (item.rows.length === 0) {
        throw new Error('Item not found');
      }

      const currentStock = parseFloat(item.rows[0].current_stock);
      let newStock;

      if (movement_type === 'in') {
        newStock = currentStock + Math.abs(quantity);
      } else if (movement_type === 'out' || movement_type === 'loss') {
        newStock = currentStock - Math.abs(quantity);
        if (newStock < 0) {
          throw new Error('Insufficient stock');
        }
      } else {
        newStock = quantity;
      }

      await client.query(
        `UPDATE ${table} SET current_stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [newStock, item_id]
      );

      const movementQty = movement_type === 'adjustment'
        ? newStock - currentStock
        : (movement_type === 'in' ? Math.abs(quantity) : -Math.abs(quantity));

      await client.query(
        `INSERT INTO inventory_movements (
          item_type, item_id, movement_type, quantity, quantity_before, quantity_after,
          lot_number, reason, user_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          item_type, item_id, movement_type, movementQty,
          currentStock, newStock, lot_number, reason, req.user.id
        ]
      );

      return {
        item_id,
        previous_stock: currentStock,
        new_stock: newStock,
        movement: movementQty
      };
    });

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/movements', async (req, res) => {
  const { item_type, item_id, from_date, to_date, limit = 100, offset = 0 } = req.query;

  try {
    let sql = `
      SELECT m.*, u.name as user_name
      FROM inventory_movements m
      JOIN users u ON m.user_id = u.id
      WHERE 1=1`;
    const params = [];
    let paramCount = 0;

    if (item_type) {
      paramCount++;
      sql += ` AND m.item_type = $${paramCount}`;
      params.push(item_type);
    }

    if (item_id) {
      paramCount++;
      sql += ` AND m.item_id = $${paramCount}`;
      params.push(item_id);
    }

    if (from_date) {
      paramCount++;
      sql += ` AND m.created_at >= $${paramCount}`;
      params.push(from_date);
    }

    if (to_date) {
      paramCount++;
      sql += ` AND m.created_at <= $${paramCount}`;
      params.push(to_date);
    }

    sql += ` ORDER BY m.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch movements' });
  }
});

router.get('/alerts', async (req, res) => {
  try {
    const products = await query(`
      SELECT 'product' as type, id, sku, name, current_stock, min_stock
      FROM products
      WHERE is_active = true AND current_stock <= min_stock
      ORDER BY (current_stock - min_stock)
    `);

    const components = await query(`
      SELECT 'component' as type, id, sku, name, current_stock, min_stock
      FROM components
      WHERE is_active = true AND current_stock <= min_stock
      ORDER BY (current_stock - min_stock)
    `);

    res.json({
      products: products.rows,
      components: components.rows,
      total: products.rows.length + components.rows.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

router.post('/components', authorize('admin', 'manager'), async (req, res) => {
  const {
    sku, name, description, unit, purchase_price,
    min_stock, warehouse_location, supplier
  } = req.body;

  if (!sku || !name) {
    return res.status(400).json({ error: 'SKU and name are required' });
  }

  try {
    const result = await query(
      `INSERT INTO components (
        sku, name, description, unit, purchase_price,
        min_stock, warehouse_location, supplier, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        sku, name, description, unit || 'Stk', purchase_price || 0,
        min_stock || 0, warehouse_location, supplier, req.user.id
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'SKU already exists' });
    }
    res.status(500).json({ error: 'Failed to create component' });
  }
});

router.put('/components/:id', authorize('admin', 'manager'), async (req, res) => {
  const { id } = req.params;
  const {
    sku, name, description, unit, purchase_price,
    min_stock, warehouse_location, supplier, is_active
  } = req.body;

  try {
    const result = await query(
      `UPDATE components SET
        sku = COALESCE($1, sku),
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        unit = COALESCE($4, unit),
        purchase_price = COALESCE($5, purchase_price),
        min_stock = COALESCE($6, min_stock),
        warehouse_location = COALESCE($7, warehouse_location),
        supplier = COALESCE($8, supplier),
        is_active = COALESCE($9, is_active),
        updated_by = $10,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING *`,
      [
        sku, name, description, unit, purchase_price,
        min_stock, warehouse_location, supplier, is_active, req.user.id, id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Component not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update component' });
  }
});

module.exports = router;
