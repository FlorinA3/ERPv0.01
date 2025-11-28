const { pool } = require('../db/client');

function requirePool() {
  if (!pool) {
    throw new Error('Database is not configured');
  }
}

function buildPagination({ page = 1, limit = 50 }) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 200));
  const safePage = Math.max(1, Number(page) || 1);
  const offset = (safePage - 1) * safeLimit;
  return { limit: safeLimit, offset, page: safePage };
}

async function listProducts({ search, page, limit } = {}) {
  requirePool();
  const { limit: take, offset } = buildPagination({ page, limit });

  const params = [];
  const where = ['deleted_at IS NULL'];

  if (search) {
    params.push(`%${search.toLowerCase()}%`);
    where.push(
      `(LOWER(sku) LIKE $${params.length} OR LOWER(name) LIKE $${params.length} OR LOWER(description) LIKE $${params.length})`
    );
  }

  const sql = `
    SELECT id, sku, name, description, type, unit, allow_decimal_qty,
           avg_purchase_price, dealer_price, end_customer_price,
           currency, vat_rate, lifecycle_status, min_stock, row_version,
           created_at, updated_at
    FROM products
    WHERE ${where.join(' AND ')}
    ORDER BY created_at DESC
    LIMIT ${take} OFFSET ${offset};
  `;

  const { rows } = await pool.query(sql, params);
  return rows;
}

async function getProductById(id) {
  requirePool();
  const { rows } = await pool.query(
    `SELECT id, sku, name, description, type, unit, allow_decimal_qty,
            avg_purchase_price, dealer_price, end_customer_price,
            currency, vat_rate, lifecycle_status, min_stock, row_version,
            created_at, updated_at, deleted_at
     FROM products
     WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function createProduct(data) {
  requirePool();
  const sql = `
    INSERT INTO products
      (sku, name, description, type, unit, allow_decimal_qty,
       avg_purchase_price, dealer_price, end_customer_price,
       currency, vat_rate, lifecycle_status, min_stock)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING id, sku, name, description, type, unit, allow_decimal_qty,
              avg_purchase_price, dealer_price, end_customer_price,
              currency, vat_rate, lifecycle_status, min_stock, row_version,
              created_at, updated_at;
  `;
  const params = [
    data.sku,
    data.name,
    data.description || null,
    data.type || 'finished',
    data.unit || 'Stk',
    data.allow_decimal_qty || false,
    data.avg_purchase_price ?? null,
    data.dealer_price ?? null,
    data.end_customer_price ?? null,
    data.currency || 'EUR',
    data.vat_rate ?? 20,
    data.lifecycle_status || 'active',
    data.min_stock ?? 0,
  ];
  const { rows } = await pool.query(sql, params);
  return rows[0];
}

async function updateProduct(id, data, expectedRowVersion) {
  requirePool();
  if (!expectedRowVersion) {
    const err = new Error('row_version is required for update');
    err.code = 'MISSING_VERSION';
    throw err;
  }
  const fields = [];
  const params = [];

  const add = (column, value) => {
    if (value !== undefined) {
      params.push(value);
      fields.push(`${column} = $${params.length}`);
    }
  };

  add('sku', data.sku);
  add('name', data.name);
  add('description', data.description ?? null);
  add('type', data.type);
  add('unit', data.unit);
  add('allow_decimal_qty', data.allow_decimal_qty);
  add('avg_purchase_price', data.avg_purchase_price ?? null);
  add('dealer_price', data.dealer_price ?? null);
  add('end_customer_price', data.end_customer_price ?? null);
  add('currency', data.currency);
  add('vat_rate', data.vat_rate);
  add('lifecycle_status', data.lifecycle_status);
  add('min_stock', data.min_stock);
  add('updated_at', new Date());

  if (!fields.length) {
    return getProductById(id);
  }

  params.push(id);
  params.push(expectedRowVersion);
  const sql = `
    UPDATE products
    SET ${fields.join(', ')}, row_version = row_version + 1
    WHERE id = $${params.length - 1} AND row_version = $${params.length}
    RETURNING id, sku, name, description, type, unit, allow_decimal_qty,
              avg_purchase_price, dealer_price, end_customer_price,
              currency, vat_rate, lifecycle_status, min_stock, row_version,
              created_at, updated_at, deleted_at;
  `;

  const { rows } = await pool.query(sql, params);
  if (!rows.length) {
    const err = new Error('Concurrent update detected');
    err.code = 'CONCURRENT_UPDATE';
    throw err;
  }
  return rows[0] || null;
}

async function softDeleteProduct(id) {
  requirePool();
  const { rows } = await pool.query(
    `UPDATE products
     SET deleted_at = COALESCE(deleted_at, NOW()), updated_at = NOW(), row_version = row_version + 1
     WHERE id = $1
     RETURNING id`,
    [id]
  );
  return rows[0] || null;
}

module.exports = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  softDeleteProduct,
};
