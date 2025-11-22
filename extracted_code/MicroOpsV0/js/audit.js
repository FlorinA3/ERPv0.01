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

App.Validate = {
  order(order) {
    if (!order.custId && !order.customerId) {
      throw new Error('Customer is required');
    }
    if (!order.items || order.items.length === 0) {
      throw new Error('At least 1 item required');
    }
    for (const item of order.items) {
      if (!item.productId) {
        throw new Error('Each item must have a product');
      }
      if (!item.qty || item.qty <= 0) {
        throw new Error('Item quantity must be > 0');
      }
      if (item.unitPrice < 0) {
        throw new Error('Item price cannot be negative');
      }
    }
    return true;
  },

  customer(customer) {
    if (!customer.company || customer.company.trim() === '') {
      throw new Error('Customer/Company name required');
    }
    if (customer.vatNumber && customer.vatNumber.trim() !== '') {
      const vat = customer.vatNumber.trim().toUpperCase();
      if (vat.startsWith('AT') && !vat.match(/^ATU[0-9]{8}$/)) {
        throw new Error('Austrian VAT must be format: ATU12345678');
      }
    }
    if (customer.contacts) {
      for (const contact of customer.contacts) {
        if (contact.email && !contact.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
          throw new Error(`Invalid email format: ${contact.email}`);
        }
      }
    }
    return true;
  },

  product(product) {
    if (!product.nameDE && !product.nameEN && !product.name) {
      throw new Error('Product name required');
    }
    if (product.dealerPrice < 0 || product.endCustomerPrice < 0) {
      throw new Error('Price cannot be negative');
    }
    if (product.stock < 0) {
      throw new Error('Stock cannot be negative');
    }
    if (!product.sku || product.sku.trim() === '') {
      throw new Error('SKU is required');
    }
    return true;
  },

  document(doc) {
    if (!doc.customerId) {
      throw new Error('Customer required for document');
    }
    if (!doc.items || doc.items.length === 0) {
      throw new Error('Document must have items');
    }
    return true;
  },

  component(component) {
    if (!component.componentNumber || component.componentNumber.trim() === '') {
      throw new Error('Component number required');
    }
    if (!component.description || component.description.trim() === '') {
      throw new Error('Component description required');
    }
    if (component.stock < 0) {
      throw new Error('Stock cannot be negative');
    }
    return true;
  }
};
