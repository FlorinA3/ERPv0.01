const express = require('express');
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.use(authorize('admin', 'manager'));

router.get('/', async (req, res) => {
  const { table_name, user_id, action, from_date, to_date, record_id, limit = 100, offset = 0 } = req.query;

  try {
    let sql = `
      SELECT a.*, u.name as user_name
      FROM audit_log a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE 1=1`;
    const params = [];
    let paramCount = 0;

    if (table_name) {
      paramCount++;
      sql += ` AND a.table_name = $${paramCount}`;
      params.push(table_name);
    }

    if (user_id) {
      paramCount++;
      sql += ` AND a.user_id = $${paramCount}`;
      params.push(user_id);
    }

    if (action) {
      paramCount++;
      sql += ` AND a.action = $${paramCount}`;
      params.push(action);
    }

    if (record_id) {
      paramCount++;
      sql += ` AND a.record_id = $${paramCount}`;
      params.push(record_id);
    }

    if (from_date) {
      paramCount++;
      sql += ` AND a.created_at >= $${paramCount}`;
      params.push(from_date);
    }

    if (to_date) {
      paramCount++;
      sql += ` AND a.created_at <= $${paramCount}`;
      params.push(to_date);
    }

    sql += ` ORDER BY a.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

router.get('/record/:table/:id', async (req, res) => {
  const { table, id } = req.params;

  try {
    const result = await query(
      `SELECT a.*, u.name as user_name
       FROM audit_log a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.table_name = $1 AND a.record_id = $2
       ORDER BY a.created_at DESC`,
      [table, id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch record history' });
  }
});

router.get('/user/:userId', async (req, res) => {
  const { from_date, to_date, limit = 100 } = req.query;

  try {
    let sql = `
      SELECT a.*, u.name as user_name
      FROM audit_log a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.user_id = $1`;
    const params = [req.params.userId];
    let paramCount = 1;

    if (from_date) {
      paramCount++;
      sql += ` AND a.created_at >= $${paramCount}`;
      params.push(from_date);
    }

    if (to_date) {
      paramCount++;
      sql += ` AND a.created_at <= $${paramCount}`;
      params.push(to_date);
    }

    sql += ` ORDER BY a.created_at DESC LIMIT $${paramCount + 1}`;
    params.push(parseInt(limit));

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user activity' });
  }
});

router.get('/stats', async (req, res) => {
  const { days = 30 } = req.query;

  try {
    const actionStats = await query(`
      SELECT action, COUNT(*) as count
      FROM audit_log
      WHERE created_at >= CURRENT_DATE - $1::integer
      GROUP BY action
      ORDER BY count DESC`,
      [days]
    );

    const tableStats = await query(`
      SELECT table_name, COUNT(*) as count
      FROM audit_log
      WHERE created_at >= CURRENT_DATE - $1::integer
      GROUP BY table_name
      ORDER BY count DESC`,
      [days]
    );

    const userStats = await query(`
      SELECT u.name as user_name, COUNT(*) as count
      FROM audit_log a
      JOIN users u ON a.user_id = u.id
      WHERE a.created_at >= CURRENT_DATE - $1::integer
      GROUP BY u.id, u.name
      ORDER BY count DESC
      LIMIT 10`,
      [days]
    );

    const dailyStats = await query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM audit_log
      WHERE created_at >= CURRENT_DATE - $1::integer
      GROUP BY DATE(created_at)
      ORDER BY date`,
      [days]
    );

    res.json({
      by_action: actionStats.rows,
      by_table: tableStats.rows,
      by_user: userStats.rows,
      by_day: dailyStats.rows
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit stats' });
  }
});

router.get('/compliance/invoices', async (req, res) => {
  const { year } = req.query;
  const targetYear = year || new Date().getFullYear();

  try {
    const result = await query(`
      SELECT
        a.created_at as posted_at,
        u.name as posted_by,
        a.new_value->>'document_number' as invoice_number,
        a.new_value->>'total_gross' as amount,
        a.new_value->>'customer_id' as customer_id
      FROM audit_log a
      JOIN users u ON a.user_id = u.id
      WHERE a.table_name = 'documents'
        AND a.action = 'UPDATE'
        AND a.new_value->>'status' = 'posted'
        AND a.new_value->>'document_type' = 'invoice'
        AND EXTRACT(YEAR FROM a.created_at) = $1
      ORDER BY a.created_at`,
      [targetYear]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch compliance report' });
  }
});

module.exports = router;
