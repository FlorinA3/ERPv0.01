const { pool, getClient } = require('../db/client');

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

async function listMovements({ productId, orderId, documentId, page, limit } = {}, client) {
  const db = client || pool;
  requirePool();
  const { limit: take, offset } = buildPagination({ page, limit });

  const params = [];
  const where = ['1=1'];

  if (productId) {
    params.push(productId);
    where.push(`product_id = $${params.length}`);
  }

  if (orderId) {
    params.push(orderId);
    where.push(`order_id = $${params.length}`);
  }

  if (documentId) {
    params.push(documentId);
    where.push(`document_id = $${params.length}`);
  }

  const sql = `
    SELECT *
    FROM inventory_movements
    WHERE ${where.join(' AND ')}
    ORDER BY created_at DESC, id DESC
    LIMIT ${take} OFFSET ${offset};
  `;

  const { rows } = await db.query(sql, params);
  return rows;
}

async function getCurrentStockByProduct(productId, client) {
  const db = client || pool;
  requirePool();
  const { rows } = await db.query(
    `
    SELECT
      COALESCE(SUM(CASE WHEN direction = 'in' THEN quantity ELSE -quantity END), 0) AS stock
    FROM inventory_movements
    WHERE product_id = $1
    `,
    [productId]
  );
  return rows[0]?.stock || 0;
}

async function hasShipmentForDocument(documentId, client) {
  const db = client || pool;
  requirePool();
  const { rows } = await db.query(
    `
    SELECT 1
    FROM inventory_movements
    WHERE document_id = $1
      AND movement_type = 'shipment'
      AND direction = 'out'
    LIMIT 1
    `,
    [documentId]
  );
  return rows.length > 0;
}

module.exports = {
  listMovements,
  getCurrentStockByProduct,
  hasShipmentForDocument,
};
