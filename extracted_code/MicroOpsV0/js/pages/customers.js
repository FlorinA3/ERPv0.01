App.UI.Views.Customers = {
  _unsubscribe: null,

  render(root) {
    this.root = root;

    // initial render (may be empty state)
    this.renderTable();

    // subscribe to store updates
    if (this._unsubscribe) this._unsubscribe();
    this._unsubscribe = App.Store.Customers.subscribe(() => this.renderTable());

    // trigger load from server (store handles errors and caching)
    App.Store.Customers.load().catch(() => {});
  },

  getState() {
    return App.Store.Customers.getState();
  },

  renderTable() {
    const root = this.root;
    if (!root) return;

    const state = this.getState();
    const stale = App.Store.Customers.isStale();
    if (stale && !state.loading) {
      App.Store.Customers.load({ force: true }).catch(() => {});
    }
    const t = (key, fallback) => App.I18n.t(`common.${key}`, fallback);
    const esc = App.Utils.escapeHtml;
    const customers = state.items || [];
    const lastUpdated =
      state.lastLoadedAt ? new Date(state.lastLoadedAt).toLocaleTimeString() : App.I18n.t('common.never', 'Never');

    const rows =
      customers.length > 0
        ? customers
            .map((c) => {
              const contact = (c.contacts && c.contacts[0]) || c.name || '-';
              const phone = (c.phones && c.phones[0]) || '-';
              const email = (c.emails && c.emails[0]) || c.email || '-';
              const addr = (c.addresses && c.addresses[0]) || {};
              return `
                <tr>
                  <td><strong>${esc(c.customerNumber) || '-'}</strong></td>
                  <td>${esc(c.company) || '-'}</td>
                  <td>${esc(contact)}</td>
                  <td>${esc(email)}</td>
                  <td>${esc(phone)}</td>
                  <td>${esc(addr.country) || '-'}</td>
                  <td style="text-align:right;">
                    <button class="btn btn-ghost btn-edit-customer" data-id="${c.id}" title="${App.I18n.t('common.edit', 'Edit')}" aria-label="Edit customer">✏️</button>
                    <button class="btn btn-ghost btn-del-customer" data-id="${c.id}" title="${App.I18n.t('common.delete', 'Delete')}" aria-label="Delete customer">🗑️</button>
                  </td>
                </tr>
              `;
            })
            .join('')
        : `<tr><td colspan="7" style="text-align:center;color:var(--color-text-muted);">${App.I18n.t(
            'common.noCustomers',
            'No customers'
          )}</td></tr>`;

    root.innerHTML = `
      <div class="card-soft">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 style="font-size:16px; font-weight:600;">${App.I18n.t('pages.customers.title','Customers')}</h3>
          <div style="display:flex; gap:8px; align-items:center;">
            <input type="text" id="customer-search" class="input" placeholder="${App.I18n.t('common.search','Search...')}" style="width:200px;" />
            <button class="btn btn-ghost" id="btn-import-customers" title="${t('importCSV', 'Import CSV')}">📥 ${t('importCSV', 'Import')}</button>
            <button class="btn btn-primary" id="btn-add-customer">+ ${App.I18n.t('common.add','Add')}</button>
          </div>
        </div>
        <div id="customers-error" class="${state.error ? '' : 'hidden'}" style="color:var(--color-danger); margin-bottom:8px;">${esc(state.error || '')}</div>
        <table class="table">
          <thead>
            <tr>
              <th>${App.I18n.t('common.customerNo', 'Customer No')}</th>
              <th>${App.I18n.t('common.company', 'Company')}</th>
              <th>${App.I18n.t('common.contact', 'Contact')}</th>
              <th>${App.I18n.t('common.email', 'Email')}</th>
              <th>${App.I18n.t('common.phone', 'Phone')}</th>
              <th>${App.I18n.t('common.country', 'Country')}</th>
              <th style="text-align:right;">${App.I18n.t('common.actions', 'Actions')}</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('btn-add-customer')?.addEventListener('click', () => this.openEditModal());
    document.getElementById('btn-import-customers')?.addEventListener('click', () => this.openImportModal());
    document.getElementById('customers-refresh')?.addEventListener('click', () => {
      App.Store.Customers.load({ force: true });
    });

    root.querySelectorAll('.btn-edit-customer').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.openEditModal(btn.getAttribute('data-id'));
      });
    });

    root.querySelectorAll('.btn-del-customer').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.deleteCustomer(btn.getAttribute('data-id'));
      });
    });

    // Search filter (client-side on current list)
    const searchInput = document.getElementById('customer-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const rows = root.querySelectorAll('tbody tr');
        rows.forEach((row) => {
          const text = row.textContent.toLowerCase();
          row.style.display = query === '' || text.includes(query) ? '' : 'none';
        });
      });
    }
  },

  openEditModal(id) {
    const state = this.getState();
    const customers = state.items || [];
    const isNew = !id;
    const c = isNew
      ? { company: '', contacts: [''], phones: [''], emails: [''], addresses: [{ id: App.Utils.generateId('a'), label: 'Main', street: '', number: '', city: '', zip: '', country: '' }] }
      : customers.find((x) => x.id == id) || { company: '', contacts: [], phones: [], emails: [], addresses: [] };

    const contacts = c.contacts && c.contacts.length ? c.contacts : [''];
    const phones = c.phones && c.phones.length ? c.phones : [''];
    const emails = c.emails && c.emails.length ? c.emails : [''];
    const addresses = c.addresses && c.addresses.length ? c.addresses : [{ id: App.Utils.generateId('a'), label: 'Main', street: '', number: '', city: '', zip: '', country: '' }];

    const buildListInputs = (items, type) => {
      return items
        .map(
          (val, idx) => `
        <div class="cust-${type}-row" data-index="${idx}" style="display:flex; align-items:center; margin-bottom:6px; gap:4px;">
          <input class="input cust-${type}-input" style="flex:1;" value="${val || ''}" />
          <button type="button" class="btn btn-ghost cust-${type}-remove" title="Remove" style="padding:2px 6px;">✖</button>
        </div>
      `
        )
        .join('');
    };

    const buildAddressInputs = (items) => {
      return items
        .map(
          (addr, idx) => `
        <div class="cust-address-row" data-index="${idx}" style="border:1px solid var(--color-border); padding:8px; border-radius:8px; margin-bottom:8px;">
          <div class="grid grid-2" style="gap:8px;">
            <div>
              <label class="field-label">Label</label>
              <input class="input cust-address-label" value="${addr.label || ''}" />
            </div>
            <div>
              <label class="field-label">Role</label>
              <select class="input cust-address-role">
                <option value="main" ${addr.role === 'main' ? 'selected' : ''}>Main</option>
                <option value="billing" ${addr.role === 'billing' ? 'selected' : ''}>Billing</option>
                <option value="shipping" ${addr.role === 'shipping' ? 'selected' : ''}>Shipping</option>
              </select>
            </div>
          </div>
          <div style="display:flex; gap:4px; margin-top:4px;">
            <div style="flex:1;">
              <label class="field-label">Street</label>
              <input class="input cust-address-street" value="${addr.street || ''}" />
            </div>
            <div style="width:70px;">
              <label class="field-label">No.</label>
              <input class="input cust-address-number" value="${addr.number || ''}" />
            </div>
          </div>
          <div style="display:flex; gap:4px; margin-top:4px;">
            <div style="flex:1;">
              <label class="field-label">City</label>
              <input class="input cust-address-city" value="${addr.city || ''}" />
            </div>
            <div style="width:80px;">
              <label class="field-label">ZIP</label>
              <input class="input cust-address-zip" value="${addr.zip || ''}" />
            </div>
          </div>
          <label class="field-label" style="margin-top:4px;">Country</label>
          <input class="input cust-address-country" value="${addr.country || ''}" />
          <button type="button" class="btn btn-ghost cust-address-remove" title="Remove address" style="margin-top:6px;">Remove</button>
        </div>
      `
        )
        .join('');
    };

    const segmentOptions = ['', 'Premium', 'Standard', 'Basic', 'Retail', 'Wholesale']
      .map((s) => `<option value="${s}" ${c.segment === s ? 'selected' : ''}>${s || 'Select...'}</option>`)
      .join('');

    const t = (key, fallback) => App.I18n.t(`common.${key}`, fallback);
    const esc = App.Utils.escapeHtml;

    const body = `
      <div>
        ${!isNew && c.customerNumber ? `<p style="margin-bottom:12px; font-size:13px; color:var(--color-text-muted);">${t('customerNo', 'Customer No')}: <strong>${esc(c.customerNumber)}</strong></p>` : ''}

        <div class="grid grid-2" style="gap:12px;">
          <div>
            <label class="field-label" for="cust-company">${t('company', 'Company')}*</label>
            <input id="cust-company" class="input" value="${esc(c.company || '')}" aria-required="true" />
          </div>
          <div>
            <label class="field-label" for="cust-segment">${t('segment', 'Segment')}</label>
            <select id="cust-segment" class="input">${segmentOptions}</select>
          </div>
        </div>

        <div class="grid grid-2" style="gap:12px; margin-top:8px;">
          <div>
            <label class="field-label" for="cust-vat">${t('vatNumber', 'VAT Number')}</label>
            <input id="cust-vat" class="input" value="${esc(c.vatNumber || '')}" placeholder="e.g., DE123456789" />
          </div>
          <div>
            <label class="field-label" for="cust-payment-terms">${t('paymentTerms', 'Payment Terms')}</label>
            <select id="cust-payment-terms" class="input">
              <option value="">Select...</option>
              <option value="Net 7" ${c.paymentTerms === 'Net 7' ? 'selected' : ''}>Net 7</option>
              <option value="Net 15" ${c.paymentTerms === 'Net 15' ? 'selected' : ''}>Net 15</option>
              <option value="Net 30" ${c.paymentTerms === 'Net 30' ? 'selected' : ''}>Net 30</option>
              <option value="Net 45" ${c.paymentTerms === 'Net 45' ? 'selected' : ''}>Net 45</option>
              <option value="Net 60" ${c.paymentTerms === 'Net 60' ? 'selected' : ''}>Net 60</option>
              <option value="COD" ${c.paymentTerms === 'COD' ? 'selected' : ''}>COD</option>
              <option value="Prepaid" ${c.paymentTerms === 'Prepaid' ? 'selected' : ''}>Prepaid</option>
            </select>
          </div>
        </div>

        <div style="margin-top:12px;">
          <label class="field-label">${t('contacts', 'Contacts')}</label>
          <div id="cust-contacts-container">${buildListInputs(contacts, 'contact')}</div>
          <button type="button" class="btn btn-ghost" id="cust-add-contact" style="margin-top:4px;">${t('addContact', '+ Add Contact')}</button>
        </div>

        <div style="margin-top:8px;">
          <label class="field-label">${t('phones', 'Phones')}</label>
          <div id="cust-phones-container">${buildListInputs(phones, 'phone')}</div>
          <button type="button" class="btn btn-ghost" id="cust-add-phone" style="margin-top:4px;">${t('addPhone', '+ Add Phone')}</button>
        </div>

        <div style="margin-top:8px;">
          <label class="field-label">${t('emails', 'Emails')}</label>
          <div id="cust-emails-container">${buildListInputs(emails, 'email')}</div>
          <button type="button" class="btn btn-ghost" id="cust-add-email" style="margin-top:4px;">${t('addEmail', '+ Add Email')}</button>
        </div>

        <div style="margin-top:8px;">
          <label class="field-label">${t('addresses', 'Addresses')}</label>
          <div id="cust-addresses-container">${buildAddressInputs(addresses)}</div>
          <button type="button" class="btn btn-ghost" id="cust-add-address" style="margin-top:4px;">${t('addAddress', '+ Add Address')}</button>
        </div>

        <div style="margin-top:8px;">
          <label class="field-label" for="cust-notes">${t('notes', 'Notes')}</label>
          <textarea id="cust-notes" class="input" rows="2">${esc(c.notes || '')}</textarea>
        </div>
      </div>
    `;

    App.UI.Modal.open(isNew ? t('addCustomer', 'Add Customer') : t('editCustomer', 'Edit Customer'), body, [
      { text: App.I18n.t('common.cancel', 'Cancel'), variant: 'ghost', onClick: () => {} },
      {
        text: App.I18n.t('common.save', 'Save'),
        variant: 'primary',
        onClick: async () => {
          const company = document.getElementById('cust-company').value.trim();
          if (!company) {
            App.UI.Toast.show(t('companyRequired', 'Company name is required'));
            return false;
          }

          const contactVals = Array.from(document.querySelectorAll('#cust-contacts-container .cust-contact-input'))
            .map((i) => i.value.trim())
            .filter((v) => v);

          const phoneVals = Array.from(document.querySelectorAll('#cust-phones-container .cust-phone-input'))
            .map((i) => i.value.trim())
            .filter((v) => v);

          const emailVals = Array.from(document.querySelectorAll('#cust-emails-container .cust-email-input'))
            .map((i) => i.value.trim())
            .filter((v) => v);

          // Validate email format
          const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
          for (const email of emailVals) {
            if (!emailRegex.test(email)) {
              App.UI.Toast.show(`${t('invalidEmailFormat', 'Invalid email format')}: ${email}`);
              return false;
            }
          }

          const addrEls = document.querySelectorAll('#cust-addresses-container .cust-address-row');
          const addrVals = Array.from(addrEls).map((row, idx) => {
            return {
              id: addresses[idx] && addresses[idx].id ? addresses[idx].id : App.Utils.generateId('a'),
              label: row.querySelector('.cust-address-label').value.trim() || 'Main',
              role: row.querySelector('.cust-address-role').value || 'main',
              street: row.querySelector('.cust-address-street').value.trim(),
              number: row.querySelector('.cust-address-number').value.trim(),
              city: row.querySelector('.cust-address-city').value.trim(),
              zip: row.querySelector('.cust-address-zip').value.trim(),
              country: row.querySelector('.cust-address-country').value.trim(),
            };
          });

          const payload = {
            id: isNew ? App.Utils.generateId('c') : c.id,
            rowVersion: isNew ? 1 : c.rowVersion || c.row_version || 1,
            customerNumber: isNew
              ? App.Services.NumberSequence?.nextCustomerNumber?.() || null
              : c.customerNumber,
            company,
            segment: document.getElementById('cust-segment').value || null,
            vatNumber: document.getElementById('cust-vat').value.trim() || null,
            paymentTerms: document.getElementById('cust-payment-terms').value || null,
            contacts: contactVals,
            phones: phoneVals,
            emails: emailVals,
            addresses: addrVals,
            notes: document.getElementById('cust-notes').value.trim() || null,
            name: contactVals[0] || '',
            email: emailVals[0] || '',
          };

          const validation = App.Validate?.customer
            ? App.Validate.customer(payload)
            : { isValid: true, errors: {} };
          const summary = App.UI.Validation.showErrors(document, validation.errors);
          if (!validation.isValid) {
            App.UI.Toast.show(summary || t('fixValidation', 'Please fix validation errors'), 'error');
            return false;
          }

          try {
            if (isNew) {
              await App.Store.Customers.create(payload);
            } else {
              await App.Store.Customers.update(c.id, payload);
            }
            App.UI.Toast.show(App.I18n.t('common.customerSaved', 'Customer saved'));
            App.Core.Router.navigate('customers');
          } catch (err) {
            if (err.status === 409 || err.code === 'CONFLICT' || err.code === 'CONCURRENT_UPDATE') {
              App.UI.Toast.show(App.I18n.t('common.conflictReload', 'This record was changed elsewhere. Reloading latest data.'), 'warning');
              await App.Store.Customers.load({ force: true });
              this.renderTable();
              return false;
            }
            App.UI.Toast.show(App.I18n.t('common.saveFailed', 'Save failed') + ': ' + (err.message || err), 'error');
            return false;
          }
        },
      },
    ]);

    setTimeout(() => {
      this.wireListHandlers('contact', 'cust-contacts-container', 'cust-add-contact');
      this.wireListHandlers('phone', 'cust-phones-container', 'cust-add-phone');
      this.wireListHandlers('email', 'cust-emails-container', 'cust-add-email');

      document.getElementById('cust-add-address')?.addEventListener('click', () => {
        const container = document.getElementById('cust-addresses-container');
        const div = document.createElement('div');
        div.className = 'cust-address-row';
        div.style.cssText = 'border:1px solid var(--color-border); padding:8px; border-radius:8px; margin-bottom:8px;';
        div.innerHTML = `
          <div class="grid grid-2" style="gap:8px;">
            <div>
              <label class="field-label">Label</label>
              <input class="input cust-address-label" value="" />
            </div>
            <div>
              <label class="field-label">Role</label>
              <select class="input cust-address-role">
                <option value="main">Main</option>
                <option value="billing">Billing</option>
                <option value="shipping">Shipping</option>
              </select>
            </div>
          </div>
          <div style="display:flex; gap:4px; margin-top:4px;">
            <div style="flex:1;">
              <label class="field-label">Street</label>
              <input class="input cust-address-street" value="" />
            </div>
            <div style="width:70px;">
              <label class="field-label">No.</label>
              <input class="input cust-address-number" value="" />
            </div>
          </div>
          <div style="display:flex; gap:4px; margin-top:4px;">
            <div style="flex:1;">
              <label class="field-label">City</label>
              <input class="input cust-address-city" value="" />
            </div>
            <div style="width:80px;">
              <label class="field-label">ZIP</label>
              <input class="input cust-address-zip" value="" />
            </div>
          </div>
          <label class="field-label" style="margin-top:4px;">Country</label>
          <input class="input cust-address-country" value="" />
          <button type="button" class="btn btn-ghost cust-address-remove" title="Remove address" style="margin-top:6px;">Remove</button>
        `;
        container.appendChild(div);
        div.querySelector('.cust-address-remove').addEventListener('click', () => div.remove());
      });

      document.querySelectorAll('#cust-addresses-container .cust-address-remove').forEach((btn) => {
        btn.addEventListener('click', () => btn.closest('.cust-address-row').remove());
      });
    }, 0);
  },

  wireListHandlers(type, containerId, addBtnId) {
    const container = document.getElementById(containerId);
    const addBtn = document.getElementById(addBtnId);

    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const row = document.createElement('div');
        row.className = `cust-${type}-row`;
        row.style.cssText = 'display:flex; align-items:center; margin-bottom:6px; gap:4px;';
        row.innerHTML = `
          <input class="input cust-${type}-input" style="flex:1;" value="" />
          <button type="button" class="btn btn-ghost cust-${type}-remove" style="padding:2px 6px;">✖</button>
        `;
        container.appendChild(row);
        row.querySelector(`.cust-${type}-remove`).addEventListener('click', () => row.remove());
      });
    }

    container?.querySelectorAll(`.cust-${type}-remove`).forEach((btn) => {
      btn.addEventListener('click', () => btn.parentElement.remove());
    });
  },

  async deleteCustomer(id) {
    const t = (key, fallback) => App.I18n.t(`common.${key}`, fallback);
    const esc = App.Utils.escapeHtml;

    const state = this.getState();
    const customers = state.items || [];
    const customer = customers.find((c) => c.id == id);
    if (!customer) return;

    App.UI.Modal.open(
      t('deleteCustomer', 'Delete Customer'),
      `
      <p>${t('confirmDeleteCustomer', 'Are you sure you want to delete')} <strong>${esc(customer.company)}</strong>?</p>
      ${customer.customerNumber ? `<p style="font-size:12px; color:var(--color-text-muted);">${t('customerNo', 'Customer No')}: ${esc(customer.customerNumber)}</p>` : ''}
    `,
      [
        { text: App.I18n.t('common.cancel', 'Cancel'), variant: 'ghost', onClick: () => {} },
        {
          text: App.I18n.t('common.delete', 'Delete'),
          variant: 'primary',
          onClick: async () => {
            try {
              await App.Store.Customers.remove(id);
              App.UI.Toast.show(App.I18n.t('common.customerDeleted', 'Customer deleted'));
            } catch (err) {
              App.UI.Toast.show(App.I18n.t('common.deleteFailed', 'Delete failed') + ': ' + (err.message || err), 'error');
            }
          },
        },
      ]
    );
  },

  openImportModal() {
    const t = (key, fallback) => App.I18n.t(`common.${key}`, fallback);
    const esc = App.Utils.escapeHtml;

    const body = `
      <div>
        <p style="font-size:13px; color:var(--color-text-muted); margin-bottom:12px;">
          ${t('csvFormatHelp', 'CSV format: First row = column headers')}
        </p>
        <div style="margin-bottom:12px;">
          <strong>${t('requiredFields', 'Required fields')}:</strong> company<br>
          <strong>${t('optionalFields', 'Optional fields')}:</strong> contact, email, phone, street, city, zip, country, segment, vatNumber, paymentTerms, notes
        </div>
        <div style="margin-bottom:12px;">
          <button class="btn btn-ghost" id="btn-download-customer-template">
            📄 ${t('downloadTemplate', 'Download template')}
          </button>
        </div>
        <div style="border:2px dashed var(--color-border); border-radius:8px; padding:20px; text-align:center;">
          <input type="file" id="customer-csv-input" accept=".csv,.txt" style="display:none;" />
          <button class="btn btn-primary" id="btn-select-csv">
            📁 ${t('selectCSVFile', 'Select CSV file')}
          </button>
          <p id="csv-filename" style="margin-top:8px; font-size:12px; color:var(--color-text-muted);"></p>
        </div>
        <div id="import-preview" style="margin-top:12px; display:none;">
          <h4 style="font-size:14px; margin-bottom:8px;">${t('importPreview', 'Import Preview')}</h4>
          <div id="preview-content" style="max-height:200px; overflow-y:auto; border:1px solid var(--color-border); border-radius:8px; padding:8px; font-size:12px;"></div>
          <p id="preview-count" style="margin-top:8px; font-size:13px; font-weight:600;"></p>
        </div>
      </div>
    `;

    let parsedData = null;

    App.UI.Modal.open(t('importCSV', 'Import CSV') + ' - ' + App.I18n.t('pages.customers.title', 'Customers'), body, [
      { text: App.I18n.t('common.cancel', 'Cancel'), variant: 'ghost', onClick: () => {} },
      {
        text: t('importCSV', 'Import'),
        variant: 'primary',
        onClick: async () => {
          if (!parsedData || parsedData.length === 0) {
            App.UI.Toast.show(t('noFileSelected', 'No file selected'));
            return false;
          }

          let imported = 0;
          let skipped = 0;

          for (const row of parsedData) {
            const exists = (App.Data.customers || []).find(
              (c) => c.company && row.company && c.company.toLowerCase().trim() === row.company.toLowerCase().trim()
            );

            if (exists) {
              skipped++;
              continue;
            }

            const newCustomer = {
              id: App.Utils.generateId('c'),
              customerNumber: App.Services.NumberSequence?.nextCustomerNumber?.(),
              company: row.company || '',
              segment: row.segment || null,
              vatNumber: row.vatNumber || row.vat || null,
              paymentTerms: row.paymentTerms || null,
              contacts: row.contact ? [row.contact] : [],
              phones: row.phone ? [row.phone] : [],
              emails: row.email ? [row.email] : [],
              addresses: [
                {
                  id: App.Utils.generateId('a'),
                  label: 'Main',
                  role: 'main',
                  street: row.street || '',
                  number: row.number || '',
                  city: row.city || '',
                  zip: row.zip || row.postalCode || '',
                  country: row.country || '',
                },
              ],
              notes: row.notes || null,
              name: row.contact || '',
              email: row.email || '',
            };

            try {
              await App.Store.Customers.create(newCustomer);
              imported++;
            } catch (err) {
              console.error('Import customer failed', err);
            }
          }

          let message = `${t('importSuccess', 'Import successful')}: ${imported} ${t('rowsImported', 'rows imported')}`;
          if (skipped > 0) {
            message += `, ${skipped} ${t('duplicatesSkipped', 'duplicates skipped')}`;
          }
          App.UI.Toast.show(message);
          App.Core.Router.navigate('customers');
        },
      },
    ]);

    // Wire up file selection
    setTimeout(() => {
      const fileInput = document.getElementById('customer-csv-input');
      const selectBtn = document.getElementById('btn-select-csv');
      const filenameEl = document.getElementById('csv-filename');
      const previewEl = document.getElementById('import-preview');
      const previewContent = document.getElementById('preview-content');
      const previewCount = document.getElementById('preview-count');
      const templateBtn = document.getElementById('btn-download-customer-template');

      // Download template
      templateBtn?.addEventListener('click', () => {
        const headers = [
          'company',
          'contact',
          'email',
          'phone',
          'street',
          'city',
          'zip',
          'country',
          'segment',
          'vatNumber',
          'paymentTerms',
          'notes',
        ];
        const sampleRow = [
          'Example Company GmbH',
          'John Doe',
          'john@example.com',
          '+49 123 456789',
          'Main Street',
          'Berlin',
          '10115',
          'Germany',
          'Standard',
          'DE123456789',
          'Net 30',
          'Sample customer',
        ];
        App.Utils.exportCSV(headers, [sampleRow], 'customers_template.csv');
      });

      selectBtn?.addEventListener('click', () => fileInput?.click());

      fileInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        filenameEl.textContent = file.name;

        const reader = new FileReader();
        reader.onload = (evt) => {
          const content = evt.target.result;
          const result = App.Utils.parseCSV(content);

          if (result.error) {
            App.UI.Toast.show(t('invalidCSV', 'Invalid CSV file') + ': ' + result.error);
            return;
          }

          // Map CSV fields to customer fields
          const fieldMappings = {
            company: ['company', 'firma', 'firmenname', 'name', 'kunde'],
            contact: ['contact', 'kontakt', 'ansprechpartner', 'person'],
            email: ['email', 'e-mail', 'mail'],
            phone: ['phone', 'telefon', 'tel', 'telephone'],
            street: ['street', 'strasse', 'straße', 'address', 'adresse'],
            city: ['city', 'stadt', 'ort'],
            zip: ['zip', 'plz', 'postalcode', 'postal'],
            country: ['country', 'land'],
            segment: ['segment', 'kategorie', 'category'],
            vatNumber: ['vatnumber', 'vat', 'ust', 'ustid', 'uidnummer'],
            paymentTerms: ['paymentterms', 'zahlungsbedingungen', 'payment'],
            notes: ['notes', 'notizen', 'bemerkungen', 'comment'],
          };

          const mapping = App.Utils.mapCSVFields(result.headers, fieldMappings);

          // Check for required field
          const hasCompany = Object.values(mapping).includes('company');
          if (!hasCompany) {
            App.UI.Toast.show(t('mappingError', 'Required fields not found') + ': company');
            return;
          }

          // Transform data using mapping
          parsedData = result.data
            .map((row) => {
              const mapped = {};
              Object.entries(row).forEach(([key, value]) => {
                const field = mapping[key] || key.toLowerCase();
                mapped[field] = value;
              });
              return mapped;
            })
            .filter((row) => row.company);

          // Show preview
          if (parsedData.length > 0) {
            previewEl.style.display = 'block';
            const previewRows = parsedData
              .slice(0, 5)
              .map(
                (row) =>
                  `<div style="padding:4px 0; border-bottom:1px solid var(--color-border);">
                <strong>${esc(row.company || '')}</strong>
                ${row.contact ? ` - ${esc(row.contact)}` : ''}
                ${row.email ? ` (${esc(row.email)})` : ''}
              </div>`
              )
              .join('');
            previewContent.innerHTML = previewRows;
            previewCount.textContent = `${parsedData.length} ${t('foundRows', 'rows found')}`;
          }
        };
        reader.readAsText(file);
      });
    }, 50);
  },
};
