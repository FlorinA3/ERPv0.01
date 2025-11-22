const express = require('express');
const { query, transaction } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

async function getNextDocumentNumber(type) {
  const seqName = type === 'credit_note' ? 'credit_note' : type;
  const result = await query(
    `UPDATE sequences SET current_value = current_value + 1
     WHERE name = $1
     RETURNING prefix, current_value, year`,
    [seqName]
  );
  const { prefix, current_value, year } = result.rows[0];
  return `${prefix}-${year}-${String(current_value).padStart(5, '0')}`;
}

router.get('/', async (req, res) => {
  const { type, customer_id, status, from_date, to_date, limit = 100, offset = 0 } = req.query;

  try {
    let sql = `
      SELECT d.*, c.company_name as customer_name
      FROM documents d
      JOIN customers c ON d.customer_id = c.id
      WHERE 1=1`;
    const params = [];
    let paramCount = 0;

    if (type) {
      paramCount++;
      sql += ` AND d.document_type = $${paramCount}`;
      params.push(type);
    }

    if (customer_id) {
      paramCount++;
      sql += ` AND d.customer_id = $${paramCount}`;
      params.push(customer_id);
    }

    if (status) {
      paramCount++;
      sql += ` AND d.status = $${paramCount}`;
      params.push(status);
    }

    if (from_date) {
      paramCount++;
      sql += ` AND d.document_date >= $${paramCount}`;
      params.push(from_date);
    }

    if (to_date) {
      paramCount++;
      sql += ` AND d.document_date <= $${paramCount}`;
      params.push(to_date);
    }

    sql += ` ORDER BY d.document_date DESC, d.document_number DESC
             LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const doc = await query(
      `SELECT d.*, c.company_name, c.address, c.city, c.postal_code, c.vat_number
       FROM documents d
       JOIN customers c ON d.customer_id = c.id
       WHERE d.id = $1`,
      [req.params.id]
    );

    if (doc.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const items = await query(
      `SELECT * FROM document_items WHERE document_id = $1`,
      [req.params.id]
    );

    res.json({
      ...doc.rows[0],
      items: items.rows
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

router.post('/from-order/:orderId', authorize('admin', 'manager', 'sales'), async (req, res) => {
  const { orderId } = req.params;
  const { document_type = 'invoice' } = req.body;

  try {
    const result = await transaction(async (client) => {
      const order = await client.query(
        `SELECT o.*, c.company_name, c.vat_number
         FROM orders o
         JOIN customers c ON o.customer_id = c.id
         WHERE o.id = $1`,
        [orderId]
      );

      if (order.rows.length === 0) {
        throw new Error('Order not found');
      }

      if (order.rows[0].status === 'draft') {
        throw new Error('Cannot create document from draft order');
      }

      const docNumber = await getNextDocumentNumber(document_type);

      const docResult = await client.query(
        `INSERT INTO documents (
          document_type, document_number, order_id, customer_id, document_date,
          due_date, status, total_net, total_vat, total_gross, created_by
        ) VALUES ($1, $2, $3, $4, CURRENT_DATE, CURRENT_DATE + 30, 'draft',
                  $5, $6, $7, $8)
        RETURNING *`,
        [
          document_type, docNumber, orderId, order.rows[0].customer_id,
          order.rows[0].total_net, order.rows[0].total_vat,
          order.rows[0].total_gross, req.user.id
        ]
      );

      const items = await client.query(
        `SELECT oi.*, p.name as product_name
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = $1`,
        [orderId]
      );

      for (const item of items.rows) {
        await client.query(
          `INSERT INTO document_items (
            document_id, product_id, description, quantity, unit_price,
            discount_percent, vat_rate, line_net, line_vat, line_gross
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            docResult.rows[0].id, item.product_id, item.product_name,
            item.quantity, item.unit_price, item.discount_percent,
            item.vat_rate, item.line_net, item.line_vat, item.line_gross
          ]
        );
      }

      return docResult.rows[0];
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/post', authorize('admin', 'manager'), async (req, res) => {
  try {
    const result = await transaction(async (client) => {
      const doc = await client.query(
        'SELECT * FROM documents WHERE id = $1 FOR UPDATE',
        [req.params.id]
      );

      if (doc.rows.length === 0) {
        throw new Error('Document not found');
      }

      if (doc.rows[0].status !== 'draft') {
        throw new Error('Only draft documents can be posted');
      }

      await client.query(
        `UPDATE documents SET
          status = 'posted',
          posted_at = CURRENT_TIMESTAMP,
          posted_by = $1,
          updated_by = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2`,
        [req.user.id, req.params.id]
      );

      if (doc.rows[0].document_type === 'invoice' && doc.rows[0].order_id) {
        await client.query(
          `UPDATE orders SET status = 'invoiced', updated_by = $1, updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [req.user.id, doc.rows[0].order_id]
        );
      }

      return { message: 'Document posted successfully' };
    });

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/mark-paid', authorize('admin', 'manager'), async (req, res) => {
  try {
    const doc = await query('SELECT status FROM documents WHERE id = $1', [req.params.id]);

    if (doc.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (doc.rows[0].status !== 'posted' && doc.rows[0].status !== 'sent') {
      return res.status(400).json({ error: 'Only posted documents can be marked as paid' });
    }

    await query(
      `UPDATE documents SET
        status = 'paid',
        updated_by = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2`,
      [req.user.id, req.params.id]
    );

    res.json({ message: 'Document marked as paid' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update document' });
  }
});

router.get('/:id/pdf', async (req, res) => {
  try {
    const doc = await query(
      'SELECT pdf_content, document_number, document_type FROM documents WHERE id = $1',
      [req.params.id]
    );

    if (doc.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (!doc.rows[0].pdf_content) {
      return res.status(404).json({ error: 'PDF not generated yet' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition',
      `inline; filename="${doc.rows[0].document_number}.pdf"`);
    res.send(doc.rows[0].pdf_content);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch PDF' });
  }
});

router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const doc = await query('SELECT status FROM documents WHERE id = $1', [req.params.id]);

    if (doc.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (doc.rows[0].status !== 'draft') {
      return res.status(400).json({ error: 'Only draft documents can be deleted' });
    }

    await query('DELETE FROM documents WHERE id = $1', [req.params.id]);
    res.json({ message: 'Document deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

module.exports = router;
