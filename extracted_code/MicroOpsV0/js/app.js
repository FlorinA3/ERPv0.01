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
    },
    showMessage(text, type = 'info', duration = 5000) {
      const colors = {
        success: 'var(--color-success, #4CAF50)',
        error: 'var(--color-danger, #F44336)',
        warning: 'var(--color-warning, #FF9800)',
        info: 'var(--color-primary, #2196F3)'
      };
      const toast = document.createElement('div');
      toast.className = `ui-toast ui-toast-${type}`;
      toast.innerHTML = text;
      toast.style.cssText = `
        position: fixed; top: 20px; right: 20px; padding: 12px 20px;
        background: ${colors[type] || colors.info}; color: white;
        border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10001; font-weight: 500; max-width: 400px;
        animation: slideIn 0.3s ease;
      `;
      document.body.appendChild(toast);
      if (duration > 0) {
        setTimeout(() => {
          toast.style.animation = 'slideOut 0.3s ease';
          setTimeout(() => toast.remove(), 300);
        }, duration);
      }
      return toast;
    },
    showSuccess(text) {
      return this.showMessage(text, 'success', 3000);
    },
    showError(text, duration = 8000) {
      return this.showMessage(text, 'error', duration);
    },
    showWarning(text) {
      return this.showMessage(text, 'warning', 5000);
    },
    updateErrorBanner() {
      let banner = document.getElementById('appErrorBanner');
      if (App.lastSaveError) {
        if (!banner) {
          banner = document.createElement('div');
          banner.id = 'appErrorBanner';
          document.body.insertBefore(banner, document.body.firstChild);
        }
        banner.innerHTML = `
          <div style="background: var(--color-danger, #F44336); color: white; padding: 12px 20px; text-align: center; font-weight: bold;">
            ${App.lastSaveError.message}
            <button onclick="App.UI.dismissError()" style="margin-left: 20px; padding: 4px 12px; background: white; color: var(--color-danger, #F44336); border: none; cursor: pointer; border-radius: 4px;">
              Dismiss
            </button>
          </div>
        `;
        banner.style.display = 'block';
      } else if (banner) {
        banner.style.display = 'none';
      }
    },
    dismissError() {
      App.lastSaveError = null;
      this.updateErrorBanner();
    }
  },
  Utils: {},
  SessionManager: {
    lastActivity: Date.now(),
    warningShown: false,
    sessionStartTime: Date.now(),
    timeoutMinutes: 30,
    warningMinutes: 5,
    checkInterval: null,

    init() {
      this.sessionStartTime = Date.now();
      this.lastActivity = Date.now();

      document.addEventListener('click', () => this.updateActivity(), true);
      document.addEventListener('keydown', () => this.updateActivity(), true);
      document.addEventListener('mousemove', this._throttle(() => this.updateActivity(), 10000), true);

      this.checkInterval = setInterval(() => this.checkTimeout(), 10000);

      if (App.currentUser && App.Audit) {
        App.Audit.log('LOGIN', 'session', App.currentUser.id, null, {
          user: App.currentUser.name,
          timestamp: new Date().toISOString()
        });
      }
    },

    _throttle(fn, delay) {
      let last = 0;
      return function() {
        const now = Date.now();
        if (now - last >= delay) {
          last = now;
          fn();
        }
      };
    },

    updateActivity() {
      this.lastActivity = Date.now();
      if (this.warningShown) {
        this.warningShown = false;
        this.dismissWarning();
      }
    },

    checkTimeout() {
      if (!App.currentUser) return;

      const idleMs = Date.now() - this.lastActivity;
      const timeoutMs = this.timeoutMinutes * 60 * 1000;
      const warningMs = this.warningMinutes * 60 * 1000;

      if (idleMs > timeoutMs) {
        if (App.Audit) {
          App.Audit.log('LOGOUT', 'session', App.currentUser.id, null, {
            reason: 'Session timeout',
            idleMinutes: Math.round(idleMs / 60000)
          });
        }
        this.forceLogout('Session expired for security. Please log in again.');
        return;
      }

      if (idleMs > timeoutMs - warningMs && !this.warningShown) {
        this.showWarning();
        this.warningShown = true;
      }
    },

    showWarning() {
      const remaining = Math.ceil((this.timeoutMinutes * 60 * 1000 - (Date.now() - this.lastActivity)) / 60000);
      let banner = document.getElementById('sessionWarningBanner');
      if (!banner) {
        banner = document.createElement('div');
        banner.id = 'sessionWarningBanner';
        document.body.insertBefore(banner, document.body.firstChild);
      }
      banner.innerHTML = `
        <div style="background: var(--color-warning, #FF9800); color: white; padding: 12px 20px; text-align: center; font-weight: bold;">
          Session expires in ${remaining} min - Click anywhere to extend
          <button onclick="App.SessionManager.manualLogout()" style="margin-left: 20px; padding: 4px 12px; background: white; color: var(--color-warning, #FF9800); border: none; cursor: pointer; border-radius: 4px;">
            Logout Now
          </button>
        </div>
      `;
      banner.style.display = 'block';
    },

    dismissWarning() {
      const banner = document.getElementById('sessionWarningBanner');
      if (banner) banner.remove();
    },

    forceLogout(message) {
      this.dismissWarning();
      if (this.checkInterval) clearInterval(this.checkInterval);
      App.currentUser = null;
      if (App.Services && App.Services.Auth) {
        App.Services.Auth.initLoginScreen();
      }
      if (App.UI) {
        App.UI.showError(message, 0);
      }
    },

    manualLogout() {
      if (App.currentUser && App.Audit) {
        App.Audit.log('LOGOUT', 'session', App.currentUser.id, null, {
          reason: 'User logout',
          sessionMinutes: Math.round((Date.now() - this.sessionStartTime) / 60000)
        });
      }
      this.dismissWarning();
      if (this.checkInterval) clearInterval(this.checkInterval);
      App.currentUser = null;
      if (App.Services && App.Services.Auth) {
        App.Services.Auth.initLoginScreen();
      }
    },

    getSessionDuration() {
      return Math.round((Date.now() - this.sessionStartTime) / 60000);
    }
  },
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
          pricingSection: 'Preise',
          inventory: 'Lager & Material',
          inventoryPage: 'Lagerliste',
          movements: 'Lagerbewegungen',
          batches: 'Chargen/LOT',
          ordersPage: 'Aufträge',
          purchaseOrders: 'Bestellungen',
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
          batches: { title: 'Chargen/LOT Verwaltung' },
          orders: { title: 'Aufträge' },
          purchaseOrders: { title: 'Bestellungen' },
          production: { title: 'Produktionsaufträge' },
          documents: {
            title: 'Dokumente',
            finalize: 'Finalisieren',
            finalizeTitle: 'Rechnung finalisieren',
            finalizeWarning: 'Diese Aktion kann nicht rückgängig gemacht werden!',
            finalizeDesc: 'Durch das Finalisieren wird diese Rechnung dauerhaft gesperrt. Sie können sie danach nicht mehr bearbeiten oder löschen.',
            finalized: 'Rechnung erfolgreich finalisiert',
            alreadyFinalized: 'Rechnung ist bereits finalisiert',
            finalizedTooltip: 'Diese Rechnung ist finalisiert und kann nicht bearbeitet werden',
            draftTooltip: 'Entwurf - kann bearbeitet werden',
            invoice: 'Rechnung',
            customer: 'Kunde',
            document: 'Dokument',
            total: 'Gesamt',
            // Trash bin
            trash: 'Papierkorb',
            viewTrash: 'Papierkorb anzeigen',
            trashEmpty: 'Papierkorb ist leer',
            trashTitle: 'Gelöschte Dokumente',
            trashHint: 'Dokumente wiederherstellen oder endgültig löschen.',
            movedToTrash: 'Dokument in Papierkorb verschoben',
            restore: 'Wiederherstellen',
            restored: 'Dokument wiederhergestellt',
            deletedDate: 'Gelöscht',
            permanentDelete: 'Endgültig löschen',
            confirmPermanentDelete: 'Endgültiges Löschen bestätigen',
            permanentDeleteDesc: 'Dieses Dokument wird dauerhaft aus dem System entfernt.',
            deletePermanently: 'Endgültig löschen',
            permanentlyDeleted: 'Dokument endgültig gelöscht',
            cannotUndo: 'Diese Aktion kann nicht rückgängig gemacht werden!',
            emptyTrash: 'Papierkorb leeren',
            confirmEmptyTrash: 'Papierkorb leeren',
            emptyTrashDesc: 'Alle Dokumente werden endgültig gelöscht',
            documentsInTrash: 'Dokumente im Papierkorb',
            trashEmptied: 'Papierkorb geleert',
            // Edit
            editDocument: 'Dokument bearbeiten',
            updated: 'Dokument aktualisiert',
            cannotEditFinalized: 'Finalisierte Dokumente können nicht bearbeitet werden',
            docNumber: 'Dokumentnummer',
            date: 'Datum',
            dueDate: 'Fälligkeitsdatum',
            notes: 'Notizen',
            createDelivery: 'Lieferschein',
            createInvoice: 'Rechnung'
          },
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
          saved: 'Gespeichert',
          backupSection: 'Datensicherung',
          downloadBackup: 'Backup herunterladen',
          restoreBackup: 'Backup wiederherstellen',
          backupSaved: 'Backup gespeichert als',
          backupRestored: 'Backup erfolgreich wiederhergestellt',
          backupFailed: 'Backup-Wiederherstellung fehlgeschlagen'
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
          search: 'Suchen...',
          noDataToExport: 'Keine Daten zum Exportieren',
          exportSuccess: 'Export erfolgreich',
          rows: 'Zeilen',
          // CSV Import
          importCSV: 'CSV importieren',
          selectCSVFile: 'CSV-Datei auswählen',
          importPreview: 'Import-Vorschau',
          foundRows: 'Zeilen gefunden',
          importSuccess: 'Import erfolgreich',
          importError: 'Import-Fehler',
          rowsImported: 'Zeilen importiert',
          duplicatesSkipped: 'Duplikate übersprungen',
          csvFormatHelp: 'CSV-Format: Erste Zeile = Spaltenüberschriften',
          requiredFields: 'Pflichtfelder',
          optionalFields: 'Optionale Felder',
          downloadTemplate: 'Vorlage herunterladen',
          noFileSelected: 'Keine Datei ausgewählt',
          invalidCSV: 'Ungültige CSV-Datei',
          mappingError: 'Pflichtfelder nicht gefunden',
          viewPrint: 'Anzeigen/Drucken',
          recordPayment: 'Zahlung erfassen',
          paymentHistory: 'Zahlungshistorie',
          viewDetails: 'Details anzeigen',
          changeStatus: 'Status ändern',
          deliveryNote: 'Lieferschein',
          invoice: 'Rechnung',
          receiveStock: 'Wareneingang',
          adjustStock: 'Bestand anpassen',
          createPO: 'Bestellung erstellen',
          trace: 'Rückverfolgen',
          editBOM: 'Stückliste bearbeiten',
          remove: 'Entfernen',
          receive: 'Empfangen',
          offlineMode: 'Offline-Modus - Daten werden lokal gespeichert',
          backOnline: 'Wieder online',
          // Modal titles
          deleteCarrier: 'Spediteur löschen',
          cannotDeleteCarrier: 'Spediteur kann nicht gelöscht werden',
          deleteSupplier: 'Lieferant löschen',
          deleteComponent: 'Komponente löschen',
          deleteCustomer: 'Kunde löschen',
          cannotDeleteCustomer: 'Kunde kann nicht gelöscht werden',
          deletePriceList: 'Preisliste löschen',
          deleteProduction: 'Produktionsauftrag löschen',
          cannotDeleteProduction: 'Löschen nicht möglich',
          deleteCompletedOrder: 'Abgeschlossenen Auftrag löschen',
          startProduction: 'Produktion starten',
          completeProduction: 'Produktion abschließen',
          deleteUser: 'Benutzer löschen',
          deleteProduct: 'Produkt löschen',
          cannotDeleteProduct: 'Produkt kann nicht gelöscht werden',
          documentHasPayments: 'Dokument hat Zahlungen',
          deleteDocument: 'Dokument löschen',
          recordPaymentTitle: 'Zahlung erfassen',
          deliveryNoteRequired: 'Lieferschein erforderlich',
          selectDeliveryNote: 'Lieferschein auswählen',
          deliveryNoteExists: 'Lieferschein existiert',
          cannotCreateDocument: 'Dokument kann nicht erstellt werden',
          orderDetails: 'Auftragsdetails',
          changeOrderStatus: 'Auftragsstatus ändern',
          createOrder: 'Auftrag erstellen',
          stockWarning: 'Lagerbestandswarnung',
          createProductionOrder: 'Produktionsauftrag erstellen',
          cannotDeleteOrder: 'Auftrag kann nicht gelöscht werden',
          deleteOrder: 'Auftrag löschen',
          receivePurchaseOrder: 'Bestellung empfangen',
          purchaseOrderDetails: 'Bestelldetails',
          automationSettings: 'Automatisierungseinstellungen',
          keyboardShortcuts: 'Tastaturkürzel',
          qualityControl: 'Qualitätskontrolle',
          batchTraceability: 'Chargenrückverfolgung',
          // Table headers
          artNo: 'Art.Nr.',
          name: 'Name',
          type: 'Typ',
          stock: 'Bestand',
          order: 'Auftrag',
          customer: 'Kunde',
          status: 'Status',
          carrier: 'Spediteur',
          date: 'Datum',
          dueDate: 'Fällig',
          number: 'Nummer',
          total: 'Gesamt',
          customerNo: 'Kd.Nr.',
          company: 'Firma',
          contact: 'Kontakt',
          email: 'Email',
          phone: 'Telefon',
          country: 'Land',
          lotNumber: 'LOT-Nummer',
          item: 'Artikel',
          qty: 'Menge',
          expiry: 'Ablauf',
          created: 'Erstellt',
          supplier: 'Lieferant',
          sku: 'Art.Nr.',
          product: 'Produkt',
          source: 'Quelle',
          component: 'Komponente',
          amount: 'Betrag',
          method: 'Methode',
          reference: 'Referenz',
          poNumber: 'Best.Nr.',
          documentType: 'Dokumenttyp',
          lastNumber: 'Letzte Nr.',
          time: 'Zeit',
          user: 'Benutzer',
          action: 'Aktion',
          entity: 'Objekt',
          details: 'Details',
          paymentTerms: 'Zahlungsbedingungen',
          // Toast messages
          saved: 'gespeichert',
          deleted: 'gelöscht',
          productSaved: 'Produkt gespeichert',
          productDeleted: 'Produkt gelöscht',
          customerSaved: 'Kunde gespeichert',
          customerDeleted: 'Kunde gelöscht',
          // Customer form
          addCustomer: 'Kunde hinzufügen',
          editCustomer: 'Kunde bearbeiten',
          segment: 'Segment',
          vatNumber: 'USt-IdNr.',
          contacts: 'Kontakte',
          phones: 'Telefone',
          emails: 'E-Mails',
          addresses: 'Adressen',
          notes: 'Notizen',
          label: 'Bezeichnung',
          role: 'Rolle',
          street: 'Straße',
          streetNo: 'Nr.',
          city: 'Stadt',
          zip: 'PLZ',
          main: 'Haupt',
          billing: 'Rechnung',
          shipping: 'Lieferung',
          addContact: '+ Kontakt hinzufügen',
          addPhone: '+ Telefon hinzufügen',
          addEmail: '+ E-Mail hinzufügen',
          addAddress: '+ Adresse hinzufügen',
          removeAddress: 'Entfernen',
          companyRequired: 'Firmenname ist erforderlich',
          invalidEmailFormat: 'Ungültiges E-Mail-Format',
          confirmDeleteCustomer: 'Möchten Sie wirklich löschen',
          linkedRecordsWarning: 'Dieser Kunde hat verknüpfte Datensätze:',
          deleteRecordsFirst: 'Löschen Sie diese Datensätze zuerst.',
          ordersCount: 'Auftrag/Aufträge',
          documentsCount: 'Dokument(e)',
          noCustomers: 'Keine Kunden',
          orderSaved: 'Auftrag gespeichert',
          orderDeleted: 'Auftrag gelöscht und Bestand wiederhergestellt',
          supplierSaved: 'Lieferant gespeichert',
          supplierDeleted: 'Lieferant gelöscht',
          carrierDeleted: 'Spediteur gelöscht',
          componentSaved: 'Komponente gespeichert',
          componentDeleted: 'Komponente gelöscht',
          batchSaved: 'Charge gespeichert',
          qcUpdated: 'QC-Status aktualisiert',
          stockAdjusted: 'Bestand angepasst',
          priceListDeleted: 'Preisliste gelöscht',
          poSaved: 'Bestellung gespeichert',
          poReceived: 'Bestellung empfangen und Bestand aktualisiert',
          productionDeleted: 'Produktionsauftrag gelöscht',
          productionStarted: 'Produktion gestartet',
          productionCompleted: 'Auftrag abgeschlossen & Bestand aktualisiert',
          settingsSaved: 'Systemeinstellungen gespeichert',
          userDeleted: 'Benutzer gelöscht',
          requiredFields: 'Bitte alle Pflichtfelder ausfüllen',
          validAmountRequired: 'Bitte gültigen Betrag eingeben',
          amountExceedsBalance: 'Betrag übersteigt Restbetrag',
          addAtLeastOneItem: 'Mindestens einen Artikel hinzufügen',
          automationSettingsSaved: 'Automatisierungseinstellungen gespeichert',
          // Product form
          addProduct: 'Produkt hinzufügen',
          editProduct: 'Produkt bearbeiten',
          articleNumber: 'Artikelnummer',
          nameDE: 'Name (DE)',
          nameEN: 'Name (EN)',
          purchasePrice: 'Einkaufspreis',
          endCustomerPrice: 'Endkundenpreis',
          minStock: 'Mindestbestand',
          noProducts: 'Keine Produkte',
          productRequired: 'Artikelnummer und Name (DE) sind erforderlich',
          // BOM
          bomFor: 'Stückliste für',
          defineComponents: 'Komponenten für',
          oneUnitOf: '1 Einheit von',
          noComponentsDefined: 'Keine Komponenten definiert',
          addComponentRow: '+ Komponente hinzufügen',
          saveBOM: 'Stückliste speichern',
          bomSaved: 'Stückliste gespeichert',
          components: 'Komponenten',
          perUnit: 'Pro Einheit',
          // Delete product warnings
          cannotDeleteProduct: 'Produkt kann nicht gelöscht werden',
          linkedProductRecords: 'Dieses Produkt hat verknüpfte Datensätze:',
          deleteProductRecordsFirst: 'Löschen Sie diese Datensätze zuerst.',
          productionOrdersLinked: 'Produktionsauftrag/-aufträge',
          confirmDeleteProduct: 'Möchten Sie wirklich löschen'
        },
        pricing: {
          name: 'Name',
          type: 'Typ',
          scope: 'Geltungsbereich',
          validity: 'Gültigkeit',
          status: 'Status',
          items: 'Einträge',
          managePrices: 'Preise verwalten',
          editPricesDesc: 'Bearbeiten Sie die einzelnen Produktpreise in dieser Liste. Änderungen werden beim Klicken auf Speichern gespeichert.',
          sku: 'Art.Nr.',
          product: 'Produkt',
          price: 'Preis (€)',
          uvp: 'UVP (€)',
          moq: 'Mindestbestellmenge',
          products: 'Produkte',
          total: 'Gesamt',
          saved: 'Preise gespeichert',
          changed: 'geändert',
          export: 'CSV Export',
          edit: 'Preisliste bearbeiten',
          add: 'Preisliste hinzufügen',
          segment: 'Segment',
          customer: 'Kunde',
          validFrom: 'Gültig ab',
          validTo: 'Gültig bis',
          statusActive: 'Aktiv',
          statusInactive: 'Inaktiv',
          statusScheduled: 'Geplant',
          statusExpired: 'Abgelaufen',
          typeCustomer: 'Kunde',
          typeSegment: 'Segment',
          typeDefault: 'Standard',
          defaultScope: 'Standard',
          always: 'Immer',
          noEntries: 'Keine Einträge',
          noPriceLists: 'Keine Preislisten',
          confirmDelete: 'Möchten Sie wirklich löschen',
          willRemoveEntries: 'Dadurch werden alle',
          priceEntries: 'Preiseinträge entfernt',
          nameRequired: 'Name ist erforderlich'
        },
        inventory: {
          totalValue: 'Gesamtwert',
          lowStockItems: 'Artikel mit niedrigem Bestand',
          outOfStock: 'Nicht vorrätig',
          replenishmentSuggestions: 'Nachschubvorschläge',
          createAllPOs: 'Alle Bestellungen erstellen',
          suggestedQty: 'Vorgeschlagene Menge',
          createPO: 'Bestellung erstellen',
          noSupplier: 'Kein Lieferant',
          noItemsInCategory: 'Keine Artikel in dieser Kategorie',
          exportCsv: 'CSV Export',
          sku: 'Art.Nr.',
          product: 'Produkt',
          stock: 'Bestand',
          min: 'Min',
          price: 'Preis',
          actions: 'Aktionen',
          finished: 'Fertigprodukte',
          device: 'Geräte',
          consumable: 'Verbrauchsmaterial',
          part: 'Teile',
          out: 'Aus',
          low: 'Niedrig',
          quantityToAdd: 'Hinzuzufügende Menge',
          reference: 'Referenz (Bestellnummer)',
          receive: 'Empfangen',
          newStockLevel: 'Neuer Bestand',
          reason: 'Grund',
          reasonCount: 'Physische Zählung',
          reasonDamage: 'Beschädigt/Abgelaufen',
          reasonCorrection: 'Korrektur',
          reasonOther: 'Sonstiges',
          notes: 'Notizen',
          adjust: 'Anpassen',
          enterValidQty: 'Geben Sie eine gültige Menge ein',
          received: 'empfangen',
          units: 'Einheiten',
          currentStock: 'Aktueller Bestand',
          noItemsNeedReorder: 'Keine Artikel mit Lieferanten benötigen Nachbestellung',
          poCreated: 'Bestellung erstellt',
          posCreated: 'Bestellung(en) erstellt für',
          items: 'Artikel'
        },
        movements: {
          date: 'Datum',
          type: 'Typ',
          item: 'Artikel',
          quantity: 'Menge',
          direction: 'Richtung',
          ref: 'Referenz',
          add: 'Bewegung hinzufügen',
          noMovements: 'Keine Bewegungen',
          typeReceipt: 'Wareneingang',
          typeConsumption: 'Verbrauch',
          typeProduction: 'Produktion',
          directionIn: 'Eingang',
          directionOut: 'Ausgang',
          fillRequired: 'Bitte füllen Sie alle Pflichtfelder aus'
        },
        batches: {
          title: 'Chargen / LOT Verwaltung',
          createBatch: 'Charge erstellen',
          editBatch: 'Charge bearbeiten',
          lotNumber: 'LOT-Nummer',
          type: 'Typ',
          product: 'Produkt',
          component: 'Komponente',
          quantity: 'Menge',
          productionDate: 'Produktionsdatum',
          expiryDate: 'Ablaufdatum',
          supplierLot: 'Lieferanten-LOT',
          notes: 'Notizen',
          noBatches: 'Keine Chargen',
          lotRequired: 'LOT-Nummer ist erforderlich',
          statusRejected: 'Abgelehnt',
          statusQuarantine: 'Quarantäne',
          statusExpired: 'Abgelaufen',
          statusExpiring: 'Läuft ab',
          statusReleased: 'Freigegeben',
          statusPending: 'QC ausstehend',
          qcStatus: 'QC Status',
          inspector: 'Prüfer',
          qcDate: 'QC Datum',
          qcNotes: 'QC Notizen',
          saveQC: 'QC speichern',
          forwardTrace: 'Vorwärts-Rückverfolgung (Verwendet in)',
          reverseTrace: 'Rückwärts-Rückverfolgung (Hergestellt aus)',
          stockMovements: 'Lagerbewegungen',
          notUsedInProduction: 'Nicht in Produktion verwendet',
          notProductionOutput: 'Kein Produktionsoutput',
          noMovementsRecorded: 'Keine Bewegungen aufgezeichnet',
          close: 'Schließen'
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
        },
        purchaseOrders: {
          title: 'Bestellungen',
          createPO: '+ Bestellung erstellen',
          editPO: 'Bestellung bearbeiten',
          poNumber: 'Best.Nr.',
          supplier: 'Lieferant',
          status: 'Status',
          orderDate: 'Bestelldatum',
          expected: 'Erwartet',
          total: 'Gesamt',
          lineItems: 'Positionen',
          addLine: '+ Position hinzufügen',
          notes: 'Notizen',
          noPurchaseOrders: 'Keine Bestellungen',
          supplierRequired: 'Lieferant ist erforderlich',
          statusDraft: 'Entwurf',
          statusSent: 'Gesendet',
          statusConfirmed: 'Bestätigt',
          statusReceived: 'Empfangen',
          statusClosed: 'Abgeschlossen',
          statusCancelled: 'Storniert',
          receivingPO: 'Bestellung empfangen',
          addToStock: 'Artikel zum Bestand hinzufügen',
          receiveDate: 'Empfangsdatum',
          selectItem: '-- Artikel auswählen --',
          components: 'Komponenten',
          products: 'Produkte'
        },
        components: {
          number: 'Komp.Nr.',
          description: 'Beschreibung',
          unit: 'Einheit',
          stock: 'Bestand',
          safetyStock: 'Sicherheitsbestand',
          supplier: 'Bevorzugter Lieferant',
          status: 'Status',
          group: 'Gruppe',
          notes: 'Notizen',
          leadTime: 'Lieferzeit (Tage)',
          purchasePrice: 'Einkaufspreis (€)',
          add: 'Komponente hinzufügen',
          edit: 'Komponente bearbeiten',
          noComponents: 'Keine Komponenten',
          confirmDelete: 'Möchten Sie wirklich löschen',
          cannotDelete: 'Kann nicht gelöscht werden: Verwendet in',
          productBOMs: 'Produkt-Stücklisten',
          stockManagement: 'Bestandsverwaltung',
          purchasing: 'Einkauf',
          reorderPoint: 'Nachbestellpunkt',
          reorderQuantity: 'Nachbestellmenge',
          minOrderQty: 'Mindestbestellmenge',
          supplierPartNumber: 'Lieferanten-Art.Nr.',
          select: 'Auswählen...',
          statusActive: 'Aktiv',
          statusBlocked: 'Gesperrt',
          statusDiscontinued: 'Eingestellt',
          numberRequired: 'Komponentennummer ist erforderlich'
        },
        suppliers: {
          name: 'Name',
          country: 'Land',
          leadTime: 'Lieferzeit',
          orders: 'Bestellungen',
          onTime: 'Pünktlich',
          totalSpend: 'Gesamtausgaben',
          supplierCode: 'Lieferantennr.',
          street: 'Straße',
          zip: 'PLZ',
          city: 'Stadt',
          contact: 'Ansprechpartner',
          phone: 'Telefon',
          email: 'E-Mail',
          website: 'Website',
          notes: 'Notizen',
          businessTerms: 'Geschäftsbedingungen',
          minOrderValue: 'Mindestbestellwert (€)',
          currency: 'Währung',
          vatId: 'USt-IdNr.',
          rating: 'Bewertung',
          add: 'Lieferant hinzufügen',
          edit: 'Lieferant bearbeiten',
          noSuppliers: 'Keine Lieferanten',
          days: 'Tage',
          select: 'Auswählen...',
          notRated: 'Nicht bewertet',
          excellent: 'Ausgezeichnet',
          good: 'Gut',
          average: 'Durchschnittlich',
          belowAverage: 'Unterdurchschnittlich',
          poor: 'Schlecht',
          confirmDelete: 'Möchten Sie wirklich löschen',
          cannotDelete: 'Kann nicht gelöscht werden:',
          linkedPOs: 'verknüpfte Bestellungen',
          nameRequired: 'Name ist erforderlich'
        },
        carriers: {
          name: 'Name',
          account: 'Kontonummer',
          contact: 'Ansprechpartner',
          phone: 'Telefon',
          email: 'E-Mail',
          notes: 'Notizen',
          add: 'Spediteur hinzufügen',
          edit: 'Spediteur bearbeiten',
          noCarriers: 'Keine Spediteure',
          confirmDelete: 'Möchten Sie wirklich löschen',
          cannotDelete: 'Kann nicht gelöscht werden',
          usedInOrders: 'Dieser Spediteur wird in',
          ordersUsed: 'Auftrag/Aufträgen verwendet',
          removeFirst: 'Entfernen Sie den Spediteur zuerst aus diesen Aufträgen.',
          nameRequired: 'Name ist erforderlich'
        },
        production: {
          title: 'Produktionsaufträge',
          number: 'Nummer',
          product: 'Produkt',
          qty: 'Menge',
          status: 'Status',
          planned: 'Geplant',
          start: 'Geplanter Start',
          end: 'Geplantes Ende',
          notes: 'Notizen',
          add: 'Produktionsauftrag hinzufügen',
          edit: 'Produktionsauftrag bearbeiten',
          noOrders: 'Keine Produktionsaufträge',
          automation: 'Automatisierung',
          statusPlanned: 'Geplant',
          statusInProgress: 'In Bearbeitung',
          statusCompleted: 'Abgeschlossen',
          startProduction: 'Produktion starten',
          completeProduction: 'Produktion abschließen',
          cannotDeleteInProgress: 'Produktion läuft - kann nicht gelöscht werden',
          deleteCompletedOrder: 'Abgeschlossenen Auftrag löschen',
          deleteProduction: 'Produktionsauftrag löschen',
          productionDeleted: 'Produktionsauftrag gelöscht',
          componentShort: 'kurz',
          confirmStart: 'Produktion starten bestätigen?',
          confirmComplete: 'Auftrag abschließen?',
          bomLoaded: 'Komponenten aus Stückliste geladen'
        },
        reports: {
          title: 'Berichte & Analysen',
          totalRevenue: 'Gesamtumsatz',
          collected: 'Eingezogen',
          outstanding: 'Ausstehend',
          avgOrder: 'Ø Auftragswert',
          topCustomers: 'Top 5 Kunden nach Umsatz',
          topProducts: 'Top 5 Produkte nach Verkauf',
          monthlyTrend: 'Monatlicher Verkaufstrend',
          exportReports: 'Berichte exportieren',
          ordersMasterlist: 'Auftrags-Stammliste',
          invoicesReport: 'Rechnungsbericht',
          customerReport: 'Kundenbericht',
          productSales: 'Produktverkäufe',
          inventoryValuation: 'Bestandsbewertung',
          productionSummary: 'Produktionsübersicht',
          downloadCsv: 'CSV herunterladen',
          noData: 'Keine Daten',
          allOrdersWithDetails: 'Alle Aufträge mit Details',
          invoicePaymentsStatus: 'Rechnungszahlungen & Status',
          revenuePerCustomer: 'Umsatz pro Kunde',
          unitsSoldByProduct: 'Verkaufte Einheiten nach Produkt',
          stockValueReport: 'Bestandswertbericht',
          productionOrdersLog: 'Produktionsauftragsprotokoll'
        },
        tasks: {
          title: 'Aufgabe',
          category: 'Kategorie',
          status: 'Status',
          priority: 'Priorität',
          assignee: 'Zugewiesen an',
          due: 'Fällig',
          add: 'Aufgabe hinzufügen',
          edit: 'Aufgabe bearbeiten',
          noTasks: 'Keine Aufgaben',
          saved: 'Aufgabe gespeichert',
          titleRequired: 'Titel ist erforderlich',
          statusOpen: 'Offen',
          statusInProgress: 'In Bearbeitung',
          statusCompleted: 'Abgeschlossen',
          priorityLow: 'Niedrig',
          priorityMedium: 'Mittel',
          priorityHigh: 'Hoch',
          categoryGeneral: 'Allgemein',
          categoryProgramming: 'Programmierung',
          categoryProduction: 'Produktion',
          categoryWarehouse: 'Lager'
        },
        settings: {
          companyInfo: 'Firmeninformationen',
          bankingTerms: 'Banking & Konditionen',
          companyName: 'Firmenname',
          address: 'Adresse',
          phone: 'Telefon',
          email: 'E-Mail',
          vat: 'USt-IdNr.',
          reg: 'Handelsregisternr.',
          bank: 'Bankname',
          iban: 'IBAN',
          bic: 'BIC',
          payTerms: 'Zahlungsbedingungen',
          delTerms: 'Lieferbedingungen',
          vatRate: 'MwSt-Satz',
          currency: 'Währung',
          invoiceDueDays: 'Rechnungsfälligkeit (Tage)',
          save: 'Einstellungen speichern',
          saved: 'Einstellungen gespeichert',
          userManagement: 'Benutzerverwaltung',
          addUser: 'Benutzer hinzufügen',
          editUser: 'Benutzer bearbeiten',
          deleteUser: 'Benutzer löschen',
          userDeleted: 'Benutzer gelöscht',
          backupSection: 'Datenbank-Backup',
          downloadBackup: 'Backup herunterladen',
          restoreBackup: 'Backup wiederherstellen',
          backupSaved: 'Backup gespeichert als',
          backupRestored: 'Backup erfolgreich wiederhergestellt',
          backupFailed: 'Backup-Wiederherstellung fehlgeschlagen',
          tabCompany: 'Firma',
          tabUsers: 'Benutzer',
          tabSystem: 'System',
          tabActivity: 'Aktivitätsprotokoll',
          numberSequences: 'Nummernkreise',
          securitySettings: 'Sicherheitseinstellungen',
          autoLock: 'Auto-Sperre nach (Minuten)',
          systemInfo: 'Systeminformationen',
          dataMaintenance: 'Datenpflege',
          cleanOldLogs: 'Alte Protokolle bereinigen',
          saveSystemSettings: 'Systemeinstellungen speichern',
          tabCommunication: 'Kommunikation',
          emailTemplateTitle: 'E-Mail-Vorlage LS/RE',
          emailTemplateDesc: 'Vorlage für Kunden-E-Mails mit Lieferschein und Rechnung',
          emailSubjectTemplate: 'Betreff-Vorlage',
          emailBodyTemplate: 'E-Mail-Text-Vorlage',
          availablePlaceholders: 'Verfügbare Platzhalter',
          livePreview: 'Live-Vorschau',
          saveEmailTemplate: 'E-Mail-Vorlage speichern',
          emailTemplateSaved: 'E-Mail-Vorlage gespeichert',
          defaultEmailSubject: 'Rechnung {{Rechnungsnummer}} / Lieferschein {{Lieferscheinnummer}}',
          defaultEmailBody: 'Sehr geehrte Damen und Herren,\n\nanbei erhalten Sie:\n\n- Lieferschein Nr. {{Lieferscheinnummer}} vom {{Lieferscheindatum}}\n- Rechnung Nr. {{Rechnungsnummer}} vom {{Rechnungsdatum}}\n\nRechnungsbetrag: {{Gesamtbetrag}}\nZahlungsziel: {{Zahlungsziel}}\n\nBitte überweisen Sie den Betrag unter Angabe der Rechnungsnummer.\n\nMit freundlichen Grüßen\n{{BenutzerName}}\n\n{{Firmensignatur}}'
        },
        emailTemplate: {
          generateEmail: 'E-Mail-Text (Kunde)',
          copyToClipboard: 'In Zwischenablage kopieren',
          copied: 'In Zwischenablage kopiert!',
          emailSubject: 'Betreff',
          emailBody: 'E-Mail-Text',
          missingData: 'Fehlende Daten',
          noInvoiceNumber: 'Keine Rechnungsnummer - Rechnung muss zuerst finalisiert werden',
          noDeliveryNote: 'Kein Lieferschein für diese Bestellung gefunden',
          selectDocument: 'Bitte wählen Sie ein Dokument aus',
          generatedFor: 'Generiert für',
          customer: 'Kunde',
          invoice: 'Rechnung',
          deliveryNote: 'Lieferschein'
        },
        dashboard: {
          overview: 'Dashboard Übersicht',
          pressF1: 'für Tastenkürzel drücken',
          totalRevenue: 'Gesamtumsatz',
          thisMonth: 'Diesen Monat',
          outstanding: 'Ausstehend',
          overdue: 'Überfällig',
          invoices: 'Rechnungen',
          unpaid: 'unbezahlt',
          overdueLabel: 'überfällig',
          collection: 'Einzug',
          openOrders: 'Offene Aufträge',
          shipped: 'Versendet',
          production: 'Produktion',
          awaitingPOs: 'Erwartete Best.',
          newCustomers: 'Neue Kunden',
          tasksDue: 'Fällige Aufgaben',
          quickActions: 'Schnellaktionen',
          newOrder: '+ Neuer Auftrag',
          newCustomer: '+ Neuer Kunde',
          newProductionOrder: '+ Produktionsauftrag',
          openTasks: 'Aufgaben öffnen',
          checkInventory: 'Lager prüfen',
          viewReports: 'Berichte anzeigen',
          createPO: 'Bestellung erstellen',
          recentOrders: 'Letzte Aufträge',
          noOrdersYet: 'Noch keine Aufträge',
          viewAllOrders: 'Alle Aufträge anzeigen',
          inventoryStatus: 'Lagerstatus',
          allStockOK: '✓ Alle Bestände OK',
          viewInventory: 'Lager anzeigen',
          salesTrend: 'Monatlicher Umsatztrend',
          outOfStock: 'Nicht auf Lager',
          lowStock: 'Niedriger Bestand',
          min: 'min',
          view: 'Anzeigen →',
          // Alert messages
          backupAlert: 'Letztes Backup vor {days} Tagen - Daten sichern empfohlen',
          noBackupAlert: 'Kein Backup gefunden - bitte Daten sichern',
          overdueInvoiceAlert: '{count} überfällige Rechnung(en) erfordern Aufmerksamkeit',
          overdueTaskAlert: '{count} überfällige Aufgabe(n)',
          outOfStockAlert: '{count} Artikel nicht auf Lager',
          // Month names
          jan: 'Jan', feb: 'Feb', mar: 'Mär', apr: 'Apr', may: 'Mai', jun: 'Jun',
          jul: 'Jul', aug: 'Aug', sep: 'Sep', oct: 'Okt', nov: 'Nov', dec: 'Dez'
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
          pricingSection: 'Pricing',
          inventory: 'Inventory & Material',
          inventoryPage: 'Inventory',
          movements: 'Movements',
          batches: 'Batches/LOT',
          ordersPage: 'Orders',
          purchaseOrders: 'Purchase Orders',
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
          batches: { title: 'Batch/LOT Management' },
          orders: { title: 'Orders' },
          purchaseOrders: { title: 'Purchase Orders' },
          production: { title: 'Production Orders' },
          documents: {
            title: 'Documents',
            finalize: 'Finalize',
            finalizeTitle: 'Finalize Invoice',
            finalizeWarning: 'This action cannot be undone!',
            finalizeDesc: 'Finalizing this invoice will lock it permanently. You will not be able to edit or delete it afterwards.',
            finalized: 'Invoice finalized successfully',
            alreadyFinalized: 'Invoice is already finalized',
            finalizedTooltip: 'This invoice is finalized and cannot be edited',
            draftTooltip: 'Draft - can be edited',
            invoice: 'Invoice',
            customer: 'Customer',
            document: 'Document',
            total: 'Total',
            // Trash bin
            trash: 'Trash',
            viewTrash: 'View Trash',
            trashEmpty: 'Trash is empty',
            trashTitle: 'Deleted Documents',
            trashHint: 'Restore documents to recover them, or delete permanently to free space.',
            movedToTrash: 'Document moved to trash',
            restore: 'Restore',
            restored: 'Document restored',
            deletedDate: 'Deleted',
            permanentDelete: 'Delete Permanently',
            confirmPermanentDelete: 'Confirm Permanent Delete',
            permanentDeleteDesc: 'This will permanently remove the document from the system.',
            deletePermanently: 'Delete Permanently',
            permanentlyDeleted: 'Document permanently deleted',
            cannotUndo: 'This action cannot be undone!',
            emptyTrash: 'Empty Trash',
            confirmEmptyTrash: 'Empty Trash',
            emptyTrashDesc: 'This will permanently delete all',
            documentsInTrash: 'documents in trash',
            trashEmptied: 'Trash emptied',
            // Edit
            editDocument: 'Edit Document',
            updated: 'Document updated',
            cannotEditFinalized: 'Cannot edit finalized documents',
            docNumber: 'Document Number',
            date: 'Date',
            dueDate: 'Due Date',
            notes: 'Notes',
            createDelivery: 'Delivery Note',
            createInvoice: 'Invoice'
          },
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
          saved: 'Settings saved',
          backupSection: 'Database Backup',
          downloadBackup: 'Download Backup',
          restoreBackup: 'Restore Backup',
          backupSaved: 'Backup saved as',
          backupRestored: 'Backup restored successfully',
          backupFailed: 'Backup restore failed'
        },
        dashboard: {
          overview: 'Dashboard Overview',
          pressF1: 'for shortcuts',
          totalRevenue: 'Total Revenue',
          thisMonth: 'This Month',
          outstanding: 'Outstanding',
          overdue: 'Overdue',
          invoices: 'invoices',
          unpaid: 'unpaid',
          overdueLabel: 'overdue',
          collection: 'Collection',
          openOrders: 'Open Orders',
          shipped: 'Shipped',
          production: 'Production',
          awaitingPOs: 'Awaiting POs',
          newCustomers: 'New Customers',
          tasksDue: 'Tasks Due',
          quickActions: 'Quick Actions',
          newOrder: '+ New Order',
          newCustomer: '+ New Customer',
          newProductionOrder: '+ New Production Order',
          openTasks: 'Open Tasks',
          checkInventory: 'Check Inventory',
          viewReports: 'View Reports',
          createPO: 'Create PO',
          recentOrders: 'Recent Orders',
          noOrdersYet: 'No orders yet',
          viewAllOrders: 'View All Orders',
          inventoryStatus: 'Inventory Status',
          allStockOK: '✓ All stock levels OK',
          viewInventory: 'View Inventory',
          salesTrend: 'Monthly Sales Trend',
          outOfStock: 'Out of Stock',
          lowStock: 'Low Stock',
          min: 'min',
          view: 'View →',
          // Alert messages
          backupAlert: 'Last backup was {days} days ago - consider backing up your data',
          noBackupAlert: 'No backup found - please backup your data',
          overdueInvoiceAlert: '{count} overdue invoice(s) need attention',
          overdueTaskAlert: '{count} overdue task(s)',
          outOfStockAlert: '{count} item(s) out of stock',
          // Month names
          jan: 'Jan', feb: 'Feb', mar: 'Mar', apr: 'Apr', may: 'May', jun: 'Jun',
          jul: 'Jul', aug: 'Aug', sep: 'Sep', oct: 'Oct', nov: 'Nov', dec: 'Dec'
        },
        common: {
          add: 'Add New',
          save: 'Save',
          cancel: 'Cancel',
          delete: 'Delete',
          edit: 'Edit',
          actions: 'Actions',
          view: 'View',
          search: 'Search...',
          noDataToExport: 'No data to export',
          exportSuccess: 'Export successful',
          rows: 'rows',
          // CSV Import
          importCSV: 'Import CSV',
          selectCSVFile: 'Select CSV file',
          importPreview: 'Import Preview',
          foundRows: 'rows found',
          importSuccess: 'Import successful',
          importError: 'Import error',
          rowsImported: 'rows imported',
          duplicatesSkipped: 'duplicates skipped',
          csvFormatHelp: 'CSV format: First row = column headers',
          requiredFields: 'Required fields',
          optionalFields: 'Optional fields',
          downloadTemplate: 'Download template',
          noFileSelected: 'No file selected',
          invalidCSV: 'Invalid CSV file',
          mappingError: 'Required fields not found',
          viewPrint: 'View/Print',
          recordPayment: 'Record Payment',
          paymentHistory: 'Payment History',
          viewDetails: 'View Details',
          changeStatus: 'Change Status',
          deliveryNote: 'Delivery Note',
          invoice: 'Invoice',
          receiveStock: 'Receive Stock',
          adjustStock: 'Adjust Stock',
          createPO: 'Create Purchase Order',
          trace: 'Trace',
          editBOM: 'Edit BOM',
          remove: 'Remove',
          receive: 'Receive',
          offlineMode: 'Offline mode - data is saved locally',
          backOnline: 'Back online',
          // Modal titles
          deleteCarrier: 'Delete Carrier',
          cannotDeleteCarrier: 'Cannot Delete Carrier',
          deleteSupplier: 'Delete Supplier',
          deleteComponent: 'Delete Component',
          deleteCustomer: 'Delete Customer',
          cannotDeleteCustomer: 'Cannot Delete Customer',
          deletePriceList: 'Delete Price List',
          deleteProduction: 'Delete Production Order',
          cannotDeleteProduction: 'Cannot Delete',
          deleteCompletedOrder: 'Delete Completed Order',
          startProduction: 'Start Production',
          completeProduction: 'Complete Production',
          deleteUser: 'Delete User',
          deleteProduct: 'Delete Product',
          cannotDeleteProduct: 'Cannot Delete Product',
          documentHasPayments: 'Document Has Payments',
          deleteDocument: 'Delete Document',
          recordPaymentTitle: 'Record Payment',
          deliveryNoteRequired: 'Delivery Note Required',
          selectDeliveryNote: 'Select Delivery Note',
          deliveryNoteExists: 'Delivery Note Exists',
          cannotCreateDocument: 'Cannot Create Document',
          orderDetails: 'Order Details',
          changeOrderStatus: 'Change Order Status',
          createOrder: 'Create Order',
          stockWarning: 'Stock Warning',
          createProductionOrder: 'Create Production Order',
          cannotDeleteOrder: 'Cannot Delete Order',
          deleteOrder: 'Delete Order',
          receivePurchaseOrder: 'Receive Purchase Order',
          purchaseOrderDetails: 'Purchase Order Details',
          automationSettings: 'Automation Settings',
          keyboardShortcuts: 'Keyboard Shortcuts',
          qualityControl: 'Quality Control',
          batchTraceability: 'Batch Traceability',
          // Table headers
          artNo: 'Art. No.',
          name: 'Name',
          type: 'Type',
          stock: 'Stock',
          order: 'Order',
          customer: 'Customer',
          status: 'Status',
          carrier: 'Carrier',
          date: 'Date',
          dueDate: 'Due Date',
          number: 'Number',
          total: 'Total',
          customerNo: 'Customer No',
          company: 'Company',
          contact: 'Contact',
          email: 'Email',
          phone: 'Phone',
          country: 'Country',
          lotNumber: 'LOT Number',
          item: 'Item',
          qty: 'Qty',
          expiry: 'Expiry',
          created: 'Created',
          supplier: 'Supplier',
          sku: 'SKU',
          product: 'Product',
          source: 'Source',
          component: 'Component',
          amount: 'Amount',
          method: 'Method',
          reference: 'Reference',
          poNumber: 'PO Number',
          documentType: 'Document Type',
          lastNumber: 'Last Number',
          time: 'Time',
          user: 'User',
          action: 'Action',
          entity: 'Entity',
          details: 'Details',
          paymentTerms: 'Payment Terms',
          // Toast messages
          saved: 'saved',
          deleted: 'deleted',
          productSaved: 'Product saved',
          productDeleted: 'Product deleted',
          customerSaved: 'Customer saved',
          customerDeleted: 'Customer deleted',
          // Customer form
          addCustomer: 'Add Customer',
          editCustomer: 'Edit Customer',
          segment: 'Segment',
          vatNumber: 'VAT Number',
          contacts: 'Contacts',
          phones: 'Phones',
          emails: 'Emails',
          addresses: 'Addresses',
          notes: 'Notes',
          label: 'Label',
          role: 'Role',
          street: 'Street',
          streetNo: 'No.',
          city: 'City',
          zip: 'ZIP',
          main: 'Main',
          billing: 'Billing',
          shipping: 'Shipping',
          addContact: '+ Add Contact',
          addPhone: '+ Add Phone',
          addEmail: '+ Add Email',
          addAddress: '+ Add Address',
          removeAddress: 'Remove',
          companyRequired: 'Company name is required',
          invalidEmailFormat: 'Invalid email format',
          confirmDeleteCustomer: 'Are you sure you want to delete',
          linkedRecordsWarning: 'This customer has linked records:',
          deleteRecordsFirst: 'Delete these records first.',
          ordersCount: 'order(s)',
          documentsCount: 'document(s)',
          noCustomers: 'No customers',
          orderSaved: 'Order saved',
          orderDeleted: 'Order deleted and stock restored',
          supplierSaved: 'Supplier saved',
          supplierDeleted: 'Supplier deleted',
          carrierDeleted: 'Carrier deleted',
          componentSaved: 'Component saved',
          componentDeleted: 'Component deleted',
          batchSaved: 'Batch saved',
          qcUpdated: 'QC status updated',
          stockAdjusted: 'Stock adjusted',
          priceListDeleted: 'Price list deleted',
          poSaved: 'Purchase order saved',
          poReceived: 'PO received and stock updated',
          productionDeleted: 'Production order deleted',
          productionStarted: 'Production started',
          productionCompleted: 'Order completed & stock updated',
          settingsSaved: 'System settings saved',
          userDeleted: 'User deleted',
          requiredFields: 'Please fill all required fields',
          validAmountRequired: 'Please enter a valid amount',
          amountExceedsBalance: 'Amount exceeds remaining balance',
          addAtLeastOneItem: 'Add at least one item to the order',
          automationSettingsSaved: 'Automation settings saved',
          // Product form
          addProduct: 'Add Product',
          editProduct: 'Edit Product',
          articleNumber: 'Article Number',
          nameDE: 'Name (DE)',
          nameEN: 'Name (EN)',
          purchasePrice: 'Purchase Price',
          endCustomerPrice: 'End Customer',
          minStock: 'Min Stock',
          noProducts: 'No products',
          productRequired: 'Article number and Name (DE) are required',
          // BOM
          bomFor: 'BOM for',
          defineComponents: 'Components for',
          oneUnitOf: '1 unit of',
          noComponentsDefined: 'No components defined',
          addComponentRow: '+ Add Component',
          saveBOM: 'Save BOM',
          bomSaved: 'BOM saved',
          components: 'components',
          perUnit: 'Per Unit',
          // Delete product warnings
          cannotDeleteProduct: 'Cannot Delete Product',
          linkedProductRecords: 'This product has linked records:',
          deleteProductRecordsFirst: 'Delete these records first.',
          productionOrdersLinked: 'production order(s)',
          confirmDeleteProduct: 'Are you sure you want to delete'
        },
        pricing: {
          name: 'Name',
          type: 'Type',
          scope: 'Scope',
          validity: 'Validity',
          status: 'Status',
          items: 'Items',
          managePrices: 'Manage Prices',
          editPricesDesc: 'Edit individual product prices in this list. Changes are saved when you click Save.',
          sku: 'SKU',
          product: 'Product',
          price: 'Price (€)',
          uvp: 'UVP (€)',
          moq: 'MOQ',
          products: 'products',
          total: 'Total',
          saved: 'Prices saved',
          changed: 'changed',
          export: 'Export CSV',
          edit: 'Edit Price List',
          add: 'Add Price List',
          segment: 'Segment',
          customer: 'Customer',
          validFrom: 'Valid From',
          validTo: 'Valid To',
          statusActive: 'Active',
          statusInactive: 'Inactive',
          statusScheduled: 'Scheduled',
          statusExpired: 'Expired',
          typeCustomer: 'Customer',
          typeSegment: 'Segment',
          typeDefault: 'Default',
          defaultScope: 'Default',
          always: 'Always',
          noEntries: 'No entries',
          noPriceLists: 'No price lists',
          confirmDelete: 'Are you sure you want to delete',
          willRemoveEntries: 'This will remove all',
          priceEntries: 'price entries',
          nameRequired: 'Name is required'
        },
        inventory: {
          totalValue: 'Total Value',
          lowStockItems: 'Low Stock Items',
          outOfStock: 'Out of Stock',
          replenishmentSuggestions: 'Replenishment Suggestions',
          createAllPOs: 'Create All POs',
          suggestedQty: 'Suggested Qty',
          createPO: 'Create Purchase Order',
          noSupplier: 'No supplier',
          noItemsInCategory: 'No items in this category',
          exportCsv: 'Export CSV',
          sku: 'SKU',
          product: 'Product',
          stock: 'Stock',
          min: 'Min',
          price: 'Price',
          actions: 'Actions',
          finished: 'Finished',
          device: 'Device',
          consumable: 'Consumable',
          part: 'Part',
          out: 'Out',
          low: 'Low',
          quantityToAdd: 'Quantity to Add',
          reference: 'Reference (PO Number)',
          receive: 'Receive',
          newStockLevel: 'New Stock Level',
          reason: 'Reason',
          reasonCount: 'Physical Count',
          reasonDamage: 'Damaged/Expired',
          reasonCorrection: 'Correction',
          reasonOther: 'Other',
          notes: 'Notes',
          adjust: 'Adjust',
          enterValidQty: 'Enter a valid quantity',
          received: 'Received',
          units: 'units',
          currentStock: 'Current Stock',
          noItemsNeedReorder: 'No items with suppliers need reordering',
          poCreated: 'Purchase Order created',
          posCreated: 'Purchase Order(s) created for',
          items: 'items'
        },
        movements: {
          date: 'Date',
          type: 'Type',
          item: 'Item',
          quantity: 'Quantity',
          direction: 'Direction',
          ref: 'Reference',
          add: 'Add Movement',
          noMovements: 'No movements',
          typeReceipt: 'Receipt',
          typeConsumption: 'Consumption',
          typeProduction: 'Production',
          directionIn: 'In',
          directionOut: 'Out',
          fillRequired: 'Please fill all required fields'
        },
        batches: {
          title: 'Batch / LOT Management',
          createBatch: 'Create Batch',
          editBatch: 'Edit Batch',
          lotNumber: 'LOT Number',
          type: 'Type',
          product: 'Product',
          component: 'Component',
          quantity: 'Quantity',
          productionDate: 'Production Date',
          expiryDate: 'Expiry Date',
          supplierLot: 'Supplier LOT',
          notes: 'Notes',
          noBatches: 'No batches',
          lotRequired: 'LOT number is required',
          statusRejected: 'Rejected',
          statusQuarantine: 'Quarantine',
          statusExpired: 'Expired',
          statusExpiring: 'Expiring',
          statusReleased: 'Released',
          statusPending: 'Pending QC',
          qcStatus: 'QC Status',
          inspector: 'Inspector',
          qcDate: 'QC Date',
          qcNotes: 'QC Notes',
          saveQC: 'Save QC',
          forwardTrace: 'Forward Traceability (Used In)',
          reverseTrace: 'Reverse Traceability (Produced From)',
          stockMovements: 'Stock Movements',
          notUsedInProduction: 'Not used in any production',
          notProductionOutput: 'Not a production output',
          noMovementsRecorded: 'No movements recorded',
          close: 'Close'
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
        },
        purchaseOrders: {
          title: 'Purchase Orders',
          createPO: '+ Create PO',
          editPO: 'Edit Purchase Order',
          poNumber: 'PO Number',
          supplier: 'Supplier',
          status: 'Status',
          orderDate: 'Order Date',
          expected: 'Expected',
          total: 'Total',
          lineItems: 'Line Items',
          addLine: '+ Add Line',
          notes: 'Notes',
          noPurchaseOrders: 'No purchase orders',
          supplierRequired: 'Supplier is required',
          statusDraft: 'Draft',
          statusSent: 'Sent',
          statusConfirmed: 'Confirmed',
          statusReceived: 'Received',
          statusClosed: 'Closed',
          statusCancelled: 'Cancelled',
          receivingPO: 'Receiving PO',
          addToStock: 'Add items to stock',
          receiveDate: 'Receive Date',
          selectItem: '-- Select Item --',
          components: 'Components',
          products: 'Products'
        },
        components: {
          number: 'Component No',
          description: 'Description',
          unit: 'Unit',
          stock: 'Stock',
          safetyStock: 'Safety Stock',
          supplier: 'Preferred Supplier',
          status: 'Status',
          group: 'Group',
          notes: 'Notes',
          leadTime: 'Lead Time (days)',
          purchasePrice: 'Purchase Price (€)',
          add: 'Add Component',
          edit: 'Edit Component',
          noComponents: 'No components',
          confirmDelete: 'Are you sure you want to delete',
          cannotDelete: 'Cannot delete: Used in',
          productBOMs: 'product BOMs',
          stockManagement: 'Stock Management',
          purchasing: 'Purchasing',
          reorderPoint: 'Reorder Point',
          reorderQuantity: 'Reorder Quantity',
          minOrderQty: 'Min Order Qty',
          supplierPartNumber: 'Supplier Part Number',
          select: 'Select...',
          statusActive: 'Active',
          statusBlocked: 'Blocked',
          statusDiscontinued: 'Discontinued',
          numberRequired: 'Component number is required'
        },
        suppliers: {
          name: 'Name',
          country: 'Country',
          leadTime: 'Lead Time',
          orders: 'Orders',
          onTime: 'On-Time',
          totalSpend: 'Total Spend',
          supplierCode: 'Supplier Code',
          street: 'Street',
          zip: 'ZIP',
          city: 'City',
          contact: 'Contact Person',
          phone: 'Phone',
          email: 'Email',
          website: 'Website',
          notes: 'Notes',
          businessTerms: 'Business Terms',
          minOrderValue: 'Minimum Order Value (€)',
          currency: 'Currency',
          vatId: 'VAT ID',
          rating: 'Rating',
          add: 'Add Supplier',
          edit: 'Edit Supplier',
          noSuppliers: 'No suppliers',
          days: 'days',
          select: 'Select...',
          notRated: 'Not Rated',
          excellent: 'Excellent',
          good: 'Good',
          average: 'Average',
          belowAverage: 'Below Average',
          poor: 'Poor',
          confirmDelete: 'Are you sure you want to delete',
          cannotDelete: 'Cannot delete:',
          linkedPOs: 'purchase orders linked',
          nameRequired: 'Name is required'
        },
        carriers: {
          name: 'Name',
          account: 'Account Number',
          contact: 'Contact Person',
          phone: 'Phone',
          email: 'Email',
          notes: 'Notes',
          add: 'Add Carrier',
          edit: 'Edit Carrier',
          noCarriers: 'No carriers',
          confirmDelete: 'Are you sure you want to delete',
          cannotDelete: 'Cannot Delete Carrier',
          usedInOrders: 'This carrier is used in',
          ordersUsed: 'order(s)',
          removeFirst: 'Remove the carrier from these orders first.',
          nameRequired: 'Name is required'
        },
        production: {
          title: 'Production Orders',
          number: 'Number',
          product: 'Product',
          qty: 'Qty',
          status: 'Status',
          planned: 'Planned',
          start: 'Planned Start',
          end: 'Planned End',
          notes: 'Notes',
          add: 'Add Production Order',
          edit: 'Edit Production Order',
          noOrders: 'No production orders',
          automation: 'Automation',
          statusPlanned: 'Planned',
          statusInProgress: 'In Progress',
          statusCompleted: 'Completed',
          startProduction: 'Start Production',
          completeProduction: 'Complete Production',
          cannotDeleteInProgress: 'Production in progress - cannot delete',
          deleteCompletedOrder: 'Delete Completed Order',
          deleteProduction: 'Delete Production Order',
          productionDeleted: 'Production order deleted',
          componentShort: 'short',
          confirmStart: 'Confirm to start production?',
          confirmComplete: 'Confirm completion?',
          bomLoaded: 'Loaded components from BOM'
        },
        reports: {
          title: 'Reports & Analytics',
          totalRevenue: 'Total Revenue',
          collected: 'Collected',
          outstanding: 'Outstanding',
          avgOrder: 'Avg Order',
          topCustomers: 'Top 5 Customers by Revenue',
          topProducts: 'Top 5 Products by Sales',
          monthlyTrend: 'Monthly Sales Trend',
          exportReports: 'Export Reports',
          ordersMasterlist: 'Orders Masterlist',
          invoicesReport: 'Invoices Report',
          customerReport: 'Customer Report',
          productSales: 'Product Sales',
          inventoryValuation: 'Inventory Valuation',
          productionSummary: 'Production Summary',
          downloadCsv: 'Download CSV',
          noData: 'No data',
          allOrdersWithDetails: 'All orders with details',
          invoicePaymentsStatus: 'Invoice payments & status',
          revenuePerCustomer: 'Revenue per customer',
          unitsSoldByProduct: 'Units sold by product',
          stockValueReport: 'Stock value report',
          productionOrdersLog: 'Production orders log'
        },
        tasks: {
          title: 'Title',
          category: 'Category',
          status: 'Status',
          priority: 'Priority',
          assignee: 'Assignee',
          due: 'Due',
          add: 'Add Task',
          edit: 'Edit Task',
          noTasks: 'No tasks',
          saved: 'Task saved',
          titleRequired: 'Title is required',
          statusOpen: 'Open',
          statusInProgress: 'In Progress',
          statusCompleted: 'Completed',
          priorityLow: 'Low',
          priorityMedium: 'Medium',
          priorityHigh: 'High',
          categoryGeneral: 'General',
          categoryProgramming: 'Programming',
          categoryProduction: 'Production',
          categoryWarehouse: 'Warehouse'
        },
        settings: {
          companyInfo: 'Company Information',
          bankingTerms: 'Banking & Terms',
          companyName: 'Company Name',
          address: 'Address',
          phone: 'Phone',
          email: 'Email',
          vat: 'VAT ID',
          reg: 'Register No',
          bank: 'Bank Name',
          iban: 'IBAN',
          bic: 'BIC',
          payTerms: 'Payment Terms',
          delTerms: 'Delivery Terms',
          vatRate: 'VAT Rate',
          currency: 'Currency',
          invoiceDueDays: 'Invoice Due Days',
          save: 'Save Settings',
          saved: 'Settings saved',
          userManagement: 'User Management',
          addUser: 'Add User',
          editUser: 'Edit User',
          deleteUser: 'Delete User',
          userDeleted: 'User deleted',
          backupSection: 'Database Backup',
          downloadBackup: 'Download Backup',
          restoreBackup: 'Restore Backup',
          backupSaved: 'Backup saved as',
          backupRestored: 'Backup restored successfully',
          backupFailed: 'Backup restore failed',
          tabCompany: 'Company',
          tabUsers: 'Users',
          tabSystem: 'System',
          tabActivity: 'Activity Log',
          numberSequences: 'Number Sequences',
          securitySettings: 'Security Settings',
          autoLock: 'Auto-lock after (minutes)',
          systemInfo: 'System Information',
          dataMaintenance: 'Data Maintenance',
          cleanOldLogs: 'Clean Old Logs',
          saveSystemSettings: 'Save System Settings',
          tabCommunication: 'Communication',
          emailTemplateTitle: 'Email Template LS/RE',
          emailTemplateDesc: 'Template for customer emails with delivery note and invoice',
          emailSubjectTemplate: 'Subject Template',
          emailBodyTemplate: 'Email Body Template',
          availablePlaceholders: 'Available Placeholders',
          livePreview: 'Live Preview',
          saveEmailTemplate: 'Save Email Template',
          emailTemplateSaved: 'Email template saved',
          defaultEmailSubject: 'Invoice {{Rechnungsnummer}} / Delivery Note {{Lieferscheinnummer}}',
          defaultEmailBody: 'Dear Sir or Madam,\n\nPlease find attached:\n\n- Delivery Note No. {{Lieferscheinnummer}} dated {{Lieferscheindatum}}\n- Invoice No. {{Rechnungsnummer}} dated {{Rechnungsdatum}}\n\nInvoice Amount: {{Gesamtbetrag}}\nPayment Due: {{Zahlungsziel}}\n\nPlease transfer the amount quoting the invoice number.\n\nBest regards\n{{BenutzerName}}\n\n{{Firmensignatur}}'
        },
        emailTemplate: {
          generateEmail: 'Email Text (Customer)',
          copyToClipboard: 'Copy to Clipboard',
          copied: 'Copied to clipboard!',
          emailSubject: 'Subject',
          emailBody: 'Email Body',
          missingData: 'Missing Data',
          noInvoiceNumber: 'No invoice number - invoice must be finalized first',
          noDeliveryNote: 'No delivery note found for this order',
          selectDocument: 'Please select a document',
          generatedFor: 'Generated for',
          customer: 'Customer',
          invoice: 'Invoice',
          deliveryNote: 'Delivery Note'
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
          pricingSection: 'Prețuri',
          inventory: 'Inventar & Material',
          inventoryPage: 'Inventar',
          movements: 'Mișcări stoc',
          batches: 'Loturi',
          ordersPage: 'Comenzi',
          purchaseOrders: 'Comenzi de aprovizionare',
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
          documents: {
            title: 'Documente',
            finalize: 'Finalizează',
            finalizeTitle: 'Finalizează Factura',
            finalizeWarning: 'Această acțiune nu poate fi anulată!',
            finalizeDesc: 'Finalizarea acestei facturi o va bloca permanent. Nu o veți mai putea edita sau șterge ulterior.',
            finalized: 'Factură finalizată cu succes',
            alreadyFinalized: 'Factura este deja finalizată',
            finalizedTooltip: 'Această factură este finalizată și nu poate fi editată',
            draftTooltip: 'Ciornă - poate fi editată',
            invoice: 'Factură',
            customer: 'Client',
            document: 'Document',
            total: 'Total',
            // Trash bin
            trash: 'Coș de gunoi',
            viewTrash: 'Vezi Coșul',
            trashEmpty: 'Coșul de gunoi este gol',
            trashTitle: 'Documente Șterse',
            trashHint: 'Restaurați documentele sau ștergeți-le definitiv.',
            movedToTrash: 'Document mutat în coș',
            restore: 'Restaurare',
            restored: 'Document restaurat',
            deletedDate: 'Șters',
            permanentDelete: 'Șterge Definitiv',
            confirmPermanentDelete: 'Confirmă Ștergerea Definitivă',
            permanentDeleteDesc: 'Documentul va fi eliminat definitiv din sistem.',
            deletePermanently: 'Șterge Definitiv',
            permanentlyDeleted: 'Document șters definitiv',
            cannotUndo: 'Această acțiune nu poate fi anulată!',
            emptyTrash: 'Golește Coșul',
            confirmEmptyTrash: 'Golește Coșul',
            emptyTrashDesc: 'Toate documentele vor fi șterse definitiv',
            documentsInTrash: 'documente în coș',
            trashEmptied: 'Coș golit',
            // Edit
            editDocument: 'Editează Document',
            updated: 'Document actualizat',
            cannotEditFinalized: 'Documentele finalizate nu pot fi editate',
            docNumber: 'Număr Document',
            date: 'Data',
            dueDate: 'Data Scadenței',
            notes: 'Note',
            createDelivery: 'Aviz de Livrare',
            createInvoice: 'Factură'
          },
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
          saved: 'Setări salvate',
          backupSection: 'Salvare Date',
          downloadBackup: 'Descarcă Backup',
          restoreBackup: 'Restaurează Backup',
          backupSaved: 'Backup salvat ca',
          backupRestored: 'Backup restaurat cu succes',
          backupFailed: 'Restaurare backup eșuată'
        },
        dashboard: {
          overview: 'Prezentare Generală Dashboard',
          pressF1: 'pentru comenzi rapide',
          totalRevenue: 'Venit Total',
          thisMonth: 'Luna Aceasta',
          outstanding: 'În Așteptare',
          overdue: 'Depășite',
          invoices: 'facturi',
          unpaid: 'neachitate',
          overdueLabel: 'depășite',
          collection: 'Colectare',
          openOrders: 'Comenzi Deschise',
          shipped: 'Expediate',
          production: 'Producție',
          awaitingPOs: 'CA în Așteptare',
          newCustomers: 'Clienți Noi',
          tasksDue: 'Sarcini Scadente',
          quickActions: 'Acțiuni Rapide',
          newOrder: '+ Comandă Nouă',
          newCustomer: '+ Client Nou',
          newProductionOrder: '+ Ordin Producție',
          openTasks: 'Deschide Sarcini',
          checkInventory: 'Verifică Stoc',
          viewReports: 'Vezi Rapoarte',
          createPO: 'Creează CA',
          recentOrders: 'Comenzi Recente',
          noOrdersYet: 'Încă nu există comenzi',
          viewAllOrders: 'Vezi Toate Comenzile',
          inventoryStatus: 'Status Inventar',
          allStockOK: '✓ Toate stocurile OK',
          viewInventory: 'Vezi Inventar',
          salesTrend: 'Trend Vânzări Lunare',
          outOfStock: 'Stoc Epuizat',
          lowStock: 'Stoc Redus',
          min: 'min',
          view: 'Vezi →',
          // Alert messages
          backupAlert: 'Ultimul backup acum {days} zile - se recomandă salvarea datelor',
          noBackupAlert: 'Nu există backup - vă rugăm salvați datele',
          overdueInvoiceAlert: '{count} factură(i) depășită(e) necesită atenție',
          overdueTaskAlert: '{count} sarcină(i) depășită(e)',
          outOfStockAlert: '{count} articol(e) fără stoc',
          // Month names
          jan: 'Ian', feb: 'Feb', mar: 'Mar', apr: 'Apr', may: 'Mai', jun: 'Iun',
          jul: 'Iul', aug: 'Aug', sep: 'Sep', oct: 'Oct', nov: 'Nov', dec: 'Dec'
        },
        common: {
          add: 'Adaugă',
          save: 'Salvează',
          cancel: 'Anulează',
          delete: 'Șterge',
          edit: 'Editează',
          actions: 'Acțiuni',
          view: 'Vizualizează',
          search: 'Caută...',
          noDataToExport: 'Nu există date de exportat',
          exportSuccess: 'Export reușit',
          rows: 'rânduri',
          // CSV Import
          importCSV: 'Importă CSV',
          selectCSVFile: 'Selectează fișier CSV',
          importPreview: 'Previzualizare import',
          foundRows: 'rânduri găsite',
          importSuccess: 'Import reușit',
          importError: 'Eroare import',
          rowsImported: 'rânduri importate',
          duplicatesSkipped: 'duplicate omise',
          csvFormatHelp: 'Format CSV: Prima linie = anteturi coloane',
          requiredFields: 'Câmpuri obligatorii',
          optionalFields: 'Câmpuri opționale',
          downloadTemplate: 'Descarcă șablon',
          noFileSelected: 'Niciun fișier selectat',
          invalidCSV: 'Fișier CSV invalid',
          mappingError: 'Câmpuri obligatorii negăsite',
          viewPrint: 'Vizualizează/Printează',
          recordPayment: 'Înregistrează plată',
          paymentHistory: 'Istoric plăți',
          viewDetails: 'Vezi detalii',
          changeStatus: 'Schimbă status',
          deliveryNote: 'Aviz de livrare',
          invoice: 'Factură',
          receiveStock: 'Recepție stoc',
          adjustStock: 'Ajustează stoc',
          createPO: 'Creează comandă',
          trace: 'Urmărește',
          editBOM: 'Editează BOM',
          remove: 'Elimină',
          receive: 'Primește',
          offlineMode: 'Mod offline - datele sunt salvate local',
          backOnline: 'Înapoi online',
          // Modal titles
          deleteCarrier: 'Șterge Transportator',
          cannotDeleteCarrier: 'Nu se poate șterge Transportatorul',
          deleteSupplier: 'Șterge Furnizor',
          deleteComponent: 'Șterge Componentă',
          deleteCustomer: 'Șterge Client',
          cannotDeleteCustomer: 'Nu se poate șterge Clientul',
          deletePriceList: 'Șterge Lista de Prețuri',
          deleteProduction: 'Șterge Ordin de Producție',
          cannotDeleteProduction: 'Nu se poate șterge',
          deleteCompletedOrder: 'Șterge Comandă Finalizată',
          startProduction: 'Începe Producția',
          completeProduction: 'Finalizează Producția',
          deleteUser: 'Șterge Utilizator',
          deleteProduct: 'Șterge Produs',
          cannotDeleteProduct: 'Nu se poate șterge Produsul',
          documentHasPayments: 'Documentul are Plăți',
          deleteDocument: 'Șterge Document',
          recordPaymentTitle: 'Înregistrează Plată',
          deliveryNoteRequired: 'Aviz de Livrare Necesar',
          selectDeliveryNote: 'Selectează Aviz de Livrare',
          deliveryNoteExists: 'Avizul de Livrare Există',
          cannotCreateDocument: 'Nu se poate crea Documentul',
          orderDetails: 'Detalii Comandă',
          changeOrderStatus: 'Schimbă Status Comandă',
          createOrder: 'Creează Comandă',
          stockWarning: 'Avertisment Stoc',
          createProductionOrder: 'Creează Ordin de Producție',
          cannotDeleteOrder: 'Nu se poate șterge Comanda',
          deleteOrder: 'Șterge Comandă',
          receivePurchaseOrder: 'Primește Comanda de Achiziție',
          purchaseOrderDetails: 'Detalii Comandă de Achiziție',
          automationSettings: 'Setări Automatizare',
          keyboardShortcuts: 'Scurtături Tastatură',
          qualityControl: 'Control Calitate',
          batchTraceability: 'Trasabilitate Loturi',
          // Table headers
          artNo: 'Nr. Art.',
          name: 'Nume',
          type: 'Tip',
          stock: 'Stoc',
          order: 'Comandă',
          customer: 'Client',
          status: 'Status',
          carrier: 'Transportator',
          date: 'Dată',
          dueDate: 'Scadență',
          number: 'Număr',
          total: 'Total',
          customerNo: 'Nr. Client',
          company: 'Companie',
          contact: 'Contact',
          email: 'Email',
          phone: 'Telefon',
          country: 'Țară',
          lotNumber: 'Număr LOT',
          item: 'Articol',
          qty: 'Cant.',
          expiry: 'Expirare',
          created: 'Creat',
          supplier: 'Furnizor',
          sku: 'COD',
          product: 'Produs',
          source: 'Sursă',
          component: 'Componentă',
          amount: 'Sumă',
          method: 'Metodă',
          reference: 'Referință',
          poNumber: 'Nr. Comandă',
          documentType: 'Tip Document',
          lastNumber: 'Ultima Nr.',
          time: 'Timp',
          user: 'Utilizator',
          action: 'Acțiune',
          entity: 'Entitate',
          details: 'Detalii',
          paymentTerms: 'Condiții Plată',
          // Toast messages
          saved: 'salvat',
          deleted: 'șters',
          productSaved: 'Produs salvat',
          productDeleted: 'Produs șters',
          customerSaved: 'Client salvat',
          customerDeleted: 'Client șters',
          // Customer form
          addCustomer: 'Adaugă Client',
          editCustomer: 'Editează Client',
          segment: 'Segment',
          vatNumber: 'CUI/CIF',
          contacts: 'Contacte',
          phones: 'Telefoane',
          emails: 'Email-uri',
          addresses: 'Adrese',
          notes: 'Note',
          label: 'Etichetă',
          role: 'Rol',
          street: 'Stradă',
          streetNo: 'Nr.',
          city: 'Oraș',
          zip: 'Cod Poștal',
          main: 'Principal',
          billing: 'Facturare',
          shipping: 'Livrare',
          addContact: '+ Adaugă Contact',
          addPhone: '+ Adaugă Telefon',
          addEmail: '+ Adaugă Email',
          addAddress: '+ Adaugă Adresă',
          removeAddress: 'Elimină',
          companyRequired: 'Numele companiei este obligatoriu',
          invalidEmailFormat: 'Format email invalid',
          confirmDeleteCustomer: 'Sigur doriți să ștergeți',
          linkedRecordsWarning: 'Acest client are înregistrări legate:',
          deleteRecordsFirst: 'Ștergeți mai întâi aceste înregistrări.',
          ordersCount: 'comandă(i)',
          documentsCount: 'document(e)',
          noCustomers: 'Niciun client',
          orderSaved: 'Comandă salvată',
          orderDeleted: 'Comandă ștearsă și stoc restaurat',
          supplierSaved: 'Furnizor salvat',
          supplierDeleted: 'Furnizor șters',
          carrierDeleted: 'Transportator șters',
          componentSaved: 'Componentă salvată',
          componentDeleted: 'Componentă ștearsă',
          batchSaved: 'Lot salvat',
          qcUpdated: 'Status QC actualizat',
          stockAdjusted: 'Stoc ajustat',
          priceListDeleted: 'Lista de prețuri ștearsă',
          poSaved: 'Comandă de achiziție salvată',
          poReceived: 'Comandă primită și stoc actualizat',
          productionDeleted: 'Ordin de producție șters',
          productionStarted: 'Producție începută',
          productionCompleted: 'Comandă finalizată & stoc actualizat',
          settingsSaved: 'Setări sistem salvate',
          userDeleted: 'Utilizator șters',
          requiredFields: 'Vă rugăm completați toate câmpurile obligatorii',
          validAmountRequired: 'Vă rugăm introduceți o sumă validă',
          amountExceedsBalance: 'Suma depășește soldul rămas',
          addAtLeastOneItem: 'Adăugați cel puțin un articol la comandă',
          automationSettingsSaved: 'Setări automatizare salvate',
          // Product form
          addProduct: 'Adaugă Produs',
          editProduct: 'Editează Produs',
          articleNumber: 'Număr Articol',
          nameDE: 'Nume (DE)',
          nameEN: 'Nume (EN)',
          purchasePrice: 'Preț Achiziție',
          endCustomerPrice: 'Client Final',
          minStock: 'Stoc Minim',
          noProducts: 'Niciun produs',
          productRequired: 'Numărul articolului și Numele (DE) sunt obligatorii',
          // BOM
          bomFor: 'BOM pentru',
          defineComponents: 'Componente pentru',
          oneUnitOf: '1 unitate de',
          noComponentsDefined: 'Nicio componentă definită',
          addComponentRow: '+ Adaugă Componentă',
          saveBOM: 'Salvează BOM',
          bomSaved: 'BOM salvat',
          components: 'componente',
          perUnit: 'Per Unitate',
          // Delete product warnings
          cannotDeleteProduct: 'Nu se poate șterge produsul',
          linkedProductRecords: 'Acest produs are înregistrări legate:',
          deleteProductRecordsFirst: 'Ștergeți mai întâi aceste înregistrări.',
          productionOrdersLinked: 'ordin(e) de producție',
          confirmDeleteProduct: 'Sigur doriți să ștergeți'
        },
        pricing: {
          name: 'Nume',
          type: 'Tip',
          scope: 'Domeniu',
          validity: 'Valabilitate',
          status: 'Status',
          items: 'Elemente',
          managePrices: 'Gestionează Prețuri',
          editPricesDesc: 'Editați prețurile individuale ale produselor din această listă. Modificările sunt salvate când faceți clic pe Salvează.',
          sku: 'COD',
          product: 'Produs',
          price: 'Preț (€)',
          uvp: 'PVR (€)',
          moq: 'Cantitate minimă',
          products: 'produse',
          total: 'Total',
          saved: 'Prețuri salvate',
          changed: 'modificate',
          export: 'Export CSV',
          edit: 'Editează Lista',
          add: 'Adaugă Listă',
          segment: 'Segment',
          customer: 'Client',
          validFrom: 'Valabil de la',
          validTo: 'Valabil până la',
          statusActive: 'Activ',
          statusInactive: 'Inactiv',
          statusScheduled: 'Programat',
          statusExpired: 'Expirat',
          typeCustomer: 'Client',
          typeSegment: 'Segment',
          typeDefault: 'Implicit',
          defaultScope: 'Implicit',
          always: 'Întotdeauna',
          noEntries: 'Nicio intrare',
          noPriceLists: 'Nicio listă de prețuri',
          confirmDelete: 'Sigur doriți să ștergeți',
          willRemoveEntries: 'Aceasta va elimina toate',
          priceEntries: 'intrări de preț',
          nameRequired: 'Numele este obligatoriu'
        },
        inventory: {
          totalValue: 'Valoare Totală',
          lowStockItems: 'Articole cu Stoc Scăzut',
          outOfStock: 'Stoc Epuizat',
          replenishmentSuggestions: 'Sugestii de Reaprovizionare',
          createAllPOs: 'Creează Toate Comenzile',
          suggestedQty: 'Cantitate Sugerată',
          createPO: 'Creează Comandă',
          noSupplier: 'Fără furnizor',
          noItemsInCategory: 'Niciun articol în această categorie',
          exportCsv: 'Export CSV',
          sku: 'COD',
          product: 'Produs',
          stock: 'Stoc',
          min: 'Min',
          price: 'Preț',
          actions: 'Acțiuni',
          finished: 'Finite',
          device: 'Dispozitive',
          consumable: 'Consumabile',
          part: 'Piese',
          out: 'Epuizat',
          low: 'Scăzut',
          quantityToAdd: 'Cantitate de Adăugat',
          reference: 'Referință (Nr. Comandă)',
          receive: 'Primește',
          newStockLevel: 'Nivel Stoc Nou',
          reason: 'Motiv',
          reasonCount: 'Inventar Fizic',
          reasonDamage: 'Deteriorat/Expirat',
          reasonCorrection: 'Corecție',
          reasonOther: 'Altele',
          notes: 'Note',
          adjust: 'Ajustează',
          enterValidQty: 'Introduceți o cantitate validă',
          received: 'Primit',
          units: 'unități',
          currentStock: 'Stoc Curent',
          noItemsNeedReorder: 'Niciun articol cu furnizor nu necesită reaprovizionare',
          poCreated: 'Comandă creată',
          posCreated: 'Comandă(e) create pentru',
          items: 'articole'
        },
        movements: {
          date: 'Data',
          type: 'Tip',
          item: 'Articol',
          quantity: 'Cantitate',
          direction: 'Direcție',
          ref: 'Referință',
          add: 'Adaugă Mișcare',
          noMovements: 'Nicio mișcare',
          typeReceipt: 'Recepție',
          typeConsumption: 'Consum',
          typeProduction: 'Producție',
          directionIn: 'Intrare',
          directionOut: 'Ieșire',
          fillRequired: 'Completați toate câmpurile obligatorii'
        },
        batches: {
          title: 'Gestionare Lot / Serie',
          createBatch: 'Creează Lot',
          editBatch: 'Editează Lot',
          lotNumber: 'Număr LOT',
          type: 'Tip',
          product: 'Produs',
          component: 'Componentă',
          quantity: 'Cantitate',
          productionDate: 'Data Producției',
          expiryDate: 'Data Expirării',
          supplierLot: 'LOT Furnizor',
          notes: 'Note',
          noBatches: 'Niciun lot',
          lotRequired: 'Numărul LOT este obligatoriu',
          statusRejected: 'Respins',
          statusQuarantine: 'Carantină',
          statusExpired: 'Expirat',
          statusExpiring: 'Expiră curând',
          statusReleased: 'Eliberat',
          statusPending: 'QC în așteptare',
          qcStatus: 'Status QC',
          inspector: 'Inspector',
          qcDate: 'Data QC',
          qcNotes: 'Note QC',
          saveQC: 'Salvează QC',
          forwardTrace: 'Trasabilitate Înainte (Utilizat în)',
          reverseTrace: 'Trasabilitate Înapoi (Produs din)',
          stockMovements: 'Mișcări Stoc',
          notUsedInProduction: 'Nu este utilizat în producție',
          notProductionOutput: 'Nu este output de producție',
          noMovementsRecorded: 'Nicio mișcare înregistrată',
          close: 'Închide'
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
        },
        purchaseOrders: {
          title: 'Comenzi de Achiziție',
          createPO: '+ Creează CA',
          editPO: 'Editează Comandă de Achiziție',
          poNumber: 'Nr. CA',
          supplier: 'Furnizor',
          status: 'Status',
          orderDate: 'Data Comenzii',
          expected: 'Estimat',
          total: 'Total',
          lineItems: 'Articole',
          addLine: '+ Adaugă rând',
          notes: 'Note',
          noPurchaseOrders: 'Fără comenzi de achiziție',
          supplierRequired: 'Furnizorul este obligatoriu',
          statusDraft: 'Ciornă',
          statusSent: 'Trimis',
          statusConfirmed: 'Confirmat',
          statusReceived: 'Primit',
          statusClosed: 'Închis',
          statusCancelled: 'Anulat',
          receivingPO: 'Recepție CA',
          addToStock: 'Adaugă articole în stoc',
          receiveDate: 'Data Recepției',
          selectItem: '-- Selectează Articol --',
          components: 'Componente',
          products: 'Produse'
        },
        components: {
          number: 'Nr. Comp.',
          description: 'Descriere',
          unit: 'Unitate',
          stock: 'Stoc',
          safetyStock: 'Stoc Siguranță',
          supplier: 'Furnizor Preferat',
          status: 'Status',
          group: 'Grup',
          notes: 'Note',
          leadTime: 'Timp Livrare (zile)',
          purchasePrice: 'Preț Achiziție (€)',
          add: 'Adaugă Componentă',
          edit: 'Editează Componentă',
          noComponents: 'Nicio componentă',
          confirmDelete: 'Sigur doriți să ștergeți',
          cannotDelete: 'Nu se poate șterge: Folosită în',
          productBOMs: 'BOM-uri produse',
          stockManagement: 'Gestionare Stoc',
          purchasing: 'Achiziții',
          reorderPoint: 'Punct Reaprovizionare',
          reorderQuantity: 'Cantitate Reaprovizionare',
          minOrderQty: 'Cantitate Min Comandă',
          supplierPartNumber: 'Nr. Articol Furnizor',
          select: 'Selectează...',
          statusActive: 'Activ',
          statusBlocked: 'Blocat',
          statusDiscontinued: 'Întrerupt',
          numberRequired: 'Numărul componentei este obligatoriu'
        },
        suppliers: {
          name: 'Nume',
          country: 'Țară',
          leadTime: 'Timp Livrare',
          orders: 'Comenzi',
          onTime: 'La Timp',
          totalSpend: 'Cheltuieli Totale',
          supplierCode: 'Cod Furnizor',
          street: 'Stradă',
          zip: 'Cod Poștal',
          city: 'Oraș',
          contact: 'Persoană Contact',
          phone: 'Telefon',
          email: 'Email',
          website: 'Website',
          notes: 'Note',
          businessTerms: 'Condiții Comerciale',
          minOrderValue: 'Valoare Minimă Comandă (€)',
          currency: 'Monedă',
          vatId: 'CUI',
          rating: 'Evaluare',
          add: 'Adaugă Furnizor',
          edit: 'Editează Furnizor',
          noSuppliers: 'Niciun furnizor',
          days: 'zile',
          select: 'Selectează...',
          notRated: 'Neevaluat',
          excellent: 'Excelent',
          good: 'Bun',
          average: 'Mediu',
          belowAverage: 'Sub Medie',
          poor: 'Slab',
          confirmDelete: 'Sigur doriți să ștergeți',
          cannotDelete: 'Nu se poate șterge:',
          linkedPOs: 'comenzi de achiziție legate',
          nameRequired: 'Numele este obligatoriu'
        },
        carriers: {
          name: 'Nume',
          account: 'Număr Cont',
          contact: 'Persoană Contact',
          phone: 'Telefon',
          email: 'Email',
          notes: 'Note',
          add: 'Adaugă Transportator',
          edit: 'Editează Transportator',
          noCarriers: 'Niciun transportator',
          confirmDelete: 'Sigur doriți să ștergeți',
          cannotDelete: 'Nu se poate șterge transportatorul',
          usedInOrders: 'Acest transportator este folosit în',
          ordersUsed: 'comandă(i)',
          removeFirst: 'Eliminați mai întâi transportatorul din aceste comenzi.',
          nameRequired: 'Numele este obligatoriu'
        },
        production: {
          title: 'Comenzi de Producție',
          number: 'Număr',
          product: 'Produs',
          qty: 'Cant.',
          status: 'Status',
          planned: 'Planificat',
          start: 'Start Planificat',
          end: 'Final Planificat',
          notes: 'Note',
          add: 'Adaugă Comandă de Producție',
          edit: 'Editează Comandă de Producție',
          noOrders: 'Nicio comandă de producție',
          automation: 'Automatizare',
          statusPlanned: 'Planificat',
          statusInProgress: 'În Desfășurare',
          statusCompleted: 'Finalizat',
          startProduction: 'Începe Producția',
          completeProduction: 'Finalizează Producția',
          cannotDeleteInProgress: 'Producție în desfășurare - nu poate fi ștearsă',
          deleteCompletedOrder: 'Șterge Comanda Finalizată',
          deleteProduction: 'Șterge Comanda de Producție',
          productionDeleted: 'Comanda de producție ștearsă',
          componentShort: 'lipsă',
          confirmStart: 'Confirmați începerea producției?',
          confirmComplete: 'Confirmați finalizarea?',
          bomLoaded: 'Componente încărcate din BOM'
        },
        reports: {
          title: 'Rapoarte & Analize',
          totalRevenue: 'Venituri Totale',
          collected: 'Încasat',
          outstanding: 'Restant',
          avgOrder: 'Comandă Medie',
          topCustomers: 'Top 5 Clienți după Venituri',
          topProducts: 'Top 5 Produse după Vânzări',
          monthlyTrend: 'Tendință Vânzări Lunară',
          exportReports: 'Export Rapoarte',
          ordersMasterlist: 'Lista Completă Comenzi',
          invoicesReport: 'Raport Facturi',
          customerReport: 'Raport Clienți',
          productSales: 'Vânzări Produse',
          inventoryValuation: 'Evaluare Stoc',
          productionSummary: 'Sumar Producție',
          downloadCsv: 'Descarcă CSV',
          noData: 'Fără date',
          allOrdersWithDetails: 'Toate comenzile cu detalii',
          invoicePaymentsStatus: 'Plăți facturi & status',
          revenuePerCustomer: 'Venituri per client',
          unitsSoldByProduct: 'Unități vândute per produs',
          stockValueReport: 'Raport valoare stoc',
          productionOrdersLog: 'Jurnal comenzi producție'
        },
        tasks: {
          title: 'Titlu',
          category: 'Categorie',
          status: 'Status',
          priority: 'Prioritate',
          assignee: 'Atribuit',
          due: 'Termen',
          add: 'Adaugă Sarcină',
          edit: 'Editează Sarcină',
          noTasks: 'Nicio sarcină',
          saved: 'Sarcină salvată',
          titleRequired: 'Titlul este obligatoriu',
          statusOpen: 'Deschis',
          statusInProgress: 'În Desfășurare',
          statusCompleted: 'Finalizat',
          priorityLow: 'Scăzut',
          priorityMedium: 'Mediu',
          priorityHigh: 'Ridicat',
          categoryGeneral: 'General',
          categoryProgramming: 'Programare',
          categoryProduction: 'Producție',
          categoryWarehouse: 'Depozit'
        },
        settings: {
          companyInfo: 'Informații Companie',
          bankingTerms: 'Banking & Termeni',
          companyName: 'Nume Companie',
          address: 'Adresă',
          phone: 'Telefon',
          email: 'Email',
          vat: 'CUI',
          reg: 'Nr. Registru',
          bank: 'Nume Bancă',
          iban: 'IBAN',
          bic: 'BIC',
          payTerms: 'Termeni Plată',
          delTerms: 'Termeni Livrare',
          vatRate: 'Cotă TVA',
          currency: 'Monedă',
          invoiceDueDays: 'Zile Scadență Factură',
          save: 'Salvează Setări',
          saved: 'Setări salvate',
          userManagement: 'Gestionare Utilizatori',
          addUser: 'Adaugă Utilizator',
          editUser: 'Editează Utilizator',
          deleteUser: 'Șterge Utilizator',
          userDeleted: 'Utilizator șters',
          backupSection: 'Backup Bază de Date',
          downloadBackup: 'Descarcă Backup',
          restoreBackup: 'Restaurează Backup',
          backupSaved: 'Backup salvat ca',
          backupRestored: 'Backup restaurat cu succes',
          backupFailed: 'Restaurare backup eșuată',
          tabCompany: 'Companie',
          tabUsers: 'Utilizatori',
          tabSystem: 'Sistem',
          tabActivity: 'Jurnal Activitate',
          numberSequences: 'Serii de Numere',
          securitySettings: 'Setări Securitate',
          autoLock: 'Blocare automată după (minute)',
          systemInfo: 'Informații Sistem',
          dataMaintenance: 'Întreținere Date',
          cleanOldLogs: 'Curăță Jurnale Vechi',
          saveSystemSettings: 'Salvează Setări Sistem',
          tabCommunication: 'Comunicare',
          emailTemplateTitle: 'Șablon Email LS/RE',
          emailTemplateDesc: 'Șablon pentru emailuri clienți cu aviz de livrare și factură',
          emailSubjectTemplate: 'Șablon Subiect',
          emailBodyTemplate: 'Șablon Corp Email',
          availablePlaceholders: 'Substituenți Disponibili',
          livePreview: 'Previzualizare',
          saveEmailTemplate: 'Salvează Șablon Email',
          emailTemplateSaved: 'Șablon email salvat',
          defaultEmailSubject: 'Factură {{Rechnungsnummer}} / Aviz {{Lieferscheinnummer}}',
          defaultEmailBody: 'Stimate client,\n\nAtașat găsiți:\n\n- Aviz de Livrare Nr. {{Lieferscheinnummer}} din {{Lieferscheindatum}}\n- Factură Nr. {{Rechnungsnummer}} din {{Rechnungsdatum}}\n\nValoare Factură: {{Gesamtbetrag}}\nScadență: {{Zahlungsziel}}\n\nVă rugăm să transferați suma menționând numărul facturii.\n\nCu stimă\n{{BenutzerName}}\n\n{{Firmensignatur}}'
        },
        emailTemplate: {
          generateEmail: 'Text Email (Client)',
          copyToClipboard: 'Copiază în Clipboard',
          copied: 'Copiat în clipboard!',
          emailSubject: 'Subiect',
          emailBody: 'Corp Email',
          missingData: 'Date Lipsă',
          noInvoiceNumber: 'Fără număr factură - factura trebuie finalizată mai întâi',
          noDeliveryNote: 'Niciun aviz de livrare găsit pentru această comandă',
          selectDocument: 'Vă rugăm selectați un document',
          generatedFor: 'Generat pentru',
          customer: 'Client',
          invoice: 'Factură',
          deliveryNote: 'Aviz de Livrare'
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

/**
 * HTML Escape utility to prevent XSS attacks
 * Use this when inserting user-provided data into HTML
 */
App.Utils.escapeHtml = function (str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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

/**
 * Secure CSV Export Utility
 * - Adds UTF-8 BOM for Excel compatibility with special characters
 * - Sanitizes formula injection (=, +, -, @, TAB, CR)
 * - Handles empty states with user feedback
 */
App.Utils.exportCSV = function (headers, rows, filename, options = {}) {
  // Check for empty data
  if (!rows || rows.length === 0) {
    const emptyMsg = App.I18n.t('common.noDataToExport', 'No data to export');
    App.UI.Toast.show(emptyMsg, 'warning');
    return false;
  }

  // Sanitize a single cell value for CSV injection protection
  const sanitizeCell = (value) => {
    let str = String(value ?? '');

    // Escape double quotes by doubling them
    str = str.replace(/"/g, '""');

    // CSV injection protection: prefix dangerous characters with single quote
    // This prevents Excel from interpreting formulas
    if (/^[=+\-@\t\r]/.test(str)) {
      str = "'" + str;
    }

    return `"${str}"`;
  };

  // Build CSV content
  const csvRows = [
    headers.map(h => sanitizeCell(h)).join(','),
    ...rows.map(row => row.map(cell => sanitizeCell(cell)).join(','))
  ];

  const csvContent = csvRows.join('\n');

  // Add UTF-8 BOM for Excel compatibility with special characters (ä, ö, ü, ș, etc.)
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

  // Create download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename || 'export.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  // Show success message
  const successMsg = App.I18n.t('common.exportSuccess', 'Export successful');
  App.UI.Toast.show(`${successMsg}: ${rows.length} ${App.I18n.t('common.rows', 'rows')}`, 'success');

  return true;
};

/**
 * CSV Import Utility
 * - Parses CSV content with proper handling of quotes and commas
 * - Supports both comma and semicolon delimiters (European formats)
 * - Returns array of objects with headers as keys
 */
App.Utils.parseCSV = function (content, options = {}) {
  const delimiter = options.delimiter || (content.includes(';') && !content.includes(',') ? ';' : ',');
  const lines = content.split(/\r?\n/).filter(line => line.trim());

  if (lines.length < 2) {
    return { error: 'CSV must have at least a header row and one data row', data: [] };
  }

  // Parse a single line handling quoted values
  const parseLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]).map(h => h.replace(/^["']|["']$/g, '').trim());
  const data = [];
  const errors = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    if (values.length !== headers.length) {
      errors.push(`Row ${i + 1}: Expected ${headers.length} columns, got ${values.length}`);
      continue;
    }

    const row = {};
    headers.forEach((header, idx) => {
      let value = values[idx].replace(/^["']|["']$/g, '').trim();
      // Convert numeric strings to numbers
      if (value && !isNaN(value) && value !== '') {
        value = parseFloat(value);
      }
      row[header] = value;
    });
    data.push(row);
  }

  return { headers, data, errors };
};

/**
 * CSV Field Mapping Helper
 * Maps CSV columns to entity fields with flexible matching
 */
App.Utils.mapCSVFields = function (csvHeaders, fieldMappings) {
  const mapping = {};

  Object.entries(fieldMappings).forEach(([field, aliases]) => {
    const allNames = [field, ...aliases].map(n => n.toLowerCase().trim());
    const match = csvHeaders.find(h => allNames.includes(h.toLowerCase().trim()));
    if (match) {
      mapping[match] = field;
    }
  });

  return mapping;
};

/**
 * Number Sequence Service - Generates sequential document numbers
 * Includes year change detection and guardrails
 */
App.Services.NumberSequence = {
  /**
   * Check and handle year change for sequences
   * Returns true if year changed and sequences were reset
   */
  _checkYearChange() {
    const config = App.Data.config || App.Data.Config || {};
    const seq = config.numberSequences || {};
    const currentYear = new Date().getFullYear();
    const lastYear = seq.lastYear || currentYear;

    if (currentYear !== lastYear) {
      // Year has changed - check if auto-reset is enabled
      const autoReset = config.autoResetSequencesOnYear !== false; // Default to true

      if (autoReset) {
        // Reset all sequences
        seq.lastOrderNumber = 0;
        seq.lastDeliveryNumber = 0;
        seq.lastInvoiceNumber = 0;
        seq.lastProductionOrderNumber = 0;
        seq.lastPurchaseOrderNumber = 0;
        seq.lastYear = currentYear;
        config.numberSequences = seq;
        App.DB.save();

        // Notify user
        if (App.UI?.Toast) {
          App.UI.Toast.show(`Happy New Year! Sequences reset for ${currentYear}`);
        }

        // Log activity
        if (App.Services.ActivityLog) {
          App.Services.ActivityLog.log('update', 'config', null, {
            action: 'year_change_reset',
            oldYear: lastYear,
            newYear: currentYear
          });
        }

        return true;
      }
    }

    // Update last year tracker
    if (seq.lastYear !== currentYear) {
      seq.lastYear = currentYear;
      config.numberSequences = seq;
    }

    return false;
  },

  /**
   * Get next order number (A2025-0076)
   */
  nextOrderNumber() {
    this._checkYearChange();
    const config = App.Data.config || App.Data.Config || {};
    const seq = config.numberSequences || {};
    const year = new Date().getFullYear();
    const next = (seq.lastOrderNumber || 0) + 1;
    seq.lastOrderNumber = next;
    config.numberSequences = seq;
    App.DB.save();
    return `A${year}-${String(next).padStart(4, '0')}`;
  },

  /**
   * Get next delivery note number (L20250059)
   */
  nextDeliveryNumber() {
    this._checkYearChange();
    const config = App.Data.config || App.Data.Config || {};
    const seq = config.numberSequences || {};
    const year = new Date().getFullYear();
    const next = (seq.lastDeliveryNumber || 0) + 1;
    seq.lastDeliveryNumber = next;
    config.numberSequences = seq;
    App.DB.save();
    return `L${year}${String(next).padStart(5, '0')}`;
  },

  /**
   * Get next invoice number (R20250069)
   */
  nextInvoiceNumber() {
    this._checkYearChange();
    const config = App.Data.config || App.Data.Config || {};
    const seq = config.numberSequences || {};
    const year = new Date().getFullYear();
    const next = (seq.lastInvoiceNumber || 0) + 1;
    seq.lastInvoiceNumber = next;
    config.numberSequences = seq;
    App.DB.save();
    return `R${year}${String(next).padStart(5, '0')}`;
  },

  /**
   * Get next production order number (PO-2025-002)
   */
  nextProductionOrderNumber() {
    this._checkYearChange();
    const config = App.Data.config || App.Data.Config || {};
    const seq = config.numberSequences || {};
    const year = new Date().getFullYear();
    const next = (seq.lastProductionOrderNumber || 0) + 1;
    seq.lastProductionOrderNumber = next;
    config.numberSequences = seq;
    App.DB.save();
    return `PO-${year}-${String(next).padStart(3, '0')}`;
  },

  /**
   * Get next customer number (K-2025-0001)
   */
  nextCustomerNumber() {
    this._checkYearChange();
    const config = App.Data.config || App.Data.Config || {};
    const seq = config.numberSequences || {};
    const year = new Date().getFullYear();
    const next = (seq.lastCustomerNumber || 0) + 1;
    seq.lastCustomerNumber = next;
    config.numberSequences = seq;
    App.DB.save();
    return `K-${year}-${String(next).padStart(4, '0')}`;
  },

  /**
   * Get current sequence numbers (for display in settings)
   */
  getCurrentNumbers() {
    const config = App.Data.config || App.Data.Config || {};
    const seq = config.numberSequences || {};
    return {
      lastOrderNumber: seq.lastOrderNumber || 0,
      lastDeliveryNumber: seq.lastDeliveryNumber || 0,
      lastInvoiceNumber: seq.lastInvoiceNumber || 0,
      lastProductionOrderNumber: seq.lastProductionOrderNumber || 0,
      lastCustomerNumber: seq.lastCustomerNumber || 0
    };
  }
};

/**
 * Validation Service - Form and data validation utilities
 */
App.Services.Validation = {
  /**
   * Validate required fields
   * @param {Object} data - Object with field values
   * @param {Array} requiredFields - Array of field names that are required
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  validateRequired(data, requiredFields) {
    const errors = [];
    for (const field of requiredFields) {
      const value = data[field];
      if (value === undefined || value === null || value === '' || (typeof value === 'string' && !value.trim())) {
        errors.push(`${field} is required`);
      }
    }
    return { valid: errors.length === 0, errors };
  },

  /**
   * Validate email format
   */
  isValidEmail(email) {
    if (!email) return true; // Empty is valid (use validateRequired for required check)
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  /**
   * Validate phone format (basic)
   */
  isValidPhone(phone) {
    if (!phone) return true;
    const re = /^[+]?[\d\s\-()]{7,20}$/;
    return re.test(phone);
  },

  /**
   * Validate IBAN format (basic)
   */
  isValidIBAN(iban) {
    if (!iban) return true;
    const cleaned = iban.replace(/\s/g, '');
    return cleaned.length >= 15 && cleaned.length <= 34 && /^[A-Z]{2}\d{2}[A-Z\d]+$/.test(cleaned);
  },

  /**
   * Validate VAT number format (basic)
   */
  isValidVAT(vat) {
    if (!vat) return true;
    return /^[A-Z]{2}[\dA-Z]{8,12}$/.test(vat.replace(/\s/g, ''));
  },

  /**
   * Validate positive number
   */
  isPositive(value) {
    return typeof value === 'number' && value > 0;
  },

  /**
   * Validate non-negative number
   */
  isNonNegative(value) {
    return typeof value === 'number' && value >= 0;
  },

  /**
   * Check stock availability
   * @param {string} productId - Product ID
   * @param {number} quantity - Requested quantity
   * @returns {Object} { available: boolean, stock: number, shortage: number }
   */
  checkStockAvailability(productId, quantity) {
    const products = App.Data.products || App.Data.Products || [];
    const product = products.find(p => p.id === productId);
    if (!product) {
      return { available: false, stock: 0, shortage: quantity };
    }
    // Services don't need stock
    if (product.type === 'Service') {
      return { available: true, stock: Infinity, shortage: 0 };
    }
    const stock = product.stock || 0;
    const available = stock >= quantity;
    return {
      available,
      stock,
      shortage: available ? 0 : quantity - stock
    };
  }
};

/**
 * Price Cascade Service - Implements price lookup cascade logic
 * Priority: Customer-specific price → Segment price → Product default price
 */
App.Services.PriceCascade = {
  /**
   * Get price for a product for a specific customer
   * Follows cascade: Customer → Segment → Product Default
   * @param {string} productId - Product ID
   * @param {string} customerId - Customer ID (optional)
   * @param {number} quantity - Quantity for volume discounts (optional)
   * @returns {Object} { price, source, priceListId, priceListName }
   */
  getPrice(productId, customerId = null, quantity = 1) {
    const product = (App.Data.products || []).find(p => p.id === productId);
    if (!product) {
      return { price: 0, source: 'not_found', priceListId: null, priceListName: null };
    }

    const priceLists = App.Data.priceLists || [];
    const customer = customerId ? (App.Data.customers || []).find(c => c.id === customerId) : null;
    const now = new Date();

    // Default product price
    let result = {
      price: product.dealerPrice || product.avgPurchasePrice || 0,
      source: 'product_default',
      priceListId: null,
      priceListName: null
    };

    // Filter valid price lists (active and within date range)
    const validLists = priceLists.filter(pl => {
      if (pl.active === false) return false;
      if (pl.validFrom && new Date(pl.validFrom) > now) return false;
      if (pl.validTo && new Date(pl.validTo) < now) return false;
      return true;
    });

    // 1. Look for customer-specific price list
    if (customer) {
      const customerList = validLists.find(pl => pl.customerId === customerId);
      if (customerList) {
        const entry = (customerList.entries || []).find(e => e.productId === productId);
        if (entry && entry.price != null) {
          result = {
            price: this._applyQuantityDiscount(entry, quantity),
            source: 'customer',
            priceListId: customerList.id,
            priceListName: customerList.name
          };
          return result; // Customer-specific has highest priority
        }
      }
    }

    // 2. Look for segment-based price list
    if (customer && customer.segment) {
      const segmentList = validLists.find(pl => pl.segmentId === customer.segment && !pl.customerId);
      if (segmentList) {
        const entry = (segmentList.entries || []).find(e => e.productId === productId);
        if (entry && entry.price != null) {
          result = {
            price: this._applyQuantityDiscount(entry, quantity),
            source: 'segment',
            priceListId: segmentList.id,
            priceListName: segmentList.name
          };
          return result;
        }
      }
    }

    // 3. Look for default price list (no customer or segment)
    const defaultList = validLists.find(pl => !pl.customerId && !pl.segmentId);
    if (defaultList) {
      const entry = (defaultList.entries || []).find(e => e.productId === productId);
      if (entry && entry.price != null) {
        result = {
          price: this._applyQuantityDiscount(entry, quantity),
          source: 'default_list',
          priceListId: defaultList.id,
          priceListName: defaultList.name
        };
      }
    }

    return result;
  },

  /**
   * Apply quantity-based discount if applicable
   */
  _applyQuantityDiscount(entry, quantity) {
    let price = entry.price;

    // Check for volume discounts
    if (entry.volumeDiscounts && Array.isArray(entry.volumeDiscounts)) {
      // Sort by minQty descending to find the best matching tier
      const sortedDiscounts = [...entry.volumeDiscounts].sort((a, b) => b.minQty - a.minQty);
      for (const discount of sortedDiscounts) {
        if (quantity >= discount.minQty) {
          if (discount.discountPercent) {
            price = price * (1 - discount.discountPercent / 100);
          } else if (discount.fixedPrice != null) {
            price = discount.fixedPrice;
          }
          break;
        }
      }
    }

    return price;
  },

  /**
   * Get all prices for a customer (for price list preview)
   */
  getAllPricesForCustomer(customerId) {
    const products = (App.Data.products || []).filter(p => p.type !== 'Service');
    return products.map(p => {
      const priceInfo = this.getPrice(p.id, customerId);
      return {
        productId: p.id,
        productName: p.nameDE || p.nameEN || p.name,
        sku: p.internalArticleNumber || p.sku,
        ...priceInfo
      };
    });
  },

  /**
   * Compare prices across different sources for a product
   */
  comparePrices(productId) {
    const product = (App.Data.products || []).find(p => p.id === productId);
    if (!product) return null;

    const priceLists = App.Data.priceLists || [];
    const result = {
      productId,
      productName: product.nameDE || product.nameEN || product.name,
      defaultPrice: product.dealerPrice || 0,
      prices: []
    };

    for (const pl of priceLists) {
      const entry = (pl.entries || []).find(e => e.productId === productId);
      if (entry) {
        result.prices.push({
          priceListId: pl.id,
          priceListName: pl.name,
          type: pl.customerId ? 'customer' : (pl.segmentId ? 'segment' : 'default'),
          price: entry.price,
          uvp: entry.uvp,
          minOrderQty: entry.minOrderQty
        });
      }
    }

    return result;
  },

  /**
   * Calculate line total with proper pricing
   */
  calculateLineTotal(productId, customerId, quantity, overridePrice = null) {
    const price = overridePrice != null ? overridePrice : this.getPrice(productId, customerId, quantity).price;
    const lineNet = quantity * price;
    const vatRate = App.Data.config?.defaultVatRate || 0.2;
    const lineVat = lineNet * vatRate;
    const lineGross = lineNet + lineVat;

    return {
      quantity,
      unitPrice: price,
      lineNet,
      lineVat,
      lineGross,
      vatRate
    };
  }
};

App.Services.Auth = {
  currentUser: null,
  lastActivity: Date.now(),
  lockTimer: null,
  isLocked: false,

  // Role-based route permissions
  rolePermissions: {
    admin: ['dashboard', 'customers', 'products', 'components', 'suppliers', 'carriers', 'pricing', 'inventory', 'movements', 'batches', 'orders', 'purchaseOrders', 'production', 'documents', 'reports', 'tasks', 'settings'],
    sales: ['dashboard', 'customers', 'products', 'pricing', 'orders', 'documents', 'reports', 'tasks'],
    warehouse: ['dashboard', 'inventory', 'movements', 'batches', 'components', 'suppliers', 'carriers', 'purchaseOrders', 'production', 'tasks'],
    production: ['dashboard', 'production', 'components', 'inventory', 'movements', 'batches', 'tasks']
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

    // Start session tracking for multi-user concurrency
    if (App.Services.SessionManager) {
      App.Services.SessionManager.startSession(this.currentUser.id, this.currentUser.name);
    }

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
    // End session tracking
    if (App.Services.SessionManager) {
      App.Services.SessionManager.endSession();
    }

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

/**
 * Session Manager Service - Handles multi-user concurrency
 * Tracks active sessions and warns about potential conflicts
 */
App.Services.SessionManager = {
  sessionId: null,
  heartbeatInterval: null,
  SESSION_TIMEOUT_MS: 2 * 60 * 1000, // 2 minutes without heartbeat = stale session
  HEARTBEAT_INTERVAL_MS: 30 * 1000, // Update session every 30 seconds

  /**
   * Initialize session management
   */
  init() {
    // Generate unique session ID
    this.sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  },

  /**
   * Start session tracking after login
   */
  startSession(userId, userName) {
    if (!App.Data.activeSessions) App.Data.activeSessions = [];

    // Check for existing active sessions
    const otherSessions = this.getActiveSessions().filter(s => s.sessionId !== this.sessionId);

    // Register this session
    this.registerSession(userId, userName);

    // Start heartbeat
    this.startHeartbeat(userId, userName);

    // Warn if other sessions detected
    if (otherSessions.length > 0) {
      const sessionInfo = otherSessions.map(s =>
        `${s.userName} (${new Date(s.lastActivity).toLocaleTimeString()})`
      ).join(', ');

      setTimeout(() => {
        App.UI.Toast.show(
          `Warning: Other active sessions detected: ${sessionInfo}. Changes may conflict.`,
          'warning',
          8000
        );
      }, 1000);
    }

    return otherSessions;
  },

  /**
   * Register or update session
   */
  registerSession(userId, userName) {
    if (!App.Data.activeSessions) App.Data.activeSessions = [];

    const existingIdx = App.Data.activeSessions.findIndex(s => s.sessionId === this.sessionId);
    const sessionData = {
      sessionId: this.sessionId,
      userId,
      userName,
      startTime: existingIdx >= 0 ? App.Data.activeSessions[existingIdx].startTime : new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      browser: navigator.userAgent.slice(0, 50)
    };

    if (existingIdx >= 0) {
      App.Data.activeSessions[existingIdx] = sessionData;
    } else {
      App.Data.activeSessions.push(sessionData);
    }

    // Clean up stale sessions
    this.cleanupStaleSessions();

    App.DB.save();
  },

  /**
   * Start heartbeat to maintain session presence
   */
  startHeartbeat(userId, userName) {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      if (App.Services.Auth.currentUser) {
        this.registerSession(userId, userName);
      }
    }, this.HEARTBEAT_INTERVAL_MS);
  },

  /**
   * Stop session tracking
   */
  endSession() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (App.Data.activeSessions) {
      App.Data.activeSessions = App.Data.activeSessions.filter(s => s.sessionId !== this.sessionId);
      App.DB.save();
    }
  },

  /**
   * Get active sessions (not stale)
   */
  getActiveSessions() {
    const sessions = App.Data.activeSessions || [];
    const cutoff = Date.now() - this.SESSION_TIMEOUT_MS;

    return sessions.filter(s => new Date(s.lastActivity).getTime() > cutoff);
  },

  /**
   * Clean up stale sessions
   */
  cleanupStaleSessions() {
    if (!App.Data.activeSessions) return;

    const cutoff = Date.now() - this.SESSION_TIMEOUT_MS;
    const before = App.Data.activeSessions.length;
    App.Data.activeSessions = App.Data.activeSessions.filter(s =>
      new Date(s.lastActivity).getTime() > cutoff
    );
    const removed = before - App.Data.activeSessions.length;

    if (removed > 0) {
      console.log(`Cleaned up ${removed} stale sessions`);
    }
  },

  /**
   * Check for concurrent sessions and show warning if needed
   */
  checkConcurrentSessions() {
    const otherSessions = this.getActiveSessions().filter(s => s.sessionId !== this.sessionId);

    if (otherSessions.length > 0) {
      return {
        hasConcurrent: true,
        sessions: otherSessions
      };
    }

    return { hasConcurrent: false, sessions: [] };
  },

  /**
   * Get session info for display
   */
  getSessionInfo() {
    return {
      currentSessionId: this.sessionId,
      activeSessions: this.getActiveSessions(),
      totalSessions: this.getActiveSessions().length
    };
  }
};

/**
 * Activity Log Service - Tracks all user actions for auditing
 */
App.Services.ActivityLog = {
  /**
   * Log an activity
   * @param {string} action - Action type (create, update, delete, view, export, login, etc.)
   * @param {string} entity - Entity type (order, customer, product, etc.)
   * @param {string} entityId - ID of the affected entity
   * @param {object} details - Additional details about the action
   */
  log(action, entity, entityId = null, details = {}) {
    if (!App.Data.activityLog) App.Data.activityLog = [];

    const entry = {
      id: App.Utils.generateId('log'),
      timestamp: new Date().toISOString(),
      userId: App.Services.Auth.currentUser?.id || null,
      userName: App.Services.Auth.currentUser?.name || 'System',
      action,
      entity,
      entityId,
      details,
      route: App.Core.Router?.currentRoute || null
    };

    App.Data.activityLog.unshift(entry);

    // Keep only last 1000 entries
    if (App.Data.activityLog.length > 1000) {
      App.Data.activityLog = App.Data.activityLog.slice(0, 1000);
    }

    App.DB.save();
    return entry;
  },

  /**
   * Get activity log entries with optional filters
   */
  getEntries(filters = {}) {
    const log = App.Data.activityLog || [];
    let entries = [...log];

    if (filters.action) {
      entries = entries.filter(e => e.action === filters.action);
    }
    if (filters.entity) {
      entries = entries.filter(e => e.entity === filters.entity);
    }
    if (filters.userId) {
      entries = entries.filter(e => e.userId === filters.userId);
    }
    if (filters.fromDate) {
      const from = new Date(filters.fromDate);
      entries = entries.filter(e => new Date(e.timestamp) >= from);
    }
    if (filters.toDate) {
      const to = new Date(filters.toDate);
      entries = entries.filter(e => new Date(e.timestamp) <= to);
    }

    return entries.slice(0, filters.limit || 100);
  },

  /**
   * Get recent activities for dashboard
   */
  getRecent(limit = 10) {
    return (App.Data.activityLog || []).slice(0, limit);
  },

  /**
   * Get activity summary for today
   */
  getTodaySummary() {
    const today = new Date().toDateString();
    const todayEntries = (App.Data.activityLog || []).filter(e =>
      new Date(e.timestamp).toDateString() === today
    );

    return {
      total: todayEntries.length,
      byAction: this._groupBy(todayEntries, 'action'),
      byEntity: this._groupBy(todayEntries, 'entity'),
      byUser: this._groupBy(todayEntries, 'userName')
    };
  },

  _groupBy(entries, key) {
    return entries.reduce((acc, e) => {
      const val = e[key] || 'unknown';
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});
  },

  /**
   * Clear old entries (keep last N days)
   */
  cleanup(daysToKeep = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysToKeep);

    const before = (App.Data.activityLog || []).length;
    App.Data.activityLog = (App.Data.activityLog || []).filter(e =>
      new Date(e.timestamp) >= cutoff
    );
    const after = App.Data.activityLog.length;

    App.DB.save();
    return before - after;
  },

  /**
   * Get retention configuration
   */
  getRetentionConfig() {
    const config = App.Data.config || App.Data.Config || {};
    return {
      retentionDays: config.logRetentionDays ?? 90,
      autoCleanup: config.logAutoCleanup ?? true,
      maxEntries: config.logMaxEntries ?? 1000
    };
  },

  /**
   * Set retention configuration
   */
  setRetentionConfig(options = {}) {
    const config = App.Data.config || App.Data.Config || {};
    if (options.retentionDays !== undefined) config.logRetentionDays = options.retentionDays;
    if (options.autoCleanup !== undefined) config.logAutoCleanup = options.autoCleanup;
    if (options.maxEntries !== undefined) config.logMaxEntries = options.maxEntries;
    App.DB.save();
    return this.getRetentionConfig();
  },

  /**
   * Auto-cleanup based on retention policy
   * Called on app initialization
   */
  autoCleanup() {
    const config = this.getRetentionConfig();
    if (!config.autoCleanup) return 0;

    const deleted = this.cleanup(config.retentionDays);
    if (deleted > 0) {
      console.log(`Activity log auto-cleanup: ${deleted} entries removed (retention: ${config.retentionDays} days)`);
    }
    return deleted;
  },

  /**
   * Get log statistics
   */
  getStats() {
    const log = App.Data.activityLog || [];
    const config = this.getRetentionConfig();

    // Find oldest entry
    const oldestEntry = log.length > 0 ? log[log.length - 1] : null;
    const oldestDate = oldestEntry ? new Date(oldestEntry.timestamp) : null;

    // Calculate size estimate (rough)
    const sizeEstimate = JSON.stringify(log).length;

    return {
      totalEntries: log.length,
      maxEntries: config.maxEntries,
      retentionDays: config.retentionDays,
      oldestEntryDate: oldestDate?.toISOString() || null,
      sizeEstimateKB: Math.round(sizeEstimate / 1024)
    };
  }
};

/**
 * Automation Service - Handles automated business process workflows
 * Auto-creates production orders, delivery notes, invoices based on triggers
 */
App.Services.Automation = {
  /**
   * Configuration flags for automation behavior
   */
  config: {
    autoCreateProduction: true,      // Auto-create production orders when order confirmed
    autoGenerateDeliveryNote: true,  // Auto-generate delivery note when shipped
    autoGenerateInvoice: true,       // Auto-generate invoice when delivered
    autoDeductComponents: true,      // Auto-deduct components when production starts
    showNotifications: true          // Show toast notifications for auto-actions
  },

  /**
   * Process a newly created/confirmed order
   * Creates production orders for products with BOM
   */
  processOrderCreation(order) {
    if (!this.config.autoCreateProduction) return { created: [] };

    const results = { created: [], errors: [] };
    const products = App.Data.products || [];
    const productionOrders = App.Data.productionOrders || [];

    for (const item of order.items || []) {
      const product = products.find(p => p.id === item.productId);
      if (!product) continue;

      // Skip if product has no BOM (no production needed)
      if (!product.bom || product.bom.length === 0) continue;

      // Skip service products
      if (product.type === 'Service') continue;

      // Check component availability
      const componentCheck = this._checkComponentAvailability(product.bom, item.qty);

      // Create production order
      const po = {
        id: App.Utils.generateId('po'),
        orderNumber: App.Services.NumberSequence.nextProductionOrderNumber(),
        productId: product.id,
        quantity: item.qty,
        createdBy: App.Services.Auth.currentUser?.id || null,
        createdAt: new Date().toISOString(),
        plannedStart: new Date().toISOString().split('T')[0],
        status: 'planned',
        sourceOrderId: order.id,
        sourceOrderNumber: order.orderId,
        components: product.bom.map(b => ({
          componentId: b.componentId,
          quantity: b.quantityPerUnit * item.qty
        })),
        notes: `Auto-created from Order ${order.orderId}`,
        componentWarnings: componentCheck.warnings
      };

      productionOrders.push(po);
      results.created.push({
        poNumber: po.orderNumber,
        product: product.nameDE || product.nameEN || product.internalArticleNumber,
        quantity: item.qty,
        hasWarnings: componentCheck.warnings.length > 0
      });

      // Log activity
      App.Services.ActivityLog?.log('create', 'production', po.id, {
        name: po.orderNumber,
        product: product.nameDE || product.nameEN,
        quantity: item.qty,
        trigger: 'auto_from_order',
        sourceOrder: order.orderId
      });
    }

    App.Data.productionOrders = productionOrders;
    App.DB.save();

    // Show notification
    if (this.config.showNotifications && results.created.length > 0) {
      const msg = results.created.length === 1
        ? `Production order ${results.created[0].poNumber} created`
        : `${results.created.length} production orders created`;
      App.UI.Toast.show(msg);
    }

    return results;
  },

  /**
   * Check component availability for a BOM
   */
  _checkComponentAvailability(bom, quantity) {
    const warnings = [];
    const components = App.Data.components || [];

    for (const bomItem of bom) {
      const comp = components.find(c => c.id === bomItem.componentId);
      if (!comp) {
        warnings.push({
          type: 'not_found',
          componentId: bomItem.componentId,
          message: `Component ${bomItem.componentId} not found`
        });
        continue;
      }

      const required = bomItem.quantityPerUnit * quantity;
      const available = comp.stock || 0;

      if (available < required) {
        warnings.push({
          type: 'insufficient',
          componentId: bomItem.componentId,
          componentName: comp.description || comp.componentNumber,
          required,
          available,
          shortage: required - available
        });
      }
    }

    return { valid: warnings.length === 0, warnings };
  },

  /**
   * Handle order status change - triggers document generation
   */
  onStatusChange(orderId, newStatus, oldStatus) {
    const order = (App.Data.orders || []).find(o => o.id === orderId);
    if (!order) return;

    const results = { actions: [] };

    // Shipped → Auto-generate delivery note
    if (newStatus === 'shipped' && oldStatus !== 'shipped') {
      if (this.config.autoGenerateDeliveryNote) {
        const result = this.autoGenerateDeliveryNote(orderId);
        if (result.success) {
          results.actions.push({
            type: 'delivery_note',
            docNumber: result.docNumber,
            message: `Delivery note ${result.docNumber} generated`
          });
        }
      }
    }

    // Delivered → Auto-generate invoice
    if (newStatus === 'delivered' && oldStatus !== 'delivered') {
      if (this.config.autoGenerateInvoice) {
        const result = this.autoGenerateInvoice(orderId);
        if (result.success) {
          results.actions.push({
            type: 'invoice',
            docNumber: result.docNumber,
            message: `Invoice ${result.docNumber} generated`
          });
        }
      }
    }

    // Show notifications
    if (this.config.showNotifications && results.actions.length > 0) {
      results.actions.forEach(action => {
        App.UI.Toast.show(action.message);
      });
    }

    return results;
  },

  /**
   * Auto-generate delivery note from order
   */
  autoGenerateDeliveryNote(orderId) {
    // Check if delivery note already exists for this order
    const existingDoc = (App.Data.documents || []).find(d =>
      d.orderId === orderId && d.type === 'delivery'
    );

    if (existingDoc) {
      return { success: false, reason: 'already_exists', docNumber: existingDoc.docNumber };
    }

    // Use Documents view to generate
    if (App.UI.Views.Documents?.generateFromOrder) {
      App.UI.Views.Documents.generateFromOrder(orderId, 'delivery');

      // Get the newly created document
      const newDoc = (App.Data.documents || []).find(d =>
        d.orderId === orderId && d.type === 'delivery'
      );

      if (newDoc) {
        App.Services.ActivityLog?.log('create', 'document', newDoc.id, {
          name: newDoc.docNumber,
          type: 'delivery',
          trigger: 'auto_on_shipped',
          sourceOrder: orderId
        });

        return { success: true, docNumber: newDoc.docNumber, docId: newDoc.id };
      }
    }

    return { success: false, reason: 'generation_failed' };
  },

  /**
   * Auto-generate invoice from order
   */
  autoGenerateInvoice(orderId) {
    // Check if invoice already exists for this order
    const existingDoc = (App.Data.documents || []).find(d =>
      d.orderId === orderId && d.type === 'invoice'
    );

    if (existingDoc) {
      return { success: false, reason: 'already_exists', docNumber: existingDoc.docNumber };
    }

    // Use Documents view to generate
    if (App.UI.Views.Documents?.generateFromOrder) {
      App.UI.Views.Documents.generateFromOrder(orderId, 'invoice');

      // Get the newly created document
      const newDoc = (App.Data.documents || []).find(d =>
        d.orderId === orderId && d.type === 'invoice'
      );

      if (newDoc) {
        App.Services.ActivityLog?.log('create', 'document', newDoc.id, {
          name: newDoc.docNumber,
          type: 'invoice',
          trigger: 'auto_on_delivered',
          sourceOrder: orderId
        });

        return { success: true, docNumber: newDoc.docNumber, docId: newDoc.id };
      }
    }

    return { success: false, reason: 'generation_failed' };
  },

  /**
   * Start production - deducts components from inventory
   */
  startProduction(productionOrderId) {
    const po = (App.Data.productionOrders || []).find(p => p.id === productionOrderId);
    if (!po) return { success: false, reason: 'not_found' };

    if (po.status !== 'planned') {
      return { success: false, reason: 'invalid_status', currentStatus: po.status };
    }

    const components = App.Data.components || [];
    const movements = App.Data.movements || [];
    const deductions = [];

    // Deduct components
    if (this.config.autoDeductComponents && po.components) {
      for (const poComp of po.components) {
        const comp = components.find(c => c.id === poComp.componentId);
        if (comp) {
          const oldStock = comp.stock || 0;
          comp.stock = oldStock - poComp.quantity;

          deductions.push({
            componentId: poComp.componentId,
            componentName: comp.description || comp.componentNumber,
            quantity: poComp.quantity,
            oldStock,
            newStock: comp.stock
          });

          // Record movement
          movements.push({
            id: App.Utils.generateId('mv'),
            date: new Date().toISOString(),
            type: 'production_consumption',
            direction: 'out',
            componentId: poComp.componentId,
            quantity: poComp.quantity,
            reference: po.orderNumber,
            notes: `Consumed for ${po.orderNumber}`
          });
        }
      }
    }

    // Update status
    po.status = 'in_progress';
    po.startedAt = new Date().toISOString();
    po.startedBy = App.Services.Auth.currentUser?.id;

    App.Data.movements = movements;
    App.DB.save();

    // Log activity
    App.Services.ActivityLog?.log('update', 'production', po.id, {
      name: po.orderNumber,
      action: 'start_production',
      componentsDeducted: deductions.length
    });

    if (this.config.showNotifications) {
      App.UI.Toast.show(`Production ${po.orderNumber} started, ${deductions.length} components deducted`);
    }

    return { success: true, deductions };
  },

  /**
   * Complete production - adds finished product to inventory
   */
  completeProduction(productionOrderId) {
    const po = (App.Data.productionOrders || []).find(p => p.id === productionOrderId);
    if (!po) return { success: false, reason: 'not_found' };

    const products = App.Data.products || [];
    const product = products.find(p => p.id === po.productId);
    if (!product) return { success: false, reason: 'product_not_found' };

    const movements = App.Data.movements || [];

    // Add to product stock
    const oldStock = product.stock || 0;
    product.stock = oldStock + po.quantity;

    // Record movement
    movements.push({
      id: App.Utils.generateId('mv'),
      date: new Date().toISOString(),
      type: 'production',
      direction: 'in',
      productId: po.productId,
      quantity: po.quantity,
      reference: po.orderNumber,
      notes: 'Production completed'
    });

    // Update status
    po.status = 'completed';
    po.completedAt = new Date().toISOString();
    po.completedBy = App.Services.Auth.currentUser?.id;

    App.Data.movements = movements;
    App.DB.save();

    // Log activity
    App.Services.ActivityLog?.log('update', 'production', po.id, {
      name: po.orderNumber,
      action: 'complete_production',
      productName: product.nameDE || product.nameEN,
      quantityProduced: po.quantity,
      oldStock,
      newStock: product.stock
    });

    if (this.config.showNotifications) {
      App.UI.Toast.show(`Production ${po.orderNumber} completed, ${po.quantity} ${product.nameDE || product.nameEN} added to stock`);
    }

    return {
      success: true,
      productName: product.nameDE || product.nameEN,
      quantityProduced: po.quantity,
      newStock: product.stock
    };
  },

  /**
   * Get automation status/report for an order
   */
  getOrderAutomationStatus(orderId) {
    const order = (App.Data.orders || []).find(o => o.id === orderId);
    if (!order) return null;

    const productionOrders = (App.Data.productionOrders || []).filter(po => po.sourceOrderId === orderId);
    const deliveryNote = (App.Data.documents || []).find(d => d.orderId === orderId && d.type === 'delivery');
    const invoice = (App.Data.documents || []).find(d => d.orderId === orderId && d.type === 'invoice');

    return {
      orderId: order.orderId,
      status: order.status,
      production: {
        count: productionOrders.length,
        orders: productionOrders.map(po => ({
          number: po.orderNumber,
          status: po.status,
          product: (App.Data.products || []).find(p => p.id === po.productId)?.nameDE
        })),
        allCompleted: productionOrders.every(po => po.status === 'completed')
      },
      documents: {
        hasDeliveryNote: !!deliveryNote,
        deliveryNoteNumber: deliveryNote?.docNumber,
        hasInvoice: !!invoice,
        invoiceNumber: invoice?.docNumber,
        invoicePaid: invoice ? (invoice.paidAmount || 0) >= (invoice.grossTotal || 0) : false
      }
    };
  },

  /**
   * Show automation configuration modal
   */
  showConfigModal() {
    const body = `
      <div>
        <p style="font-size:13px; color:var(--color-text-muted); margin-bottom:16px;">
          Configure automatic business process workflows
        </p>

        <div style="margin-bottom:12px;">
          <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
            <input type="checkbox" id="auto-cfg-production" ${this.config.autoCreateProduction ? 'checked' : ''} />
            <span>Auto-create production orders when order confirmed</span>
          </label>
        </div>

        <div style="margin-bottom:12px;">
          <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
            <input type="checkbox" id="auto-cfg-delivery" ${this.config.autoGenerateDeliveryNote ? 'checked' : ''} />
            <span>Auto-generate delivery note when shipped</span>
          </label>
        </div>

        <div style="margin-bottom:12px;">
          <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
            <input type="checkbox" id="auto-cfg-invoice" ${this.config.autoGenerateInvoice ? 'checked' : ''} />
            <span>Auto-generate invoice when delivered</span>
          </label>
        </div>

        <div style="margin-bottom:12px;">
          <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
            <input type="checkbox" id="auto-cfg-deduct" ${this.config.autoDeductComponents ? 'checked' : ''} />
            <span>Auto-deduct components when production starts</span>
          </label>
        </div>

        <div style="margin-bottom:12px;">
          <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
            <input type="checkbox" id="auto-cfg-notify" ${this.config.showNotifications ? 'checked' : ''} />
            <span>Show notifications for auto-actions</span>
          </label>
        </div>
      </div>
    `;

    App.UI.Modal.open(App.I18n.t('common.automationSettings', 'Automation Settings'), body, [
      { text: 'Cancel', variant: 'ghost', onClick: () => {} },
      {
        text: 'Save',
        variant: 'primary',
        onClick: () => {
          this.config.autoCreateProduction = document.getElementById('auto-cfg-production').checked;
          this.config.autoGenerateDeliveryNote = document.getElementById('auto-cfg-delivery').checked;
          this.config.autoGenerateInvoice = document.getElementById('auto-cfg-invoice').checked;
          this.config.autoDeductComponents = document.getElementById('auto-cfg-deduct').checked;
          this.config.showNotifications = document.getElementById('auto-cfg-notify').checked;

          // Save to config
          if (!App.Data.config) App.Data.config = {};
          App.Data.config.automation = this.config;
          App.DB.save();

          App.UI.Toast.show('Automation settings saved');
        }
      }
    ]);
  },

  /**
   * Recompute order status based on linked documents
   * Call this when LS, invoice, or payments change
   */
  recomputeOrderStatus(orderId) {
    const order = (App.Data.orders || []).find(o => o.id === orderId);
    if (!order) return null;

    const documents = App.Data.documents || [];
    const deliveryNotes = documents.filter(d => d.orderId === orderId && d.type === 'delivery');
    const invoices = documents.filter(d => d.orderId === orderId && d.type === 'invoice');

    const oldStatus = order.status;
    let newStatus = order.status;

    // Check if all invoices are paid → paid/closed
    if (invoices.length > 0) {
      const allPaid = invoices.every(inv => {
        const paid = inv.paidAmount || 0;
        const total = inv.grossTotal || 0;
        return paid >= total;
      });

      if (allPaid) {
        newStatus = 'paid';
      }
    }

    // Check delivery status (only if not yet paid)
    if (newStatus !== 'paid' && deliveryNotes.length > 0) {
      // Calculate total delivered quantity per product
      const deliveredQty = {};
      deliveryNotes.forEach(dn => {
        (dn.items || []).forEach(item => {
          const pid = item.productId || item.id;
          const qty = item.qty || item.quantity || 0;
          deliveredQty[pid] = (deliveredQty[pid] || 0) + qty;
        });
      });

      // Calculate ordered quantity per product
      const orderedQty = {};
      (order.items || []).forEach(item => {
        orderedQty[item.productId] = (orderedQty[item.productId] || 0) + (item.qty || 0);
      });

      // Check if all items fully delivered
      const allDelivered = Object.keys(orderedQty).every(pid => {
        return (deliveredQty[pid] || 0) >= orderedQty[pid];
      });

      if (allDelivered) {
        newStatus = 'delivered';
      } else if (Object.keys(deliveredQty).length > 0) {
        // Partially shipped
        if (order.status === 'confirmed' || order.status === 'processing') {
          newStatus = 'shipped';
        }
      }
    }

    // Update if changed
    if (newStatus !== oldStatus) {
      order.status = newStatus;

      // Log status history
      if (!order.statusHistory) order.statusHistory = [];
      order.statusHistory.push({
        status: newStatus,
        date: new Date().toISOString(),
        userId: null,
        notes: 'Auto-updated based on documents'
      });

      App.DB.save();

      // Log activity
      App.Services.ActivityLog?.log('update', 'order', order.id, {
        name: order.orderId,
        action: 'auto_status_update',
        oldStatus,
        newStatus,
        trigger: 'document_change'
      });

      if (this.config.showNotifications) {
        App.UI.Toast.show(`Order ${order.orderId} status: ${oldStatus} → ${newStatus}`);
      }
    }

    return { oldStatus, newStatus, changed: newStatus !== oldStatus };
  },

  /**
   * Recompute status for all orders linked to a document
   */
  onDocumentChange(documentId) {
    const doc = (App.Data.documents || []).find(d => d.id === documentId);
    if (doc && doc.orderId) {
      return this.recomputeOrderStatus(doc.orderId);
    }
    return null;
  },

  /**
   * Create automatic tasks for key events
   */
  createTaskForOrder(order, reason) {
    const tasks = App.Data.tasks || [];
    const customer = (App.Data.customers || []).find(c => c.id === order.custId);

    // Calculate due date (planned delivery - 2 days)
    let dueDate = new Date();
    if (order.plannedDelivery) {
      dueDate = new Date(order.plannedDelivery);
      dueDate.setDate(dueDate.getDate() - 2);
    } else {
      dueDate.setDate(dueDate.getDate() + 5);
    }

    const task = {
      id: App.Utils.generateId('task'),
      title: `${reason}: Order ${order.orderId}`,
      description: `${customer?.company || 'Customer'} - ${App.Utils.formatCurrency(order.totalGross)}`,
      category: 'Production',
      status: 'pending',
      priority: order.totalGross > 5000 ? 'high' : 'normal',
      dueDate: dueDate.toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      createdBy: App.Services.Auth.currentUser?.id,
      entityType: 'order',
      entityId: order.id
    };

    tasks.push(task);
    App.Data.tasks = tasks;
    App.DB.save();

    if (this.config.showNotifications) {
      App.UI.Toast.show(`Task created: ${task.title}`);
    }

    return task;
  },

  /**
   * Check for expiring batches and create tasks
   */
  checkBatchExpiry(daysWarning = 30) {
    const batches = App.Data.batches || [];
    const tasks = App.Data.tasks || [];
    const now = new Date();
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + daysWarning);

    let created = 0;

    batches.forEach(batch => {
      if (!batch.expiryDate || batch.status === 'expired' || batch.status === 'disposed') return;

      const expiry = new Date(batch.expiryDate);
      if (expiry <= warningDate && expiry > now) {
        // Check if task already exists for this batch
        const existingTask = tasks.find(t =>
          t.entityType === 'batch' && t.entityId === batch.id && t.status !== 'completed'
        );

        if (!existingTask) {
          const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
          const task = {
            id: App.Utils.generateId('task'),
            title: `Batch Expiring: ${batch.lotNumber}`,
            description: `Expires in ${daysUntilExpiry} days (${batch.expiryDate})`,
            category: 'Inventory',
            status: 'pending',
            priority: daysUntilExpiry <= 7 ? 'high' : 'normal',
            dueDate: batch.expiryDate,
            createdAt: new Date().toISOString(),
            entityType: 'batch',
            entityId: batch.id
          };

          tasks.push(task);
          created++;
        }
      }
    });

    if (created > 0) {
      App.Data.tasks = tasks;
      App.DB.save();

      if (this.config.showNotifications) {
        App.UI.Toast.show(`${created} batch expiry task(s) created`);
      }
    }

    return created;
  },

  /**
   * Load config from saved data
   */
  loadConfig() {
    const savedConfig = App.Data.config?.automation;
    if (savedConfig) {
      this.config = { ...this.config, ...savedConfig };
    }
  }
};

/**
 * Keyboard Shortcuts Service
 */
App.Services.Keyboard = {
  shortcuts: {},
  enabled: true,

  init() {
    // Define default shortcuts
    this.shortcuts = {
      // Navigation shortcuts (Alt + key)
      'alt+d': { action: () => App.Core.Router.navigate('dashboard'), description: 'Go to Dashboard' },
      'alt+o': { action: () => App.Core.Router.navigate('orders'), description: 'Go to Orders' },
      'alt+i': { action: () => App.Core.Router.navigate('inventory'), description: 'Go to Inventory' },
      'alt+c': { action: () => App.Core.Router.navigate('customers'), description: 'Go to Customers' },
      'alt+p': { action: () => App.Core.Router.navigate('products'), description: 'Go to Products' },
      'alt+r': { action: () => App.Core.Router.navigate('reports'), description: 'Go to Reports' },
      'alt+s': { action: () => App.Core.Router.navigate('settings'), description: 'Go to Settings' },
      'alt+m': { action: () => App.Core.Router.navigate('movements'), description: 'Go to Movements' },
      'alt+b': { action: () => App.Core.Router.navigate('batches'), description: 'Go to Batches' },
      'alt+u': { action: () => App.Core.Router.navigate('purchaseOrders'), description: 'Go to Purchase Orders' },

      // Quick actions (Ctrl + key)
      'ctrl+n': { action: () => this._createNew(), description: 'Create new (context-aware)' },
      'ctrl+k': { action: () => this._focusGlobalSearch(), description: 'Global search' },
      'ctrl+f': { action: () => this._focusSearch(), description: 'Focus page search' },
      'ctrl+e': { action: () => this._exportCurrent(), description: 'Export current view' },

      // Utility shortcuts
      'escape': { action: () => App.UI.Modal.close(), description: 'Close modal' },
      'f1': { action: () => this.showHelp(), description: 'Show keyboard shortcuts' },
      '?': { action: () => this.showHelp(), description: 'Show keyboard shortcuts', requireShift: true },

      // Theme toggle
      'alt+t': { action: () => this._toggleTheme(), description: 'Toggle theme (dark/light)' },

      // Lock screen
      'ctrl+l': { action: () => App.Services.Auth.lock(), description: 'Lock screen' }
    };

    // Add event listener
    document.addEventListener('keydown', (e) => this._handleKeydown(e));
  },

  _handleKeydown(e) {
    // Don't trigger shortcuts when typing in inputs/textareas
    const target = e.target;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable;

    // Allow Escape to work everywhere
    if (e.key === 'Escape') {
      const shortcut = this.shortcuts['escape'];
      if (shortcut) {
        e.preventDefault();
        shortcut.action();
      }
      return;
    }

    // Skip shortcuts when typing in inputs (except Escape)
    if (isInput) return;

    // Don't process if disabled or user not logged in
    if (!this.enabled || !App.Services.Auth.currentUser || App.Services.Auth.isLocked) return;

    // Build shortcut key
    let key = '';
    if (e.ctrlKey || e.metaKey) key += 'ctrl+';
    if (e.altKey) key += 'alt+';
    if (e.shiftKey && !['shift', 'Shift'].includes(e.key)) key += 'shift+';
    key += e.key.toLowerCase();

    // Handle ? key specially
    if (e.shiftKey && e.key === '?') {
      key = '?';
    }

    const shortcut = this.shortcuts[key];
    if (shortcut) {
      e.preventDefault();
      shortcut.action();
    }
  },

  _createNew() {
    const route = App.Core.Router.currentRoute;
    switch (route) {
      case 'orders':
        if (App.UI.Views.Orders?.openCreateModal) App.UI.Views.Orders.openCreateModal();
        break;
      case 'customers':
        if (App.UI.Views.Customers?.openModal) App.UI.Views.Customers.openModal();
        break;
      case 'products':
        if (App.UI.Views.Products?.openModal) App.UI.Views.Products.openModal();
        break;
      case 'components':
        if (App.UI.Views.Components?.openModal) App.UI.Views.Components.openModal();
        break;
      case 'suppliers':
        if (App.UI.Views.Suppliers?.openModal) App.UI.Views.Suppliers.openModal();
        break;
      case 'carriers':
        if (App.UI.Views.Carriers?.openModal) App.UI.Views.Carriers.openModal();
        break;
      case 'batches':
        if (App.UI.Views.Batches?.openBatchModal) App.UI.Views.Batches.openBatchModal();
        break;
      case 'purchaseOrders':
        if (App.UI.Views.PurchaseOrders?.openPOModal) App.UI.Views.PurchaseOrders.openPOModal();
        break;
      case 'production':
        if (App.UI.Views.Production?.openModal) App.UI.Views.Production.openModal();
        break;
      case 'tasks':
        if (App.UI.Views.Tasks?.openModal) App.UI.Views.Tasks.openModal();
        break;
      default:
        App.UI.Toast.show('No create action for this page');
    }
  },

  _focusGlobalSearch() {
    const globalSearch = document.getElementById('global-search');
    if (globalSearch) {
      globalSearch.focus();
      globalSearch.select();
    }
  },

  _focusSearch() {
    // First try page-specific search, then fall back to global
    const pageSearch = document.querySelector('#customer-search, #product-search, #order-search, #component-search');
    if (pageSearch) {
      pageSearch.focus();
      pageSearch.select();
    } else {
      this._focusGlobalSearch();
    }
  },

  _exportCurrent() {
    const route = App.Core.Router.currentRoute;
    switch (route) {
      case 'orders':
        document.getElementById('ord-export-excel')?.click();
        break;
      case 'inventory':
        document.getElementById('inv-export')?.click();
        break;
      case 'reports':
        // Reports have their own export buttons
        App.UI.Toast.show('Select an export option from Reports page');
        break;
      default:
        App.UI.Toast.show('No export available for this page');
    }
  },

  _toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);

    // Save to config
    if (App.Data.config) {
      App.Data.config.theme = newTheme;
      App.DB.save();
    }

    App.UI.Toast.show(`Theme: ${newTheme}`);
  },

  showHelp() {
    const categories = {
      'Navigation': ['alt+d', 'alt+o', 'alt+i', 'alt+c', 'alt+p', 'alt+r', 'alt+s', 'alt+m', 'alt+b', 'alt+u'],
      'Actions': ['ctrl+n', 'ctrl+k', 'ctrl+f', 'ctrl+e', 'ctrl+l'],
      'Utility': ['escape', 'f1', 'alt+t']
    };

    let helpHtml = '<div style="max-height:400px; overflow-y:auto;">';

    for (const [category, keys] of Object.entries(categories)) {
      helpHtml += `<h4 style="margin:12px 0 8px; font-size:14px; font-weight:600; color:var(--color-primary);">${category}</h4>`;
      helpHtml += '<table style="width:100%; font-size:13px;">';

      for (const key of keys) {
        const shortcut = this.shortcuts[key];
        if (shortcut) {
          const displayKey = key.replace('ctrl+', 'Ctrl + ').replace('alt+', 'Alt + ').replace('shift+', 'Shift + ').toUpperCase();
          helpHtml += `
            <tr>
              <td style="padding:4px 8px;"><kbd style="background:var(--color-bg); padding:2px 6px; border-radius:4px; border:1px solid var(--color-border); font-family:monospace;">${displayKey}</kbd></td>
              <td style="padding:4px 8px; color:var(--color-text-muted);">${shortcut.description}</td>
            </tr>
          `;
        }
      }
      helpHtml += '</table>';
    }

    helpHtml += '</div>';

    App.UI.Modal.open(App.I18n.t('common.keyboardShortcuts', 'Keyboard Shortcuts'), helpHtml, [
      { text: 'Close', variant: 'ghost', onClick: () => {} }
    ]);
  },

  // Allow custom shortcuts to be added
  register(key, action, description) {
    this.shortcuts[key.toLowerCase()] = { action, description };
  },

  // Remove a shortcut
  unregister(key) {
    delete this.shortcuts[key.toLowerCase()];
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
    App.Services.Keyboard.init();
    App.Services.Automation.loadConfig();

    // Initialize session manager for multi-user support
    if (App.Services.SessionManager) {
      App.Services.SessionManager.init();
    }

    // Auto-cleanup old activity log entries based on retention policy
    if (App.Services.ActivityLog?.autoCleanup) {
      App.Services.ActivityLog.autoCleanup();
    }

    App.Services.Auth.initLoginScreen();

    // End session and auto-backup when user closes/navigates away from page
    window.addEventListener('beforeunload', async () => {
      if (App.Services.SessionManager) {
        App.Services.SessionManager.endSession();
      }
      if (App.DB && App.DB.autoBackupOnExit) {
        await App.DB.autoBackupOnExit();
      }
    });

    // Initialize session timeout manager
    if (App.SessionManager) {
      App.SessionManager.init();
    }

    // Offline/Online status detection
    window.addEventListener('offline', () => {
      App.UI.Toast.show(App.I18n.t('common.offlineMode', 'Offline mode - data is saved locally'), 'warning', 5000);
    });
    window.addEventListener('online', () => {
      App.UI.Toast.show(App.I18n.t('common.backOnline', 'Back online'), 'success');
    });
  } catch (e) {
    console.error(e);
    alert('Failed to initialize MicroOps. Check console for details.');
  }
});