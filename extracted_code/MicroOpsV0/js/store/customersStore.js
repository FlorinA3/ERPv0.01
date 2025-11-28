// Simple store for customers with remote-first loading and local cache fallback.
(function () {
  const cached = (App.Data && App.Data.customers) || [];
  const initialState = { items: cached, loading: false, loaded: cached.length > 0, error: null, lastLoadedAt: null };
  let state = { ...initialState };
  const listeners = [];

  function notify() {
    listeners.forEach((fn) => fn(state));
  }

  function setState(patch) {
    state = { ...state, ...patch };
    notify();
  }

  function subscribe(fn) {
    listeners.push(fn);
    return () => {
      const idx = listeners.indexOf(fn);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }

  function mapFromApi(row) {
    return {
      id: row.id,
      company: row.company_name,
      customerNumber: row.internal_id || `C-${row.id}`,
      rowVersion: row.row_version || row.rowVersion || 1,
      status: row.status,
      vatNumber: row.vat_number,
      paymentTerms: row.payment_terms,
      deliveryTerms: row.delivery_terms,
      segment: row.price_segment,
      defaultCurrency: row.default_currency,
      defaultLanguage: row.default_language,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      // legacy UI fields preserved as optional arrays for display
      contacts: row.contacts || [],
      phones: row.phones || [],
      emails: row.emails || [],
      addresses: row.addresses || [],
      notes: row.notes || '',
      name: row.name || '',
      email: row.email || '',
    };
  }

  function mapToApi(payload) {
    return {
      internal_id: payload.customerNumber || null,
      company_name: payload.company,
      status: payload.status || 'active',
      vat_number: payload.vatNumber || null,
      payment_terms: payload.paymentTerms || null,
      delivery_terms: payload.deliveryTerms || null,
      price_segment: payload.segment || null,
      default_currency: payload.defaultCurrency || 'EUR',
      default_language: payload.defaultLanguage || null,
      row_version: payload.rowVersion || payload.row_version,
    };
  }

  function persistCache(items) {
    App.Data.customers = items;
    if (App.DB && App.DB.save) {
      App.DB.save();
    }
  }

  async function load(params = {}) {
    if (state.loading) return;
    const stale = !state.lastLoadedAt || Date.now() - state.lastLoadedAt > 5 * 60 * 1000;
    if (state.loaded && !stale && !params.force) return;
    setState({ loading: true, error: null });
    try {
      const data = await App.Services.Api.customers.list(params);
      const mapped = Array.isArray(data) ? data.map(mapFromApi) : [];
      setState({ items: mapped, loading: false, loaded: true, lastLoadedAt: Date.now() });
      persistCache(mapped);
    } catch (err) {
      console.error('Failed to load customers', err);
      setState({ loading: false, error: err.message || 'Load failed' });
      App.UI.Toast?.show(App.I18n.t('common.loadFailed', 'Load failed') + ': ' + (err.message || err));
      // fallback: load from cache if present
      if (App.Data.customers && Array.isArray(App.Data.customers)) {
        setState({ items: App.Data.customers, loaded: true });
      }
    }
  }

  async function create(payload) {
    const body = mapToApi(payload);
    try {
      const created = await App.Services.Api.customers.create(body);
      const mapped = {
        ...mapFromApi(created),
        contacts: payload.contacts || [],
        phones: payload.phones || [],
        emails: payload.emails || [],
        addresses: payload.addresses || [],
        notes: payload.notes || '',
      };
      const items = [...state.items, mapped];
      setState({ items });
      persistCache(items);
      App.Services?.TabSync?.broadcast?.({ entity: 'customer', id: mapped.id, action: 'created' });
      return mapped;
    } catch (err) {
      throw err;
    }
  }

  async function update(id, payload) {
    const existing = state.items.find((c) => String(c.id) === String(id));
    const body = mapToApi({
      ...payload,
      rowVersion: payload.rowVersion || payload.row_version || existing?.rowVersion || 1,
    });
    try {
      const updated = await App.Services.Api.customers.update(id, body);
      const mapped = mapFromApi(updated);
      const items = state.items.map((c) => (String(c.id) === String(id) ? { ...mapped, contacts: payload.contacts || [], phones: payload.phones || [], emails: payload.emails || [], addresses: payload.addresses || [], notes: payload.notes || '' } : c));
      setState({ items });
      persistCache(items);
      App.Services?.TabSync?.broadcast?.({ entity: 'customer', id, action: 'updated' });
      return mapped;
    } catch (err) {
      throw err;
    }
  }

  async function remove(id) {
    try {
      await App.Services.Api.customers.remove(id);
      const items = state.items.filter((c) => String(c.id) !== String(id));
      setState({ items });
      persistCache(items);
      App.Services?.TabSync?.broadcast?.({ entity: 'customer', id, action: 'deleted' });
      return true;
    } catch (err) {
      throw err;
    }
  }

  App.Store = App.Store || {};
  App.Store.Customers = {
    subscribe,
    getState: () => state,
    load,
    create,
    update,
    remove,
    isStale: () => !state.lastLoadedAt || Date.now() - state.lastLoadedAt > 5 * 60 * 1000,
    markStale: () => { state = { ...state, lastLoadedAt: null }; },
  };
})();
