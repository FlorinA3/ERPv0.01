const { getClient } = require('../db/client');

/**
 * Reserve the next number for a given sequence key (e.g. invoice, credit_note).
 * Supports yearly resets via number_sequences.current_year/reset_annually.
 * Uses SELECT ... FOR UPDATE to ensure concurrency safety.
 */
async function reserveNextNumber(sequenceKey, options = {}) {
  if (!sequenceKey) {
    const err = new Error('sequenceKey is required');
    err.code = 'INVALID_SEQUENCE_KEY';
    throw err;
  }

  const now = options.now ? new Date(options.now) : new Date();
  const year = now.getFullYear();
  const externalClient = !!options.client;
  const client = options.client || (await getClient());

  try {
    if (!externalClient) {
      await client.query('BEGIN');
    }

    let seqRes = await client.query(
      'SELECT * FROM number_sequences WHERE key = $1 FOR UPDATE',
      [sequenceKey]
    );

    if (!seqRes.rowCount) {
      const insertRes = await client.query(
        `INSERT INTO number_sequences (key, prefix, suffix, pad_length, current_year, last_number, reset_annually)
         VALUES ($1, $2, $3, $4, $5, 0, TRUE)
         RETURNING *`,
        [sequenceKey, sequenceKey.charAt(0).toUpperCase(), '', 5, year]
      );
      seqRes = { rows: insertRes.rows };
    }

    const row = seqRes.rows[0];
    let lastNumber = Number(row.last_number) || 0;
    let currentYear = Number(row.current_year) || year;

    if (row.reset_annually && currentYear !== year) {
      lastNumber = 0;
      currentYear = year;
    }

    const nextValue = lastNumber + 1;
    await client.query(
      `UPDATE number_sequences
         SET last_number = $1,
             current_year = $2,
             updated_at = NOW()
       WHERE id = $3`,
      [nextValue, currentYear, row.id]
    );

    const prefix = row.prefix || '';
    const suffix = row.suffix || '';
    const padLength = row.pad_length || 5;
    const yearPart = row.reset_annually ? String(currentYear) : '';
    const numericPart = String(nextValue).padStart(padLength, '0');

    const formatted = [prefix, yearPart, numericPart].filter(Boolean).join('-') + (suffix || '');

    if (!externalClient) {
      await client.query('COMMIT');
    }

    return {
      number: formatted,
      value: nextValue,
      key: sequenceKey,
    };
  } catch (err) {
    if (!externalClient) {
      await client.query('ROLLBACK');
    }
    throw err;
  } finally {
    if (!externalClient) {
      client.release();
    }
  }
}

module.exports = {
  reserveNextNumber,
};
