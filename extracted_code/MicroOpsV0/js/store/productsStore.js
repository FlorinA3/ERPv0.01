// Store for products with basic caching, TTL, and tab sync broadcasts.
(function () {
  const TTL_MS = 5 * 60 * 1000; // 5 minutes
  const initialItems = (App.Data && (App.Data.products || App.Data.Products)) || [];

  let state = {
    items: initialItems,
    isLoading: false,
    loaded: initialItems.length > 0,
    error: null,
    lastLoadedAt: null,
  };

  const listeners = [];

  function notify() {
    listeners.forEach((fn) => fn(state));
  }

  function subscribe(fn) {
    listeners.push(fn);
    return () => {
      const idx = listeners.indexOf(fn);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }

  function persist(items) {
    App.Data.products = items;
    if (App.DB && App.DB.scheduleSave) {
      App.DB.scheduleSave();
    } else if (App.DB && App.DB.save) {
      App.DB.save();
    }
  }

  function mapFromApi(row) {
    if (!row) return row;
    return {
      id: row.id,
      internalArticleNumber: row.sku || row.internal_article_number || row.internalArticleNumber,
      sku: row.sku,
      name: row.name || row.name_de || row.name_en,
      nameDE: row.name || row.name_de,
      nameEN: row.name_en || row.name,
      type: row.type ? row.type.charAt(0).toUpperCase() + row.type.slice(1) : row.type,
      unit: row.unit || 'Stk',
      allowDecimalQty: row.allow_decimal_qty || row.allowDecimalQty || false,
      avgPurchasePrice: row.avg_purchase_price ?? row.avgPurchasePrice ?? 0,
      dealerPrice: row.dealer_price ?? row.dealerPrice ?? 0,
      endCustomerPrice: row.end_customer_price ?? row.endCustomerPrice ?? 0,
      currency: row.currency || 'EUR',
      vatRate: row.vat_rate ?? row.vatRate ?? 20,
      lifecycleStatus: row.lifecycle_status || row.lifecycleStatus || 'active',
      minStock: row.min_stock ?? row.minStock ?? 0,
      stock: row.stock ?? row.current_stock ?? row.currentStock ?? 0,
      rowVersion: row.row_version || row.rowVersion || 1,
    };
  }

  function mapToApi(payload) {
    return {
      sku: payload.internalArticleNumber || payload.sku,
      name: payload.name || payload.nameDE || payload.nameEN,
      description: payload.description || null,
      type: (payload.type || 'finished').toString().toLowerCase(),
      unit: payload.unit || 'Stk',
      allow_decimal_qty: payload.allowDecimalQty ?? false,
      avg_purchase_price: payload.avgPurchasePrice ?? null,
      dealer_price: payload.dealerPrice ?? null,
      end_customer_price: payload.endCustomerPrice ?? null,
      currency: payload.currency || 'EUR',
      vat_rate: payload.vatRate ?? 20,
      lifecycle_status: payload.lifecycleStatus || 'active',
      min_stock: payload.minStock ?? 0,
      row_version: payload.rowVersion || payload.row_version,
    };
  }

  function isStale() {
    return !state.lastLoadedAt || Date.now() - state.lastLoadedAt > TTL_MS;
  }

  async function load(params = {}, options = {}) {
    if (state.isLoading) return;
    if (!options.force && state.loaded && !isStale()) {
      return;
    }
    state = { ...state, isLoading: true, error: null };
    notify();
    try {
      let items = state.items;
      if (App.Services?.Api?.products?.list) {
        const data = await App.Services.Api.products.list(params);
        items = (data || []).map(mapFromApi);
      }
      state = {
        ...state,
        items,
        isLoading: false,
        loaded: true,
        lastLoadedAt: Date.now(),
      };
      persist(items);
      notify();
      return items;
    } catch (err) {
      console.error('Failed to load products', err);
      state = { ...state, isLoading: false, error: err.message || 'Load failed' };
      notify();
      return state.items;
    }
  }

  async function create(payload) {
    const body = mapToApi(payload);
    let created = null;
    if (App.Services?.Api?.products?.create) {
      created = await App.Services.Api.products.create(body);
    } else {
      created = { ...body, id: payload.id || App.Utils.generateId('prod') };
    }
    const mapped = mapFromApi(created);
    const items = [...state.items, mapped];
    state = { ...state, items };
    persist(items);
    notify();
    App.Services?.TabSync?.broadcast?.({ entity: 'product', id: mapped.id, action: 'created' });
    return mapped;
  }

  async function update(id, payload) {
    const existing = state.items.find((p) => String(p.id) === String(id));
    const body = mapToApi({ ...existing, ...payload });
    let updated = null;
    if (App.Services?.Api?.products?.update) {
      updated = await App.Services.Api.products.update(id, body);
    } else {
      updated = { ...existing, ...body, id };
    }
    const mapped = mapFromApi(updated);
    const items = state.items.map((p) => (String(p.id) === String(id) ? mapped : p));
    state = { ...state, items };
    persist(items);
    notify();
    App.Services?.TabSync?.broadcast?.({ entity: 'product', id, action: 'updated' });
    return mapped;
  }

  async function remove(id) {
    if (App.Services?.Api?.products?.remove) {
      await App.Services.Api.products.remove(id);
    }
    const items = state.items.filter((p) => String(p.id) !== String(id));
    state = { ...state, items };
    persist(items);
    notify();
    App.Services?.TabSync?.broadcast?.({ entity: 'product', id, action: 'deleted' });
    return true;
  }

  function getState() {
    return state;
  }

  function markStale() {
    state = { ...state, lastLoadedAt: null };
  }

  App.Store = App.Store || {};
  App.Store.Products = {
    subscribe,
    getState,
    load,
    create,
    update,
    remove,
    isStale,
    markStale,
  };
})();
