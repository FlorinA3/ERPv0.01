// Lightweight tab-to-tab event broadcaster using localStorage.
(function () {
  const CHANNEL_KEY = 'microops_tab_sync';

  const listeners = [];

  function broadcast(payload) {
    try {
      const envelope = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        at: Date.now(),
        payload,
      };
      localStorage.setItem(CHANNEL_KEY, JSON.stringify(envelope));
      // cleanup to avoid quota noise
      localStorage.removeItem(CHANNEL_KEY);
    } catch (e) {
      console.warn('TabSync broadcast failed', e);
    }
  }

  function subscribe(fn) {
    if (typeof fn === 'function') {
      listeners.push(fn);
    }
    return () => {
      const idx = listeners.indexOf(fn);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }

  window.addEventListener('storage', (event) => {
    if (event.key !== CHANNEL_KEY || !event.newValue) return;
    try {
      const data = JSON.parse(event.newValue);
      listeners.forEach((fn) => fn(data.payload, data));
    } catch (e) {
      console.warn('TabSync parse error', e);
    }
  });

  App.Services = App.Services || {};
  App.Services.TabSync = { broadcast, subscribe };
})();
