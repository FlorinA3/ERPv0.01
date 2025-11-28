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

async function listDocuments({ type, status, customerId, page, limit } = {}) {
  requirePool();
  const { limit: take, offset } = buildPagination({ page, limit });

  const params = [];
  const where = ['1=1'];

  if (type) {
    params.push(type);
    where.push(`d.type = $${params.length}`);
  }

  if (status) {
    params.push(status);
    where.push(`d.status = $${params.length}`);
  }

  if (customerId) {
    params.push(customerId);
    where.push(`d.customer_id = $${params.length}`);
  }

  const sql = `
    SELECT
      d.*,
      c.company_name AS customer_name
    FROM documents d
    JOIN customers c ON d.customer_id = c.id
    WHERE ${where.join(' AND ')}
    ORDER BY d.issued_at DESC, d.id DESC
    LIMIT ${take} OFFSET ${offset};
  `;

  const { rows } = await pool.query(sql, params);
  return rows;
}

async function getDocumentById(id) {
  requirePool();
  const { rows } = await pool.query(
    `
    SELECT d.*, c.company_name AS customer_name
    FROM documents d
    JOIN customers c ON d.customer_id = c.id
    WHERE d.id = $1
    `,
    [id]
  );
  return rows[0] || null;
}

async function getDocumentItems(documentId) {
  requirePool();
  const { rows } = await pool.query(
    `
    SELECT *
    FROM document_items
    WHERE document_id = $1
    ORDER BY line_number ASC, id ASC
    `,
    [documentId]
  );
  return rows;
}

async function createDocument(data) {
  requirePool();
  const sql = `
    INSERT INTO documents (
      type,
      doc_number,
      order_id,
      related_document_id,
      customer_id,
      billing_address_id,
      shipping_address_id,
      status,
      currency,
      net_total,
      vat_total,
      gross_total,
      vat_summary,
      payment_terms,
      delivery_terms,
      due_date,
      issued_at,
      posted_at,
      created_by,
      updated_by
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7,
      $8, $9, $10, $11, $12, $13, $14, $15,
      $16, $17, $18, $19, $20
    )
    RETURNING *;
  `;

  const params = [
    data.type,
    data.doc_number || null,
    data.order_id || null,
    data.related_document_id || null,
    data.customer_id,
    data.billing_address_id || null,
    data.shipping_address_id || null,
    data.status || 'draft',
    data.currency || 'EUR',
    data.net_total ?? 0,
    data.vat_total ?? 0,
    data.gross_total ?? 0,
    data.vat_summary || null,
    data.payment_terms || null,
    data.delivery_terms || null,
    data.due_date || null,
    data.issued_at || new Date(),
    data.posted_at || null,
    data.created_by || null,
    data.updated_by || null,
  ];

  const { rows } = await pool.query(sql, params);
  return rows[0];
}

async function updateDocument(id, data) {
  requirePool();
  const fields = [];
  const params = [];

  const add = (column, value) => {
    if (value !== undefined) {
      params.push(value);
      fields.push(`${column} = $${params.length}`);
    }
  };

  add('doc_number', data.doc_number ?? null);
  add('order_id', data.order_id ?? null);
  add('related_document_id', data.related_document_id ?? null);
  add('billing_address_id', data.billing_address_id ?? null);
  add('shipping_address_id', data.shipping_address_id ?? null);
  add('status', data.status);
  add('currency', data.currency);
  add('net_total', data.net_total);
  add('vat_total', data.vat_total);
  add('gross_total', data.gross_total);
  add('vat_summary', data.vat_summary || null);
  add('payment_terms', data.payment_terms ?? null);
  add('delivery_terms', data.delivery_terms ?? null);
  add('due_date', data.due_date ?? null);
  add('issued_at', data.issued_at);
  add('posted_at', data.posted_at ?? null);
  add('paid_at', data.paid_at ?? null);
  add('legal_template_version', data.legal_template_version ?? null);
  add('printed_count', data.printed_count);
  add('last_printed_at', data.last_printed_at ?? null);
  add('last_printed_by', data.last_printed_by ?? null);
  add('updated_by', data.updated_by ?? null);
  add('updated_at', new Date());

  if (!fields.length) {
    return getDocumentById(id);
  }

  params.push(id);
  const sql = `
    UPDATE documents
    SET ${fields.join(', ')}
    WHERE id = $${params.length}
    RETURNING *;
  `;

  const { rows } = await pool.query(sql, params);
  return rows[0] || null;
}

module.exports = {
  listDocuments,
  getDocumentById,
  getDocumentItems,
  createDocument,
  updateDocument,
};
