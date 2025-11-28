const orderRepository = require('../repositories/orderRepository');

const ORDER_TRANSITIONS = {
  draft: ['confirmed', 'cancelled'],
  confirmed: ['in_production', 'ready_to_ship', 'cancelled'],
  in_production: ['ready_to_ship', 'cancelled'],
  ready_to_ship: ['shipped'],
  shipped: ['invoiced'],
  invoiced: ['closed'],
  closed: [],
  cancelled: [],
};

const ACTION_TARGETS = {
  confirm: 'confirmed',
  start_production: 'in_production',
  ready_to_ship: 'ready_to_ship',
  ship: 'shipped',
  invoice: 'invoiced',
  close: 'closed',
  cancel: 'cancelled',
};

// Draft-focused operations plus state transitions (inventory/sequence side effects come later).
async function createDraftOrder(payload) {
  if (!payload || !payload.customer_id) {
    throw new Error('customer_id is required');
  }

  const orderData = {
    order_number: payload.order_number || null,
    customer_id: payload.customer_id,
    price_list_id: payload.price_list_id || null,
    status: 'draft',
    order_date: payload.order_date || new Date(),
    planned_delivery: payload.planned_delivery || null,
    currency: payload.currency || 'EUR',
    subtotal_net: payload.subtotal_net ?? 0,
    vat_amount: payload.vat_amount ?? 0,
    total_gross: payload.total_gross ?? 0,
    payment_terms: payload.payment_terms || null,
    delivery_terms: payload.delivery_terms || null,
    created_by: payload.created_by || null,
    updated_by: payload.updated_by || null,
  };

  return orderRepository.createOrder(orderData);
}

async function updateDraftOrder(id, payload) {
  const existing = await orderRepository.getOrderById(id);
  if (!existing) {
    throw new Error('Order not found');
  }
  if (existing.status && existing.status !== 'draft') {
    throw new Error('Only draft orders can be updated at this stage');
  }

  return orderRepository.updateOrder(id, {
    price_list_id: payload.price_list_id,
    order_date: payload.order_date,
    planned_delivery: payload.planned_delivery,
    currency: payload.currency,
    subtotal_net: payload.subtotal_net,
    vat_amount: payload.vat_amount,
    total_gross: payload.total_gross,
    payment_terms: payload.payment_terms,
    delivery_terms: payload.delivery_terms,
    updated_by: payload.updated_by || null,
  });
}

async function getOrderWithItems(id) {
  const order = await orderRepository.getOrderById(id);
  if (!order) return null;
  const items = await orderRepository.getOrderItems(id);
  return { ...order, items };
}

function assertTransitionAllowed(currentStatus, nextStatus) {
  const allowed = ORDER_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    const err = new Error(`Transition ${currentStatus} -> ${nextStatus} is not allowed`);
    err.code = 'INVALID_TRANSITION';
    throw err;
  }
}

async function transitionOrder(id, action, actorId) {
  const order = await orderRepository.getOrderById(id);
  if (!order) {
    const err = new Error('Order not found');
    err.code = 'NOT_FOUND';
    throw err;
  }

  const targetStatus = ACTION_TARGETS[action];
  if (!targetStatus) {
    const err = new Error('Unsupported action');
    err.code = 'INVALID_ACTION';
    throw err;
  }

  assertTransitionAllowed(order.status, targetStatus);

  return orderRepository.updateOrder(id, {
    status: targetStatus,
    updated_by: actorId || null,
  });
}

module.exports = {
  createDraftOrder,
  updateDraftOrder,
  getOrderWithItems,
  transitionOrder,
};
