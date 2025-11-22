App.UI.Views.Settings = {
  activeTab: 'company',

  render(root) {
    const t = (key, fallback) => App.I18n.t(`settings.${key}`, fallback);
    const esc = App.Utils.escapeHtml;
    const cfg = App.Data.config || App.Data.Config || {};
    const users = App.Data.users || App.Data.Users || [];
    const sequences = cfg.numberSequences || {};

    root.innerHTML = `
      <div class="card-soft" style="margin-bottom:16px;">
        <div style="display:flex; gap:8px; border-bottom:1px solid var(--color-border); padding-bottom:12px; margin-bottom:16px; flex-wrap:wrap;">
          <button class="btn ${this.activeTab === 'company' ? 'btn-primary' : 'btn-ghost'}" data-tab="company">${t('tabCompany', 'Company')}</button>
          <button class="btn ${this.activeTab === 'users' ? 'btn-primary' : 'btn-ghost'}" data-tab="users">${t('tabUsers', 'Users')}</button>
          <button class="btn ${this.activeTab === 'system' ? 'btn-primary' : 'btn-ghost'}" data-tab="system">${t('tabSystem', 'System')}</button>
          <button class="btn ${this.activeTab === 'communication' ? 'btn-primary' : 'btn-ghost'}" data-tab="communication">${t('tabCommunication', 'Communication')}</button>
          <button class="btn ${this.activeTab === 'backups' ? 'btn-primary' : 'btn-ghost'}" data-tab="backups">${t('tabBackups', 'Backups')}</button>
          <button class="btn ${this.activeTab === 'audit' ? 'btn-primary' : 'btn-ghost'}" data-tab="audit">${t('tabAudit', 'Audit Log')}</button>
          <button class="btn ${this.activeTab === 'activity' ? 'btn-primary' : 'btn-ghost'}" data-tab="activity">${t('tabActivity', 'Activity Log')}</button>
        </div>

        <!-- Company Tab -->
        <div id="tab-company" style="${this.activeTab !== 'company' ? 'display:none;' : ''}">
          ${this._renderCompanyTab(cfg)}
        </div>

        <!-- Users Tab -->
        <div id="tab-users" style="${this.activeTab !== 'users' ? 'display:none;' : ''}">
          ${this._renderUsersTab(users)}
        </div>

        <!-- System Tab -->
        <div id="tab-system" style="${this.activeTab !== 'system' ? 'display:none;' : ''}">
          ${this._renderSystemTab(cfg, sequences)}
        </div>

        <!-- Communication Tab -->
        <div id="tab-communication" style="${this.activeTab !== 'communication' ? 'display:none;' : ''}">
          ${this._renderCommunicationTab(cfg)}
        </div>

        <!-- Backups Tab -->
        <div id="tab-backups" style="${this.activeTab !== 'backups' ? 'display:none;' : ''}">
          ${this._renderBackupsTab(cfg)}
        </div>

        <!-- Audit Log Tab -->
        <div id="tab-audit" style="${this.activeTab !== 'audit' ? 'display:none;' : ''}">
          ${this._renderAuditTab()}
        </div>

        <!-- Activity Log Tab -->
        <div id="tab-activity" style="${this.activeTab !== 'activity' ? 'display:none;' : ''}">
          ${this._renderActivityTab()}
        </div>
      </div>
    `;

    // Tab switching
    root.querySelectorAll('[data-tab]').forEach(btn => {
      btn.onclick = () => {
        this.activeTab = btn.getAttribute('data-tab');
        this.render(root);
      };
    });

    // Wire up event handlers based on active tab
    this._wireUpHandlers(root, cfg, users);
  },

  _renderCompanyTab(cfg) {
    const t = (key, fallback) => App.I18n.t(`settings.${key}`, fallback);
    return `
      <div class="grid grid-2" style="gap:16px;">
        <div>
          <h4 style="font-size:14px; font-weight:600; margin-bottom:12px;">${t('companyInfo', 'Company Information')}</h4>
          <div class="grid" style="gap:8px;">
            <label class="field-label">${App.I18n.t('settings.companyName', 'Company Name')}</label>
            <input id="set-company" class="input" value="${cfg.companyName || ''}" />

            <label class="field-label">${App.I18n.t('settings.address', 'Address')}</label>
            <input id="set-address" class="input" value="${cfg.address || ''}" />

            <div class="grid grid-2" style="gap:8px;">
              <div>
                <label class="field-label">${App.I18n.t('settings.phone', 'Phone')}</label>
                <input id="set-phone" class="input" value="${cfg.phone || ''}" />
              </div>
              <div>
                <label class="field-label">${App.I18n.t('settings.email', 'Email')}</label>
                <input id="set-email" class="input" value="${cfg.email || ''}" />
              </div>
            </div>

            <div class="grid grid-2" style="gap:8px;">
              <div>
                <label class="field-label">${App.I18n.t('settings.vat', 'VAT ID')}</label>
                <input id="set-vat" class="input" value="${cfg.vatNumber || ''}" />
              </div>
              <div>
                <label class="field-label">${App.I18n.t('settings.reg', 'Register No')}</label>
                <input id="set-reg" class="input" value="${cfg.commercialRegisterNumber || ''}" />
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 style="font-size:14px; font-weight:600; margin-bottom:12px;">${t('bankingTerms', 'Banking & Terms')}</h4>
          <div class="grid" style="gap:8px;">
            <label class="field-label">${App.I18n.t('settings.bank', 'Bank Name')}</label>
            <input id="set-bank" class="input" value="${cfg.bankName || ''}" />

            <div class="grid grid-2" style="gap:8px;">
              <div>
                <label class="field-label">${App.I18n.t('settings.iban', 'IBAN')}</label>
                <input id="set-iban" class="input" value="${cfg.iban || ''}" />
              </div>
              <div>
                <label class="field-label">${App.I18n.t('settings.bic', 'BIC')}</label>
                <input id="set-bic" class="input" value="${cfg.bic || ''}" />
              </div>
            </div>

            <label class="field-label">${App.I18n.t('settings.payTerms', 'Payment Terms')}</label>
            <input id="set-payterms" class="input" value="${cfg.defaultPaymentTerms || ''}" />

            <label class="field-label">${App.I18n.t('settings.delTerms', 'Delivery Terms')}</label>
            <input id="set-delterms" class="input" value="${cfg.defaultDeliveryTerms || ''}" />

            <div class="grid grid-3" style="gap:8px;">
              <div>
                <label class="field-label">${App.I18n.t('settings.vatRate', 'VAT Rate')}</label>
                <input id="set-vatrate" type="number" step="0.01" class="input" value="${cfg.defaultVatRate != null ? cfg.defaultVatRate : 0.2}" />
              </div>
              <div>
                <label class="field-label">${App.I18n.t('settings.currency', 'Currency')}</label>
                <input id="set-currency" class="input" value="${cfg.currency || 'EUR'}" />
              </div>
              <div>
                <label class="field-label">Invoice Due Days</label>
                <input id="set-duedays" type="number" class="input" value="${cfg.invoiceDueDays || 30}" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <button class="btn btn-primary" style="margin-top:16px;" id="btn-save-config">${App.I18n.t('settings.save', 'Save Settings')}</button>
    `;
  },

  _renderUsersTab(users) {
    const t = (key, fallback) => App.I18n.t(`settings.${key}`, fallback);
    const esc = App.Utils.escapeHtml;
    return `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <h4 style="font-size:14px; font-weight:600;">${t('userManagement', 'User Management')}</h4>
        <button class="btn btn-primary" id="btn-add-user">+ ${t('addUser', 'Add User')}</button>
      </div>
      <div style="display:flex; flex-direction:column; gap:6px;">
        ${users.map(u => `
          <div style="display:flex; justify-content:space-between; align-items:center; border:1px solid var(--color-border); border-radius:8px; padding:10px 12px;">
            <div>
              <span style="font-weight:500;">${u.name}</span>
              <span style="font-size:11px; text-transform:uppercase; color:var(--color-text-muted); margin-left:8px; padding:2px 6px; background:rgba(255,255,255,0.1); border-radius:4px;">${u.role}</span>
              ${u.active === false ? '<span style="font-size:10px; color:#f97373; margin-left:4px;">(inactive)</span>' : ''}
            </div>
            <div style="display:flex; gap:4px;">
              <button class="btn btn-ghost btn-edit-user" data-id="${u.id}" title="Edit" aria-label="Edit user">✏️</button>
              <button class="btn btn-ghost btn-delete-user" data-id="${u.id}" title="Delete" aria-label="Delete user">🗑️</button>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Backup/Restore Section -->
      <div style="margin-top:20px; padding-top:16px; border-top:1px solid var(--color-border);">
        <h4 style="font-size:14px; font-weight:600; margin-bottom:8px;">${App.I18n.t('settings.backupSection', 'Database Backup')}</h4>
        <div style="display:flex; gap:8px;">
          <button class="btn btn-ghost" id="btn-backup">📥 ${App.I18n.t('settings.downloadBackup', 'Download Backup')}</button>
          <label class="btn btn-ghost" style="cursor:pointer;">
            📤 ${App.I18n.t('settings.restoreBackup', 'Restore Backup')}
            <input type="file" id="restore-file" accept=".json" style="display:none;" />
          </label>
        </div>
      </div>
    `;
  },

  _renderSystemTab(cfg, sequences) {
    const t = (key, fallback) => App.I18n.t(`settings.${key}`, fallback);
    return `
      <div class="grid grid-2" style="gap:16px;">
        <div>
          <h4 style="font-size:14px; font-weight:600; margin-bottom:12px;">${t('numberSequences', 'Number Sequences')}</h4>
          <table class="table" style="font-size:13px;">
            <thead>
              <tr><th>${App.I18n.t('common.documentType', 'Document Type')}</th><th>${App.I18n.t('common.lastNumber', 'Last Number')}</th></tr>
            </thead>
            <tbody>
              <tr><td>Orders</td><td>${sequences.lastOrderNumber || 0}</td></tr>
              <tr><td>Delivery Notes</td><td>${sequences.lastDeliveryNumber || 0}</td></tr>
              <tr><td>Invoices</td><td>${sequences.lastInvoiceNumber || 0}</td></tr>
              <tr><td>Production Orders</td><td>${sequences.lastProductionOrderNumber || 0}</td></tr>
              <tr><td>Customers</td><td>${sequences.lastCustomerNumber || 0}</td></tr>
            </tbody>
          </table>

          <h4 style="font-size:14px; font-weight:600; margin:16px 0 12px;">Security Settings</h4>
          <div class="grid" style="gap:8px;">
            <div>
              <label class="field-label">Auto-lock after (minutes)</label>
              <input id="set-autolock" type="number" class="input" value="${cfg.autoLockMinutes || 15}" min="1" max="60" />
            </div>
          </div>

          <h4 style="font-size:14px; font-weight:600; margin:16px 0 12px;">Tutorials & Help</h4>
          <div class="grid" style="gap:8px;">
            <div>
              <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                <input type="checkbox" id="set-tutorials-enabled" ${cfg.tutorialsEnabled !== false ? 'checked' : ''} />
                <span>Show first-time tutorials</span>
              </label>
              <p style="font-size:11px; color:var(--color-text-muted); margin-top:4px;">Display helpful guides when visiting pages for the first time</p>
            </div>
            <div style="display:flex; gap:8px; margin-top:8px;">
              <button class="btn btn-ghost" id="btn-reset-tutorials">Reset All Tutorials</button>
              <button class="btn btn-ghost" id="btn-show-tutorial">Show Current Page Tutorial</button>
            </div>
          </div>

          <button class="btn btn-ghost" style="margin-top:12px;" id="btn-save-system">Save System Settings</button>
        </div>

        <div>
          <h4 style="font-size:14px; font-weight:600; margin-bottom:12px;">System Information</h4>
          <div style="font-size:13px; display:flex; flex-direction:column; gap:8px;">
            <div style="display:flex; justify-content:space-between; padding:8px; background:var(--color-bg); border-radius:6px;">
              <span>Products</span>
              <strong>${(App.Data.products || []).length}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; padding:8px; background:var(--color-bg); border-radius:6px;">
              <span>Components</span>
              <strong>${(App.Data.components || []).length}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; padding:8px; background:var(--color-bg); border-radius:6px;">
              <span>Customers</span>
              <strong>${(App.Data.customers || []).length}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; padding:8px; background:var(--color-bg); border-radius:6px;">
              <span>Orders</span>
              <strong>${(App.Data.orders || []).length}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; padding:8px; background:var(--color-bg); border-radius:6px;">
              <span>Documents</span>
              <strong>${(App.Data.documents || []).length}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; padding:8px; background:var(--color-bg); border-radius:6px;">
              <span>Activity Log</span>
              <strong>${(App.Data.activityLog || []).length}</strong>
            </div>
          </div>

          <h4 style="font-size:14px; font-weight:600; margin:16px 0 12px;">Activity Log Settings</h4>
          <div class="grid" style="gap:8px;">
            <div>
              <label class="field-label">Retention Period (days)</label>
              <select id="set-log-retention" class="input">
                <option value="30" ${(cfg.logRetentionDays || 90) === 30 ? 'selected' : ''}>30 days</option>
                <option value="60" ${(cfg.logRetentionDays || 90) === 60 ? 'selected' : ''}>60 days</option>
                <option value="90" ${(cfg.logRetentionDays || 90) === 90 ? 'selected' : ''}>90 days</option>
                <option value="180" ${(cfg.logRetentionDays || 90) === 180 ? 'selected' : ''}>180 days</option>
                <option value="365" ${(cfg.logRetentionDays || 90) === 365 ? 'selected' : ''}>1 year</option>
              </select>
            </div>
            <div>
              <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                <input type="checkbox" id="set-log-autocleanup" ${cfg.logAutoCleanup !== false ? 'checked' : ''} />
                <span>Auto-cleanup on startup</span>
              </label>
            </div>
          </div>
          <div style="display:flex; gap:8px; margin-top:12px;">
            <button class="btn btn-ghost" id="btn-cleanup-log">Clean Old Logs Now</button>
            <button class="btn btn-ghost" id="btn-save-log-settings">Save Log Settings</button>
          </div>
          <div id="log-stats" style="margin-top:12px; font-size:11px; color:var(--color-text-muted);"></div>
        </div>
      </div>
    `;
  },

  _renderCommunicationTab(cfg) {
    const t = (key, fallback) => App.I18n.t(`settings.${key}`, fallback);
    const emailTemplate = cfg.emailTemplate || {};
    const defaultSubject = t('defaultEmailSubject', 'Invoice {{Rechnungsnummer}} / Delivery Note {{Lieferscheinnummer}}');
    const defaultBody = t('defaultEmailBody', 'Dear Sir or Madam,\n\nPlease find attached:\n\n- Delivery Note No. {{Lieferscheinnummer}} dated {{Lieferscheindatum}}\n- Invoice No. {{Rechnungsnummer}} dated {{Rechnungsdatum}}\n\nInvoice Amount: {{Gesamtbetrag}}\nPayment Due: {{Zahlungsziel}}\n\nPlease transfer the amount quoting the invoice number.\n\nBest regards\n{{BenutzerName}}\n\n{{Firmensignatur}}');

    return `
      <div>
        <h4 style="font-size:14px; font-weight:600; margin-bottom:12px;">${t('emailTemplateTitle', 'Email Template LS/RE')}</h4>
        <p style="font-size:12px; color:var(--color-text-muted); margin-bottom:16px;">${t('emailTemplateDesc', 'Template for customer emails with delivery note and invoice')}</p>

        <div class="grid grid-2" style="gap:16px;">
          <div>
            <div style="margin-bottom:12px;">
              <label class="field-label" for="email-subject-template">${t('emailSubjectTemplate', 'Subject Template')}</label>
              <input id="email-subject-template" class="input" value="${App.Utils.escapeHtml(emailTemplate.subject || defaultSubject)}" />
            </div>

            <div style="margin-bottom:12px;">
              <label class="field-label" for="email-body-template">${t('emailBodyTemplate', 'Email Body Template')}</label>
              <textarea id="email-body-template" class="input" style="height:300px; font-family:monospace; font-size:12px;">${App.Utils.escapeHtml(emailTemplate.body || defaultBody)}</textarea>
            </div>

            <button class="btn btn-primary" id="btn-save-email-template">${t('saveEmailTemplate', 'Save Email Template')}</button>
          </div>

          <div>
            <div style="margin-bottom:16px;">
              <label class="field-label">${t('availablePlaceholders', 'Available Placeholders')}</label>
              <div style="font-size:11px; background:var(--color-bg); padding:12px; border-radius:6px; font-family:monospace;">
                <div style="margin-bottom:8px;"><strong>Kunde:</strong></div>
                <code>{{Anrede}}</code>, <code>{{KundeName}}</code>, <code>{{KundenNummer}}</code>

                <div style="margin:8px 0;"><strong>Rechnung:</strong></div>
                <code>{{Rechnungsnummer}}</code>, <code>{{Rechnungsdatum}}</code>, <code>{{Gesamtbetrag}}</code>, <code>{{Zahlungsziel}}</code>

                <div style="margin:8px 0;"><strong>Lieferschein:</strong></div>
                <code>{{Lieferscheinnummer}}</code>, <code>{{Lieferscheindatum}}</code>

                <div style="margin:8px 0;"><strong>Firma:</strong></div>
                <code>{{Firmenname}}</code>, <code>{{Firmensignatur}}</code>, <code>{{BenutzerName}}</code>
              </div>
            </div>

            <div>
              <label class="field-label">${t('livePreview', 'Live Preview')}</label>
              <div id="email-preview" style="font-size:12px; background:var(--color-bg); padding:12px; border-radius:6px; white-space:pre-wrap; max-height:280px; overflow-y:auto; border:1px solid var(--color-border);">
                <!-- Preview will be rendered here -->
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  _renderBackupsTab(cfg) {
    const t = (key, fallback) => App.I18n.t(`settings.${key}`, fallback);
    const lastBackup = cfg.lastBackupAt ? new Date(cfg.lastBackupAt).toLocaleString() : 'Never';

    return `
      <div class="grid grid-2" style="gap:16px;">
        <div>
          <h4 style="font-size:14px; font-weight:600; margin-bottom:12px;">${t('autoBackups', 'Auto-Backups')}</h4>
          <p style="font-size:12px; color:var(--color-text-muted); margin-bottom:12px;">
            ${t('autoBackupDesc', 'The system automatically saves backups when you close the browser. Up to 7 recent backups are kept.')}
          </p>

          <div id="backup-list" style="max-height:300px; overflow-y:auto; border:1px solid var(--color-border); border-radius:8px; padding:8px;">
            <div style="text-align:center; color:var(--color-text-muted); padding:20px;">
              <span class="loading-spinner"></span> ${t('loadingBackups', 'Loading backups...')}
            </div>
          </div>

          <div style="margin-top:12px; display:flex; gap:8px;">
            <button class="btn btn-ghost" id="btn-load-backups">🔄 ${t('refreshBackups', 'Refresh')}</button>
            <button class="btn btn-primary" id="btn-create-backup">💾 ${t('createBackup', 'Create Backup Now')}</button>
          </div>
        </div>

        <div>
          <h4 style="font-size:14px; font-weight:600; margin-bottom:12px;">${t('manualBackup', 'Manual Backup')}</h4>
          <p style="font-size:12px; color:var(--color-text-muted); margin-bottom:12px;">
            ${t('manualBackupDesc', 'Download a backup file to your computer or restore from a previous backup.')}
          </p>

          <div style="padding:16px; background:var(--color-bg); border-radius:8px; margin-bottom:12px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
              <span>${t('lastManualBackup', 'Last manual backup')}:</span>
              <strong>${lastBackup}</strong>
            </div>
          </div>

          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button class="btn btn-ghost" id="btn-download-backup">📥 ${t('downloadBackup', 'Download Backup')}</button>
            <label class="btn btn-ghost" style="cursor:pointer;">
              📤 ${t('restoreBackup', 'Restore from File')}
              <input type="file" id="restore-backup-file" accept=".json" style="display:none;" />
            </label>
          </div>

          <h4 style="font-size:14px; font-weight:600; margin:16px 0 12px;">${t('encryptedBackup', 'Encrypted Backup')}</h4>
          <p style="font-size:12px; color:var(--color-text-muted); margin-bottom:12px;">
            ${t('encryptedDesc', 'Create password-protected backups for extra security.')}
          </p>
          <div style="display:flex; gap:8px; align-items:center;">
            <input type="password" id="backup-password" class="input" placeholder="${t('password', 'Password')}" style="width:150px;" />
            <button class="btn btn-ghost" id="btn-encrypted-backup">🔐 ${t('encryptedDownload', 'Encrypted Download')}</button>
          </div>

          <h4 style="font-size:14px; font-weight:600; margin:16px 0 12px;">${t('storageInfo', 'Storage Information')}</h4>
          <div id="storage-info" style="font-size:12px; color:var(--color-text-muted);">
            ${t('checkingStorage', 'Checking storage usage...')}
          </div>
        </div>
      </div>
    `;
  },

  _renderAuditTab() {
    const t = (key, fallback) => App.I18n.t(`settings.${key}`, fallback);
    const auditLog = App.Data.auditLog || [];
    const recentEntries = auditLog.slice(0, 100);

    const stats = App.Audit?.getStats ? App.Audit.getStats() : {
      total: auditLog.length,
      byAction: {},
      byEntity: {}
    };

    const actionColors = {
      CREATE: '#10b981',
      UPDATE: '#3b82f6',
      DELETE: '#ef4444'
    };

    return `
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <h4 style="font-size:14px; font-weight:600;">${t('auditTrail', 'Audit Trail')}</h4>
          <div style="display:flex; gap:8px;">
            <button class="btn btn-ghost" id="btn-export-audit">📥 ${t('exportCSV', 'Export CSV')}</button>
            <button class="btn btn-ghost" id="btn-clear-audit">🗑️ ${t('clearOldEntries', 'Clear Old')}</button>
          </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-4" style="gap:8px; margin-bottom:16px;">
          <div style="padding:12px; background:var(--color-bg); border-radius:6px; text-align:center;">
            <div style="font-size:10px; text-transform:uppercase; color:var(--color-text-muted);">${t('totalEntries', 'Total')}</div>
            <div style="font-size:18px; font-weight:600; margin-top:4px;">${stats.total || auditLog.length}</div>
          </div>
          <div style="padding:12px; background:var(--color-bg); border-radius:6px; text-align:center;">
            <div style="font-size:10px; text-transform:uppercase; color:var(--color-text-muted);">${t('creates', 'Creates')}</div>
            <div style="font-size:18px; font-weight:600; margin-top:4px; color:#10b981;">${stats.byAction?.CREATE || 0}</div>
          </div>
          <div style="padding:12px; background:var(--color-bg); border-radius:6px; text-align:center;">
            <div style="font-size:10px; text-transform:uppercase; color:var(--color-text-muted);">${t('updates', 'Updates')}</div>
            <div style="font-size:18px; font-weight:600; margin-top:4px; color:#3b82f6;">${stats.byAction?.UPDATE || 0}</div>
          </div>
          <div style="padding:12px; background:var(--color-bg); border-radius:6px; text-align:center;">
            <div style="font-size:10px; text-transform:uppercase; color:var(--color-text-muted);">${t('deletes', 'Deletes')}</div>
            <div style="font-size:18px; font-weight:600; margin-top:4px; color:#ef4444;">${stats.byAction?.DELETE || 0}</div>
          </div>
        </div>

        <!-- Filters -->
        <div style="display:flex; gap:8px; margin-bottom:12px; flex-wrap:wrap;">
          <select id="audit-filter-action" class="input" style="width:120px;">
            <option value="">${t('allActions', 'All Actions')}</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
          </select>
          <select id="audit-filter-entity" class="input" style="width:130px;">
            <option value="">${t('allEntities', 'All Entities')}</option>
            <option value="customers">Customers</option>
            <option value="orders">Orders</option>
            <option value="products">Products</option>
            <option value="documents">Documents</option>
          </select>
          <input type="text" id="audit-search" class="input" placeholder="${t('searchAudit', 'Search...')}" style="width:150px;" />
        </div>

        <!-- Log Table -->
        <div style="max-height:400px; overflow-y:auto; border:1px solid var(--color-border); border-radius:8px;">
          <table class="table" style="font-size:11px;">
            <thead style="position:sticky; top:0; background:var(--color-surface);">
              <tr>
                <th style="width:130px;">${t('timestamp', 'Timestamp')}</th>
                <th style="width:80px;">${t('user', 'User')}</th>
                <th style="width:70px;">${t('action', 'Action')}</th>
                <th style="width:80px;">${t('entity', 'Entity')}</th>
                <th style="width:80px;">${t('entityId', 'ID')}</th>
                <th>${t('changes', 'Changes')}</th>
              </tr>
            </thead>
            <tbody id="audit-table-body">
              ${recentEntries.length > 0 ? recentEntries.map(entry => {
                const time = new Date(entry.timestamp);
                const timeStr = time.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
                const actionColor = actionColors[entry.action] || '#888';
                const changesStr = entry.changes?.length > 0
                  ? entry.changes.map(c => `${c.field}`).join(', ')
                  : (entry.action === 'CREATE' ? 'New record' : entry.action === 'DELETE' ? 'Deleted' : '-');

                return `
                  <tr class="audit-row" data-action="${entry.action}" data-entity="${entry.entity}">
                    <td style="white-space:nowrap;">${timeStr}</td>
                    <td>${entry.userName || 'System'}</td>
                    <td><span style="color:${actionColor}; font-weight:600;">${entry.action}</span></td>
                    <td>${entry.entity}</td>
                    <td style="font-family:monospace; font-size:10px;">${entry.entityId ? entry.entityId.slice(-8) : '-'}</td>
                    <td style="max-width:200px; overflow:hidden; text-overflow:ellipsis;" title="${changesStr}">${changesStr}</td>
                  </tr>
                `;
              }).join('') : `<tr><td colspan="6" style="text-align:center; color:var(--color-text-muted);">${t('noAuditEntries', 'No audit entries yet')}</td></tr>`}
            </tbody>
          </table>
        </div>

        ${recentEntries.length < auditLog.length ? `
          <p style="font-size:11px; color:var(--color-text-muted); margin-top:8px; text-align:center;">
            ${t('showingRecent', 'Showing')} ${recentEntries.length} ${t('of', 'of')} ${auditLog.length} ${t('entries', 'entries')}
          </p>
        ` : ''}
      </div>
    `;
  },

  _renderActivityTab() {
    const activities = App.Services.ActivityLog?.getEntries({ limit: 50 }) || [];
    const summary = App.Services.ActivityLog?.getTodaySummary() || { total: 0 };

    const actionIcons = {
      create: '➕', update: '✏️', delete: '🗑️', view: '👁️',
      export: '📥', login: '🔐', logout: '🚪', status_change: '🔄'
    };

    return `
      <div style="margin-bottom:16px;">
        <div class="grid grid-4" style="gap:8px;">
          <div style="padding:12px; background:var(--color-bg); border-radius:6px; text-align:center;">
            <div style="font-size:10px; text-transform:uppercase; color:var(--color-text-muted);">Today</div>
            <div style="font-size:18px; font-weight:600; margin-top:4px;">${summary.total}</div>
          </div>
          <div style="padding:12px; background:var(--color-bg); border-radius:6px; text-align:center;">
            <div style="font-size:10px; text-transform:uppercase; color:var(--color-text-muted);">Creates</div>
            <div style="font-size:18px; font-weight:600; margin-top:4px;">${summary.byAction?.create || 0}</div>
          </div>
          <div style="padding:12px; background:var(--color-bg); border-radius:6px; text-align:center;">
            <div style="font-size:10px; text-transform:uppercase; color:var(--color-text-muted);">Updates</div>
            <div style="font-size:18px; font-weight:600; margin-top:4px;">${summary.byAction?.update || 0}</div>
          </div>
          <div style="padding:12px; background:var(--color-bg); border-radius:6px; text-align:center;">
            <div style="font-size:10px; text-transform:uppercase; color:var(--color-text-muted);">Exports</div>
            <div style="font-size:18px; font-weight:600; margin-top:4px;">${summary.byAction?.export || 0}</div>
          </div>
        </div>
      </div>

      <div style="max-height:400px; overflow-y:auto;">
        <table class="table" style="font-size:12px;">
          <thead>
            <tr>
              <th>${App.I18n.t('common.time', 'Time')}</th>
              <th>${App.I18n.t('common.user', 'User')}</th>
              <th>${App.I18n.t('common.action', 'Action')}</th>
              <th>${App.I18n.t('common.entity', 'Entity')}</th>
              <th>${App.I18n.t('common.details', 'Details')}</th>
            </tr>
          </thead>
          <tbody>
            ${activities.length > 0 ? activities.map(a => {
              const time = new Date(a.timestamp);
              const timeStr = time.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
              return `
                <tr>
                  <td style="white-space:nowrap;">${timeStr}</td>
                  <td>${a.userName}</td>
                  <td>${actionIcons[a.action] || '•'} ${a.action}</td>
                  <td>${a.entity}${a.entityId ? ` <span style="color:var(--color-text-muted);">#${a.entityId.slice(-6)}</span>` : ''}</td>
                  <td style="font-size:11px; color:var(--color-text-muted); max-width:200px; overflow:hidden; text-overflow:ellipsis;">${a.details?.name || a.details?.message || '-'}</td>
                </tr>
              `;
            }).join('') : '<tr><td colspan="5" style="text-align:center; color:var(--color-text-muted);">No activity logged yet</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  },

  _wireUpHandlers(root, cfg, users) {
    // Company config save
    const saveConfigBtn = document.getElementById('btn-save-config');
    if (saveConfigBtn) {
      saveConfigBtn.onclick = () => {
        cfg.companyName = document.getElementById('set-company')?.value.trim() || '';
        cfg.street = document.getElementById('set-address')?.value.trim() || '';
        cfg.phone = document.getElementById('set-phone')?.value.trim() || '';
        cfg.email = document.getElementById('set-email')?.value.trim() || '';
        cfg.vatNumber = document.getElementById('set-vat')?.value.trim() || '';
        cfg.commercialRegisterNumber = document.getElementById('set-reg')?.value.trim() || '';
        cfg.bankName = document.getElementById('set-bank')?.value.trim() || '';
        cfg.iban = document.getElementById('set-iban')?.value.trim() || '';
        cfg.bic = document.getElementById('set-bic')?.value.trim() || '';
        cfg.defaultPaymentTerms = document.getElementById('set-payterms')?.value.trim() || '';
        cfg.defaultDeliveryTerms = document.getElementById('set-delterms')?.value.trim() || '';
        cfg.defaultVatRate = parseFloat(document.getElementById('set-vatrate')?.value) || 0.2;
        cfg.currency = document.getElementById('set-currency')?.value.trim() || 'EUR';
        const dueDays = document.getElementById('set-duedays');
        if (dueDays) cfg.invoiceDueDays = parseInt(dueDays.value) || 30;

        App.Data.config = cfg;
        App.Data.Config = cfg;
        App.DB.save();
        App.UI.Toast.show(App.I18n.t('settings.saved', 'Settings saved'));
        App.UI.Navbar.render();
      };
    }

    // System settings save
    const saveSystemBtn = document.getElementById('btn-save-system');
    if (saveSystemBtn) {
      saveSystemBtn.onclick = () => {
        const autoLock = document.getElementById('set-autolock');
        if (autoLock) cfg.autoLockMinutes = parseInt(autoLock.value) || 15;

        // Save tutorial settings
        const tutorialsEnabled = document.getElementById('set-tutorials-enabled')?.checked ?? true;
        cfg.tutorialsEnabled = tutorialsEnabled;
        if (App.UI.Tutorial) App.UI.Tutorial.setEnabled(tutorialsEnabled);

        App.Data.config = cfg;
        App.DB.save();
        App.UI.Toast.show(App.I18n.t('common.settingsSaved', 'System settings saved'));
      };
    }

    // Tutorial reset button
    const resetTutorialsBtn = document.getElementById('btn-reset-tutorials');
    if (resetTutorialsBtn) {
      resetTutorialsBtn.onclick = () => {
        if (App.UI.Tutorial) {
          App.UI.Tutorial.reset();
          App.UI.Toast.show('All tutorials have been reset. They will show again on first visit.');
        }
      };
    }

    // Show current tutorial button
    const showTutorialBtn = document.getElementById('btn-show-tutorial');
    if (showTutorialBtn) {
      showTutorialBtn.onclick = () => {
        if (App.UI.Tutorial) {
          const tutorials = App.UI.Tutorial.getTutorials();
          const tutorial = tutorials['settings'];
          if (tutorial) {
            App.UI.Tutorial.show(tutorial.title, tutorial.steps, null);
          } else {
            App.UI.Toast.show('No tutorial available for this page');
          }
        }
      };
    }

    // Log retention settings
    const saveLogSettingsBtn = document.getElementById('btn-save-log-settings');
    if (saveLogSettingsBtn) {
      saveLogSettingsBtn.onclick = () => {
        const retentionDays = parseInt(document.getElementById('set-log-retention')?.value) || 90;
        const autoCleanup = document.getElementById('set-log-autocleanup')?.checked ?? true;

        App.Services.ActivityLog.setRetentionConfig({
          retentionDays,
          autoCleanup
        });

        App.UI.Toast.show('Log retention settings saved');
      };
    }

    // Log cleanup
    const cleanupBtn = document.getElementById('btn-cleanup-log');
    if (cleanupBtn) {
      cleanupBtn.onclick = () => {
        const retentionDays = parseInt(document.getElementById('set-log-retention')?.value) || 90;
        const removed = App.Services.ActivityLog?.cleanup(retentionDays) || 0;
        App.UI.Toast.show(`Cleaned up ${removed} old log entries (older than ${retentionDays} days)`);
        this.render(root);
      };
    }

    // Display log stats
    const logStatsEl = document.getElementById('log-stats');
    if (logStatsEl && App.Services.ActivityLog?.getStats) {
      const stats = App.Services.ActivityLog.getStats();
      logStatsEl.innerHTML = `
        Entries: ${stats.totalEntries} |
        Size: ~${stats.sizeEstimateKB} KB |
        Oldest: ${stats.oldestEntryDate ? new Date(stats.oldestEntryDate).toLocaleDateString() : 'N/A'}
      `;
    }

    // Email Template Event Handlers
    const saveEmailTemplateBtn = document.getElementById('btn-save-email-template');
    const emailSubjectInput = document.getElementById('email-subject-template');
    const emailBodyTextarea = document.getElementById('email-body-template');
    const emailPreview = document.getElementById('email-preview');

    // Function to update preview with sample data
    const updateEmailPreview = () => {
      if (!emailBodyTextarea || !emailPreview) return;

      const sampleData = {
        '{{Anrede}}': 'Sehr geehrte Damen und Herren',
        '{{KundeName}}': 'Musterfirma GmbH',
        '{{KundenNummer}}': 'K-001',
        '{{Rechnungsnummer}}': 'RE-2024-001',
        '{{Rechnungsdatum}}': '22.11.2024',
        '{{Gesamtbetrag}}': '€ 1.234,56',
        '{{Zahlungsziel}}': '22.12.2024',
        '{{Lieferscheinnummer}}': 'LS-2024-001',
        '{{Lieferscheindatum}}': '20.11.2024',
        '{{Firmenname}}': cfg.companyName || 'MicroOps Global',
        '{{Firmensignatur}}': `${cfg.companyName || 'MicroOps Global'}\n${cfg.street || ''}\n${cfg.phone || ''}`,
        '{{BenutzerName}}': App.Services.Auth?.currentUser?.name || 'Max Mustermann'
      };

      let preview = emailBodyTextarea.value;
      Object.keys(sampleData).forEach(placeholder => {
        preview = preview.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), sampleData[placeholder]);
      });
      emailPreview.textContent = preview;
    };

    if (saveEmailTemplateBtn) {
      saveEmailTemplateBtn.onclick = () => {
        if (!cfg.emailTemplate) cfg.emailTemplate = {};
        cfg.emailTemplate.subject = emailSubjectInput?.value || '';
        cfg.emailTemplate.body = emailBodyTextarea?.value || '';
        cfg.emailTemplate.lastModified = new Date().toISOString();
        cfg.emailTemplate.modifiedBy = App.Services.Auth?.currentUser?.id || 'system';

        App.Data.config = cfg;
        App.DB.save();

        // Log activity
        if (App.Services.ActivityLog) {
          App.Services.ActivityLog.log('update', 'config', 'emailTemplate', {
            action: 'email_template_updated'
          });
        }

        App.UI.Toast.show(App.I18n.t('settings.emailTemplateSaved', 'Email template saved'));
      };
    }

    // Update preview on input
    if (emailBodyTextarea) {
      emailBodyTextarea.addEventListener('input', updateEmailPreview);
      // Initial preview
      updateEmailPreview();
    }

    // User Management Event Handlers
    const addUserBtn = document.getElementById('btn-add-user');
    if (addUserBtn) addUserBtn.onclick = () => this.openUserModal();

    root.querySelectorAll('.btn-edit-user').forEach(btn => {
      btn.onclick = () => {
        const userId = btn.getAttribute('data-id');
        const user = users.find(u => u.id === userId);
        if (user) this.openUserModal(user);
      };
    });

    root.querySelectorAll('.btn-delete-user').forEach(btn => {
      btn.onclick = () => {
        const userId = btn.getAttribute('data-id');
        const user = users.find(u => u.id === userId);
        if (user) this.deleteUser(user);
      };
    });

    // Backup/Restore Event Handlers
    const backupBtn = document.getElementById('btn-backup');
    const restoreInput = document.getElementById('restore-file');

    if (backupBtn) {
      backupBtn.onclick = () => {
        const filename = App.DB.exportBackup();

        // Track backup timestamp for reminders
        if (!App.Data.config) App.Data.config = {};
        App.Data.config.lastBackupAt = new Date().toISOString();
        App.DB.save();

        App.UI.Toast.show(`${App.I18n.t('settings.backupSaved', 'Backup saved as')} ${filename}`);

        // Log activity
        if (App.Services.ActivityLog) {
          App.Services.ActivityLog.log('export', 'backup', null, {
            filename: filename,
            action: 'database_backup'
          });
        }
      };
    }

    if (restoreInput) {
      restoreInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const result = await App.DB.importBackup(file);
        if (result.success) {
          App.UI.Toast.show(App.I18n.t('settings.backupRestored', 'Backup restored successfully'));

          // Log activity
          if (App.Services.ActivityLog) {
            App.Services.ActivityLog.log('import', 'backup', null, {
              filename: file.name,
              action: 'database_restore',
              stats: result.stats
            });
          }

          App.Core.Router.navigate('settings');
        } else {
          App.UI.Toast.show(`${App.I18n.t('settings.backupFailed', 'Backup restore failed')}: ${result.message}`);
        }
        e.target.value = '';
      };
    }

    // Backups Tab Event Handlers
    this._wireUpBackupsHandlers(root, cfg);

    // Audit Tab Event Handlers
    this._wireUpAuditHandlers(root);
  },

  _wireUpBackupsHandlers(root, cfg) {
    const loadBackupsBtn = document.getElementById('btn-load-backups');
    const createBackupBtn = document.getElementById('btn-create-backup');
    const downloadBackupBtn = document.getElementById('btn-download-backup');
    const restoreBackupFile = document.getElementById('restore-backup-file');
    const encryptedBackupBtn = document.getElementById('btn-encrypted-backup');
    const backupList = document.getElementById('backup-list');
    const storageInfo = document.getElementById('storage-info');

    // Load auto-backup list
    const loadBackups = async () => {
      if (!backupList) return;

      try {
        const backups = await App.DB.listBackups();

        if (backups.length === 0) {
          backupList.innerHTML = `
            <div style="text-align:center; color:var(--color-text-muted); padding:20px;">
              No auto-backups found. Backups are created when you close the browser.
            </div>
          `;
          return;
        }

        backupList.innerHTML = backups.map((backup, index) => {
          const date = new Date(backup.timestamp);
          const dateStr = date.toLocaleString();
          const sizeKB = backup.size ? (backup.size / 1024).toFixed(1) : '?';

          return `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:8px; border-bottom:1px solid var(--color-border); ${index === 0 ? 'background:rgba(59, 130, 246, 0.1);' : ''}">
              <div>
                <div style="font-weight:500; font-size:12px;">${dateStr}</div>
                <div style="font-size:10px; color:var(--color-text-muted);">${sizeKB} KB ${index === 0 ? '(Latest)' : ''}</div>
              </div>
              <button class="btn btn-ghost btn-restore-auto" data-timestamp="${backup.timestamp}" title="Restore this backup">
                ♻️
              </button>
            </div>
          `;
        }).join('');

        // Wire restore buttons
        document.querySelectorAll('.btn-restore-auto').forEach(btn => {
          btn.onclick = async () => {
            const timestamp = parseInt(btn.getAttribute('data-timestamp'));
            if (confirm('Are you sure you want to restore this backup? Current data will be replaced.')) {
              try {
                await App.DB.restoreFromBackup(timestamp);
                App.UI.Toast.show('Backup restored successfully');
                App.Core.Router.navigate('settings');
              } catch (err) {
                App.UI.Toast.show('Restore failed: ' + err.message, 'error');
              }
            }
          };
        });
      } catch (err) {
        backupList.innerHTML = `
          <div style="text-align:center; color:var(--color-danger); padding:20px;">
            Error loading backups: ${err.message}
          </div>
        `;
      }
    };

    // Load storage info
    const loadStorageInfo = async () => {
      if (!storageInfo) return;

      try {
        const info = await App.DB.getStorageInfo();
        storageInfo.innerHTML = `
          <div style="margin-bottom:4px;">Used: ${(info.usage / 1024 / 1024).toFixed(2)} MB</div>
          <div style="margin-bottom:4px;">Quota: ${(info.quota / 1024 / 1024).toFixed(0)} MB</div>
          <div>Available: ${((info.quota - info.usage) / 1024 / 1024).toFixed(2)} MB</div>
        `;
      } catch (err) {
        storageInfo.textContent = 'Unable to retrieve storage information';
      }
    };

    if (loadBackupsBtn) {
      loadBackupsBtn.onclick = () => {
        loadBackups();
        loadStorageInfo();
      };
    }

    if (createBackupBtn) {
      createBackupBtn.onclick = async () => {
        try {
          await App.DB.storeBackup();
          App.UI.Toast.show('Backup created successfully');
          loadBackups();
        } catch (err) {
          App.UI.Toast.show('Failed to create backup: ' + err.message, 'error');
        }
      };
    }

    if (downloadBackupBtn) {
      downloadBackupBtn.onclick = () => {
        const filename = App.DB.exportBackup();
        cfg.lastBackupAt = new Date().toISOString();
        App.DB.save();
        App.UI.Toast.show(`Backup saved as ${filename}`);
      };
    }

    if (restoreBackupFile) {
      restoreBackupFile.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const result = await App.DB.importBackup(file);
        if (result.success) {
          App.UI.Toast.show('Backup restored successfully');
          App.Core.Router.navigate('settings');
        } else {
          App.UI.Toast.show(`Restore failed: ${result.message}`, 'error');
        }
        e.target.value = '';
      };
    }

    if (encryptedBackupBtn) {
      encryptedBackupBtn.onclick = () => {
        const password = document.getElementById('backup-password')?.value;
        if (!password) {
          App.UI.Toast.show('Please enter a password for encryption');
          return;
        }

        const filename = App.DB.exportBackup(password);
        cfg.lastBackupAt = new Date().toISOString();
        App.DB.save();
        App.UI.Toast.show(`Encrypted backup saved as ${filename}`);
      };
    }

    // Initial load if on backups tab
    if (this.activeTab === 'backups') {
      setTimeout(() => {
        loadBackups();
        loadStorageInfo();
      }, 100);
    }
  },

  _wireUpAuditHandlers(root) {
    const exportBtn = document.getElementById('btn-export-audit');
    const clearBtn = document.getElementById('btn-clear-audit');
    const actionFilter = document.getElementById('audit-filter-action');
    const entityFilter = document.getElementById('audit-filter-entity');
    const searchInput = document.getElementById('audit-search');

    // Filter function
    const applyFilters = () => {
      const action = actionFilter?.value || '';
      const entity = entityFilter?.value || '';
      const search = searchInput?.value.toLowerCase() || '';

      document.querySelectorAll('.audit-row').forEach(row => {
        const rowAction = row.getAttribute('data-action');
        const rowEntity = row.getAttribute('data-entity');
        const text = row.textContent.toLowerCase();

        const matchAction = !action || rowAction === action;
        const matchEntity = !entity || rowEntity === entity;
        const matchSearch = !search || text.includes(search);

        row.style.display = matchAction && matchEntity && matchSearch ? '' : 'none';
      });
    };

    if (actionFilter) actionFilter.onchange = applyFilters;
    if (entityFilter) entityFilter.onchange = applyFilters;
    if (searchInput) searchInput.oninput = applyFilters;

    if (exportBtn) {
      exportBtn.onclick = () => {
        if (App.Audit?.downloadCSV) {
          App.Audit.downloadCSV();
          App.UI.Toast.show('Audit log exported');
        } else {
          App.UI.Toast.show('Export not available');
        }
      };
    }

    if (clearBtn) {
      clearBtn.onclick = () => {
        App.UI.Modal.open('Clear Old Audit Entries', `
          <div>
            <p>How old should entries be to be deleted?</p>
            <select id="audit-clear-days" class="input" style="margin-top:8px;">
              <option value="30">Older than 30 days</option>
              <option value="60">Older than 60 days</option>
              <option value="90">Older than 90 days</option>
              <option value="180">Older than 180 days</option>
            </select>
          </div>
        `, [
          { text: 'Cancel', variant: 'ghost', onClick: () => {} },
          {
            text: 'Clear',
            variant: 'primary',
            onClick: () => {
              const days = parseInt(document.getElementById('audit-clear-days').value);
              const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
              const before = (App.Data.auditLog || []).length;

              App.Data.auditLog = (App.Data.auditLog || []).filter(entry => {
                return new Date(entry.timestamp).getTime() > cutoff;
              });

              const removed = before - App.Data.auditLog.length;
              App.DB.save();
              App.UI.Toast.show(`Removed ${removed} entries older than ${days} days`);
              App.Core.Router.navigate('settings');
            }
          }
        ]);
      };
    }
  },

  openUserModal(user) {
    const isEdit = !!user;
    const title = isEdit ? 'Edit User' : 'Add User';

    const body = `
      <div class="grid" style="gap:12px;">
        <div>
          <label class="field-label">Name *</label>
          <input id="user-name" class="input" value="${user?.name || ''}" placeholder="Full name" />
        </div>
        <div class="grid grid-2" style="gap:12px;">
          <div>
            <label class="field-label">PIN *</label>
            <input id="user-pin" class="input" type="password" maxlength="4" value="${user?.pin || ''}" placeholder="4-digit PIN" />
          </div>
          <div>
            <label class="field-label">Role *</label>
            <select id="user-role" class="input">
              <option value="admin" ${user?.role === 'admin' ? 'selected' : ''}>Admin</option>
              <option value="sales" ${user?.role === 'sales' ? 'selected' : ''}>Sales</option>
              <option value="warehouse" ${user?.role === 'warehouse' ? 'selected' : ''}>Warehouse</option>
              <option value="production" ${user?.role === 'production' ? 'selected' : ''}>Production</option>
            </select>
          </div>
        </div>
        <div class="grid grid-2" style="gap:12px;">
          <div>
            <label class="field-label">Preferred Language</label>
            <select id="user-lang" class="input">
              <option value="en" ${user?.preferredLang === 'en' ? 'selected' : ''}>English</option>
              <option value="de" ${user?.preferredLang === 'de' ? 'selected' : ''}>Deutsch</option>
              <option value="ro" ${user?.preferredLang === 'ro' ? 'selected' : ''}>Română</option>
            </select>
          </div>
          <div>
            <label class="field-label">Preferred Theme</label>
            <select id="user-theme" class="input">
              <option value="dark" ${user?.preferredTheme === 'dark' ? 'selected' : ''}>Dark</option>
              <option value="light" ${user?.preferredTheme === 'light' ? 'selected' : ''}>Light</option>
            </select>
          </div>
        </div>
        <div>
          <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
            <input type="checkbox" id="user-active" ${user?.active !== false ? 'checked' : ''} />
            <span>Active</span>
          </label>
        </div>
      </div>
    `;

    App.UI.Modal.open(title, body, [
      { text: 'Cancel', variant: 'ghost', onClick: () => {} },
      {
        text: 'Save',
        variant: 'primary',
        onClick: () => {
          const name = document.getElementById('user-name').value.trim();
          const pin = document.getElementById('user-pin').value.trim();
          const role = document.getElementById('user-role').value;
          const preferredLang = document.getElementById('user-lang').value;
          const preferredTheme = document.getElementById('user-theme').value;
          const active = document.getElementById('user-active').checked;

          if (!name || !pin || pin.length !== 4) {
            App.UI.Toast.show('Name and 4-digit PIN are required');
            return false;
          }

          const users = App.Data.users || [];

          if (isEdit) {
            const idx = users.findIndex(u => u.id === user.id);
            if (idx >= 0) {
              users[idx] = { ...users[idx], name, pin, role, preferredLang, preferredTheme, active };
            }
          } else {
            users.push({
              id: App.Utils.generateId('u'),
              name,
              pin,
              role,
              preferredLang,
              preferredTheme,
              active,
              createdAt: new Date().toISOString()
            });
          }

          App.DB.save();
          App.UI.Toast.show(isEdit ? 'User updated' : 'User created');
          App.Core.Router.navigate('settings');
        }
      }
    ]);
  },

  deleteUser(user) {
    const users = App.Data.users || [];
    const adminCount = users.filter(u => u.role === 'admin' && u.active !== false).length;

    if (user.role === 'admin' && adminCount <= 1) {
      App.UI.Toast.show('Cannot delete the last admin user');
      return;
    }

    App.UI.Modal.open(App.I18n.t('common.deleteUser', 'Delete User'), `
      <p>Are you sure you want to delete <strong>${user.name}</strong>?</p>
      <p style="font-size:12px; color:var(--color-text-muted); margin-top:8px;">This action cannot be undone.</p>
    `, [
      { text: 'Cancel', variant: 'ghost', onClick: () => {} },
      {
        text: 'Delete',
        variant: 'primary',
        onClick: () => {
          App.Data.users = users.filter(u => u.id !== user.id);
          App.DB.save();
          App.UI.Toast.show(App.I18n.t('common.userDeleted', 'User deleted'));
          App.Core.Router.navigate('settings');
        }
      }
    ]);
  }
};