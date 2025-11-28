const express = require('express');
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT key, value FROM config');
    const config = {};
    for (const row of result.rows) {
      config[row.key] = row.value;
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch config' });
  }
});

router.get('/:key', async (req, res) => {
  try {
    const result = await query(
      'SELECT value FROM config WHERE key = $1',
      [req.params.key]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Config not found' });
    }

    res.json(result.rows[0].value);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch config' });
  }
});

router.put('/:key', authorize('admin'), async (req, res) => {
  const { key } = req.params;
  const { value } = req.body;

  if (value === undefined) {
    return res.status(400).json({ error: 'Value is required' });
  }

  try {
    await query(
      `INSERT INTO config (key, value, updated_by, updated_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (key) DO UPDATE SET
         value = $2,
         updated_by = $3,
         updated_at = CURRENT_TIMESTAMP`,
      [key, JSON.stringify(value), req.user.id]
    );

    res.json({ message: 'Config updated', key, value });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update config' });
  }
});

router.post('/initialize', authorize('admin'), async (req, res) => {
  const defaultConfig = {
    company: {
      name: 'DF-Pure GmbH',
      address: 'Musterstraße 1',
      city: 'Wien',
      postalCode: '1010',
      country: 'AT',
      phone: '+43 1 234567',
      email: 'office@df-pure.at',
      vatNumber: 'ATU12345678',
      bankName: 'Erste Bank',
      iban: 'AT12 3456 7890 1234 5678',
      bic: 'GIBAATWWXXX'
    },
    invoicing: {
      defaultPaymentTerms: 30,
      defaultVatRate: 20,
      invoicePrefix: 'RE',
      deliveryPrefix: 'LS',
      creditNotePrefix: 'GS'
    },
    inventory: {
      lowStockAlertEnabled: true,
      defaultUnit: 'Stk'
    },
    ui: {
      theme: 'dark',
      language: 'de',
      dateFormat: 'DD.MM.YYYY',
      currencySymbol: '€',
      currencyPosition: 'after'
    }
  };

  try {
    for (const [key, value] of Object.entries(defaultConfig)) {
      await query(
        `INSERT INTO config (key, value, updated_by)
         VALUES ($1, $2, $3)
         ON CONFLICT (key) DO NOTHING`,
        [key, JSON.stringify(value), req.user.id]
      );
    }

    res.json({ message: 'Config initialized with defaults' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to initialize config' });
  }
});

router.get('/sequences/all', authorize('admin', 'manager'), async (req, res) => {
  try {
    const result = await query('SELECT * FROM sequences ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sequences' });
  }
});

router.put('/sequences/:name', authorize('admin'), async (req, res) => {
  const { name } = req.params;
  const { prefix, current_value } = req.body;

  try {
    const result = await query(
      `UPDATE sequences SET
        prefix = COALESCE($1, prefix),
        current_value = COALESCE($2, current_value),
        updated_at = CURRENT_TIMESTAMP
      WHERE name = $3
      RETURNING *`,
      [prefix, current_value, name]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sequence not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update sequence' });
  }
});

router.get('/dashboard/stats', async (req, res) => {
  try {
    const customers = await query('SELECT COUNT(*) FROM customers WHERE is_active = true');
    const products = await query('SELECT COUNT(*) FROM products WHERE is_active = true');
    const orders = await query("SELECT COUNT(*) FROM orders WHERE status NOT IN ('cancelled', 'invoiced')");
    const invoices = await query("SELECT COUNT(*) FROM documents WHERE document_type = 'invoice' AND status = 'posted'");

    const revenue = await query(`
      SELECT COALESCE(SUM(total_gross), 0) as total
      FROM documents
      WHERE document_type = 'invoice'
        AND status IN ('posted', 'paid')
        AND EXTRACT(MONTH FROM document_date) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM document_date) = EXTRACT(YEAR FROM CURRENT_DATE)
    `);

    // Legacy dashboard metric: relies on old current_stock column (not authoritative vs inventory_movements).
    const lowStock = await query(`
      SELECT COUNT(*) FROM products
      WHERE is_active = true AND current_stock <= min_stock
    `);

    res.json({
      customers: parseInt(customers.rows[0].count),
      products: parseInt(products.rows[0].count),
      openOrders: parseInt(orders.rows[0].count),
      postedInvoices: parseInt(invoices.rows[0].count),
      monthlyRevenue: parseFloat(revenue.rows[0].total),
      lowStockAlerts: parseInt(lowStock.rows[0].count)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

module.exports = router;
