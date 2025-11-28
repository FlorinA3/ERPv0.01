const inventoryRepository = require('../repositories/inventoryRepository');
const { getClient } = require('../db/client');

// Snapshot helper derived from inventory_movements (INV-04); no mutation here.
async function getStockSnapshot(productId) {
  if (!productId) {
    throw new Error('productId is required');
  }
  const stock = await inventoryRepository.getCurrentStockByProduct(productId);
  return { productId, stock };
}

async function postShipment(payload) {
  if (!payload || !payload.document_id || !Array.isArray(payload.lines)) {
    const err = new Error('Invalid payload');
    err.code = 'INVALID_PAYLOAD';
    throw err;
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const docRes = await client.query(
      'SELECT * FROM documents WHERE id = $1 FOR UPDATE',
      [payload.document_id]
    );
    if (!docRes.rowCount) {
      const err = new Error('Document not found');
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (payload.order_id) {
      const orderRes = await client.query(
        'SELECT * FROM orders WHERE id = $1 FOR UPDATE',
        [payload.order_id]
      );
      if (!orderRes.rowCount) {
        const err = new Error('Order not found');
        err.code = 'ORDER_NOT_FOUND';
        throw err;
      }
    }

    const alreadyShipped = await inventoryRepository.hasShipmentForDocument(
      payload.document_id,
      client
    );
    if (alreadyShipped) {
      const err = new Error('Shipment already posted for this document.');
      err.code = 'SHIPMENT_ALREADY_POSTED';
      throw err;
    }

    for (const line of payload.lines) {
      if (!line || !line.product_id || Number(line.quantity) <= 0) {
        const err = new Error('Invalid shipment line');
        err.code = 'INVALID_LINE';
        throw err;
      }

      // Serialize competing shipments for the same product to uphold INV-01.
      await client.query('SELECT id FROM products WHERE id = $1 FOR UPDATE', [
        line.product_id,
      ]);

      const currentStock = await inventoryRepository.getCurrentStockByProduct(
        line.product_id,
        client
      );

      // Negative stock guard (INV-01): reject if movement would drop below zero.
      if (currentStock < Number(line.quantity)) {
        const err = new Error(
          `Insufficient stock for product ${line.product_id}: have ${currentStock}, need ${line.quantity}`
        );
        err.code = 'NEGATIVE_STOCK';
        throw err;
      }

      await client.query(
        `INSERT INTO inventory_movements (
          product_id,
          order_id,
          document_id,
          movement_type,
          direction,
          quantity,
          unit_cost,
          currency,
          lot_code,
          location,
          notes,
          created_by
        ) VALUES (
          $1, $2, $3, 'shipment', 'out', $4, $5, $6, $7, $8, $9, $10
        )`,
        [
          line.product_id,
          payload.order_id || null,
          payload.document_id,
          line.quantity,
          line.unit_cost ?? null,
          line.currency || 'EUR',
          line.lot_code || null,
          line.location || null,
          line.notes || null,
          payload.userId || null,
        ]
      );
    }

    await client.query('COMMIT');
    return {
      success: true,
      document_id: payload.document_id,
      order_id: payload.order_id || null,
      lines: payload.lines.length,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  getStockSnapshot,
  postShipment,
};
