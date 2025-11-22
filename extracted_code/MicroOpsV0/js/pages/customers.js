App.UI.Views.Customers = {
  render(root) {
    const t = (key, fallback) => App.I18n.t(`common.${key}`, fallback);
    const esc = App.Utils.escapeHtml;
    const customers = App.Data.customers || App.Data.Customers || [];

    root.innerHTML = `
      <div class="card-soft">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 style="font-size:16px; font-weight:600;">${App.I18n.t('pages.customers.title','Customers')}</h3>
          <div style="display:flex; gap:8px; align-items:center;">
            <input type="text" id="customer-search" class="input" placeholder="${App.I18n.t('common.search','Search...')}" style="width:200px;" />
            <button class="btn btn-primary" id="btn-add-customer">+ ${App.I18n.t('common.add','Add')}</button>
          </div>
        </div>
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
            ${customers.length > 0 ? customers.map(c => {
              const addr = (c.addresses && c.addresses[0]) || {};
              const contact = (c.contacts && c.contacts[0]) || c.name || '-';
              const phone = (c.phones && c.phones[0]) || '-';
              const email = (c.emails && c.emails[0]) || c.email || '-';
              const esc = App.Utils.escapeHtml;
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
            }).join('') : `<tr><td colspan="7" style="text-align:center;color:var(--color-text-muted);">${App.I18n.t('common.noCustomers', 'No customers')}</td></tr>`}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('btn-add-customer')?.addEventListener('click', () => this.openEditModal());

    root.querySelectorAll('.btn-edit-customer').forEach(btn => {
      btn.addEventListener('click', () => {
        this.openEditModal(btn.getAttribute('data-id'));
      });
    });

    root.querySelectorAll('.btn-del-customer').forEach(btn => {
      btn.addEventListener('click', () => {
        this.deleteCustomer(btn.getAttribute('data-id'));
      });
    });

    // Search functionality
    const searchInput = document.getElementById('customer-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const rows = root.querySelectorAll('tbody tr');
        rows.forEach(row => {
          const text = row.textContent.toLowerCase();
          row.style.display = query === '' || text.includes(query) ? '' : 'none';
        });
      });
    }
  },

  openEditModal(id) {
    const customers = App.Data.customers || App.Data.Customers || [];
    const isNew = !id;
    const c = isNew
      ? { company: '', contacts: [''], phones: [''], emails: [''], addresses: [{ id: App.Utils.generateId('a'), label: 'Main', street: '', number: '', city: '', zip: '', country: '' }] }
      : (customers.find(x => x.id === id) || { company: '', contacts: [], phones: [], emails: [], addresses: [] });

    const contacts = c.contacts && c.contacts.length ? c.contacts : [''];
    const phones = c.phones && c.phones.length ? c.phones : [''];
    const emails = c.emails && c.emails.length ? c.emails : [''];
    const addresses = c.addresses && c.addresses.length ? c.addresses : [{ id: App.Utils.generateId('a'), label: 'Main', street: '', number: '', city: '', zip: '', country: '' }];

    const buildListInputs = (items, type) => {
      return items.map((val, idx) => `
        <div class="cust-${type}-row" data-index="${idx}" style="display:flex; align-items:center; margin-bottom:6px; gap:4px;">
          <input class="input cust-${type}-input" style="flex:1;" value="${val || ''}" />
          <button type="button" class="btn btn-ghost cust-${type}-remove" title="Remove" style="padding:2px 6px;">✖️</button>
        </div>
      `).join('');
    };

    const buildAddressInputs = (items) => {
      return items.map((addr, idx) => `
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
      `).join('');
    };

    const segmentOptions = ['', 'Premium', 'Standard', 'Basic', 'Retail', 'Wholesale'].map(s =>
      `<option value="${s}" ${c.segment === s ? 'selected' : ''}>${s || 'Select...'}</option>`
    ).join('');

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
        onClick: () => {
          const company = document.getElementById('cust-company').value.trim();
          if (!company) {
            App.UI.Toast.show(t('companyRequired', 'Company name is required'));
            return false;
          }

          const contactVals = Array.from(document.querySelectorAll('#cust-contacts-container .cust-contact-input'))
            .map(i => i.value.trim())
            .filter(v => v);

          const phoneVals = Array.from(document.querySelectorAll('#cust-phones-container .cust-phone-input'))
            .map(i => i.value.trim())
            .filter(v => v);

          const emailVals = Array.from(document.querySelectorAll('#cust-emails-container .cust-email-input'))
            .map(i => i.value.trim())
            .filter(v => v);

          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
              country: row.querySelector('.cust-address-country').value.trim()
            };
          });

          const n = {
            id: isNew ? App.Utils.generateId('c') : c.id,
            customerNumber: isNew ? App.Services.NumberSequence.nextCustomerNumber() : c.customerNumber,
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
            createdAt: isNew ? new Date().toISOString() : c.createdAt,
            updatedAt: new Date().toISOString()
          };

          const list = App.Data.customers || App.Data.Customers || [];
          if (isNew) {
            list.push(n);
          } else {
            const idx = list.findIndex(x => x.id === n.id);
            if (idx >= 0) list[idx] = { ...list[idx], ...n };
          }

          App.DB.save();
          App.UI.Toast.show(App.I18n.t('common.customerSaved', 'Customer saved'));
          App.Core.Router.navigate('customers');
        }
      }
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

      document.querySelectorAll('#cust-addresses-container .cust-address-remove').forEach(btn => {
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
          <button type="button" class="btn btn-ghost cust-${type}-remove" style="padding:2px 6px;">✖️</button>
        `;
        container.appendChild(row);
        row.querySelector(`.cust-${type}-remove`).addEventListener('click', () => row.remove());
      });
    }

    container?.querySelectorAll(`.cust-${type}-remove`).forEach(btn => {
      btn.addEventListener('click', () => btn.parentElement.remove());
    });
  },

  deleteCustomer(id) {
    const t = (key, fallback) => App.I18n.t(`common.${key}`, fallback);
    const esc = App.Utils.escapeHtml;

    const customers = App.Data.customers || App.Data.Customers || [];
    const customer = customers.find(c => c.id === id);
    if (!customer) return;

    // Check for linked orders
    const orders = App.Data.orders || [];
    const linkedOrders = orders.filter(o => o.custId === id);

    // Check for linked documents
    const documents = App.Data.documents || [];
    const linkedDocs = documents.filter(d => d.customerId === id);

    if (linkedOrders.length > 0 || linkedDocs.length > 0) {
      App.UI.Modal.open(t('cannotDeleteCustomer', 'Cannot Delete Customer'), `
        <div style="color:var(--color-danger);">
          <p>${t('linkedRecordsWarning', 'This customer has linked records:')}</p>
          <ul style="margin:8px 0; padding-left:20px; font-size:12px;">
            ${linkedOrders.length > 0 ? `<li>${linkedOrders.length} ${t('ordersCount', 'order(s)')}</li>` : ''}
            ${linkedDocs.length > 0 ? `<li>${linkedDocs.length} ${t('documentsCount', 'document(s)')}</li>` : ''}
          </ul>
          <p style="font-size:12px; margin-top:8px;">${t('deleteRecordsFirst', 'Delete these records first.')}</p>
        </div>
      `, [{ text: App.I18n.t('common.cancel', 'Close'), variant: 'ghost', onClick: () => {} }]);
      return;
    }

    App.UI.Modal.open(t('deleteCustomer', 'Delete Customer'), `
      <p>${t('confirmDeleteCustomer', 'Are you sure you want to delete')} <strong>${esc(customer.company)}</strong>?</p>
      ${customer.customerNumber ? `<p style="font-size:12px; color:var(--color-text-muted);">${t('customerNo', 'Customer No')}: ${esc(customer.customerNumber)}</p>` : ''}
    `, [
      { text: App.I18n.t('common.cancel', 'Cancel'), variant: 'ghost', onClick: () => {} },
      {
        text: App.I18n.t('common.delete', 'Delete'),
        variant: 'primary',
        onClick: () => {
          const idx = customers.findIndex(c => c.id === id);
          if (idx >= 0) {
            customers.splice(idx, 1);
            App.DB.save();

            // Log activity
            if (App.Services.ActivityLog) {
              App.Services.ActivityLog.log('delete', 'customer', id, {
                name: customer.company,
                customerNumber: customer.customerNumber
              });
            }

            App.UI.Toast.show(App.I18n.t('common.customerDeleted', 'Customer deleted'));
            App.Core.Router.navigate('customers');
          }
        }
      }
    ]);
  }
};
