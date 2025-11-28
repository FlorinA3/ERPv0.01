App.DB = {
  storageKey: 'MicroOps_DB_V4',
  dbName: 'MicroOpsDB',
  dbVersion: 1,
  db: null,
  useIndexedDB: true,
  lastSaveTime: null,
  maxBackups: 7,
  _saveTimer: null,

  async init() {
    try {
      await this._initIndexedDB();
    } catch (e) {
      console.warn('IndexedDB unavailable, using localStorage fallback', e);
      this.useIndexedDB = false;
    }

    const fromStorage = await this._loadFromStorage();
    if (fromStorage) {
      App.Data = this.normalizeData(fromStorage);
      return { isFirstRun: false };
    }

    try {
      const res = await fetch('data/microops_data.json', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        App.Data = this.normalizeData(json);
        await this.save();
        return { isFirstRun: false };
      }
    } catch (e) {
      console.warn('Could not fetch microops_data.json, using seed data.', e);
    }

    this._seed();
    await this.save();
    return { isFirstRun: true };
  },

  scheduleSave(delay = 250) {
    if (this._saveTimer) {
      clearTimeout(this._saveTimer);
    }
    this._saveTimer = setTimeout(() => {
      this._saveTimer = null;
      this.save();
    }, delay);
  },

  async _initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('data')) {
          db.createObjectStore('data', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('backups')) {
          const backupStore = db.createObjectStore('backups', { keyPath: 'timestamp' });
          backupStore.createIndex('timestamp', 'timestamp', { unique: true });
        }
      };
    });
  },

  async _loadFromStorage() {
    if (this.useIndexedDB && this.db) {
      try {
        const data = await this._idbGet('data', 'main');
        if (data) return data.value;
      } catch (e) {
        console.warn('IndexedDB read failed, trying localStorage', e);
      }
    }

    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to parse local DB', e);
      return null;
    }
  },

  async _idbGet(storeName, key) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async _idbPut(storeName, data) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.put(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async _idbGetAll(storeName) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async _idbDelete(storeName, key) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  calculateHash(data) {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  },

  async save() {
    const maxRetries = 3;
    let lastError = null;
    App.lastSaveError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const dataStr = JSON.stringify(App.Data);

        if (this.useIndexedDB && this.db) {
          await this._idbPut('data', { id: 'main', value: App.Data });
        }

        localStorage.setItem(this.storageKey, dataStr);
        this.lastSaveTime = new Date();

        if (App.UI && App.UI.showSuccess) {
          App.UI.showSuccess('Data saved');
        }
        return true;
      } catch (e) {
        lastError = e;
        console.error(`Save attempt ${attempt}/${maxRetries} failed:`, e);

        if (e.name === 'QuotaExceededError') {
          App.lastSaveError = {
            type: 'QUOTA_EXCEEDED',
            message: 'Storage quota exceeded. Export backup and clear old data.'
          };
          break;
        }

        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 100 * Math.pow(2, attempt - 1)));
        }
      }
    }

    if (lastError) {
      App.lastSaveError = App.lastSaveError || {
        type: 'SAVE_FAILED',
        message: `Failed to save after ${maxRetries} attempts: ${lastError.message}`
      };

      if (App.UI && App.UI.showError) {
        App.UI.showError('CRITICAL: ' + App.lastSaveError.message, 0);
      }
    }

    return !lastError;
  },

  async autoBackupOnExit() {
    await this.storeBackup();
  },

  async storeBackup() {
    if (!this.useIndexedDB || !this.db) return null;

    try {
      const backup = {
        timestamp: new Date().toISOString(),
        data: JSON.parse(JSON.stringify(App.Data)),
        hash: this.calculateHash(App.Data),
        size: JSON.stringify(App.Data).length
      };

      await this._idbPut('backups', backup);
      await this._pruneBackups();

      return backup.timestamp;
    } catch (e) {
      console.error('Backup failed:', e);
      return null;
    }
  },

  async _pruneBackups() {
    const backups = await this._idbGetAll('backups');
    if (backups.length > this.maxBackups) {
      backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const toDelete = backups.slice(this.maxBackups);
      for (const backup of toDelete) {
        await this._idbDelete('backups', backup.timestamp);
      }
    }
  },

  async listBackups() {
    if (!this.useIndexedDB || !this.db) return [];

    try {
      const backups = await this._idbGetAll('backups');
      return backups
        .map(b => ({
          timestamp: b.timestamp,
          size: b.size,
          hash: b.hash,
          canRestore: true
        }))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (e) {
      console.error('Failed to list backups:', e);
      return [];
    }
  },

  async restoreFromBackup(timestamp) {
    if (!this.useIndexedDB || !this.db) {
      throw new Error('IndexedDB not available');
    }

    const backup = await this._idbGet('backups', timestamp);
    if (!backup) {
      throw new Error('Backup not found');
    }

    const currentHash = this.calculateHash(backup.data);
    if (currentHash !== backup.hash) {
      throw new Error('Backup integrity check failed. Data may be corrupted.');
    }

    App.Data = this.normalizeData(backup.data);
    await this.save();

    if (App.Audit && App.Audit.log) {
      App.Audit.log('RESTORE', 'backup', timestamp, null, { restored: timestamp });
    }

    return true;
  },

  async getStorageInfo() {
    let used = 0;
    let limit = 50 * 1024 * 1024;

    try {
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        used = estimate.usage || 0;
        limit = estimate.quota || limit;
      } else {
        const dataStr = JSON.stringify(App.Data || {});
        used = dataStr.length * 2;
      }
    } catch (e) {
      console.warn('Could not estimate storage:', e);
    }

    return {
      used,
      limit,
      percent: Math.round((used / limit) * 100),
      usedMB: (used / 1024 / 1024).toFixed(2),
      limitMB: (limit / 1024 / 1024).toFixed(2)
    };
  },

  isFirstRun() {
    return !localStorage.getItem(this.storageKey);
  },

  reset() {
    localStorage.removeItem(this.storageKey);
    if (this.useIndexedDB && this.db) {
      indexedDB.deleteDatabase(this.dbName);
    }
    App.Data = null;
  },

  encryptData(data, password) {
    if (!password) return JSON.stringify(data);
    const dataStr = JSON.stringify(data);
    let encrypted = '';
    for (let i = 0; i < dataStr.length; i++) {
      encrypted += String.fromCharCode(
        dataStr.charCodeAt(i) ^ password.charCodeAt(i % password.length)
      );
    }
    return btoa(unescape(encodeURIComponent(encrypted)));
  },

  decryptData(encrypted, password) {
    if (!password || encrypted.startsWith('{')) {
      return JSON.parse(encrypted);
    }
    try {
      const decoded = decodeURIComponent(escape(atob(encrypted)));
      let decrypted = '';
      for (let i = 0; i < decoded.length; i++) {
        decrypted += String.fromCharCode(
          decoded.charCodeAt(i) ^ password.charCodeAt(i % password.length)
        );
      }
      return JSON.parse(decrypted);
    } catch (e) {
      throw new Error('Incorrect password or corrupted backup');
    }
  },

  exportBackup(password = null) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `microops_backup_${timestamp}.json`;

    const backupData = {
      _meta: {
        version: 'V4',
        exportedAt: new Date().toISOString(),
        isEncrypted: !!password,
        hash: this.calculateHash(App.Data)
      },
      data: App.Data,
      auditLog: App.Data.auditLog || []
    };

    let content;
    if (password) {
      content = this.encryptData(backupData, password);
    } else {
      content = JSON.stringify(backupData, null, 2);
    }

    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);

    if (App.UI && App.UI.showSuccess) {
      App.UI.showSuccess(`Backup exported: ${filename}`);
    }

    return filename;
  },

  async importBackup(file, password = null) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          let data;
          const content = e.target.result;

          if (password || !content.startsWith('{')) {
            data = this.decryptData(content, password);
          } else {
            data = JSON.parse(content);
          }

          if (data._meta && data._meta.hash) {
            const currentHash = this.calculateHash(data.data);
            if (currentHash !== data._meta.hash) {
              throw new Error('Backup integrity check failed');
            }
          }

          const importData = data.data || data;
          delete importData._backupMeta;
          delete importData._meta;

          App.Data = this.normalizeData(importData);
          await this.save();

          if (App.Audit && App.Audit.log) {
            App.Audit.log('IMPORT', 'backup', 'file', null, { file: file.name });
          }

          const stats = {
            customers: (App.Data.customers || []).length,
            products: (App.Data.products || []).length,
            orders: (App.Data.orders || []).length
          };

          if (App.UI && App.UI.showSuccess) {
            App.UI.showSuccess('Backup restored successfully');
          }

          resolve({ success: true, message: 'Backup restored', stats });
        } catch (err) {
          if (App.UI && App.UI.showError) {
            App.UI.showError(`Import failed: ${err.message}`);
          }
          resolve({ success: false, message: err.message });
        }
      };
      reader.onerror = () => resolve({ success: false, message: 'Failed to read file' });
      reader.readAsText(file);
    });
  },

  exportJSON() {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(
      new Blob([JSON.stringify(App.Data, null, 2)], { type: 'application/json' })
    );
    a.download = 'microops_data.json';
    a.click();
  },

  normalizeData(data) {
    if (!data || typeof data !== 'object') return data;
    const normalised = {};

    const existingConfig = data.config || data.Config || {};
    normalised.config = {
      companyName: existingConfig.companyName || 'MicroOps',
      street: existingConfig.street || '',
      zip: existingConfig.zip || '',
      city: existingConfig.city || '',
      country: existingConfig.country || 'AT',
      vatNumber: existingConfig.vatNumber || '',
      commercialRegisterNumber: existingConfig.commercialRegisterNumber || '',
      iban: existingConfig.iban || '',
      bic: existingConfig.bic || '',
      bankName: existingConfig.bankName || '',
      currency: existingConfig.currency || 'EUR',
      defaultVatRate: existingConfig.defaultVatRate ?? 0.2,
      defaultPaymentTerms: existingConfig.defaultPaymentTerms || '14 Tage netto',
      defaultDeliveryTerms: existingConfig.defaultDeliveryTerms || 'FCA',
      lang: existingConfig.lang || 'en',
      theme: existingConfig.theme || 'dark',
      isDemo: existingConfig.isDemo ?? false,
      autoLockMinutes: existingConfig.autoLockMinutes ?? 15,
      encryptBackups: existingConfig.encryptBackups ?? false,
      numberSequences: existingConfig.numberSequences || {
        lastOrderNumber: existingConfig.lastOrderNumber || 75,
        lastDeliveryNumber: existingConfig.lastDeliveryNumber || 58,
        lastInvoiceNumber: existingConfig.lastInvoiceNumber || 68,
        lastProductionOrderNumber: existingConfig.lastProductionOrderNumber || 1
      }
    };

    normalised.users = data.users || data.Users || [];
    normalised.customers = data.customers || data.Customers || [];
    normalised.products = data.products || data.Products || [];
    normalised.components = data.components || data.Components || [];
    normalised.suppliers = data.suppliers || data.Suppliers || [];
    normalised.carriers = data.carriers || data.Carriers || [];
    normalised.priceLists = data.priceLists || data.PriceLists || [];
    normalised.orders = data.orders || data.Orders || [];
    normalised.documents = data.documents || data.Documents || [];
    normalised.productionOrders = data.productionOrders || data.ProductionOrders || [];
    normalised.movements = data.movements || data.Movements || [];
    normalised.tasks = data.tasks || data.Tasks || [];
    normalised.batches = data.batches || data.Batches || [];
    normalised.purchaseOrders = data.purchaseOrders || data.PurchaseOrders || [];
    normalised.activityLog = data.activityLog || data.ActivityLog || [];
    normalised.auditLog = data.auditLog || [];

    normalised.Config = normalised.config;
    normalised.Users = normalised.users;
    normalised.Customers = normalised.customers;
    normalised.Products = normalised.products;
    normalised.Components = normalised.components;
    normalised.Suppliers = normalised.suppliers;
    normalised.Carriers = normalised.carriers;
    normalised.PriceLists = normalised.priceLists;
    normalised.Orders = normalised.orders;
    normalised.Documents = normalised.documents;
    normalised.ProductionOrders = normalised.productionOrders;
    normalised.Movements = normalised.movements;
    normalised.Tasks = normalised.tasks;

    return normalised;
  },

  _seed() {
    const seed = {
      config: {
        companyName: 'DF-Pure GmbH',
        street: 'Industriestrasse 15',
        zip: '6020',
        city: 'Innsbruck',
        country: 'AT',
        vatNumber: 'ATU12345678',
        commercialRegisterNumber: 'FN 123456a',
        iban: 'AT61 1904 3002 3457 3201',
        bic: 'BKAUATWW',
        bankName: 'Bank Austria',
        currency: 'EUR',
        defaultVatRate: 0.2,
        defaultPaymentTerms: '14 Tage netto',
        defaultDeliveryTerms: 'FCA',
        lang: 'en',
        theme: 'dark',
        isDemo: true,
        autoLockMinutes: 15,
        numberSequences: {
          lastOrderNumber: 75,
          lastDeliveryNumber: 58,
          lastInvoiceNumber: 68,
          lastProductionOrderNumber: 1
        }
      },
      users: [
        { id: 'u1', name: 'Admin User', role: 'admin', pin: '0000', preferredLang: 'en', preferredTheme: 'dark', active: true, createdAt: '2025-01-01T00:00:00.000Z' },
        { id: 'u2', name: 'Sales User', role: 'sales', pin: '1111', preferredLang: 'de', preferredTheme: 'light', active: true, createdAt: '2025-01-01T00:00:00.000Z' },
        { id: 'u3', name: 'Warehouse Mgr', role: 'warehouse', pin: '2222', preferredLang: 'en', preferredTheme: 'dark', active: true, createdAt: '2025-01-01T00:00:00.000Z' },
        { id: 'u4', name: 'Production Lead', role: 'production', pin: '3333', preferredLang: 'de', preferredTheme: 'dark', active: true, createdAt: '2025-01-01T00:00:00.000Z' }
      ],
      customers: [
        {
          id: 'c1',
          internalId: '230001',
          company: 'BLUUTEC GmbH',
          status: 'active',
          defaultLang: 'de',
          accountManager: 'Anna',
          vatNumber: 'ATU12345678',
          paymentTerms: '10 Tage netto',
          deliveryTerms: 'FCA',
          iban: 'AT61 1904 3002 3457 3201',
          bic: 'BANKATWWXXX',
          bankName: 'Bank Austria',
          priceSegment: 'dealer',
          addresses: [
            { id: 'a1', role: 'billing', isDefaultBilling: true, isDefaultShipping: false, company: 'BLUUTEC GmbH', street: 'Industriestrasse 1', zip: '6020', city: 'Innsbruck', country: 'AT' },
            { id: 'a2', role: 'shipping', isDefaultBilling: false, isDefaultShipping: true, company: 'BLUUTEC GmbH', street: 'Lagerweg 5', zip: '6020', city: 'Innsbruck', country: 'AT' }
          ],
          contacts: [{ name: 'Max Mustermann', position: 'Einkauf', phone: '+43 512 123456', email: 'max@bluutec.at' }]
        },
        {
          id: 'c2',
          internalId: '230002',
          company: 'Lepage Medical',
          status: 'active',
          defaultLang: 'en',
          accountManager: 'John',
          vatNumber: 'DE99999999',
          paymentTerms: '30 Tage netto',
          deliveryTerms: 'DAP',
          iban: 'DE89 3704 0044 0532 0130 00',
          bic: 'COBADEFFXXX',
          bankName: 'Commerzbank',
          priceSegment: 'lepage',
          addresses: [
            { id: 'a3', role: 'billing', isDefaultBilling: true, isDefaultShipping: true, company: 'Lepage Medical', street: 'Rue de la Santé 7', zip: '75013', city: 'Paris', country: 'FR' }
          ],
          contacts: [{ name: 'Marie Curie', position: 'Head of Procurement', phone: '+33 1 2345 6789', email: 'marie@lepage.fr' }]
        }
      ],
      products: [
        { id: 'p1', internalArticleNumber: '350500', sku: 'FL-500ML', nameDE: 'Flächendesinfektion 500 ml', nameEN: 'Surface Disinfectant 500 ml', productLine: 'Desinfektion', volume: '500 ml', dosageForm: 'solution', unit: 'Flasche', vpe: 12, palletQuantity: 720, avgPurchasePrice: 2.5, dealerPrice: 4.5, endCustomerPrice: 6.9, currency: 'EUR', customsCode: '38089490', originCountry: 'AT', stock: 1200, minStock: 100, type: 'Consumable', allowDecimalQty: false },
        { id: 'p2', internalArticleNumber: '800100', sku: 'FFU-01', nameDE: 'Flex Fogging Unit', nameEN: 'Flex Fogging Unit', productLine: 'Device', unit: 'Stk', vpe: 1, palletQuantity: 20, avgPurchasePrice: 900, dealerPrice: 1200, endCustomerPrice: 1500, currency: 'EUR', customsCode: '84241900', originCountry: 'DE', stock: 50, minStock: 5, type: 'Device', allowDecimalQty: false },
        { id: 'p3', internalArticleNumber: '900010', sku: 'SERV-INST', nameDE: 'Installation Service', nameEN: 'Installation Service', productLine: 'Service', unit: 'job', avgPurchasePrice: 0, dealerPrice: 100, endCustomerPrice: 150, currency: 'EUR', type: 'Service', allowDecimalQty: false }
      ],
      components: [
        { id: 'cmp1', componentNumber: 'BOTTLE-500', group: 'Bottle', description: '500 ml PET bottle', unit: 'Stk', stock: 3000, safetyStock: 500, supplierId: 'sup1', leadTimeDays: 14, status: 'active' },
        { id: 'cmp2', componentNumber: 'CAP-SCRW', group: 'Cap', description: 'Screw cap for bottles', unit: 'Stk', stock: 5000, safetyStock: 800, supplierId: 'sup2', leadTimeDays: 10, status: 'active' }
      ],
      suppliers: [
        { id: 'sup1', name: 'BottleCo', street: 'Packagingstrasse 10', zip: '1100', city: 'Vienna', country: 'AT', contactPerson: 'Lisa Bottler', phone: '+43 1 2345678', email: 'info@bottleco.at' },
        { id: 'sup2', name: 'CapMaster', street: 'Kappenweg 2', zip: '4050', city: 'Linz', country: 'AT', contactPerson: 'Thomas Cap', phone: '+43 732 987654', email: 'sales@capmaster.at' }
      ],
      carriers: [
        { id: 'car1', name: 'Dachser', accountNumber: 'DAC-001', contactPerson: 'Michaela Fracht', phone: '+43 5574 12345', email: 'transport@dachser.at' },
        { id: 'car2', name: 'Lagermax', accountNumber: 'LMX-008', contactPerson: 'Jonas Lager', phone: '+43 662 765432', email: 'service@lagermax.at' }
      ],
      priceLists: [],
      orders: [
        {
          id: 'o1',
          orderId: 'A2025-0075',
          custId: 'c1',
          carrierId: 'car1',
          createdBy: 'u2',
          date: '2025-05-10',
          plannedDelivery: '2025-05-15',
          status: 'confirmed',
          customerReference: 'REF-001',
          items: [
            { id: 'oi1', productId: 'p1', qty: 24, unitPrice: 4.5, discount: 0, lineNet: 108 },
            { id: 'oi2', productId: 'p2', qty: 1, unitPrice: 1200, discount: 0, lineNet: 1200 }
          ],
          subtotalNet: 1308,
          vatAmount: 261.6,
          totalGross: 1569.6,
          currency: 'EUR'
        }
      ],
      documents: [
        {
          id: 'd1',
          type: 'delivery',
          docNumber: 'L20250058',
          date: '2025-05-11',
          customerId: 'c1',
          billingAddressId: 'a1',
          shippingAddressId: 'a2',
          orderId: 'o1',
          items: [
            { productId: 'p1', articleNumber: '350500', description: 'Flächendesinfektion 500 ml', qty: 24, unit: 'Flasche', unitPrice: 4.5, vatRate: 0.2, lineNet: 108, lineVat: 21.6, lineTotal: 129.6 }
          ],
          netTotal: 108,
          vatSummary: [{ rate: 0.2, base: 108, amount: 21.6 }],
          grossTotal: 129.6,
          status: 'Sent'
        }
      ],
      productionOrders: [],
      movements: [
        { id: 'm1', date: '2025-05-02', type: 'receipt', direction: 'in', productId: 'p1', quantity: 240, unitPrice: 2.5, reference: 'Stock receipt' }
      ],
      tasks: [
        { id: 't1', title: 'Prepare price list 2026', category: 'Sales', status: 'open', priority: 'high', assignedTo: 'u2', dueDate: '2025-12-01' }
      ],
      auditLog: []
    };
    App.Data = this.normalizeData(seed);
  }
};
