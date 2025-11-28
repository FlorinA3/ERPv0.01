App.Audit = {
  log(action, entity, entityId, oldValue, newValue) {
    const entry = {
      id: this._generateId(),
      timestamp: new Date().toISOString(),
      userId: App.currentUser?.id || App.currentUser?.name || 'system',
      userName: App.currentUser?.name || 'System',
      action: action,
      entity: entity,
      entityId: entityId,
      oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
      newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
      changes: oldValue && newValue ? this._detectChanges(oldValue, newValue) : []
    };

    if (!App.Data.auditLog) App.Data.auditLog = [];
    App.Data.auditLog.unshift(entry);

    if (App.Data.auditLog.length > 10000) {
      App.Data.auditLog = App.Data.auditLog.slice(0, 10000);
    }

    App.DB.save();
    return entry;
  },

  _generateId() {
    return 'aud_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  },

  _detectChanges(oldValue, newValue) {
    const changes = [];
    const allKeys = new Set([
      ...Object.keys(oldValue || {}),
      ...Object.keys(newValue || {})
    ]);

    for (const key of allKeys) {
      const oldVal = oldValue ? oldValue[key] : undefined;
      const newVal = newValue ? newValue[key] : undefined;

      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        changes.push({
          field: key,
          from: oldVal,
          to: newVal
        });
      }
    }
    return changes;
  },

  query(filters = {}) {
    let results = App.Data.auditLog || [];

    if (filters.userId) {
      results = results.filter(e =>
        e.userId === filters.userId ||
        e.userName?.toLowerCase().includes(filters.userId.toLowerCase())
      );
    }
    if (filters.action) {
      results = results.filter(e => e.action === filters.action);
    }
    if (filters.entity) {
      results = results.filter(e => e.entity === filters.entity);
    }
    if (filters.entityId) {
      results = results.filter(e => e.entityId === filters.entityId);
    }
    if (filters.fromDate) {
      const from = new Date(filters.fromDate);
      results = results.filter(e => new Date(e.timestamp) >= from);
    }
    if (filters.toDate) {
      const to = new Date(filters.toDate);
      to.setHours(23, 59, 59, 999);
      results = results.filter(e => new Date(e.timestamp) <= to);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      results = results.filter(e =>
        e.entityId?.toLowerCase().includes(search) ||
        e.userName?.toLowerCase().includes(search) ||
        e.action?.toLowerCase().includes(search) ||
        e.entity?.toLowerCase().includes(search)
      );
    }

    return results;
  },

  getRecordHistory(entity, entityId) {
    return this.query({ entity, entityId });
  },

  getUserActivity(userId, days = 30) {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    return this.query({ userId, fromDate: fromDate.toISOString() });
  },

  getRecentActivity(limit = 50) {
    return (App.Data.auditLog || []).slice(0, limit);
  },

  export(filters = {}) {
    const log = this.query(filters);
    let csv = 'Timestamp,User,Action,Entity,ID,Changes\n';

    for (const entry of log) {
      const changes = (entry.changes || [])
        .map(c => `${c.field}: ${this._formatValue(c.from)} → ${this._formatValue(c.to)}`)
        .join('; ');

      const row = [
        entry.timestamp,
        entry.userName || entry.userId,
        entry.action,
        entry.entity,
        entry.entityId,
        changes
      ].map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',');

      csv += row + '\n';
    }

    return csv;
  },

  _formatValue(val) {
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  },

  downloadCSV(filters = {}) {
    const csv = this.export(filters);
    const filename = `audit_log_${new Date().toISOString().slice(0, 10)}.csv`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
    return filename;
  },

  getStats(days = 30) {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    const entries = this.query({ fromDate: fromDate.toISOString() });

    const byAction = {};
    const byEntity = {};
    const byUser = {};

    for (const entry of entries) {
      byAction[entry.action] = (byAction[entry.action] || 0) + 1;
      byEntity[entry.entity] = (byEntity[entry.entity] || 0) + 1;
      byUser[entry.userName || entry.userId] = (byUser[entry.userName || entry.userId] || 0) + 1;
    }

    return { byAction, byEntity, byUser, total: entries.length };
  }
};

/**
 * Frontend validation summary (Phase 2.6)
 * - Existing coverage: customers, products, orders, documents, components (basic), now extended with shipments.
 * - Missing historically: detailed per-field errors and alignment with backend FSM/quantity rules (added below).
 * - Known backend constraints mirrored: required customer on orders/docs, positive quantities, VAT rate range, no negative stock/price.
 */
App.Validate = {
  _makeResult() {
    const errors = {};
    const add = (field, message) => {
      if (!errors[field]) errors[field] = [];
      errors[field].push(message);
    };
    const finalize = () => {
      const isValid = Object.keys(errors).length === 0;
      return { isValid, errors };
    };
    return { add, finalize };
  },

  customer(customer) {
    const res = this._makeResult();
    if (!customer.company || customer.company.trim() === '') {
      res.add('cust-company', 'Customer/Company name is required.');
    }
    if (customer.vatNumber && customer.vatNumber.trim() !== '') {
      const vat = customer.vatNumber.trim().toUpperCase();
      if (vat.startsWith('AT') && !vat.match(/^ATU[0-9]{8}$/)) {
        res.add('cust-vat', 'Austrian VAT must be ATU12345678.');
      }
    }
    if (customer.emails) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      customer.emails.forEach((email) => {
        if (email && !emailRegex.test(email)) {
          res.add('cust-emails', `Invalid email format: ${email}`);
        }
      });
    }
    return res.finalize();
  },

  product(product) {
    const res = this._makeResult();
    if (!product.sku || product.sku.trim() === '') {
      res.add('prod-artno', 'SKU / Article number is required.');
    }
    if (!product.nameDE && !product.nameEN && !product.name) {
      res.add('prod-namede', 'Product name is required.');
    }
    if (product.dealerPrice < 0 || product.endCustomerPrice < 0) {
      res.add('prod-dealer', 'Prices cannot be negative.');
    }
    if (product.stock < 0) {
      res.add('prod-stock', 'Stock cannot be negative.');
    }
    if (product.vatRate !== undefined && (product.vatRate < 0 || product.vatRate > 100)) {
      res.add('prod-vat', 'VAT rate must be between 0 and 100.');
    }
    return res.finalize();
  },

  order(order) {
    const res = this._makeResult();
    if (!order.custId && !order.customerId) {
      res.add('ord-cust', 'Customer is required.');
    }
    if (!order.items || order.items.length === 0) {
      res.add('items', 'At least one item is required.');
    }
    (order.items || []).forEach((item, idx) => {
      if (!item.productId) {
        res.add(`item-${idx}`, 'Each item must have a product.');
      }
      if (!item.qty || item.qty <= 0) {
        res.add(`item-${idx}`, 'Quantity must be greater than 0.');
      }
      if (item.unitPrice < 0) {
        res.add(`item-${idx}`, 'Item price cannot be negative.');
      }
    });
    return res.finalize();
  },

  document(doc) {
    const res = this._makeResult();
    if (!doc.customerId && !doc.customer_id) {
      res.add('doc-customer', 'Customer is required for document.');
    }
    if (!doc.type) {
      res.add('doc-type', 'Document type is required.');
    }
    if (!doc.items || doc.items.length === 0) {
      res.add('doc-items', 'Document must have at least one line item.');
    }
    return res.finalize();
  },

  shipment(payload) {
    const res = this._makeResult();
    if (!payload.document_id) {
      res.add('ship-document', 'Document is required for shipment.');
    }
    if (!payload.lines || payload.lines.length === 0) {
      res.add('ship-lines', 'At least one shipment line is required.');
    }
    (payload.lines || []).forEach((line, idx) => {
      if (!line.product_id) {
        res.add(`ship-line-${idx}`, 'Product is required.');
      }
      if (!line.quantity || line.quantity <= 0) {
        res.add(`ship-line-${idx}`, 'Quantity must be greater than 0.');
      }
    });
    return res.finalize();
  },

  component(component) {
    const res = this._makeResult();
    if (!component.componentNumber || component.componentNumber.trim() === '') {
      res.add('component-number', 'Component number required.');
    }
    if (!component.description || component.description.trim() === '') {
      res.add('component-description', 'Component description required.');
    }
    if (component.stock < 0) {
      res.add('component-stock', 'Stock cannot be negative.');
    }
    return res.finalize();
  }
};
