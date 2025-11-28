// Simple online/offline state helper with subscriptions.
(function () {
  let online = navigator.onLine !== false;
  const listeners = [];

  function notify() {
    listeners.forEach((fn) => {
      try {
        fn(online);
      } catch (e) {
        console.warn('Offline listener error', e);
      }
    });
  }

  function setOnline(next) {
    if (online === next) return;
    online = next;
    notify();
  }

  function isOnline() {
    return online;
  }

  function isOffline() {
    return !online;
  }

  function subscribe(fn) {
    if (typeof fn === 'function') {
      listeners.push(fn);
      // Immediately inform new subscribers of current state.
      try {
        fn(online);
      } catch (e) {
        console.warn('Offline listener error on subscribe', e);
      }
    }
    return () => {
      const idx = listeners.indexOf(fn);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }

  window.addEventListener('online', () => setOnline(true));
  window.addEventListener('offline', () => setOnline(false));

  App.Services = App.Services || {};
  App.Services.Offline = {
    isOnline,
    isOffline,
    subscribe,
  };
})();
