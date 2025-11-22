window.App = window.App || {
  Data: {
    Users: [],
    Customers: [],
    Products: [],
    Orders: [],
    Documents: [],
    Config: {
      currency: 'EUR',
      companyName: 'MicroOps Global',
      theme: 'default',
      lang: 'en'
    }
  },
  Core: {},
  Services: {},
  UI: {
    Views: {},
    Navbar: {},
    Sidebar: {},
    Modal: {},
    Toast: {},
    // Central Icon Registry (SVGs) for professional look
    Icons: {
      dashboard: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>',
      customers: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
      products: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22v-10"/></svg>',
      components: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
      suppliers: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="8" rx="1"/><path d="M17 14v7"/><path d="M7 14v7"/><path d="M17 3v3"/><path d="M7 3v3"/><path d="M10 14 2.3 6.3"/><path d="m14 6 7.7 7.7"/><path d="m8 6 8 8"/></svg>',
      carriers: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13" rx="2" ry="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>',
      pricing: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
      inventory: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
      movements: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/></svg>',
      orders: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
      production: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>',
      documents: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>',
      reports: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
      tasks: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>',
      settings: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>'
    },
    getIcon(key) {
      return this.Icons[key] || '<span>•</span>';
    }
  },
  Utils: {},
  I18n: {
    translations: {
      de: {
        sidebar: {
          overview: 'Übersicht',
          masterdata: 'Stammdaten',
          stock: 'Lager & Material',
          orders: 'Aufträge & Produktion',
          docs: 'Dokumente & Auswertungen',
          organisation: 'Organisation & Einstellungen',
          dashboard: 'Dashboard',
          customers: 'Kunden',
          products: 'Artikelstamm',
          components: 'E‑Komponenten',
          suppliers: 'Lieferanten',
          carriers: 'Spediteure',
          pricing: 'Preislisten',
          inventory: 'Lagerliste',
          movements: 'Lagerbewegungen',
          ordersPage: 'Aufträge',
          production: 'Produktion',
          documents: 'Dokumente',
          reports: 'Berichte',
          tasks: 'Aufgaben',
          settings: 'Einstellungen'
        },
        pages: {
          dashboard: { title: 'Dashboard' },
          customers: { title: 'Kundenstammdaten' },
          products: { title: 'Artikelstamm' },
          components: { title: 'E‑Komponenten' },
          suppliers: { title: 'Lieferanten' },
          carriers: { title: 'Spediteure' },
          pricing: { title: 'Preislisten' },
          inventory: { title: 'Lager & Material' },
          movements: { title: 'Lagerbewegungen' },
          orders: { title: 'Aufträge' },
          production: { title: 'Produktionsaufträge' },
          documents: { title: 'Dokumente' },
          reports: { title: 'Auswertungen' },
          tasks: { title: 'Aufgabenplaner' },
          settings: { title: 'Systemeinstellungen' }
        },
        settings: {
          companySection: 'Firma & Konfiguration',
          companyName: 'Firmenname',
          address: 'Adresse',
          phone: 'Telefon',
          email: 'E-Mail',
          vat: 'UID-Nummer',
          reg: 'Firmenbuchnr.',
          iban: 'IBAN',
          bic: 'BIC',
          bank: 'Bank',
          payTerms: 'Zahlungsbed.',
          delTerms: 'Lieferbed.',
          vatRate: 'MwSt Satz',
          currency: 'Währung',
          lang: 'Sprache',
          userSection: 'Benutzerverwaltung',
          role: 'Rolle',
          save: 'Einstellungen speichern',
          saved: 'Gespeichert'
        },
        dashboard: {
          total: 'Gesamtumsatz',
          totalDesc: 'Summe aller Aufträge',
          inventory: 'Artikel im Lager',
          inventoryDesc: 'Produkte & Komponenten',
          lowStock: 'Geringer Bestand',
          lowStockDesc: 'Artikel <= 5 Stück',
          customers: 'Kunden',
          customersDesc: 'Aktive Kunden'
        },
        common: {
          add: 'Neu',
          save: 'Speichern',
          cancel: 'Abbrechen',
          delete: 'Löschen',
          edit: 'Bearbeiten',
          actions: 'Aktionen',
          view: 'Ansehen',
          search: 'Suchen...'
        },
        orders: {
          create: 'Auftrag anlegen',
          customer: 'Kunde',
          items: 'Positionen',
          total: 'Gesamt',
          qty: 'Menge',
          price: 'Preis',
          addItem: 'Position hinzufügen',
          exportCsv: 'CSV Export'
        }
      },
      en: {
        sidebar: {
          overview: 'Overview',
          masterdata: 'Master Data',
          stock: 'Inventory & Material',
          orders: 'Orders & Production',
          docs: 'Documents & Reports',
          organisation: 'Organisation & Settings',
          dashboard: 'Dashboard',
          customers: 'Customers',
          products: 'Products',
          components: 'Components',
          suppliers: 'Suppliers',
          carriers: 'Carriers',
          pricing: 'Price Lists',
          inventory: 'Inventory',
          movements: 'Movements',
          ordersPage: 'Orders',
          production: 'Production',
          documents: 'Documents',
          reports: 'Reports',
          tasks: 'Tasks',
          settings: 'Settings'
        },
        pages: {
          dashboard: { title: 'Dashboard' },
          customers: { title: 'Customer Master' },
          products: { title: 'Product Master' },
          components: { title: 'E-Components' },
          suppliers: { title: 'Suppliers' },
          carriers: { title: 'Carriers' },
          pricing: { title: 'Price Lists' },
          inventory: { title: 'Inventory & Material' },
          movements: { title: 'Stock Movements' },
          orders: { title: 'Orders' },
          production: { title: 'Production Orders' },
          documents: { title: 'Documents' },
          reports: { title: 'Reports' },
          tasks: { title: 'Task Planner' },
          settings: { title: 'System Settings' }
        },
        settings: {
          companySection: 'Company & Configuration',
          companyName: 'Company Name',
          address: 'Address',
          phone: 'Phone',
          email: 'Email',
          vat: 'VAT ID',
          reg: 'Reg. Number',
          iban: 'IBAN',
          bic: 'BIC',
          bank: 'Bank Name',
          payTerms: 'Payment Terms',
          delTerms: 'Delivery Terms',
          vatRate: 'VAT Rate',
          currency: 'Currency',
          lang: 'Language',
          userSection: 'User Management',
          role: 'Role',
          save: 'Save Settings',
          saved: 'Settings saved'
        },
        dashboard: {
          total: 'Total Revenue',
          totalDesc: 'Sum of all orders',
          inventory: 'Inventory Items',
          inventoryDesc: 'Products & Components',
          lowStock: 'Low Stock',
          lowStockDesc: 'Items <= 5 units',
          customers: 'Customers',
          customersDesc: 'Active Accounts'
        },
        common: {
          add: 'Add New',
          save: 'Save',
          cancel: 'Cancel',
          delete: 'Delete',
          edit: 'Edit',
          actions: 'Actions',
          view: 'View',
          search: 'Search...'
        },
        orders: {
          create: 'Create Order',
          customer: 'Customer',
          items: 'Line Items',
          total: 'Total',
          qty: 'Qty',
          price: 'Price',
          addItem: 'Add Item',
          exportCsv: 'Export CSV'
        }
      },
      ro: {
        sidebar: {
          overview: 'Prezentare generală',
          masterdata: 'Date principale',
          stock: 'Inventar & Material',
          orders: 'Comenzi & Producție',
          docs: 'Documente & Rapoarte',
          organisation: 'Organizare & Setări',
          dashboard: 'Tablou de bord',
          customers: 'Clienți',
          products: 'Produse',
          components: 'Componente',
          suppliers: 'Furnizori',
          carriers: 'Transportatori',
          pricing: 'Liste de prețuri',
          inventory: 'Inventar',
          movements: 'Mișcări stoc',
          ordersPage: 'Comenzi',
          production: 'Producție',
          documents: 'Documente',
          reports: 'Rapoarte',
          tasks: 'Sarcini',
          settings: 'Setări'
        },
        pages: {
          dashboard: { title: 'Tablou de bord' },
          customers: { title: 'Clienți' },
          products: { title: 'Produse' },
          components: { title: 'Componente' },
          suppliers: { title: 'Furnizori' },
          carriers: { title: 'Transportatori' },
          pricing: { title: 'Liste de prețuri' },
          inventory: { title: 'Inventar & Material' },
          movements: { title: 'Mișcări stoc' },
          orders: { title: 'Comenzi' },
          production: { title: 'Ordine de producție' },
          documents: { title: 'Documente' },
          reports: { title: 'Rapoarte' },
          tasks: { title: 'Planificator Sarcini' },
          settings: { title: 'Setări sistem' }
        },
        settings: {
          companySection: 'Companie & Configurare',
          companyName: 'Nume Companie',
          address: 'Adresă',
          phone: 'Telefon',
          email: 'Email',
          vat: 'CUI/CIF',
          reg: 'Nr. Reg. Com.',
          iban: 'IBAN',
          bic: 'BIC',
          bank: 'Bancă',
          payTerms: 'Termeni plată',
          delTerms: 'Condiții livrare',
          vatRate: 'Cota TVA',
          currency: 'Monedă',
          lang: 'Limbă',
          userSection: 'Gestionare Utilizatori',
          role: 'Rol',
          save: 'Salvează Setările',
          saved: 'Setări salvate'
        },
        dashboard: {
          total: 'Venit Total',
          totalDesc: 'Suma comenzilor',
          inventory: 'Articole Stoc',
          inventoryDesc: 'Produse & Componente',
          lowStock: 'Stoc Redus',
          lowStockDesc: 'Articole <= 5 unități',
          customers: 'Clienți',
          customersDesc: 'Conturi active'
        },
        common: {
          add: 'Adaugă',
          save: 'Salvează',
          cancel: 'Anulează',
          delete: 'Șterge',
          edit: 'Editează',
          actions: 'Acțiuni',
          view: 'Vizualizează',
          search: 'Caută...'
        },
        orders: {
          create: 'Creează Comandă',
          customer: 'Client',
          items: 'Articole',
          total: 'Total',
          qty: 'Cant',
          price: 'Preț',
          addItem: 'Adaugă rând',
          exportCsv: 'Export CSV'
        }
      }
    },
    currentLang: 'en',
    t(key, fallback) {
      const lang = (App.Data.config?.lang || App.Data.Config?.lang || this.currentLang || 'en');
      const parts = key.split('.');
      let value = this.translations[lang];
      for (const p of parts) {
        value = value && value[p];
      }
      if (!value) {
        let fallbackVal = this.translations['en'];
        for (const p of parts) {
          fallbackVal = fallbackVal && fallbackVal[p];
        }
        return fallbackVal || fallback || key;
      }
      return value;
    }
  }
};

App.Utils.generateId = function (prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
};

App.Utils.formatCurrency = function (value) {
  const cfg = App.Data.Config || { currency: 'EUR', lang: 'en' };
  const lang = cfg.lang || 'en';
  const cur = cfg.currency || 'EUR';
  return new Intl.NumberFormat(lang, { style: 'currency', currency: cur }).format(value || 0);
};

App.Utils.formatDate = function (iso) {
  if (!iso) return '-';
  const cfg = App.Data.Config || { lang: 'en' };
  const lang = cfg.lang || 'en';
  return new Date(iso).toLocaleString(lang, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

App.Services.Auth = {
  currentUser: null,
  lastActivity: Date.now(),
  lockTimer: null,
  isLocked: false,

  // Role-based route permissions
  rolePermissions: {
    admin: ['dashboard', 'customers', 'products', 'components', 'suppliers', 'carriers', 'pricing', 'inventory', 'movements', 'orders', 'production', 'documents', 'reports', 'tasks', 'settings'],
    sales: ['dashboard', 'customers', 'products', 'pricing', 'orders', 'documents', 'reports', 'tasks'],
    warehouse: ['dashboard', 'inventory', 'movements', 'components', 'suppliers', 'carriers', 'production', 'tasks'],
    production: ['dashboard', 'production', 'components', 'inventory', 'movements', 'tasks']
  },

  initLoginScreen() {
    const userSelect = document.getElementById('login-user');
    const pinInput = document.getElementById('login-pin');
    const btn = document.getElementById('login-btn');
    const err = document.getElementById('login-error');
    const users = (App.Data.users || App.Data.Users || []).filter(u => u.active !== false);

    if (users.length === 0) {
      userSelect.innerHTML = '<option value="">No users available</option>';
      return;
    }

    userSelect.innerHTML = users
      .map(u => `<option value="${u.id}">${u.name} (${u.role})</option>`)
      .join('');

    // Check for remembered user
    const rememberedUserId = localStorage.getItem('microops_last_user');
    if (rememberedUserId) {
      userSelect.value = rememberedUserId;
    }

    btn.onclick = () => this._attemptLogin();
    pinInput.onkeydown = (e) => {
      if (e.key === 'Enter') this._attemptLogin();
    };
  },

  _attemptLogin() {
    const userSelect = document.getElementById('login-user');
    const pinInput = document.getElementById('login-pin');
    const err = document.getElementById('login-error');
    const rememberCheckbox = document.getElementById('login-remember');

    const userId = userSelect.value;
    const user = (App.Data.users || App.Data.Users || []).find(u => u.id === userId);
    const pin = pinInput.value.trim();

    if (!user || pin !== user.pin || user.active === false) {
      err.classList.remove('hidden');
      pinInput.classList.add('shake');
      setTimeout(() => pinInput.classList.remove('shake'), 500);
      return;
    }

    err.classList.add('hidden');
    this.currentUser = user;

    // Remember user if checkbox is checked
    if (rememberCheckbox && rememberCheckbox.checked) {
      localStorage.setItem('microops_last_user', userId);
    } else {
      localStorage.removeItem('microops_last_user');
    }

    this._enterApp();
  },

  _enterApp() {
    const login = document.getElementById('login-screen');
    const shell = document.getElementById('app-shell');
    const lockScreen = document.getElementById('lock-screen');

    login.classList.add('hidden');
    shell.classList.remove('hidden');
    if (lockScreen) lockScreen.classList.add('hidden');
    this.isLocked = false;

    // Apply user preferences
    if (this.currentUser) {
      const theme = this.currentUser.preferredTheme || App.Data.config?.theme || 'dark';
      const lang = this.currentUser.preferredLang || App.Data.config?.lang || 'en';
      document.documentElement.setAttribute('data-theme', theme);
      App.I18n.currentLang = lang;
    }

    if (App.UI.Navbar && App.UI.Navbar.render) App.UI.Navbar.render();
    if (App.UI.Sidebar && App.UI.Sidebar.init) App.UI.Sidebar.init();

    // Start activity tracking for auto-lock
    this._startActivityTracking();

    App.Core.Router.navigate('dashboard');
    App.UI.Toast.show('Welcome back, ' + (this.currentUser?.name || 'User'));
  },

  _startActivityTracking() {
    this.lastActivity = Date.now();

    // Clear existing timer
    if (this.lockTimer) {
      clearInterval(this.lockTimer);
    }

    // Track user activity
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach(event => {
      document.addEventListener(event, () => {
        this.lastActivity = Date.now();
      }, { passive: true });
    });

    // Check for inactivity every minute
    this.lockTimer = setInterval(() => {
      const autoLockMinutes = App.Data.config?.autoLockMinutes || 15;
      const inactiveMinutes = (Date.now() - this.lastActivity) / 60000;

      if (inactiveMinutes >= autoLockMinutes && this.currentUser && !this.isLocked) {
        this.lock();
      }
    }, 60000);
  },

  lock() {
    this.isLocked = true;
    const lockScreen = document.getElementById('lock-screen');
    if (lockScreen) {
      const lockUser = document.getElementById('lock-user-name');
      const lockPin = document.getElementById('lock-pin');
      if (lockUser) lockUser.textContent = this.currentUser?.name || 'User';
      if (lockPin) lockPin.value = '';
      lockScreen.classList.remove('hidden');
    }
  },

  unlock(pin) {
    if (!this.currentUser) return false;

    if (pin === this.currentUser.pin) {
      this.isLocked = false;
      this.lastActivity = Date.now();
      const lockScreen = document.getElementById('lock-screen');
      if (lockScreen) lockScreen.classList.add('hidden');
      return true;
    }
    return false;
  },

  logout() {
    this.currentUser = null;
    this.isLocked = false;
    if (this.lockTimer) {
      clearInterval(this.lockTimer);
      this.lockTimer = null;
    }
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('app-shell').classList.add('hidden');
    const lockScreen = document.getElementById('lock-screen');
    if (lockScreen) lockScreen.classList.add('hidden');
    document.getElementById('login-pin').value = '';
  },

  /**
   * Check if current user can access a route
   */
  canAccess(route) {
    if (!this.currentUser) return false;
    const role = this.currentUser.role || 'admin';
    const permissions = this.rolePermissions[role] || [];
    return permissions.includes(route);
  },

  /**
   * Get allowed routes for current user
   */
  getAllowedRoutes() {
    if (!this.currentUser) return [];
    const role = this.currentUser.role || 'admin';
    return this.rolePermissions[role] || [];
  },

  /**
   * Check if current user is admin
   */
  isAdmin() {
    return this.currentUser?.role === 'admin';
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await App.DB.init();
    const theme = (App.Data.Config?.theme || 'dark').toLowerCase();
    document.documentElement.setAttribute('data-theme', theme);
    App.UI.Navbar.init();
    App.UI.Sidebar.init();
    App.UI.Modal.init();
    App.Services.Auth.initLoginScreen();
  } catch (e) {
    console.error(e);
    alert('Failed to initialize MicroOps. Check console for details.');
  }
});