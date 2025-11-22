App.DB = {
  // Bump the storage key to V4 for complete blueprint implementation
  storageKey: 'MicroOps_DB_V4',

  async init() {
    const fromStorage = this._loadFromStorage();
    if (fromStorage) {
      // Normalise loaded data according to spec
      App.Data = this.normalizeData(fromStorage);
      return { isFirstRun: false };
    }

    try {
      const res = await fetch('data/microops_data.json', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        // Normalise fetched data according to spec
        App.Data = this.normalizeData(json);
        this.save();
        return { isFirstRun: false };
      }
    } catch (e) {
      console.warn('Could not fetch microops_data.json, using seed data.', e);
    }

    this._seed();
    this.save();
    return { isFirstRun: true };
  },

  /**
   * Check if this is first run (no data)
   */
  isFirstRun() {
    return !localStorage.getItem(this.storageKey);
  },

  /**
   * Clear all data and return to first-run state
   */
  reset() {
    localStorage.removeItem(this.storageKey);
    App.Data = null;
  },

  /**
   * Export full database as downloadable JSON backup
   */
  exportBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `microops_backup_${timestamp}.json`;
    const data = {
      _backupMeta: {
        version: 'V4',
        exportedAt: new Date().toISOString(),
        appVersion: '0.1.0'
      },
      ...App.Data
    };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    );
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
    return filename;
  },

  /**
   * Import database from JSON file
   * @param {File} file - The JSON file to import
   * @returns {Promise<{success: boolean, message: string, stats?: object}>}
   */
  async importBackup(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          // Remove backup metadata before import
          delete data._backupMeta;

          // Validate structure
          const required = ['config', 'users'];
          for (const key of required) {
            if (!data[key] && !data[key.charAt(0).toUpperCase() + key.slice(1)]) {
              resolve({ success: false, message: `Invalid backup: missing ${key}` });
              return;
            }
          }

          // Normalize and set data
          App.Data = this.normalizeData(data);
          this.save();

          // Return stats
          const stats = {
            users: (App.Data.users || []).length,
            customers: (App.Data.customers || []).length,
            products: (App.Data.products || []).length,
            orders: (App.Data.orders || []).length,
            documents: (App.Data.documents || []).length
          };

          resolve({ success: true, message: 'Backup restored successfully', stats });
        } catch (err) {
          resolve({ success: false, message: `Import failed: ${err.message}` });
        }
      };
      reader.onerror = () => {
        resolve({ success: false, message: 'Failed to read file' });
      };
      reader.readAsText(file);
    });
  },

  /**
   * Normalise a data object into the canonical structure used by the latest specification.
   * Older capitalised keys are mapped to their lower-case counterparts. Missing collections
   * are initialised to empty arrays. Legacy keys remain pointing to the same arrays so that
   * older code still works.
   *
   * @param {Object} data Raw data loaded from storage or JSON file
   * @returns {Object} Normalised data with both new and legacy keys
   */
  normalizeData(data) {
    if (!data || typeof data !== 'object') return data;
    const normalised = {};

    // Config - Complete blueprint schema
    const existingConfig = data.config || data.Config || {};
    normalised.config = {
      // Company
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
      // Defaults
      defaultVatRate: existingConfig.defaultVatRate ?? 0.2,
      defaultPaymentTerms: existingConfig.defaultPaymentTerms || '14 Tage netto',
      defaultDeliveryTerms: existingConfig.defaultDeliveryTerms || 'FCA',
      // UI
      lang: existingConfig.lang || 'en',
      theme: existingConfig.theme || 'dark',
      // Environment
      isDemo: existingConfig.isDemo ?? false,
      autoLockMinutes: existingConfig.autoLockMinutes ?? 15,
      // Numbering sequences
      numberSequences: existingConfig.numberSequences || {
        lastOrderNumber: existingConfig.lastOrderNumber || 75,
        lastDeliveryNumber: existingConfig.lastDeliveryNumber || 58,
        lastInvoiceNumber: existingConfig.lastInvoiceNumber || 68,
        lastProductionOrderNumber: existingConfig.lastProductionOrderNumber || 1
      }
    };
    // Collections: use lower case names, fallback to legacy
    normalised.users            = data.users || data.Users || [];
    normalised.customers        = data.customers || data.Customers || [];
    normalised.products         = data.products || data.Products || [];
    normalised.components       = data.components || data.Components || [];
    normalised.suppliers        = data.suppliers || data.Suppliers || [];
    normalised.carriers         = data.carriers || data.Carriers || [];
    normalised.priceLists       = data.priceLists || data.PriceLists || [];
    normalised.orders           = data.orders || data.Orders || [];
    normalised.documents        = data.documents || data.Documents || [];
    normalised.productionOrders = data.productionOrders || data.ProductionOrders || [];
    normalised.movements        = data.movements || data.Movements || [];
    normalised.tasks            = data.tasks || data.Tasks || [];
    normalised.batches          = data.batches || data.Batches || [];
    normalised.purchaseOrders   = data.purchaseOrders || data.PurchaseOrders || [];
    // Mirror uppercase keys to preserve compatibility
    normalised.Config           = normalised.config;
    normalised.Users            = normalised.users;
    normalised.Customers        = normalised.customers;
    normalised.Products         = normalised.products;
    normalised.Components       = normalised.components;
    normalised.Suppliers        = normalised.suppliers;
    normalised.Carriers         = normalised.carriers;
    normalised.PriceLists       = normalised.priceLists;
    normalised.Orders           = normalised.orders;
    normalised.Documents        = normalised.documents;
    normalised.ProductionOrders = normalised.productionOrders;
    normalised.Movements        = normalised.movements;
    normalised.Tasks            = normalised.tasks;
    return normalised;
  },

  _loadFromStorage() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to parse local DB, ignoring.', e);
      return null;
    }
  },

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(App.Data));
    } catch (e) {
      console.warn('Failed to save DB.', e);
    }
  },

  exportJSON() {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(
      new Blob([JSON.stringify(App.Data, null, 2)], { type: 'application/json' })
    );
    a.download = 'microops_data.json';
    a.click();
  },

  _seed() {
    // Provide a comprehensive seed using the new canonical structure. This seed
    // populates all collections with realistic demo data so that pages and
    // features can be exercised without having to import data manually.
    const seed = {
      config: {
        // Company
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
        // Defaults
        defaultVatRate: 0.2,
        defaultPaymentTerms: '14 Tage netto',
        defaultDeliveryTerms: 'FCA',
        // UI
        lang: 'en',
        theme: 'dark',
        // Environment
        isDemo: true,
        autoLockMinutes: 15,
        // Numbering sequences
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
          contacts: [ { name: 'Max Mustermann', position: 'Einkauf', phone: '+43 512 123456', email: 'max@bluutec.at' } ]
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
          contacts: [ { name: 'Marie Curie', position: 'Head of Procurement', phone: '+33 1 2345 6789', email: 'marie@lepage.fr' } ]
        }
      ],
      products: [
        {
          id: 'p1',
          internalArticleNumber: '350500',
          sku: 'FL-500ML',
          nameDE: 'Flächendesinfektion 500 ml',
          nameEN: 'Surface Disinfectant 500 ml',
          productLine: 'Desinfektion',
          volume: '500 ml',
          dosageForm: 'solution',
          unit: 'Flasche',
          vpe: 12,
          palletQuantity: 720,
          avgPurchasePrice: 2.5,
          dealerPrice: 4.5,
          endCustomerPrice: 6.9,
          currency: 'EUR',
          customsCode: '38089490',
          originCountry: 'AT',
          stock: 1200,
          minStock: 100,
          type: 'Consumable',
          allowDecimalQty: false
        },
        {
          id: 'p2',
          internalArticleNumber: '800100',
          sku: 'FFU-01',
          nameDE: 'Flex Fogging Unit',
          nameEN: 'Flex Fogging Unit',
          productLine: 'Device',
          volume: '',
          dosageForm: '',
          unit: 'Stk',
          vpe: 1,
          palletQuantity: 20,
          avgPurchasePrice: 900,
          dealerPrice: 1200,
          endCustomerPrice: 1500,
          currency: 'EUR',
          customsCode: '84241900',
          originCountry: 'DE',
          stock: 50,
          minStock: 5,
          type: 'Device',
          allowDecimalQty: false
        },
        {
          id: 'p3',
          internalArticleNumber: '900010',
          sku: 'SERV-INST',
          nameDE: 'Installation Service',
          nameEN: 'Installation Service',
          productLine: 'Service',
          unit: 'job',
          avgPurchasePrice: 0,
          dealerPrice: 100,
          endCustomerPrice: 150,
          currency: 'EUR',
          type: 'Service',
          allowDecimalQty: false
        },
        {
          id: 'p4',
          internalArticleNumber: '100200',
          sku: 'DIS-5L-FIN',
          nameDE: 'Desinfektionsmittel 5L Kanister',
          nameEN: 'Disinfectant 5L Canister',
          productLine: 'Desinfektion',
          volume: '5000 ml',
          dosageForm: 'solution',
          unit: 'Kanister',
          vpe: 4,
          palletQuantity: 120,
          avgPurchasePrice: 12,
          dealerPrice: 22,
          endCustomerPrice: 29.9,
          currency: 'EUR',
          customsCode: '38089490',
          originCountry: 'AT',
          stock: 85,
          minStock: 20,
          type: 'Finished',
          allowDecimalQty: false
        },
        {
          id: 'p5',
          internalArticleNumber: '100300',
          sku: 'HAND-GEL',
          nameDE: 'Handdesinfektion Gel 100ml',
          nameEN: 'Hand Sanitizer Gel 100ml',
          productLine: 'Desinfektion',
          volume: '100 ml',
          dosageForm: 'gel',
          unit: 'Tube',
          vpe: 24,
          palletQuantity: 960,
          avgPurchasePrice: 0.8,
          dealerPrice: 1.8,
          endCustomerPrice: 2.99,
          currency: 'EUR',
          customsCode: '38089490',
          originCountry: 'AT',
          stock: 450,
          minStock: 100,
          type: 'Finished',
          allowDecimalQty: false
        },
        {
          id: 'p6',
          internalArticleNumber: '500100',
          sku: 'PUMP-REPL',
          nameDE: 'Ersatzpumpe für Fogging Unit',
          nameEN: 'Replacement Pump for Fogging Unit',
          productLine: 'Part',
          unit: 'Stk',
          vpe: 1,
          palletQuantity: 100,
          avgPurchasePrice: 45,
          dealerPrice: 89,
          endCustomerPrice: 119,
          currency: 'EUR',
          customsCode: '84135000',
          originCountry: 'DE',
          stock: 25,
          minStock: 5,
          type: 'Part',
          allowDecimalQty: false
        },
        {
          id: 'p7',
          internalArticleNumber: '500200',
          sku: 'FILTER-SET',
          nameDE: 'Filterset für Fogging Unit',
          nameEN: 'Filter Set for Fogging Unit',
          productLine: 'Part',
          unit: 'Set',
          vpe: 5,
          palletQuantity: 200,
          avgPurchasePrice: 8,
          dealerPrice: 18,
          endCustomerPrice: 24.9,
          currency: 'EUR',
          customsCode: '84219990',
          originCountry: 'DE',
          stock: 3,
          minStock: 10,
          type: 'Part',
          allowDecimalQty: false
        }
      ],
      components: [
        {
          id: 'cmp1',
          componentNumber: 'BOTTLE-500',
          group: 'Bottle',
          description: '500 ml PET bottle',
          unit: 'Stk',
          stock: 3000,
          safetyStock: 500,
          supplierId: 'sup1',
          leadTimeDays: 14,
          prices: [ { supplierId: 'sup1', price: 0.15, moq: 1000, currency: 'EUR' } ],
          status: 'active',
          notes: 'Used for 500 ml disinfectant'
        },
        {
          id: 'cmp2',
          componentNumber: 'CAP-SCRW',
          group: 'Cap',
          description: 'Screw cap for bottles',
          unit: 'Stk',
          stock: 5000,
          safetyStock: 800,
          supplierId: 'sup2',
          leadTimeDays: 10,
          prices: [ { supplierId: 'sup2', price: 0.05, moq: 2000, currency: 'EUR' } ],
          status: 'active',
          notes: 'Fits all bottle sizes'
        }
      ],
      suppliers: [
        { id: 'sup1', name: 'BottleCo', street: 'Packagingstrasse 10', zip: '1100', city: 'Vienna', country: 'AT', contactPerson: 'Lisa Bottler', phone: '+43 1 2345678', email: 'info@bottleco.at', notes: 'Main supplier for PET bottles' },
        { id: 'sup2', name: 'CapMaster', street: 'Kappenweg 2', zip: '4050', city: 'Linz', country: 'AT', contactPerson: 'Thomas Cap', phone: '+43 732 987654', email: 'sales@capmaster.at', notes: 'Provides screw caps and pumps' }
      ],
      carriers: [
        { id: 'car1', name: 'Dachser', accountNumber: 'DAC-001', contactPerson: 'Michaela Fracht', phone: '+43 5574 12345', email: 'transport@dachser.at', notes: 'Preferred for domestic deliveries' },
        { id: 'car2', name: 'Lagermax', accountNumber: 'LMX-008', contactPerson: 'Jonas Lager', phone: '+43 662 765432', email: 'service@lagermax.at', notes: 'Used for international shipments' }
      ],
      priceLists: [
        {
          id: 'pl1',
          name: 'Preisliste 2025 (Händler)',
          type: 'segment',
          segmentId: 'dealer',
          currency: 'EUR',
          validFrom: '2025-01-01',
          validTo: '2025-12-31',
          entries: [
            { productId: 'p1', price: 4.5, uvp: 6.9, minOrderQty: 12, tariffCode: '38089490', originCountry: 'AT', languages: 'DE,EN' },
            { productId: 'p2', price: 1200, uvp: 1500, minOrderQty: 1, tariffCode: '84241900', originCountry: 'DE', languages: 'DE,EN' }
          ]
        },
        {
          id: 'pl2',
          name: 'Preisliste Endkunde 2025',
          type: 'segment',
          segmentId: 'endcustomer',
          currency: 'EUR',
          validFrom: '2025-01-01',
          validTo: '2025-12-31',
          entries: [
            { productId: 'p1', price: 6.9, uvp: 7.5, minOrderQty: 1, tariffCode: '38089490', originCountry: 'AT', languages: 'DE,EN' },
            { productId: 'p2', price: 1500, uvp: 1700, minOrderQty: 1, tariffCode: '84241900', originCountry: 'DE', languages: 'DE,EN' }
          ]
        },
        {
          id: 'pl3',
          name: 'Preisliste Lepage 05_2025',
          type: 'customer',
          customerId: 'c2',
          currency: 'EUR',
          validFrom: '2025-05-01',
          validTo: '2025-12-31',
          entries: [
            { productId: 'p1', price: 5.5, uvp: 7.5, minOrderQty: 12, tariffCode: '38089490', originCountry: 'AT', languages: 'DE,EN' },
            { productId: 'p2', price: 1100, uvp: 1500, minOrderQty: 1, tariffCode: '84241900', originCountry: 'DE', languages: 'DE,EN' }
          ]
        }
      ],
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
          currency: 'EUR',
          deliveryNoteIds: ['d1'],
          invoiceIds: ['i1']
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
          paymentTerms: '10 Tage netto',
          deliveryTerms: 'FCA',
          items: [
            { productId: 'p1', articleNumber: '350500', description: 'Flächendesinfektion 500 ml', qty: 24, unit: 'Flasche', unitPrice: 4.5, vatRate: 0.2, lineNet: 108, lineVat: 21.6, lineTotal: 129.6 },
            { productId: 'p2', articleNumber: '800100', description: 'Flex Fogging Unit', qty: 1, unit: 'Stk', unitPrice: 1200, vatRate: 0.2, lineNet: 1200, lineVat: 240, lineTotal: 1440 }
          ],
          netTotal: 1308,
          vatSummary: [ { rate: 0.2, base: 1308, amount: 261.6 } ],
          grossTotal: 1569.6,
          status: 'Sent'
        },
        {
          id: 'i1',
          type: 'invoice',
          docNumber: 'R20250068',
          date: '2025-05-12',
          customerId: 'c1',
          billingAddressId: 'a1',
          shippingAddressId: 'a2',
          orderId: 'o1',
          refDeliveryId: 'd1',
          paymentTerms: '10 Tage netto',
          deliveryTerms: 'FCA',
          items: [
            { productId: 'p1', articleNumber: '350500', description: 'Flächendesinfektion 500 ml', qty: 24, unit: 'Flasche', unitPrice: 4.5, vatRate: 0.2, lineNet: 108, lineVat: 21.6, lineTotal: 129.6 },
            { productId: 'p2', articleNumber: '800100', description: 'Flex Fogging Unit', qty: 1, unit: 'Stk', unitPrice: 1200, vatRate: 0.2, lineNet: 1200, lineVat: 240, lineTotal: 1440 }
          ],
          netTotal: 1308,
          vatSummary: [ { rate: 0.2, base: 1308, amount: 261.6 } ],
          grossTotal: 1569.6,
          status: 'Draft'
        }
      ],
      productionOrders: [
        { id: 'po1', orderNumber: 'PO-2025-01', productId: 'p2', quantity: 10, createdBy: 'u4', createdAt: '2025-05-01', plannedStart: '2025-05-20', plannedEnd: '2025-05-30', status: 'open', components: [], notes: 'First batch of fogging units' }
      ],
      movements: [
        { id: 'm1', date: '2025-05-02', type: 'receipt', direction: 'in', productId: 'p1', quantity: 240, unitPrice: 2.5, reference: 'Stock receipt' },
        { id: 'm2', date: '2025-05-10', type: 'consumption', direction: 'out', productId: 'p1', quantity: 24, unitPrice: 2.5, reference: 'Order A2025-0075' },
        { id: 'm3', date: '2025-05-10', type: 'consumption', direction: 'out', productId: 'p2', quantity: 1, unitPrice: 900, reference: 'Order A2025-0075' }
      ],
      tasks: [
        { id: 't1', title: 'Prepare price list 2026', category: 'Sales', status: 'open', priority: 'high', assignedTo: 'u2', dueDate: '2025-12-01', notes: 'Gather cost updates and adjust dealer prices' },
        { id: 't2', title: 'Schedule production of fogging units', category: 'Production', status: 'open', priority: 'medium', assignedTo: 'u4', dueDate: '2025-05-18', notes: 'Ensure all components are in stock' }
      ]
    };
    // Normalise the seed and set it as the in-memory DB
    App.Data = this.normalizeData(seed);
  }
};
