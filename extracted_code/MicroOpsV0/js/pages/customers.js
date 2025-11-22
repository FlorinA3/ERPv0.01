App.UI.Views.Customers = {
  render(root) {
    const customers = App.Data.Customers || [];
    const cards = customers.map(c => {
      const addr = (c.addresses && c.addresses[0]) || {};
      const contact = (c.contacts && c.contacts[0]) || c.name || '-';
      const phone = (c.phones && c.phones[0]) || '';
      return `
        <div class="customer-card">
          <div class="customer-avatar">${(c.company || 'C').charAt(0).toUpperCase()}</div>
          <div class="customer-info">
            <div class="customer-name">${c.company || '-'}</div>
            <div class="customer-contact">${contact || ''}</div>
            <div class="customer-meta">${addr.country || ''} ${phone ? ' \u260E ' + phone : ''}</div>
          </div>
          <div class="customer-actions">
            <button class="btn btn-ghost btn-edit-customer" data-id="${c.id}">✏️</button>
            <button class="btn btn-ghost btn-del-customer" data-id="${c.id}">🗑️</button>
          </div>
        </div>
      `;
    }).join('');

    root.innerHTML = `
      <div class="card-soft">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 style="font-size:16px; font-weight:600;">Customers</h3>
          <button class="btn btn-primary" id="btn-add-customer">+ Add New</button>
        </div>
        <div class="customer-list" style="display:flex; flex-direction:column; gap:12px;">
          ${cards || `<div style="padding:16px; text-align:center; color:var(--color-text-muted);">No customers</div>`}
        </div>
      </div>
    `;

    document.getElementById('btn-add-customer').onclick = () => this.openEditModal();

    root.querySelectorAll('.btn-edit-customer').forEach(btn => {
      btn.addEventListener('click', () => {
        this.openEditModal(btn.getAttribute('data-id'));
      });
    });
    root.querySelectorAll('.btn-del-customer').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.deleteCustomer(id);
      });
    });
  },

  openEditModal(id) {
    const isNew = !id;
    const c = isNew
      ? { company: '', contacts: [''], phones: [''], emails: [''], addresses: [ { id: App.Utils.generateId('a'), label: 'Main', street: '', number: '', city: '', zip: '', country: '' } ] }
      : (App.Data.Customers.find(x => x.id === id) || { company: '', contacts: [], phones: [], emails: [], addresses: [] });

    
    const contacts = c.contacts && c.contacts.length ? c.contacts : [''];
    const phones = c.phones && c.phones.length ? c.phones : [''];
    const emails = c.emails && c.emails.length ? c.emails : [''];
    const addresses = c.addresses && c.addresses.length ? c.addresses : [ { id: App.Utils.generateId('a'), label: 'Main', street: '', number: '', city: '', zip: '', country: '' } ];

    
    const buildListInputs = (items, type) => {
      return items.map((val, idx) => `
        <div class="cust-${type}-row" data-index="${idx}" style="display:flex; align-items:center; margin-bottom:6px; gap:4px;">
          <input class="input cust-${type}-input" style="flex:1;" value="${val || ''}" />
          <button class="btn btn-ghost cust-${type}-remove" title="Remove" style="padding:2px 6px;">✖️</button>
        </div>
      `).join('');
    };

    const buildAddressInputs = (items) => {
      return items.map((addr, idx) => `
        <div class="cust-address-row" data-index="${idx}" style="border:1px solid var(--color-border); padding:8px; border-radius:8px; margin-bottom:8px;">
          <label class="field-label">Label</label>
          <input class="input cust-address-label" value="${addr.label || ''}" />
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
          <button class="btn btn-ghost cust-address-remove" title="Remove address" style="margin-top:6px;">Remove</button>
        </div>
      `).join('');
    };

    const body = `
      <div>
        <label class="field-label">Company</label>
        <input id="cust-company" class="input" value="${c.company || ''}" />

        <div style="margin-top:8px;">
          <label class="field-label">Contacts</label>
          <div id="cust-contacts-container">
            ${buildListInputs(contacts, 'contact')}
          </div>
          <button class="btn btn-ghost" id="cust-add-contact" type="button" style="margin-top:4px;">+ Add Contact</button>
        </div>

        <div style="margin-top:8px;">
          <label class="field-label">Phones</label>
          <div id="cust-phones-container">
            ${buildListInputs(phones, 'phone')}
          </div>
          <button class="btn btn-ghost" id="cust-add-phone" type="button" style="margin-top:4px;">+ Add Phone</button>
        </div>

        <div style="margin-top:8px;">
          <label class="field-label">Emails</label>
          <div id="cust-emails-container">
            ${buildListInputs(emails, 'email')}
          </div>
          <button class="btn btn-ghost" id="cust-add-email" type="button" style="margin-top:4px;">+ Add Email</button>
        </div>

        <div style="margin-top:8px;">
          <label class="field-label">Addresses</label>
          <div id="cust-addresses-container">
            ${buildAddressInputs(addresses)}
          </div>
          <button class="btn btn-ghost" id="cust-add-address" type="button" style="margin-top:4px;">+ Add Address</button>
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
          
          const contactVals = Array.from(document.querySelectorAll('#cust-contacts-container .cust-contact-input'))
            .map(i => i.value.trim())
            .filter(v => v);
          
          const phoneVals = Array.from(document.querySelectorAll('#cust-phones-container .cust-phone-input'))
            .map(i => i.value.trim())
            .filter(v => v);
          
          const emailVals = Array.from(document.querySelectorAll('#cust-emails-container .cust-email-input'))
            .map(i => i.value.trim())
            .filter(v => v);
          
          const addrEls = document.querySelectorAll('#cust-addresses-container .cust-address-row');
          const addrVals = Array.from(addrEls).map((row, idx) => {
            return {
              id: addresses[idx] && addresses[idx].id ? addresses[idx].id : App.Utils.generateId('a'),
              label: row.querySelector('.cust-address-label').value.trim() || 'Main',
              street: row.querySelector('.cust-address-street').value.trim(),
              number: row.querySelector('.cust-address-number').value.trim(),
              city: row.querySelector('.cust-address-city').value.trim(),
              zip: row.querySelector('.cust-address-zip').value.trim(),
              country: row.querySelector('.cust-address-country').value.trim()
            };
          });
          const n = {
            id: isNew ? App.Utils.generateId('c') : c.id,
            company,
            contacts: contactVals,
            phones: phoneVals,
            emails: emailVals,
            addresses: addrVals
          };
          
          n.name = contactVals[0] || '';
          n.email = emailVals[0] || '';
          if (isNew) {
            App.Data.Customers.push(n);
          } else {
            const idx = App.Data.Customers.findIndex(x => x.id === n.id);
            if (idx >= 0) App.Data.Customers[idx] = n;
          }
          App.DB.save();
          App.UI.Toast.show('Customer saved');
          App.Core.Router.navigate('customers');
        }
      }
    ]);

    
    setTimeout(() => {
      
      document.getElementById('cust-add-contact').onclick = () => {
        const container = document.getElementById('cust-contacts-container');
        const row = document.createElement('div');
        row.className = 'cust-contact-row';
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.marginBottom = '6px';
        row.style.gap = '4px';
        row.innerHTML = `<input class="input cust-contact-input" style="flex:1;" value="" /><button class="btn btn-ghost cust-contact-remove" style="padding:2px 6px;">✖️</button>`;
        container.appendChild(row);
        row.querySelector('.cust-contact-remove').onclick = () => row.remove();
      };
      document.querySelectorAll('#cust-contacts-container .cust-contact-remove').forEach(btn => {
        btn.onclick = () => {
          btn.parentElement.remove();
        };
      });
      
      document.getElementById('cust-add-phone').onclick = () => {
        const container = document.getElementById('cust-phones-container');
        const row = document.createElement('div');
        row.className = 'cust-phone-row';
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.marginBottom = '6px';
        row.style.gap = '4px';
        row.innerHTML = `<input class="input cust-phone-input" style="flex:1;" value="" /><button class="btn btn-ghost cust-phone-remove" style="padding:2px 6px;">✖️</button>`;
        container.appendChild(row);
        row.querySelector('.cust-phone-remove').onclick = () => row.remove();
      };
      document.querySelectorAll('#cust-phones-container .cust-phone-remove').forEach(btn => {
        btn.onclick = () => {
          btn.parentElement.remove();
        };
      });
      
      document.getElementById('cust-add-email').onclick = () => {
        const container = document.getElementById('cust-emails-container');
        const row = document.createElement('div');
        row.className = 'cust-email-row';
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.marginBottom = '6px';
        row.style.gap = '4px';
        row.innerHTML = `<input class="input cust-email-input" style="flex:1;" value="" /><button class="btn btn-ghost cust-email-remove" style="padding:2px 6px;">✖️</button>`;
        container.appendChild(row);
        row.querySelector('.cust-email-remove').onclick = () => row.remove();
      };
      document.querySelectorAll('#cust-emails-container .cust-email-remove').forEach(btn => {
        btn.onclick = () => {
          btn.parentElement.remove();
        };
      });
      
      document.getElementById('cust-add-address').onclick = () => {
        const container = document.getElementById('cust-addresses-container');
        const idx = container.querySelectorAll('.cust-address-row').length;
        const div = document.createElement('div');
        div.className = 'cust-address-row';
        div.style.border = '1px solid var(--color-border)';
        div.style.padding = '8px';
        div.style.borderRadius = '8px';
        div.style.marginBottom = '8px';
        div.innerHTML = `
          <label class="field-label">Label</label>
          <input class="input cust-address-label" value="" />
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
          <button class="btn btn-ghost cust-address-remove" title="Remove address" style="margin-top:6px;">Remove</button>
        `;
        container.appendChild(div);
        div.querySelector('.cust-address-remove').onclick = () => div.remove();
      };
      document.querySelectorAll('#cust-addresses-container .cust-address-remove').forEach(btn => {
        btn.onclick = () => {
          btn.parentElement.remove();
        };
      });
    }, 0);
  },

  deleteCustomer(id) {
    const customer = App.Data.Customers.find(c => c.id === id);
    if (!customer) return;
    App.UI.Modal.open('Delete Customer', `Are you sure you want to delete <strong>${customer.company}</strong>? This action cannot be undone.`, [
      { text: 'Cancel', variant: 'ghost', onClick: () => {} },
      {
        text: 'Delete',
        variant: 'primary',
        onClick: () => {
          App.Data.Customers = App.Data.Customers.filter(c => c.id !== id);
          App.DB.save();
          App.UI.Toast.show('Customer deleted');
          App.Core.Router.navigate('customers');
        }
      }
    ]);
  }
};
