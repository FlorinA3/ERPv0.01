// Store for inventory snapshots with TTL and tab sync awareness.
(function () {
  const TTL_MS = 5 * 60 * 1000;

  let state = {
    snapshots: {}, // productId -> { stock, lastLoadedAt }
    error: null,
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

  function isStale(productId) {
    const snap = state.snapshots[productId];
    if (!snap || !snap.lastLoadedAt) return true;
    return Date.now() - snap.lastLoadedAt > TTL_MS;
  }

  async function loadSnapshot(productId, options = {}) {
    if (!productId) return null;
    if (!options.force && !isStale(productId)) {
      return state.snapshots[productId];
    }
    try {
      if (App.Services?.Api?.inventory?.stock) {
        const snap = await App.Services.Api.inventory.stock(productId);
        state.snapshots[productId] = {
          stock: snap.stock ?? snap.quantity ?? 0,
          lastLoadedAt: Date.now(),
        };
      }
      notify();
      return state.snapshots[productId];
    } catch (err) {
      console.error('Failed to load stock snapshot', err);
      state.error = err.message || 'Load failed';
      notify();
      return state.snapshots[productId];
    }
  }

  function markStale(productId) {
    if (productId) {
      if (state.snapshots[productId]) state.snapshots[productId].lastLoadedAt = null;
    } else {
      Object.keys(state.snapshots).forEach((k) => {
        state.snapshots[k].lastLoadedAt = null;
      });
    }
  }

  function getState() {
    return state;
  }

  App.Store = App.Store || {};
  App.Store.Inventory = {
    subscribe,
    loadSnapshot,
    isStale,
    markStale,
    getState,
  };
})();
