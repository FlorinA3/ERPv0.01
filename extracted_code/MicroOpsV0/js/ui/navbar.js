App.UI.Navbar = {
  init() {
    this.render();
  },
  render() {
    const root = document.getElementById('navbar-root');
    if (!root) return;
    const company = (App.Data.Config && App.Data.Config.companyName) || 'MicroOps';
    const user = App.Services.Auth.currentUser;
    const languages = [
      { code: 'en', label: 'English', flag: '🇬🇧' },
      { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
      // Romanian support as required by specification
      { code: 'ro', label: 'Română', flag: '🇷🇴' },
      { code: 'fr', label: 'Français', flag: '🇫🇷' },
      { code: 'es', label: 'Español', flag: '🇪🇸' },
      { code: 'pt', label: 'Português', flag: '🇵🇹' },
      { code: 'zh', label: '中文', flag: '🇨🇳' },
      { code: 'ja', label: '日本語', flag: '🇯🇵' }
    ];
    const themes = [
      { id: 'light', label: 'Corporate', color: '#3b82f6' },
      { id: 'dark', label: 'Dark Mode', color: '#0f172a' },
      { id: 'cyberpunk', label: 'Cyberpunk', color: '#d946ef' },
      { id: 'vaporwave', label: 'Vaporwave', color: '#8b5cf6' },
      { id: 'steampunk', label: 'Steampunk', color: '#b45309' },
      { id: 'scifi', label: 'Sci‑Fi', color: '#0ea5e9' }
    ];
    const currentLang = (App.Data.Config && App.Data.Config.lang) || 'en';
    const currentTheme = (App.Data.Config && App.Data.Config.theme) || 'dark';
    const langInfo = languages.find(l => l.code === currentLang) || languages[0];
    const themeInfo = themes.find(t => t.id === currentTheme) || themes[0];
    root.innerHTML = `
      <div class="navbar">
        <div class="navbar-left">
          <div class="navbar-logo">M</div>
          <div class="navbar-brand">
            <div class="navbar-brand-title">${company}</div>
            <div class="navbar-brand-subtitle">System Overview & Analytics</div>
          </div>
        </div>
        <div class="navbar-center">
          <div class="search-container" style="position:relative;">
            <input type="text" id="global-search" class="input search-input" placeholder="Search... (Ctrl+K)" style="width:280px; padding-left:32px;" />
            <span style="position:absolute; left:10px; top:50%; transform:translateY(-50%); color:var(--color-text-muted);">🔍</span>
            <div id="search-results" class="search-results hidden" style="position:absolute; top:100%; left:0; right:0; background:var(--color-surface); border:1px solid var(--color-border); border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.15); max-height:400px; overflow-y:auto; z-index:1000;"></div>
          </div>
        </div>
        <div class="navbar-right">
          <div id="offline-indicator" style="display:${navigator.onLine ? 'none' : 'flex'}; align-items:center; gap:4px; padding:4px 8px; background:rgba(239,68,68,0.2); border-radius:4px; font-size:11px; color:var(--color-danger);">
            <span>⚠️</span> Offline
          </div>
          <div class="navbar-user">
            <div class="navbar-user-avatar">${(user && user.name ? user.name.charAt(0) : 'U').toUpperCase()}</div>
            <div class="navbar-user-name">${user ? user.name : 'Not logged in'}</div>
          </div>
          <div class="dropdown" id="lang-dropdown">
            <button class="btn btn-ghost" id="lang-btn" title="Language">${langInfo.flag}</button>
            <div class="dropdown-menu hidden" id="lang-menu">
              ${languages.map(l => `<button class="dropdown-item" data-lang="${l.code}">${l.flag} ${l.label}</button>`).join('')}
            </div>
          </div>
          <div class="dropdown" id="theme-dropdown">
            <button class="btn btn-ghost" id="theme-btn" title="Theme"><span style="color:${themeInfo.color}">●</span></button>
            <div class="dropdown-menu hidden" id="theme-menu">
              ${themes.map(t => `<button class="dropdown-item" data-theme="${t.id}"><span style="color:${t.color}">●</span> ${t.label}</button>`).join('')}
            </div>
          </div>
          <button class="btn btn-ghost" id="navbar-help-btn" title="Help & Troubleshooting">❓</button>
          <button class="btn btn-ghost" id="navbar-logout-btn" title="Logout">Logout</button>
        </div>
      </div>
    `;
    const logoutBtn = root.querySelector('#navbar-logout-btn');
    if (logoutBtn) {
      logoutBtn.onclick = () => {
        App.Services.Auth.logout();
      };
    }
    const helpBtn = root.querySelector('#navbar-help-btn');
    if (helpBtn) {
      helpBtn.onclick = () => {
        App.Core.Router.navigate('settings');
        setTimeout(() => {
          if (App.UI.Views.Settings) {
            App.UI.Views.Settings.activeTab = 'help';
            App.UI.Views.Settings.render(document.getElementById('main-content'));
          }
        }, 50);
      };
    }
    const langBtnEl = root.querySelector('#lang-btn');
    const langMenu = root.querySelector('#lang-menu');
    langBtnEl.onclick = () => {
      langMenu.classList.toggle('hidden');
      const themeMenu = root.querySelector('#theme-menu');
      themeMenu.classList.add('hidden');
    };
    langMenu.querySelectorAll('.dropdown-item').forEach(item => {
      item.onclick = () => {
        const code = item.getAttribute('data-lang');
        const info = languages.find(l => l.code === code);
        // Persist language to config (both canonical and legacy keys)
        if (App.Data.config) App.Data.config.lang = code;
        if (App.Data.Config) App.Data.Config.lang = code;
        App.I18n.currentLang = code;
        langBtnEl.textContent = info.flag;
        langMenu.classList.add('hidden');
        App.DB.save();
        // Re-render sidebar and current page to reflect new language
        if (App.UI.Sidebar && App.UI.Sidebar.init) App.UI.Sidebar.init();
        App.Core.Router.navigate(App.Core.Router.currentRoute);
        App.UI.Toast.show('Language set to ' + info.label);
      };
    });
    const themeBtnEl = root.querySelector('#theme-btn');
    const themeMenu = root.querySelector('#theme-menu');
    themeBtnEl.onclick = () => {
      themeMenu.classList.toggle('hidden');
      langMenu.classList.add('hidden');
    };
    themeMenu.querySelectorAll('.dropdown-item').forEach(item => {
      item.onclick = () => {
        const id = item.getAttribute('data-theme');
        const info = themes.find(t => t.id === id);
        document.documentElement.setAttribute('data-theme', id);
        if (App.Data.config) App.Data.config.theme = id;
        if (App.Data.Config) App.Data.Config.theme = id;
        themeBtnEl.innerHTML = `<span style="color:${info.color}">●</span>`;
        themeMenu.classList.add('hidden');
        App.DB.save();
        App.UI.Toast.show('Theme set to ' + info.label);
      };
    });

    // Global search functionality
    const searchInput = root.querySelector('#global-search');
    const searchResults = root.querySelector('#search-results');
    let searchTimeout = null;

    if (searchInput && searchResults) {
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim().toLowerCase();

        if (query.length < 2) {
          searchResults.classList.add('hidden');
          return;
        }

        searchTimeout = setTimeout(() => {
          const results = this.performSearch(query);
          this.renderSearchResults(results, searchResults, query);
        }, 200);
      });

      searchInput.addEventListener('focus', () => {
        if (searchInput.value.trim().length >= 2) {
          searchResults.classList.remove('hidden');
        }
      });

      // Close search results when clicking outside
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
          searchResults.classList.add('hidden');
        }
      });

      // Handle keyboard navigation
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          searchResults.classList.add('hidden');
          searchInput.blur();
        }
      });
    }
  },

  performSearch(query) {
    const results = [];
    const limit = 5; // Max results per category

    // Search customers
    const customers = App.Data.customers || [];
    const matchedCustomers = customers.filter(c =>
      (c.company || '').toLowerCase().includes(query) ||
      (c.customerNumber || '').toLowerCase().includes(query) ||
      (c.email || '').toLowerCase().includes(query) ||
      (c.contact || '').toLowerCase().includes(query)
    ).slice(0, limit);

    matchedCustomers.forEach(c => {
      results.push({
        type: 'customer',
        icon: '👤',
        title: c.company || c.contact || 'Unknown',
        subtitle: c.customerNumber || c.email || '',
        action: () => {
          App.Core.Router.navigate('customers');
          // Could implement detail view here
        }
      });
    });

    // Search products
    const products = App.Data.products || [];
    const matchedProducts = products.filter(p =>
      (p.nameDE || '').toLowerCase().includes(query) ||
      (p.nameEN || '').toLowerCase().includes(query) ||
      (p.internalArticleNumber || '').toLowerCase().includes(query) ||
      (p.sku || '').toLowerCase().includes(query)
    ).slice(0, limit);

    matchedProducts.forEach(p => {
      results.push({
        type: 'product',
        icon: '📦',
        title: p.nameDE || p.nameEN || p.internalArticleNumber,
        subtitle: `${p.internalArticleNumber || p.sku || ''} • Stock: ${p.stock || 0}`,
        action: () => App.Core.Router.navigate('products')
      });
    });

    // Search components
    const components = App.Data.components || [];
    const matchedComponents = components.filter(c =>
      (c.description || '').toLowerCase().includes(query) ||
      (c.componentNumber || '').toLowerCase().includes(query)
    ).slice(0, limit);

    matchedComponents.forEach(c => {
      results.push({
        type: 'component',
        icon: '🔧',
        title: c.description || c.componentNumber,
        subtitle: `${c.componentNumber || ''} • Stock: ${c.stock || 0}`,
        action: () => App.Core.Router.navigate('components')
      });
    });

    // Search orders
    const orders = App.Data.orders || [];
    const matchedOrders = orders.filter(o =>
      (o.orderId || '').toLowerCase().includes(query) ||
      (o.id || '').toLowerCase().includes(query)
    ).slice(0, limit);

    matchedOrders.forEach(o => {
      const cust = customers.find(c => c.id === o.custId);
      results.push({
        type: 'order',
        icon: '📋',
        title: o.orderId || o.id,
        subtitle: `${cust?.company || 'Unknown'} • ${o.status || 'Open'}`,
        action: () => App.Core.Router.navigate('orders')
      });
    });

    // Search documents (invoices, delivery notes)
    const documents = App.Data.documents || [];
    const matchedDocs = documents.filter(d =>
      (d.docNumber || '').toLowerCase().includes(query)
    ).slice(0, limit);

    matchedDocs.forEach(d => {
      const cust = customers.find(c => c.id === d.customerId);
      results.push({
        type: 'document',
        icon: d.type === 'invoice' ? '🧾' : '📦',
        title: d.docNumber,
        subtitle: `${d.type} • ${cust?.company || 'Unknown'}`,
        action: () => App.Core.Router.navigate('documents')
      });
    });

    // Search suppliers
    const suppliers = App.Data.suppliers || [];
    const matchedSuppliers = suppliers.filter(s =>
      (s.name || '').toLowerCase().includes(query) ||
      (s.email || '').toLowerCase().includes(query)
    ).slice(0, limit);

    matchedSuppliers.forEach(s => {
      results.push({
        type: 'supplier',
        icon: '🏭',
        title: s.name,
        subtitle: s.email || s.phone || '',
        action: () => App.Core.Router.navigate('suppliers')
      });
    });

    // Search purchase orders
    const purchaseOrders = App.Data.purchaseOrders || [];
    const matchedPOs = purchaseOrders.filter(po =>
      (po.poNumber || '').toLowerCase().includes(query)
    ).slice(0, limit);

    matchedPOs.forEach(po => {
      const supplier = suppliers.find(s => s.id === po.supplierId);
      results.push({
        type: 'purchaseOrder',
        icon: '📥',
        title: po.poNumber,
        subtitle: `${supplier?.name || 'Unknown'} • ${po.status || 'Draft'}`,
        action: () => App.Core.Router.navigate('purchaseOrders')
      });
    });

    // Search production orders
    const productionOrders = App.Data.productionOrders || [];
    const matchedProdOrders = productionOrders.filter(po =>
      (po.poNumber || '').toLowerCase().includes(query)
    ).slice(0, limit);

    matchedProdOrders.forEach(po => {
      const prod = products.find(p => p.id === po.productId);
      results.push({
        type: 'productionOrder',
        icon: '⚙️',
        title: po.poNumber,
        subtitle: `${prod?.nameDE || prod?.nameEN || 'Unknown'} • ${po.status || 'Planned'}`,
        action: () => App.Core.Router.navigate('production')
      });
    });

    // Search batches/LOTs
    const batches = App.Data.batches || [];
    const matchedBatches = batches.filter(b =>
      (b.lotNumber || '').toLowerCase().includes(query)
    ).slice(0, limit);

    matchedBatches.forEach(b => {
      results.push({
        type: 'batch',
        icon: '🏷️',
        title: b.lotNumber,
        subtitle: `${b.itemType === 'component' ? 'Component' : 'Product'} • Qty: ${b.quantity || 0}`,
        action: () => App.Core.Router.navigate('batches')
      });
    });

    // Search carriers
    const carriers = App.Data.carriers || [];
    const matchedCarriers = carriers.filter(c =>
      (c.name || '').toLowerCase().includes(query) ||
      (c.trackingUrl || '').toLowerCase().includes(query)
    ).slice(0, limit);

    matchedCarriers.forEach(c => {
      results.push({
        type: 'carrier',
        icon: '🚚',
        title: c.name,
        subtitle: c.phone || c.email || '',
        action: () => App.Core.Router.navigate('carriers')
      });
    });

    return results;
  },

  renderSearchResults(results, container, query) {
    if (results.length === 0) {
      container.innerHTML = `
        <div style="padding:16px; text-align:center; color:var(--color-text-muted);">
          No results found for "${query}"
        </div>
      `;
      container.classList.remove('hidden');
      return;
    }

    // Group results by type
    const grouped = {};
    results.forEach(r => {
      if (!grouped[r.type]) grouped[r.type] = [];
      grouped[r.type].push(r);
    });

    const typeLabels = {
      customer: 'Customers',
      product: 'Products',
      component: 'Components',
      order: 'Orders',
      document: 'Documents',
      supplier: 'Suppliers',
      purchaseOrder: 'Purchase Orders',
      productionOrder: 'Production Orders',
      batch: 'Batches/LOTs',
      carrier: 'Carriers'
    };

    let html = '';
    for (const [type, items] of Object.entries(grouped)) {
      html += `<div style="padding:8px 12px; font-size:11px; text-transform:uppercase; color:var(--color-text-muted); background:var(--color-bg); font-weight:600;">${typeLabels[type] || type}</div>`;
      items.forEach(item => {
        html += `
          <div class="search-result-item" style="padding:10px 12px; cursor:pointer; display:flex; align-items:center; gap:10px; border-bottom:1px solid var(--color-border);">
            <span style="font-size:16px;">${item.icon}</span>
            <div style="flex:1; min-width:0;">
              <div style="font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.title}</div>
              <div style="font-size:11px; color:var(--color-text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.subtitle}</div>
            </div>
          </div>
        `;
      });
    }

    container.innerHTML = html;
    container.classList.remove('hidden');

    // Add click handlers
    container.querySelectorAll('.search-result-item').forEach((el, i) => {
      el.addEventListener('click', () => {
        results[i].action();
        container.classList.add('hidden');
        document.getElementById('global-search').value = '';
      });

      el.addEventListener('mouseenter', () => {
        el.style.background = 'var(--color-bg)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.background = 'transparent';
      });
    });
  }
};