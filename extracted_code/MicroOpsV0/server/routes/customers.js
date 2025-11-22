const express = require('express');
const { query, transaction } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

async function getNextCustomerNumber() {
  const result = await query(
    `UPDATE sequences SET current_value = current_value + 1
     WHERE name = 'customer'
     RETURNING prefix, current_value, year`
  );
  const { prefix, current_value, year } = result.rows[0];
  return `${prefix}-${year}-${String(current_value).padStart(5, '0')}`;
}

router.get('/', async (req, res) => {
  const { search, active, limit = 100, offset = 0 } = req.query;

  try {
    let sql = `
      SELECT id, customer_number, company_name, contact_name, email, phone,
             city, country, credit_limit, is_active, created_at
      FROM customers WHERE 1=1`;
    const params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      sql += ` AND (company_name ILIKE $${paramCount} OR customer_number ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (active !== undefined) {
      paramCount++;
      sql += ` AND is_active = $${paramCount}`;
      params.push(active === 'true');
    }

    sql += ` ORDER BY company_name LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM customers WHERE id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

router.post('/', authorize('admin', 'manager', 'sales'), async (req, res) => {
  const {
    company_name, contact_name, email, phone, address, city,
    postal_code, country, vat_number, credit_limit, payment_terms, notes
  } = req.body;

  if (!company_name) {
    return res.status(400).json({ error: 'Company name is required' });
  }

  try {
    const customerNumber = await getNextCustomerNumber();

    const result = await query(
      `INSERT INTO customers (
        customer_number, company_name, contact_name, email, phone, address,
        city, postal_code, country, vat_number, credit_limit, payment_terms,
        notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        customerNumber, company_name, contact_name, email, phone, address,
        city, postal_code, country || 'AT', vat_number, credit_limit || 0,
        payment_terms || 30, notes, req.user.id
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Customer already exists' });
    }
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

router.put('/:id', authorize('admin', 'manager', 'sales'), async (req, res) => {
  const { id } = req.params;
  const {
    company_name, contact_name, email, phone, address, city,
    postal_code, country, vat_number, credit_limit, payment_terms, notes, is_active
  } = req.body;

  try {
    const result = await query(
      `UPDATE customers SET
        company_name = COALESCE($1, company_name),
        contact_name = COALESCE($2, contact_name),
        email = COALESCE($3, email),
        phone = COALESCE($4, phone),
        address = COALESCE($5, address),
        city = COALESCE($6, city),
        postal_code = COALESCE($7, postal_code),
        country = COALESCE($8, country),
        vat_number = COALESCE($9, vat_number),
        credit_limit = COALESCE($10, credit_limit),
        payment_terms = COALESCE($11, payment_terms),
        notes = COALESCE($12, notes),
        is_active = COALESCE($13, is_active),
        updated_by = $14,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $15
      RETURNING *`,
      [
        company_name, contact_name, email, phone, address, city,
        postal_code, country, vat_number, credit_limit, payment_terms,
        notes, is_active, req.user.id, id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const orders = await query(
      'SELECT COUNT(*) FROM orders WHERE customer_id = $1',
      [req.params.id]
    );

    if (parseInt(orders.rows[0].count) > 0) {
      return res.status(409).json({
        error: 'Cannot delete customer with existing orders',
        orderCount: parseInt(orders.rows[0].count)
      });
    }

    const result = await query(
      'DELETE FROM customers WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ message: 'Customer deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

router.get('/:id/orders', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, order_number, order_date, status, total_gross
       FROM orders WHERE customer_id = $1
       ORDER BY order_date DESC LIMIT 50`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customer orders' });
  }
});

router.get('/:id/documents', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, document_type, document_number, document_date, status, total_gross
       FROM documents WHERE customer_id = $1
       ORDER BY document_date DESC LIMIT 50`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customer documents' });
  }
});

module.exports = router;
