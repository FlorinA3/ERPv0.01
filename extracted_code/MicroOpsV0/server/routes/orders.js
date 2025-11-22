const express = require('express');
const { query, transaction } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

async function getNextOrderNumber() {
  const result = await query(
    `UPDATE sequences SET current_value = current_value + 1
     WHERE name = 'order'
     RETURNING prefix, current_value, year`
  );
  const { prefix, current_value, year } = result.rows[0];
  return `${prefix}-${year}-${String(current_value).padStart(5, '0')}`;
}

router.get('/', async (req, res) => {
  const { customer_id, status, from_date, to_date, limit = 100, offset = 0 } = req.query;

  try {
    let sql = `
      SELECT o.*, c.company_name as customer_name
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE 1=1`;
    const params = [];
    let paramCount = 0;

    if (customer_id) {
      paramCount++;
      sql += ` AND o.customer_id = $${paramCount}`;
      params.push(customer_id);
    }

    if (status) {
      paramCount++;
      sql += ` AND o.status = $${paramCount}`;
      params.push(status);
    }

    if (from_date) {
      paramCount++;
      sql += ` AND o.order_date >= $${paramCount}`;
      params.push(from_date);
    }

    if (to_date) {
      paramCount++;
      sql += ` AND o.order_date <= $${paramCount}`;
      params.push(to_date);
    }

    sql += ` ORDER BY o.order_date DESC, o.order_number DESC
             LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const order = await query(
      `SELECT o.*, c.company_name as customer_name, c.address, c.city, c.postal_code
       FROM orders o
       JOIN customers c ON o.customer_id = c.id
       WHERE o.id = $1`,
      [req.params.id]
    );

    if (order.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const items = await query(
      `SELECT oi.*, p.name as product_name, p.sku
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1
       ORDER BY oi.created_at`,
      [req.params.id]
    );

    res.json({
      ...order.rows[0],
      items: items.rows
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

router.post('/', authorize('admin', 'manager', 'sales'), async (req, res) => {
  const { customer_id, delivery_date, shipping_address, notes, items } = req.body;

  if (!customer_id || !items || items.length === 0) {
    return res.status(400).json({ error: 'Customer and items are required' });
  }

  try {
    const result = await transaction(async (client) => {
      const orderNumber = await getNextOrderNumber();

      let totalNet = 0;
      let totalVat = 0;

      for (const item of items) {
        const product = await client.query(
          'SELECT sale_price, vat_rate FROM products WHERE id = $1',
          [item.product_id]
        );
        if (product.rows.length === 0) {
          throw new Error(`Product ${item.product_id} not found`);
        }

        const price = item.unit_price || product.rows[0].sale_price;
        const vatRate = item.vat_rate || product.rows[0].vat_rate;
        const discount = item.discount_percent || 0;
        const lineNet = price * item.quantity * (1 - discount / 100);
        const lineVat = lineNet * vatRate / 100;

        totalNet += lineNet;
        totalVat += lineVat;
      }

      const orderResult = await client.query(
        `INSERT INTO orders (
          order_number, customer_id, order_date, delivery_date, status,
          shipping_address, total_net, total_vat, total_gross, notes, created_by
        ) VALUES ($1, $2, CURRENT_DATE, $3, 'draft', $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          orderNumber, customer_id, delivery_date, shipping_address,
          totalNet, totalVat, totalNet + totalVat, notes, req.user.id
        ]
      );

      const order = orderResult.rows[0];

      for (const item of items) {
        const product = await client.query(
          'SELECT sale_price, vat_rate FROM products WHERE id = $1',
          [item.product_id]
        );

        const price = item.unit_price || product.rows[0].sale_price;
        const vatRate = item.vat_rate || product.rows[0].vat_rate;
        const discount = item.discount_percent || 0;
        const lineNet = price * item.quantity * (1 - discount / 100);
        const lineVat = lineNet * vatRate / 100;

        await client.query(
          `INSERT INTO order_items (
            order_id, product_id, quantity, unit_price, discount_percent,
            vat_rate, line_net, line_vat, line_gross
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            order.id, item.product_id, item.quantity, price, discount,
            vatRate, lineNet, lineVat, lineNet + lineVat
          ]
        );
      }

      return order;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: error.message || 'Failed to create order' });
  }
});

router.put('/:id', authorize('admin', 'manager', 'sales'), async (req, res) => {
  const { id } = req.params;
  const { delivery_date, shipping_address, notes, status } = req.body;

  try {
    const current = await query('SELECT status FROM orders WHERE id = $1', [id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (['invoiced', 'cancelled'].includes(current.rows[0].status)) {
      return res.status(400).json({ error: 'Cannot modify invoiced or cancelled orders' });
    }

    const result = await query(
      `UPDATE orders SET
        delivery_date = COALESCE($1, delivery_date),
        shipping_address = COALESCE($2, shipping_address),
        notes = COALESCE($3, notes),
        status = COALESCE($4, status),
        updated_by = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *`,
      [delivery_date, shipping_address, notes, status, req.user.id, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order' });
  }
});

router.post('/:id/confirm', authorize('admin', 'manager', 'sales'), async (req, res) => {
  try {
    const result = await transaction(async (client) => {
      const order = await client.query(
        'SELECT * FROM orders WHERE id = $1 FOR UPDATE',
        [req.params.id]
      );

      if (order.rows.length === 0) {
        throw new Error('Order not found');
      }

      if (order.rows[0].status !== 'draft') {
        throw new Error('Only draft orders can be confirmed');
      }

      const items = await client.query(
        'SELECT product_id, quantity FROM order_items WHERE order_id = $1',
        [req.params.id]
      );

      for (const item of items.rows) {
        const stock = await client.query(
          'SELECT current_stock FROM products WHERE id = $1',
          [item.product_id]
        );

        if (stock.rows[0].current_stock < item.quantity) {
          throw new Error(`Insufficient stock for product ${item.product_id}`);
        }
      }

      await client.query(
        `UPDATE orders SET status = 'confirmed', updated_by = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [req.user.id, req.params.id]
      );

      return { message: 'Order confirmed' };
    });

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/ship', authorize('admin', 'manager', 'warehouse'), async (req, res) => {
  try {
    const result = await transaction(async (client) => {
      const order = await client.query(
        'SELECT * FROM orders WHERE id = $1 FOR UPDATE',
        [req.params.id]
      );

      if (order.rows.length === 0) {
        throw new Error('Order not found');
      }

      if (!['confirmed', 'production'].includes(order.rows[0].status)) {
        throw new Error('Order must be confirmed before shipping');
      }

      const items = await client.query(
        'SELECT product_id, quantity FROM order_items WHERE order_id = $1',
        [req.params.id]
      );

      for (const item of items.rows) {
        const product = await client.query(
          'SELECT current_stock FROM products WHERE id = $1 FOR UPDATE',
          [item.product_id]
        );

        const newStock = product.rows[0].current_stock - item.quantity;

        await client.query(
          'UPDATE products SET current_stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [newStock, item.product_id]
        );

        await client.query(
          `INSERT INTO inventory_movements (
            item_type, item_id, movement_type, quantity, quantity_before, quantity_after,
            reference_type, reference_id, reason, user_id
          ) VALUES ('product', $1, 'out', $2, $3, $4, 'order', $5, 'Order shipment', $6)`,
          [
            item.product_id, item.quantity, product.rows[0].current_stock,
            newStock, req.params.id, req.user.id
          ]
        );
      }

      await client.query(
        `UPDATE orders SET status = 'shipped', updated_by = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [req.user.id, req.params.id]
      );

      return { message: 'Order shipped' };
    });

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const order = await query('SELECT status FROM orders WHERE id = $1', [req.params.id]);

    if (order.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.rows[0].status !== 'draft') {
      return res.status(400).json({ error: 'Only draft orders can be deleted' });
    }

    await query('DELETE FROM orders WHERE id = $1', [req.params.id]);
    res.json({ message: 'Order deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

module.exports = router;
