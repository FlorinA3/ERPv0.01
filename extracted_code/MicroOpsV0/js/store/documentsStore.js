// Store for documents (invoices/credits/delivery notes) with TTL caching.
(function () {
  const TTL_MS = 5 * 60 * 1000;
  const initialItems = (App.Data && App.Data.documents) || [];

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
    App.Data.documents = items;
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
      type: row.type,
      docNumber: row.doc_number || row.docNumber,
      customerId: row.customer_id || row.customerId,
      orderId: row.order_id || row.orderId,
      status: row.status,
      currency: row.currency || 'EUR',
      netTotal: row.net_total ?? row.netTotal ?? 0,
      vatTotal: row.vat_total ?? row.vatTotal ?? 0,
      grossTotal: row.gross_total ?? row.grossTotal ?? 0,
      issuedAt: row.issued_at || row.issuedAt,
      postedAt: row.posted_at || row.postedAt,
      paidAt: row.paid_at || row.paidAt,
    };
  }

  function isStale() {
    return !state.lastLoadedAt || Date.now() - state.lastLoadedAt > TTL_MS;
  }

  async function load(params = {}, options = {}) {
    if (state.isLoading) return;
    if (!options.force && state.loaded && !isStale()) return;
    state = { ...state, isLoading: true, error: null };
    notify();
    try {
      let items = state.items;
      if (App.Services?.Api?.documents?.list) {
        const data = await App.Services.Api.documents.list(params);
        items = (data || []).map(mapFromApi);
      }
      state = { ...state, items, isLoading: false, loaded: true, lastLoadedAt: Date.now() };
      persist(items);
      notify();
      return items;
    } catch (err) {
      console.error('Failed to load documents', err);
      state = { ...state, isLoading: false, error: err.message || 'Load failed' };
      notify();
      return state.items;
    }
  }

  function getState() {
    return state;
  }

  function markStale() {
    state = { ...state, lastLoadedAt: null };
  }

  App.Store = App.Store || {};
  App.Store.Documents = {
    subscribe,
    getState,
    load,
    isStale,
    markStale,
  };
})();
