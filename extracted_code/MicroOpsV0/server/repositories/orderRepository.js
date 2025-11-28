const { pool } = require('../db/client');

function requirePool() {
  if (!pool) {
    throw new Error('Database is not configured');
  }
}

function buildPagination({ page = 1, limit = 50 } = {}) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 200));
  const safePage = Math.max(1, Number(page) || 1);
  const offset = (safePage - 1) * safeLimit;
  return { limit: safeLimit, offset, page: safePage };
}

async function listOrders({ search, status, page, limit } = {}) {
  requirePool();
  const { limit: take, offset } = buildPagination({ page, limit });

  const params = [];
  const where = ['o.deleted_at IS NULL'];

  if (status) {
    params.push(status);
    where.push(`o.status = $${params.length}`);
  }

  if (search) {
    params.push(`%${search.toLowerCase()}%`);
    where.push(
      `(LOWER(o.order_number) LIKE $${params.length} OR LOWER(c.company_name) LIKE $${params.length})`
    );
  }

  const sql = `
    SELECT
      o.*,
      c.company_name AS customer_name
    FROM orders o
    JOIN customers c ON o.customer_id = c.id
    WHERE ${where.join(' AND ')}
    ORDER BY o.created_at DESC
    LIMIT ${take} OFFSET ${offset};
  `;

  const { rows } = await pool.query(sql, params);
  return rows;
}

async function getOrderById(id) {
  requirePool();
  const { rows } = await pool.query(
    `
    SELECT o.*, c.company_name AS customer_name
    FROM orders o
    JOIN customers c ON o.customer_id = c.id
    WHERE o.id = $1
    `,
    [id]
  );
  return rows[0] || null;
}

async function getOrderItems(orderId) {
  requirePool();
  const { rows } = await pool.query(
    `
    SELECT *
    FROM order_items
    WHERE order_id = $1
    ORDER BY line_number ASC, id ASC
    `,
    [orderId]
  );
  return rows;
}

async function createOrder(data) {
  requirePool();
  const sql = `
    INSERT INTO orders (
      order_number,
      customer_id,
      price_list_id,
      status,
      order_date,
      planned_delivery,
      currency,
      subtotal_net,
      vat_amount,
      total_gross,
      payment_terms,
      delivery_terms,
      created_by,
      updated_by
    )
    VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10, $11, $12, $13, $14
    )
    RETURNING *;
  `;
  const params = [
    data.order_number,
    data.customer_id,
    data.price_list_id || null,
    data.status || 'draft',
    data.order_date || new Date(),
    data.planned_delivery || null,
    data.currency || 'EUR',
    data.subtotal_net ?? 0,
    data.vat_amount ?? 0,
    data.total_gross ?? 0,
    data.payment_terms || null,
    data.delivery_terms || null,
    data.created_by || null,
    data.updated_by || null,
  ];
  const { rows } = await pool.query(sql, params);
  return rows[0];
}

async function updateOrder(id, data) {
  requirePool();
  const fields = [];
  const params = [];

  const add = (column, value) => {
    if (value !== undefined) {
      params.push(value);
      fields.push(`${column} = $${params.length}`);
    }
  };

  add('price_list_id', data.price_list_id ?? null);
  add('status', data.status);
  add('order_date', data.order_date);
  add('planned_delivery', data.planned_delivery ?? null);
  add('currency', data.currency);
  add('subtotal_net', data.subtotal_net);
  add('vat_amount', data.vat_amount);
  add('total_gross', data.total_gross);
  add('payment_terms', data.payment_terms ?? null);
  add('delivery_terms', data.delivery_terms ?? null);
  add('updated_by', data.updated_by ?? null);
  add('updated_at', new Date());

  if (!fields.length) {
    return getOrderById(id);
  }

  params.push(id);
  const sql = `
    UPDATE orders
    SET ${fields.join(', ')}
    WHERE id = $${params.length}
    RETURNING *;
  `;

  const { rows } = await pool.query(sql, params);
  return rows[0] || null;
}

module.exports = {
  listOrders,
  getOrderById,
  getOrderItems,
  createOrder,
  updateOrder,
};
