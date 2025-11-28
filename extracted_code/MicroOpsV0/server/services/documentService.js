const documentRepository = require('../repositories/documentRepository');
const productRepository = require('../repositories/productRepository');
const sequenceService = require('./sequenceService');
const {
  computeLineTotals,
  summariseDocumentTotals,
  fromCents,
} = require('./calculationService');

const DOCUMENT_TRANSITIONS = {
  draft: ['posted', 'cancelled'],
  posted: ['paid', 'cancelled'],
  paid: [],
  cancelled: [],
};

// Draft-focused operations plus state transitions (sequence allocation and financial guards come later).
async function createDraftDocument(payload) {
  if (!payload || !payload.customer_id) {
    throw new Error('customer_id is required');
  }
  if (!payload.type) {
    throw new Error('type is required');
  }

  const docData = {
    type: payload.type,
    doc_number: payload.doc_number || null,
    order_id: payload.order_id || null,
    related_document_id: payload.related_document_id || null,
    customer_id: payload.customer_id,
    billing_address_id: payload.billing_address_id || null,
    shipping_address_id: payload.shipping_address_id || null,
    status: 'draft',
    currency: payload.currency || 'EUR',
    net_total: payload.net_total ?? 0,
    vat_total: payload.vat_total ?? 0,
    gross_total: payload.gross_total ?? 0,
    vat_summary: payload.vat_summary || null,
    payment_terms: payload.payment_terms || null,
    delivery_terms: payload.delivery_terms || null,
    due_date: payload.due_date || null,
    issued_at: payload.issued_at || new Date(),
    posted_at: null,
    created_by: payload.created_by || null,
    updated_by: payload.updated_by || null,
  };

  return documentRepository.createDocument(docData);
}

async function updateDraftDocument(id, payload) {
  const existing = await documentRepository.getDocumentById(id);
  if (!existing) {
    const err = new Error('Document not found');
    err.code = 'NOT_FOUND';
    throw err;
  }
  if (existing.status && existing.status !== 'draft') {
    const err = new Error('Only draft documents can be updated at this stage');
    err.code = 'IMMUTABLE_DOCUMENT';
    throw err;
  }

  return documentRepository.updateDocument(id, {
    doc_number: payload.doc_number,
    order_id: payload.order_id,
    related_document_id: payload.related_document_id,
    billing_address_id: payload.billing_address_id,
    shipping_address_id: payload.shipping_address_id,
    currency: payload.currency,
    net_total: payload.net_total,
    vat_total: payload.vat_total,
    gross_total: payload.gross_total,
    vat_summary: payload.vat_summary,
    payment_terms: payload.payment_terms,
    delivery_terms: payload.delivery_terms,
    due_date: payload.due_date,
    issued_at: payload.issued_at,
    updated_by: payload.updated_by || null,
  });
}

async function getDocumentWithItems(id) {
  const doc = await documentRepository.getDocumentById(id);
  if (!doc) return null;
  const items = await documentRepository.getDocumentItems(id);
  const isCopy = (doc.printed_count || 0) > 0;
  return { ...doc, items, is_copy: isCopy };
}

function assertDocumentTransition(currentStatus, nextStatus) {
  const allowed = DOCUMENT_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    const err = new Error(`Transition ${currentStatus} -> ${nextStatus} is not allowed`);
    err.code = 'INVALID_TRANSITION';
    throw err;
  }
}

async function postDocument(id, payload = {}) {
  const doc = await documentRepository.getDocumentById(id);
  if (!doc) {
    const err = new Error('Document not found');
    err.code = 'NOT_FOUND';
    throw err;
  }

  assertDocumentTransition(doc.status, 'posted');

  const items = await documentRepository.getDocumentItems(id);
  if (!items.length) {
    const err = new Error('Cannot post a document without items');
    err.code = 'INVALID_ITEMS';
    throw err;
  }

  const productVatCache = new Map();
  const lineTotals = [];

  for (const item of items) {
    let vatRate = item.vat_rate;
    if (vatRate === null || vatRate === undefined) {
      if (item.product_id) {
        if (!productVatCache.has(item.product_id)) {
          const prod = await productRepository.getProductById(item.product_id);
          productVatCache.set(item.product_id, prod ? prod.vat_rate : null);
        }
        vatRate = productVatCache.get(item.product_id);
      }
    }

    const lineTotal = computeLineTotals(
      {
        quantity: item.quantity,
        unit_price: item.unit_price,
        vat_rate: vatRate ?? 0,
        currency: doc.currency || 'EUR',
      },
      { defaultVatRate: vatRate ?? 0, currency: doc.currency || 'EUR' }
    );
    lineTotals.push(lineTotal);
  }

  const summary = summariseDocumentTotals(lineTotals);
  const vatSummaryNormalized = {};
  for (const [rate, totals] of Object.entries(summary.vat_summary)) {
    vatSummaryNormalized[rate] = {
      net: fromCents(totals.net_cents),
      vat: fromCents(totals.vat_cents),
      gross: fromCents(totals.gross_cents),
    };
  }

  const isInvoice = doc.type === 'invoice';
  const isCredit = doc.type === 'credit_note';
  let newDocNumber = doc.doc_number;

  if (isInvoice || isCredit) {
    const when = payload.posted_at || new Date();
    const sequence = await sequenceService.reserveNextNumber(
      isInvoice ? 'invoice' : 'credit_note',
      { now: when }
    );
    newDocNumber = sequence.number;
  } else {
    newDocNumber = payload.doc_number || doc.doc_number || null;
  }

  return documentRepository.updateDocument(id, {
    doc_number: newDocNumber,
    status: 'posted',
    posted_at: payload.posted_at || new Date(),
    updated_by: payload.updated_by || null,
    net_total: fromCents(summary.net_total_cents),
    vat_total: fromCents(summary.vat_total_cents),
    gross_total: fromCents(summary.gross_total_cents),
    vat_summary: vatSummaryNormalized,
  });
}

async function markDocumentPaid(id, payload = {}) {
  const doc = await documentRepository.getDocumentById(id);
  if (!doc) {
    const err = new Error('Document not found');
    err.code = 'NOT_FOUND';
    throw err;
  }

  if (doc.status === 'paid') {
    return doc;
  }

  assertDocumentTransition(doc.status, 'paid');

  return documentRepository.updateDocument(id, {
    status: 'paid',
    paid_at: payload.paid_at || new Date(),
    updated_by: payload.updated_by || null,
  });
}

async function cancelDocument(id, payload = {}) {
  const doc = await documentRepository.getDocumentById(id);
  if (!doc) {
    const err = new Error('Document not found');
    err.code = 'NOT_FOUND';
    throw err;
  }

  assertDocumentTransition(doc.status, 'cancelled');

  return documentRepository.updateDocument(id, {
    status: 'cancelled',
    updated_by: payload.updated_by || null,
  });
}

async function registerReprint(id, payload = {}) {
  const doc = await documentRepository.getDocumentById(id);
  if (!doc) {
    const err = new Error('Document not found');
    err.code = 'NOT_FOUND';
    throw err;
  }

  if (doc.status !== 'posted' && doc.status !== 'paid') {
    const err = new Error('Only posted or paid documents can be reprinted');
    err.code = 'INVALID_STATUS_FOR_REPRINT';
    throw err;
  }

  const templateVersion =
    payload.legal_template_version ||
    doc.legal_template_version ||
    'default-v1';

  const printedCount = (doc.printed_count || 0) + 1;

  return documentRepository.updateDocument(id, {
    legal_template_version: templateVersion,
    printed_count: printedCount,
    last_printed_at: payload.printed_at || new Date(),
    last_printed_by: payload.user_id || payload.userId || null,
    updated_by: payload.user_id || payload.userId || null,
  });
}

module.exports = {
  createDraftDocument,
  updateDraftDocument,
  getDocumentWithItems,
  postDocument,
  markDocumentPaid,
  cancelDocument,
  registerReprint,
};
