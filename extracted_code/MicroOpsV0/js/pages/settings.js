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
        <div style="display:flex; gap:8px; border-bottom:1px solid var(--color-border); padding-bottom:12px; margin-bottom:16px;">
          <button class="btn ${this.activeTab === 'company' ? 'btn-primary' : 'btn-ghost'}" data-tab="company">${t('tabCompany', 'Company')}</button>
          <button class="btn ${this.activeTab === 'users' ? 'btn-primary' : 'btn-ghost'}" data-tab="users">${t('tabUsers', 'Users')}</button>
          <button class="btn ${this.activeTab === 'system' ? 'btn-primary' : 'btn-ghost'}" data-tab="system">${t('tabSystem', 'System')}</button>
          <button class="btn ${this.activeTab === 'communication' ? 'btn-primary' : 'btn-ghost'}" data-tab="communication">${t('tabCommunication', 'Communication')}</button>
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

          <h4 style="font-size:14px; font-weight:600; margin:16px 0 12px;">Data Maintenance</h4>
          <div style="display:flex; gap:8px;">
            <button class="btn btn-ghost" id="btn-cleanup-log">Clean Old Logs</button>
          </div>
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
        App.Data.config = cfg;
        App.DB.save();
        App.UI.Toast.show(App.I18n.t('common.settingsSaved', 'System settings saved'));
      };
    }

    // Log cleanup
    const cleanupBtn = document.getElementById('btn-cleanup-log');
    if (cleanupBtn) {
      cleanupBtn.onclick = () => {
        const removed = App.Services.ActivityLog?.cleanup(30) || 0;
        App.UI.Toast.show(`Cleaned up ${removed} old log entries`);
        this.render(root);
      };
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