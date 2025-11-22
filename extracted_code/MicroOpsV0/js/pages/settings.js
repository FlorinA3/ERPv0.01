App.UI.Views.Settings = {
  render(root) {
    const cfg = App.Data.config || App.Data.Config || {};
    const users = App.Data.users || App.Data.Users || [];

    root.innerHTML = `
      <div class="grid grid-2">
        <!-- User Management Section -->
        <div class="card-soft">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <h3 style="font-size:16px; font-weight:600;">${App.I18n.t('settings.userSection', 'User Management')}</h3>
            <button class="btn btn-primary" id="btn-add-user">+ Add User</button>
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
                  <button class="btn btn-ghost btn-edit-user" data-id="${u.id}" title="Edit">✏️</button>
                  <button class="btn btn-ghost btn-delete-user" data-id="${u.id}" title="Delete">🗑️</button>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Backup/Restore Section -->
          <div style="margin-top:20px; padding-top:16px; border-top:1px solid var(--color-border);">
            <h4 style="font-size:14px; font-weight:600; margin-bottom:8px;">Database Backup</h4>
            <div style="display:flex; gap:8px;">
              <button class="btn btn-ghost" id="btn-backup">📥 Download Backup</button>
              <label class="btn btn-ghost" style="cursor:pointer;">
                📤 Restore Backup
                <input type="file" id="restore-file" accept=".json" style="display:none;" />
              </label>
            </div>
          </div>
        </div>
        
        <div class="card-soft">
          <h3 style="font-size:16px; font-weight:600; margin-bottom:8px;">${App.I18n.t('settings.companySection', 'Company Configuration')}</h3>
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
                <label class="field-label">${App.I18n.t('settings.lang', 'Language')}</label>
                <input id="set-lang" class="input" value="${cfg.lang || 'en'}" disabled />
              </div>
            </div>
          </div>
          <button class="btn btn-primary mt-16" id="btn-save-config">${App.I18n.t('settings.save', 'Save Settings')}</button>
        </div>
      </div>
    `;
    
    document.getElementById('btn-save-config').onclick = () => {
      cfg.companyName = document.getElementById('set-company').value.trim();
      cfg.street = document.getElementById('set-address').value.trim();
      cfg.phone = document.getElementById('set-phone').value.trim();
      cfg.email = document.getElementById('set-email').value.trim();
      cfg.vatNumber = document.getElementById('set-vat').value.trim();
      cfg.commercialRegisterNumber = document.getElementById('set-reg').value.trim();
      cfg.bankName = document.getElementById('set-bank').value.trim();
      cfg.iban = document.getElementById('set-iban').value.trim();
      cfg.bic = document.getElementById('set-bic').value.trim();
      cfg.defaultPaymentTerms = document.getElementById('set-payterms').value.trim();
      cfg.defaultDeliveryTerms = document.getElementById('set-delterms').value.trim();
      cfg.defaultVatRate = parseFloat(document.getElementById('set-vatrate').value);
      cfg.currency = document.getElementById('set-currency').value.trim() || 'EUR';

      App.Data.config = cfg;
      App.Data.Config = cfg;
      App.DB.save();
      App.UI.Toast.show(App.I18n.t('settings.saved', 'Settings saved'));
      App.UI.Navbar.render();
    };

    // User Management Event Handlers
    document.getElementById('btn-add-user').onclick = () => this.openUserModal();

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
    document.getElementById('btn-backup').onclick = () => {
      const filename = App.DB.exportBackup();
      App.UI.Toast.show(`Backup saved as ${filename}`);
    };

    document.getElementById('restore-file').onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const result = await App.DB.importBackup(file);
      if (result.success) {
        App.UI.Toast.show(result.message);
        App.Core.Router.navigate('settings');
      } else {
        App.UI.Toast.show(result.message);
      }
      e.target.value = '';
    };
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

    App.UI.Modal.open('Delete User', `
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
          App.UI.Toast.show('User deleted');
          App.Core.Router.navigate('settings');
        }
      }
    ]);
  }
};