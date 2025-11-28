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

async function listCustomers({ search, page, limit } = {}) {
  requirePool();
  const { limit: take, offset } = buildPagination({ page, limit });

  const params = [];
  const where = ['deleted_at IS NULL'];

  if (search) {
    params.push(`%${search.toLowerCase()}%`);
    where.push(
      `(LOWER(company_name) LIKE $${params.length} OR LOWER(internal_id) LIKE $${params.length} OR LOWER(vat_number) LIKE $${params.length})`
    );
  }

  const sql = `
    SELECT id, internal_id, company_name, status, vat_number, payment_terms, delivery_terms,
           price_segment, default_currency, default_language, row_version, created_at, updated_at
    FROM customers
    WHERE ${where.join(' AND ')}
    ORDER BY created_at DESC
    LIMIT ${take} OFFSET ${offset};
  `;

  const { rows } = await pool.query(sql, params);
  return rows;
}

async function getCustomerById(id) {
  requirePool();
  const { rows } = await pool.query(
    `SELECT id, internal_id, company_name, status, vat_number, payment_terms, delivery_terms,
            price_segment, default_currency, default_language, row_version, created_at, updated_at, deleted_at
     FROM customers
     WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function createCustomer(data) {
  requirePool();
  const sql = `
    INSERT INTO customers
      (internal_id, company_name, status, vat_number, payment_terms, delivery_terms,
       price_segment, default_currency, default_language)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id, internal_id, company_name, status, vat_number, payment_terms, delivery_terms,
              price_segment, default_currency, default_language, row_version, created_at, updated_at;
  `;
  const params = [
    data.internal_id || null,
    data.company_name,
    data.status || 'active',
    data.vat_number || null,
    data.payment_terms || null,
    data.delivery_terms || null,
    data.price_segment || null,
    data.default_currency || 'EUR',
    data.default_language || null,
  ];
  const { rows } = await pool.query(sql, params);
  return rows[0];
}

async function updateCustomer(id, data, expectedRowVersion) {
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

  add('internal_id', data.internal_id ?? null);
  add('company_name', data.company_name);
  add('status', data.status);
  add('vat_number', data.vat_number ?? null);
  add('payment_terms', data.payment_terms ?? null);
  add('delivery_terms', data.delivery_terms ?? null);
  add('price_segment', data.price_segment ?? null);
  add('default_currency', data.default_currency);
  add('default_language', data.default_language ?? null);
  add('updated_at', new Date());

  if (!fields.length) {
    return getCustomerById(id);
  }

  params.push(id);
  params.push(expectedRowVersion);
  const sql = `
    UPDATE customers
    SET ${fields.join(', ')}, row_version = row_version + 1
    WHERE id = $${params.length - 1} AND row_version = $${params.length}
    RETURNING id, internal_id, company_name, status, vat_number, payment_terms, delivery_terms,
              price_segment, default_currency, default_language, row_version, created_at, updated_at, deleted_at;
  `;

  const { rows } = await pool.query(sql, params);
  if (!rows.length) {
    const err = new Error('Concurrent update detected');
    err.code = 'CONCURRENT_UPDATE';
    throw err;
  }
  return rows[0] || null;
}

async function softDeleteCustomer(id) {
  requirePool();
  const { rows } = await pool.query(
    `UPDATE customers
     SET deleted_at = COALESCE(deleted_at, NOW()), updated_at = NOW(), row_version = row_version + 1
     WHERE id = $1
     RETURNING id`,
    [id]
  );
  return rows[0] || null;
}

module.exports = {
  listCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  softDeleteCustomer,
};
