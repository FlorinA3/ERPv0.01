// Store for orders with basic caching and tab sync notifications.
(function () {
  const TTL_MS = 5 * 60 * 1000;
  const initialItems = (App.Data && App.Data.orders) || [];

  let state = {
    items: initialItems,
    isLoading: false,
    loaded: initialItems.length > 0,
    error: null,
    lastLoadedAt: null,
  };

  const listeners = [];

  function subscribe(fn) {
    listeners.push(fn);
    return () => {
      const idx = listeners.indexOf(fn);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }

  function notify() {
    listeners.forEach((fn) => fn(state));
  }

  function persist(items) {
    App.Data.orders = items;
    if (App.DB?.scheduleSave) {
      App.DB.scheduleSave();
    } else if (App.DB?.save) {
      App.DB.save();
    }
  }

  function mapFromApi(row) {
    if (!row) return row;
    return {
      id: row.id,
      orderId: row.order_number || row.orderId || row.id,
      custId: row.customer_id || row.custId,
      status: row.status || 'draft',
      date: row.order_date || row.date || new Date().toISOString(),
      plannedDelivery: row.planned_delivery || row.plannedDelivery || null,
      currency: row.currency || 'EUR',
      subtotalNet: row.subtotal_net ?? row.subtotalNet ?? 0,
      vatAmount: row.vat_amount ?? row.vatAmount ?? 0,
      totalGross: row.total_gross ?? row.totalGross ?? 0,
      paymentTerms: row.payment_terms || row.paymentTerms || null,
      deliveryTerms: row.delivery_terms || row.deliveryTerms || null,
      customer_name: row.customer_name,
      items: row.items || [],
    };
  }

  function mapToApi(payload) {
    return {
      order_number: payload.orderId || payload.id,
      customer_id: payload.custId,
      status: payload.status,
      order_date: payload.date,
      planned_delivery: payload.plannedDelivery,
      currency: payload.currency || 'EUR',
      subtotal_net: payload.subtotalNet ?? payload.totalGross ?? 0,
      vat_amount: payload.vatAmount ?? 0,
      total_gross: payload.totalGross ?? payload.subtotalNet ?? 0,
      payment_terms: payload.paymentTerms,
      delivery_terms: payload.deliveryTerms,
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
      if (App.Services?.Api?.orders?.list) {
        const data = await App.Services.Api.orders.list(params);
        items = (data || []).map(mapFromApi);
      }
      state = { ...state, items, isLoading: false, loaded: true, lastLoadedAt: Date.now() };
      persist(items);
      notify();
      return items;
    } catch (err) {
      console.error('Failed to load orders', err);
      state = { ...state, isLoading: false, error: err.message || 'Load failed' };
      notify();
      return state.items;
    }
  }

  async function create(payload) {
    const body = mapToApi(payload);
    let created = null;
    if (App.Services?.Api?.orders?.create) {
      created = await App.Services.Api.orders.create(body);
    } else {
      created = { ...payload, id: App.Utils.generateId('ord') };
    }
    const mapped = mapFromApi(created);
    const items = [...state.items, mapped];
    state = { ...state, items };
    persist(items);
    notify();
    App.Services?.TabSync?.broadcast?.({ entity: 'order', id: mapped.id, action: 'created' });
    return mapped;
  }

  async function update(id, payload) {
    const existing = state.items.find((o) => String(o.id) === String(id));
    const body = mapToApi({ ...existing, ...payload });
    let updated = null;
    if (App.Services?.Api?.orders?.update) {
      updated = await App.Services.Api.orders.update(id, body);
    } else {
      updated = { ...existing, ...payload };
    }
    const mapped = mapFromApi(updated);
    const items = state.items.map((o) => (String(o.id) === String(id) ? mapped : o));
    state = { ...state, items };
    persist(items);
    notify();
    App.Services?.TabSync?.broadcast?.({ entity: 'order', id, action: 'updated' });
    return mapped;
  }

  function getState() {
    return state;
  }

  function markStale() {
    state = { ...state, lastLoadedAt: null };
  }

  App.Store = App.Store || {};
  App.Store.Orders = {
    subscribe,
    getState,
    load,
    create,
    update,
    isStale,
    markStale,
  };
})();
