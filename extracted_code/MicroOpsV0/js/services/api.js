// Lightweight API client for remote-first operations.
// Uses JWT from App.Services.Auth.getToken().
(function () {
  const BASE_URL = '/api';

  function getToken() {
    return (App.Services && App.Services.Auth && App.Services.Auth.getToken && App.Services.Auth.getToken()) || '';
  }

  async function apiFetch(path, options = {}) {
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

    const headers = Object.assign(
      {
        'Content-Type': 'application/json',
      },
      options.headers || {}
    );

    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    let resp;
    try {
      resp = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
      });
    } catch (networkErr) {
      const isOffline = App.Services?.Offline?.isOffline?.();
      const message = isOffline
        ? 'You appear to be offline. This action requires a connection.'
        : 'Network error while reaching the server. Please retry.';
      App.UI?.Toast?.show(message, 'warning');
      const err = new Error(message);
      err.code = isOffline ? 'OFFLINE' : 'NETWORK_ERROR';
      err.status = 0;
      throw err;
    }

    const isJson = resp.headers.get('content-type')?.includes('application/json');
    const payload = isJson ? await resp.json().catch(() => ({})) : {};

    if (resp.status === 409) {
      const msg =
        payload.message ||
        payload.error ||
        'Conflict: This record was changed by another user. Please reload to see the latest version.';
      const err = new Error(msg);
      err.status = resp.status;
      err.code = payload.code || 'CONFLICT';
      App.UI?.Toast?.show(msg, 'warning');
      throw err;
    }

    if (!resp.ok) {
      const msg = payload.error || payload.message || `Request failed (${resp.status})`;
      const err = new Error(msg);
      err.status = resp.status;
      throw err;
    }
    return payload;
  }

  const apiCustomers = {
    list(params = {}) {
      const qs = new URLSearchParams();
      if (params.search) qs.set('search', params.search);
      if (params.page) qs.set('page', params.page);
      if (params.limit) qs.set('limit', params.limit);
      const suffix = qs.toString() ? `?${qs.toString()}` : '';
      return apiFetch(`/customers${suffix}`);
    },
    get(id) {
      return apiFetch(`/customers/${id}`);
    },
    create(data) {
      return apiFetch(`/customers`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update(id, data) {
      return apiFetch(`/customers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    remove(id) {
      return apiFetch(`/customers/${id}`, {
        method: 'DELETE',
      });
    },
  };

  const apiProducts = {
    list(params = {}) {
      const qs = new URLSearchParams();
      if (params.search) qs.set('search', params.search);
      if (params.page) qs.set('page', params.page);
      if (params.limit) qs.set('limit', params.limit);
      const suffix = qs.toString() ? `?${qs.toString()}` : '';
      return apiFetch(`/products${suffix}`);
    },
    get(id) {
      return apiFetch(`/products/${id}`);
    },
    create(data) {
      return apiFetch(`/products`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update(id, data) {
      return apiFetch(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    remove(id) {
      return apiFetch(`/products/${id}`, { method: 'DELETE' });
    },
  };

  const apiOrders = {
    list(params = {}) {
      const qs = new URLSearchParams();
      if (params.search) qs.set('search', params.search);
      if (params.status) qs.set('status', params.status);
      if (params.page) qs.set('page', params.page);
      if (params.limit) qs.set('limit', params.limit);
      const suffix = qs.toString() ? `?${qs.toString()}` : '';
      return apiFetch(`/orders${suffix}`);
    },
    get(id) {
      return apiFetch(`/orders/${id}`);
    },
    create(data) {
      return apiFetch(`/orders`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update(id, data) {
      return apiFetch(`/orders/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    transition(id, action) {
      return apiFetch(`/orders/${id}/transition`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      });
    },
  };

  const apiDocuments = {
    list(params = {}) {
      const qs = new URLSearchParams();
      if (params.type) qs.set('type', params.type);
      if (params.status) qs.set('status', params.status);
      if (params.customerId) qs.set('customerId', params.customerId);
      if (params.page) qs.set('page', params.page);
      if (params.limit) qs.set('limit', params.limit);
      const suffix = qs.toString() ? `?${qs.toString()}` : '';
      return apiFetch(`/documents${suffix}`);
    },
    get(id) {
      return apiFetch(`/documents/${id}`);
    },
  };

  const apiInventory = {
    stock(productId) {
      return apiFetch(`/inventory/stock/${productId}`);
    },
  };

  App.Services = App.Services || {};
  App.Services.Api = {
    fetch: apiFetch,
    customers: apiCustomers,
    products: apiProducts,
    orders: apiOrders,
    documents: apiDocuments,
    inventory: apiInventory,
  };
})();
