const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const archiver = require('archiver');
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.use(authorize('admin'));

const BACKUP_DIR = process.env.BACKUP_DIR || '/tmp/microops_backups';

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

router.post('/create', async (req, res) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `microops_backup_${timestamp}.sql`;
  const filepath = path.join(BACKUP_DIR, filename);

  try {
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || 5432;
    const dbName = process.env.DB_NAME || 'microops_erp';
    const dbUser = process.env.DB_USER || 'microops';

    await new Promise((resolve, reject) => {
      const cmd = `pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -f ${filepath}`;
      exec(cmd, { env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD } }, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    const fileBuffer = fs.readFileSync(filepath);
    const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const fileSize = fs.statSync(filepath).size;

    await query(
      `INSERT INTO backup_log (backup_file, backup_type, file_size, checksum, status)
       VALUES ($1, 'manual', $2, $3, 'success')`,
      [filename, fileSize, checksum]
    );

    res.json({
      message: 'Backup created successfully',
      filename,
      size: fileSize,
      checksum
    });
  } catch (error) {
    await query(
      `INSERT INTO backup_log (backup_file, backup_type, status, error_message)
       VALUES ($1, 'manual', 'failed', $2)`,
      [filename, error.message]
    );
    res.status(500).json({ error: 'Backup failed: ' + error.message });
  }
});

router.get('/list', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM backup_log ORDER BY created_at DESC LIMIT 50`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch backup list' });
  }
});

router.get('/download/:filename', async (req, res) => {
  const filepath = path.join(BACKUP_DIR, req.params.filename);

  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'Backup file not found' });
  }

  res.download(filepath);
});

router.post('/restore', async (req, res) => {
  const { filename } = req.body;

  if (!filename) {
    return res.status(400).json({ error: 'Filename required' });
  }

  const filepath = path.join(BACKUP_DIR, filename);

  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'Backup file not found' });
  }

  try {
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || 5432;
    const dbName = process.env.DB_NAME || 'microops_erp';
    const dbUser = process.env.DB_USER || 'microops';

    await new Promise((resolve, reject) => {
      const cmd = `psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -f ${filepath}`;
      exec(cmd, { env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD } }, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    res.json({ message: 'Restore completed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Restore failed: ' + error.message });
  }
});

router.delete('/:filename', async (req, res) => {
  const filepath = path.join(BACKUP_DIR, req.params.filename);

  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'Backup file not found' });
  }

  try {
    fs.unlinkSync(filepath);
    await query(
      'DELETE FROM backup_log WHERE backup_file = $1',
      [req.params.filename]
    );
    res.json({ message: 'Backup deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete backup' });
  }
});

router.post('/export-data', async (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `microops_export_${timestamp}.json`;
    const filepath = path.join(BACKUP_DIR, filename);

    const tables = ['customers', 'products', 'components', 'orders', 'order_items',
                    'documents', 'document_items', 'inventory_movements', 'categories'];

    const data = {};

    for (const table of tables) {
      const result = await query(`SELECT * FROM ${table}`);
      data[table] = result.rows;
    }

    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));

    res.download(filepath, filename, () => {
      fs.unlinkSync(filepath);
    });
  } catch (error) {
    res.status(500).json({ error: 'Export failed: ' + error.message });
  }
});

router.get('/verify/:filename', async (req, res) => {
  const filepath = path.join(BACKUP_DIR, req.params.filename);

  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'Backup file not found' });
  }

  try {
    const fileBuffer = fs.readFileSync(filepath);
    const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    const stored = await query(
      'SELECT checksum FROM backup_log WHERE backup_file = $1',
      [req.params.filename]
    );

    if (stored.rows.length === 0) {
      return res.json({ valid: true, checksum, message: 'No stored checksum to compare' });
    }

    const isValid = stored.rows[0].checksum === checksum;

    if (isValid) {
      await query(
        'UPDATE backup_log SET verified_at = CURRENT_TIMESTAMP WHERE backup_file = $1',
        [req.params.filename]
      );
    }

    res.json({
      valid: isValid,
      calculated: checksum,
      stored: stored.rows[0].checksum
    });
  } catch (error) {
    res.status(500).json({ error: 'Verification failed: ' + error.message });
  }
});

module.exports = router;
