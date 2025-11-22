App.UI.Views.Customers = {
  render(root) {
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
              <th>Customer No</th>
              <th>Company</th>
              <th>Contact</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Country</th>
              <th style="text-align:right;">${App.I18n.t('common.actions','Actions')}</th>
            </tr>
          </thead>
          <tbody>
            ${customers.length > 0 ? customers.map(c => {
              const addr = (c.addresses && c.addresses[0]) || {};
              const contact = (c.contacts && c.contacts[0]) || c.name || '-';
              const phone = (c.phones && c.phones[0]) || '-';
              const email = (c.emails && c.emails[0]) || c.email || '-';
              return `
                <tr>
                  <td><strong>${c.customerNumber || '-'}</strong></td>
                  <td>${c.company || '-'}</td>
                  <td>${contact}</td>
                  <td>${email}</td>
                  <td>${phone}</td>
                  <td>${addr.country || '-'}</td>
                  <td style="text-align:right;">
                    <button class="btn btn-ghost btn-edit-customer" data-id="${c.id}" title="Edit" aria-label="Edit customer">✏️</button>
                    <button class="btn btn-ghost btn-del-customer" data-id="${c.id}" title="Delete" aria-label="Delete customer">🗑️</button>
                  </td>
                </tr>
              `;
            }).join('') : '<tr><td colspan="7" style="text-align:center;color:var(--color-text-muted);">No customers</td></tr>'}
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

    const body = `
      <div>
        ${!isNew && c.customerNumber ? `<p style="margin-bottom:12px; font-size:13px; color:var(--color-text-muted);">Customer No: <strong>${c.customerNumber}</strong></p>` : ''}

        <div class="grid grid-2" style="gap:12px;">
          <div>
            <label class="field-label">Company*</label>
            <input id="cust-company" class="input" value="${c.company || ''}" />
          </div>
          <div>
            <label class="field-label">Segment</label>
            <select id="cust-segment" class="input">${segmentOptions}</select>
          </div>
        </div>

        <div class="grid grid-2" style="gap:12px; margin-top:8px;">
          <div>
            <label class="field-label">VAT Number</label>
            <input id="cust-vat" class="input" value="${c.vatNumber || ''}" placeholder="e.g., DE123456789" />
          </div>
          <div>
            <label class="field-label">Payment Terms</label>
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
          <label class="field-label">Contacts</label>
          <div id="cust-contacts-container">${buildListInputs(contacts, 'contact')}</div>
          <button type="button" class="btn btn-ghost" id="cust-add-contact" style="margin-top:4px;">+ Add Contact</button>
        </div>

        <div style="margin-top:8px;">
          <label class="field-label">Phones</label>
          <div id="cust-phones-container">${buildListInputs(phones, 'phone')}</div>
          <button type="button" class="btn btn-ghost" id="cust-add-phone" style="margin-top:4px;">+ Add Phone</button>
        </div>

        <div style="margin-top:8px;">
          <label class="field-label">Emails</label>
          <div id="cust-emails-container">${buildListInputs(emails, 'email')}</div>
          <button type="button" class="btn btn-ghost" id="cust-add-email" style="margin-top:4px;">+ Add Email</button>
        </div>

        <div style="margin-top:8px;">
          <label class="field-label">Addresses</label>
          <div id="cust-addresses-container">${buildAddressInputs(addresses)}</div>
          <button type="button" class="btn btn-ghost" id="cust-add-address" style="margin-top:4px;">+ Add Address</button>
        </div>

        <div style="margin-top:8px;">
          <label class="field-label">Notes</label>
          <textarea id="cust-notes" class="input" rows="2">${c.notes || ''}</textarea>
        </div>
      </div>
    `;

    App.UI.Modal.open(isNew ? 'Add Customer' : 'Edit Customer', body, [
      { text: 'Cancel', variant: 'ghost', onClick: () => {} },
      {
        text: 'Save',
        variant: 'primary',
        onClick: () => {
          const company = document.getElementById('cust-company').value.trim();
          if (!company) {
            App.UI.Toast.show('Company name is required');
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
              App.UI.Toast.show(`Invalid email format: ${email}`);
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
          App.UI.Toast.show('Customer saved');
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
    const customers = App.Data.customers || App.Data.Customers || [];
    const customer = customers.find(c => c.id === id);
    if (!customer) return;

    const orders = App.Data.orders || [];
    const linkedOrders = orders.filter(o => o.custId === id);
    if (linkedOrders.length > 0) {
      App.UI.Toast.show(`Cannot delete: ${linkedOrders.length} orders linked to this customer`);
      return;
    }

    App.UI.Modal.open('Delete Customer', `
      <p>Are you sure you want to delete <strong>${customer.company}</strong>?</p>
      ${customer.customerNumber ? `<p style="font-size:12px; color:var(--color-text-muted);">Customer No: ${customer.customerNumber}</p>` : ''}
    `, [
      { text: 'Cancel', variant: 'ghost', onClick: () => {} },
      {
        text: 'Delete',
        variant: 'primary',
        onClick: () => {
          const idx = customers.findIndex(c => c.id === id);
          if (idx >= 0) {
            customers.splice(idx, 1);
            App.DB.save();
            App.UI.Toast.show('Customer deleted');
            App.Core.Router.navigate('customers');
          }
        }
      }
    ]);
  }
};
