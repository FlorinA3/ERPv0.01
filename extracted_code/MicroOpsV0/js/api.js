/**
 * App.Api - Data Access Layer
 *
 * This module abstracts all data operations to prepare for backend migration.
 * Currently uses localStorage via App.Data, but can be switched to REST API calls.
 *
 * Usage:
 *   const customers = await App.Api.customers.list();
 *   const customer = await App.Api.customers.get(id);
 *   await App.Api.customers.create(data);
 *   await App.Api.customers.update(id, data);
 *   await App.Api.customers.delete(id);
 */

App.Api = {
  // Configuration for API mode
  config: {
    mode: 'remote', // 'local' | 'remote' - CHANGED TO REMOTE
    baseUrl: '/api', // Changed from /api/v1
    timeout: 30000
  },

  /**
   * Generic fetch wrapper for remote API calls
   */
  async _fetch(endpoint, options = {}) {
    if (this.config.mode === 'local') {
      throw new Error('Remote fetch called in local mode');
    }

    const url = `${this.config.baseUrl}${endpoint}`;
    const method = (options.method || 'GET').toUpperCase();
    const mutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    if (mutating && App.Services?.Offline?.isOffline?.()) {
      const message = 'You appear to be offline. This action requires a connection.';
      App.UI?.Toast?.show(message, 'warning');
      const err = new Error(message);
      err.code = 'OFFLINE';
      err.status = 0;
      throw err;
    }

    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${App.Services.Auth.getToken?.() || ''}`
      },
      timeout: this.config.timeout
    };

    let response;
    try {
      response = await fetch(url, { ...defaultOptions, ...options });
    } catch (networkErr) {
      const isOffline = App.Services?.Offline?.isOffline?.();
      const message = isOffline
        ? 'You appear to be offline. This action requires a connection.'
        : 'Network error while reaching the server. Please retry.';
      App.UI?.Toast?.show(message, 'warning');
      const err = new Error(message);
      err.status = 0;
      err.code = isOffline ? 'OFFLINE' : 'NETWORK_ERROR';
      throw err;
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText, code: undefined }));
      if (response.status === 409) {
        const msg =
          error.message ||
          error.error ||
          'Conflict: This record was changed by another user. Please reload to see the latest version.';
        App.UI?.Toast?.show(msg, 'warning');
        const conflict = new Error(msg);
        conflict.status = 409;
        conflict.code = error.code || 'CONFLICT';
        throw conflict;
      }
      const err = new Error(error.message || `API Error: ${response.status}`);
      err.status = response.status;
      err.code = error.code;
      throw err;
    }

    return response.json();
  },

  /**
   * Generic collection helper to create CRUD operations
   */
  _createCollection(collectionName, idPrefix) {
    return {
      /**
       * List all items with optional filtering
       */
      async list(filters = {}) {
        if (App.Api.config.mode === 'local') {
          let items = App.Data[collectionName] || [];

          // Apply filters
          if (filters.where) {
            items = items.filter(item => {
              return Object.entries(filters.where).every(([key, value]) => {
                if (typeof value === 'function') return value(item[key]);
                return item[key] === value;
              });
            });
          }

          // Apply sorting
          if (filters.orderBy) {
            const { field, direction = 'asc' } = filters.orderBy;
            items = [...items].sort((a, b) => {
              const aVal = a[field];
              const bVal = b[field];
              const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
              return direction === 'desc' ? -cmp : cmp;
            });
          }

          // Apply pagination
          if (filters.limit) {
            const offset = filters.offset || 0;
            items = items.slice(offset, offset + filters.limit);
          }

          return { data: items, total: (App.Data[collectionName] || []).length };
        }

        // Remote mode
        const params = new URLSearchParams();
        if (filters.limit) params.set('limit', filters.limit);
        if (filters.offset) params.set('offset', filters.offset);
        if (filters.orderBy) params.set('orderBy', `${filters.orderBy.field}:${filters.orderBy.direction || 'asc'}`);

        return App.Api._fetch(`/${collectionName}?${params.toString()}`);
      },

      /**
       * Get single item by ID
       */
      async get(id) {
        if (App.Api.config.mode === 'local') {
          const items = App.Data[collectionName] || [];
          const item = items.find(x => x.id === id);
          if (!item) throw new Error(`${collectionName} item not found: ${id}`);
          return { data: item };
        }

        return App.Api._fetch(`/${collectionName}/${id}`);
      },

      /**
       * Create new item
       */
      async create(data) {
        if (App.Api.config.mode === 'local') {
          const items = App.Data[collectionName] || [];
          const newItem = {
            id: App.Utils.generateId(idPrefix),
            ...data,
            createdAt: new Date().toISOString(),
            createdBy: App.Services.Auth.currentUser?.id || null
          };
          items.push(newItem);
          App.DB.save();
          return { data: newItem };
        }

        return App.Api._fetch(`/${collectionName}`, {
          method: 'POST',
          body: JSON.stringify(data)
        });
      },

      /**
       * Update existing item
       */
      async update(id, data) {
        if (App.Api.config.mode === 'local') {
          const items = App.Data[collectionName] || [];
          const idx = items.findIndex(x => x.id === id);
          if (idx === -1) throw new Error(`${collectionName} item not found: ${id}`);

          items[idx] = {
            ...items[idx],
            ...data,
            updatedAt: new Date().toISOString(),
            updatedBy: App.Services.Auth.currentUser?.id || null
          };
          App.DB.save();
          return { data: items[idx] };
        }

        return App.Api._fetch(`/${collectionName}/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        });
      },

      /**
       * Partial update (patch)
       */
      async patch(id, data) {
        return this.update(id, data);
      },

      /**
       * Delete item
       */
      async delete(id) {
        if (App.Api.config.mode === 'local') {
          const items = App.Data[collectionName] || [];
          const idx = items.findIndex(x => x.id === id);
          if (idx === -1) throw new Error(`${collectionName} item not found: ${id}`);

          items.splice(idx, 1);
          App.DB.save();
          return { success: true };
        }

        return App.Api._fetch(`/${collectionName}/${id}`, {
          method: 'DELETE'
        });
      },

      /**
       * Bulk operations
       */
      async bulkCreate(dataArray) {
        const results = [];
        for (const data of dataArray) {
          const result = await this.create(data);
          results.push(result.data);
        }
        return { data: results };
      },

      async bulkUpdate(updates) {
        const results = [];
        for (const { id, data } of updates) {
          const result = await this.update(id, data);
          results.push(result.data);
        }
        return { data: results };
      },

      async bulkDelete(ids) {
        for (const id of ids) {
          await this.delete(id);
        }
        return { success: true, count: ids.length };
      },

      /**
       * Count items with optional filter
       */
      async count(filters = {}) {
        if (App.Api.config.mode === 'local') {
          let items = App.Data[collectionName] || [];
          if (filters.where) {
            items = items.filter(item => {
              return Object.entries(filters.where).every(([key, value]) => item[key] === value);
            });
          }
          return { count: items.length };
        }

        return App.Api._fetch(`/${collectionName}/count`);
      }
    };
  },

  // Initialize all collections
  customers: null,
  products: null,
  components: null,
  suppliers: null,
  carriers: null,
  orders: null,
  documents: null,
  productionOrders: null,
  movements: null,
  users: null,
  priceLists: null,
  tasks: null,

  /**
   * Initialize the API module
   */
  init() {
    // Create standard collections
    this.customers = this._createCollection('customers', 'cust');
    this.products = this._createCollection('products', 'prod');
    this.components = this._createCollection('components', 'comp');
    this.suppliers = this._createCollection('suppliers', 'sup');
    this.carriers = this._createCollection('carriers', 'car');
    this.orders = this._createCollection('orders', 'ord');
    this.documents = this._createCollection('documents', 'doc');
    this.productionOrders = this._createCollection('productionOrders', 'po');
    this.movements = this._createCollection('movements', 'mov');
    this.users = this._createCollection('users', 'usr');
    this.priceLists = this._createCollection('priceLists', 'pl');
    this.tasks = this._createCollection('tasks', 'task');

    // Order methods
    this.orders.confirm = async (id) => {
      if (this.config.mode === 'local') {
        const orders = App.Data.orders || [];
        const order = orders.find(o => o.id === id);
        if (order) {
          order.status = 'confirmed';
          order.confirmedAt = new Date().toISOString();
          App.DB.save();
          return { data: order };
        }
      }

      return this._fetch(`/orders/${id}/confirm`, {
        method: 'POST'
      });
    };

    this.orders.ship = async (id, trackingNumber) => {
      if (this.config.mode === 'local') {
        const orders = App.Data.orders || [];
        const order = orders.find(o => o.id === id);
        if (order) {
          order.status = 'shipped';
          order.trackingNumber = trackingNumber;
          order.shippedAt = new Date().toISOString();
          App.DB.save();
          return { data: order };
        }
      }

      return this._fetch(`/orders/${id}/ship`, {
        method: 'POST',
        body: JSON.stringify({ trackingNumber })
      });
    };

    // Document methods
    this.documents.generateFromOrder = async (orderId) => {
      if (this.config.mode === 'local') {
        const orders = App.Data.orders || [];
        const order = orders.find(o => o.id === orderId);
        if (!order) throw new Error('Order not found');

        const doc = {
          id: App.Utils.generateId('doc'),
          orderId,
          type: 'invoice',
          date: new Date().toISOString(),
          items: order.items || [],
          customerId: order.customerId,
          subtotal: order.subtotal || 0,
          tax: order.tax || 0,
          grossTotal: order.total || 0,
          status: 'draft'
        };

        (App.Data.documents || []).push(doc);
        App.DB.save();
        return { data: doc };
      }

      return this._fetch(`/documents/from-order/${orderId}`, {
        method: 'POST'
      });
    };

    // Production order methods
    this.productionOrders.complete = async (id) => {
      if (this.config.mode === 'local') {
        const po = (App.Data.productionOrders || []).find(x => x.id === id);
        if (po) {
          po.status = 'completed';
          po.completedAt = new Date().toISOString();
          App.DB.save();
          return { data: po };
        }
      }

      return this._fetch(`/production-orders/${id}/complete`, {
        method: 'POST'
      });
    };

    // Movement methods
    this.movements.getByProduct = async (productId) => {
      return this.movements.list({
        where: { productId },
        orderBy: { field: 'date', direction: 'desc' }
      });
    };

    this.movements.getByDateRange = async (startDate, endDate) => {
      if (this.config.mode === 'local') {
        const movements = App.Data.movements || [];
        const filtered = movements.filter(m => {
          const date = new Date(m.date);
          return date >= new Date(startDate) && date <= new Date(endDate);
        });
        return { data: filtered };
      }
      return this._fetch(`/movements?start=${startDate}&end=${endDate}`);
    };

    // Price list methods
    this.priceLists.getActiveForCustomer = async (customerId) => {
      if (this.config.mode === 'local') {
        const customer = (App.Data.customers || []).find(c => c.id === customerId);
        const priceLists = App.Data.priceLists || [];
        const now = new Date();

        // Find applicable price lists
        const applicable = priceLists.filter(pl => {
          if (!pl.active) return false;
          if (pl.validFrom && new Date(pl.validFrom) > now) return false;
          if (pl.validTo && new Date(pl.validTo) < now) return false;

          // Check if applies to this customer or their segment
          if (pl.customerId && pl.customerId === customerId) return true;
          if (pl.segment && customer && pl.segment === customer.segment) return true;
          if (!pl.customerId && !pl.segment) return true; // Default price list

          return false;
        });

        return { data: applicable };
      }
      return this._fetch(`/price-lists/customer/${customerId}`);
    };

    this.priceLists.getPriceForProduct = async (productId, customerId) => {
      if (this.config.mode === 'local') {
        const customer = (App.Data.customers || []).find(c => c.id === customerId);
        const product = (App.Data.products || []).find(p => p.id === productId);
        const priceLists = App.Data.priceLists || [];
        const now = new Date();

        // Priority: Customer-specific > Segment > Default
        let price = product?.dealerPrice || 0;

        for (const pl of priceLists) {
          if (!pl.active) continue;
          if (pl.validFrom && new Date(pl.validFrom) > now) continue;
          if (pl.validTo && new Date(pl.validTo) < now) continue;

          const priceEntry = pl.prices?.find(p => p.productId === productId);
          if (!priceEntry) continue;

          // Customer-specific takes highest priority
          if (pl.customerId === customerId) {
            price = priceEntry.price;
            break;
          }

          // Segment-specific
          if (pl.segment && customer && pl.segment === customer.segment) {
            price = priceEntry.price;
            continue;
          }

          // Default (no customer or segment specified)
          if (!pl.customerId && !pl.segment) {
            price = priceEntry.price;
          }
        }

        return { price };
      }
      return this._fetch(`/price-lists/price/${productId}/${customerId}`);
    };
  },

  /**
   * Dashboard aggregations
   */
  dashboard: {
    async getStats() {
      if (App.Api.config.mode === 'local') {
        const orders = App.Data.orders || [];
        const documents = App.Data.documents || [];
        const products = App.Data.products || [];

        const totalRevenue = documents
          .filter(d => d.type === 'invoice')
          .reduce((sum, d) => sum + (d.grossTotal || 0), 0);

        const openOrders = orders.filter(o =>
          !['paid', 'cancelled'].includes(o.status?.toLowerCase())
        ).length;

        const lowStockCount = products.filter(p =>
          p.type !== 'Service' &&
          (p.stock || 0) <= (p.minStock || 0)
        ).length;

        return {
          totalRevenue,
          openOrders,
          lowStockCount,
          totalProducts: products.length,
          totalCustomers: (App.Data.customers || []).length
        };
      }
      return App.Api._fetch('/dashboard/stats');
    },

    async getRecentOrders(limit = 5) {
      return App.Api.orders.list({
        orderBy: { field: 'date', direction: 'desc' },
        limit
      });
    },

    async getRecentDocuments(limit = 5) {
      return App.Api.documents.list({
        orderBy: { field: 'date', direction: 'desc' },
        limit
      });
    }
  },

  /**
   * Reports aggregations
   */
  reports: {
    async getSalesByPeriod(startDate, endDate) {
      if (App.Api.config.mode === 'local') {
        const documents = App.Data.documents || [];
        const invoices = documents.filter(d => {
          if (d.type !== 'invoice') return false;
          const date = new Date(d.date);
          return date >= new Date(startDate) && date <= new Date(endDate);
        });

        const total = invoices.reduce((sum, d) => sum + (d.grossTotal || 0), 0);
        const count = invoices.length;

        return { total, count, invoices };
      }
      return App.Api._fetch(`/reports/sales?start=${startDate}&end=${endDate}`);
    },

    async getInventoryValue() {
      if (App.Api.config.mode === 'local') {
        const products = App.Data.products || [];
        const value = products
          .filter(p => p.type !== 'Service')
          .reduce((sum, p) => sum + ((p.stock || 0) * (p.avgPurchasePrice || 0)), 0);

        return { value };
      }
      return App.Api._fetch('/reports/inventory-value');
    },

    async getTopCustomers(limit = 10) {
      if (App.Api.config.mode === 'local') {
        const documents = App.Data.documents || [];
        const customerTotals = {};

        documents
          .filter(d => d.type === 'invoice')
          .forEach(d => {
            customerTotals[d.customerId] = (customerTotals[d.customerId] || 0) + (d.grossTotal || 0);
          });

        const customers = App.Data.customers || [];
        const ranked = Object.entries(customerTotals)
          .map(([id, total]) => {
            const customer = customers.find(c => c.id === id);
            return { customer, total };
          })
          .filter(r => r.customer)
          .sort((a, b) => b.total - a.total)
          .slice(0, limit);

        return { data: ranked };
      }
      return App.Api._fetch(`/reports/top-customers?limit=${limit}`);
    },

    async getTopProducts(limit = 10) {
      if (App.Api.config.mode === 'local') {
        const orders = App.Data.orders || [];
        const productTotals = {};

        orders.forEach(o => {
          (o.items || []).forEach(item => {
            productTotals[item.productId] = (productTotals[item.productId] || 0) + item.qty;
          });
        });

        const products = App.Data.products || [];
        const ranked = Object.entries(productTotals)
          .map(([id, qty]) => {
            const product = products.find(p => p.id === id);
            return { product, quantity: qty };
          })
          .filter(r => r.product)
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, limit);

        return { data: ranked };
      }
      return App.Api._fetch(`/reports/top-products?limit=${limit}`);
    }
  },

  /**
   * Config operations
   */
  configApi: {
    async get() {
      if (App.Api.config.mode === 'local') {
        return { data: App.Data.config || {} };
      }
      return App.Api._fetch('/config');
    },

    async update(data) {
      if (App.Api.config.mode === 'local') {
        App.Data.config = { ...App.Data.config, ...data };
        App.DB.save();
        return { data: App.Data.config };
      }
      return App.Api._fetch('/config', {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    }
  }
};

// Initialize on load
App.Api.init();
