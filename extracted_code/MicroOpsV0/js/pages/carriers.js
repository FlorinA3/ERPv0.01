// Carriers page
App.UI.Views.Carriers = {
  render(root) {
    const t = (key, fallback) => App.I18n.t(`carriers.${key}`, fallback);
    const esc = App.Utils.escapeHtml;
    const carriers = App.Data.carriers || App.Data.Carriers || [];
    root.innerHTML = `
      <div class="card-soft">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 style="font-size:16px; font-weight:600;">${App.I18n.t('pages.carriers.title','Carriers')}</h3>
          <button class="btn btn-primary" id="btn-add-carrier">+ ${App.I18n.t('common.add','Add')}</button>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>${t('name','Name')}</th>
              <th>${t('account','Account')}</th>
              <th>${t('contact','Contact')}</th>
              <th style="text-align:right;">${App.I18n.t('common.actions','Actions')}</th>
            </tr>
          </thead>
          <tbody>
            ${carriers.length > 0 ? carriers.map(c => `
              <tr>
                <td>${esc(c.name || '-')}</td>
                <td>${esc(c.accountNumber || '-')}</td>
                <td>${esc(c.contactPerson || '-')}</td>
                <td style="text-align:right;">
                  <button class="btn btn-ghost btn-edit-carrier" data-id="${c.id}" title="${App.I18n.t('common.edit', 'Edit')}" aria-label="${t('edit', 'Edit Carrier')}">✏️</button>
                  <button class="btn btn-ghost btn-del-carrier" data-id="${c.id}" title="${App.I18n.t('common.delete', 'Delete')}" aria-label="${App.I18n.t('common.deleteCarrier', 'Delete Carrier')}">🗑️</button>
                </td>
              </tr>
            `).join('') : `<tr><td colspan="4" style="text-align:center; color:var(--color-text-muted);">${t('noCarriers', 'No carriers')}</td></tr>`}
          </tbody>
        </table>
      </div>
    `;
    const addBtn = document.getElementById('btn-add-carrier');
    if (addBtn) {
      addBtn.onclick = () => this.openCarrierModal();
    }

    // Edit button handlers
    root.querySelectorAll('.btn-edit-carrier').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const car = carriers.find(c => c.id === id);
        if (car) this.openCarrierModal(car);
      });
    });

    // Delete button handlers
    root.querySelectorAll('.btn-del-carrier').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        this.deleteCarrier(id);
      });
    });
  },

  deleteCarrier(id) {
    const t = (key, fallback) => App.I18n.t(`carriers.${key}`, fallback);
    const esc = App.Utils.escapeHtml;
    const carriers = App.Data.carriers || [];
    const carrier = carriers.find(c => c.id === id);
    if (!carrier) return;

    // Check if carrier is used in any orders
    const orders = App.Data.orders || [];
    const usedInOrders = orders.filter(o => o.carrierId === id);

    if (usedInOrders.length > 0) {
      App.UI.Modal.open(t('cannotDelete', 'Cannot Delete Carrier'), `
        <div style="color:var(--color-danger);">
          <p>${t('usedInOrders', 'This carrier is used in')} <strong>${usedInOrders.length}</strong> ${t('ordersUsed', 'order(s)')}.</p>
          <p style="font-size:12px; margin-top:8px;">${t('removeFirst', 'Remove the carrier from these orders first.')}</p>
        </div>
      `, [
        { text: App.I18n.t('common.close', 'Close'), variant: 'ghost', onClick: () => {} }
      ]);
      return;
    }

    App.UI.Modal.open(App.I18n.t('common.deleteCarrier', 'Delete Carrier'), `
      <p>${t('confirmDelete', 'Are you sure you want to delete')} <strong>${esc(carrier.name)}</strong>?</p>
    `, [
      { text: App.I18n.t('common.cancel', 'Cancel'), variant: 'ghost', onClick: () => {} },
      {
        text: App.I18n.t('common.delete', 'Delete'),
        variant: 'primary',
        onClick: () => {
          App.Data.carriers = carriers.filter(c => c.id !== id);
          App.DB.save();
          App.UI.Toast.show(App.I18n.t('common.carrierDeleted', 'Carrier deleted'));
          App.Core.Router.navigate('carriers');
        }
      }
    ]);
  }
  ,
  /**
   * Opens a modal to add or edit a carrier.
   */
  openCarrierModal(car) {
    const t = (key, fallback) => App.I18n.t(`carriers.${key}`, fallback);
    const esc = App.Utils.escapeHtml;
    const isEdit = !!car;
    const body = `
      <div>
        <label class="field-label" for="car-name">${t('name','Name')}*</label>
        <input id="car-name" class="input" value="${esc(car ? car.name : '')}" aria-required="true" />

        <label class="field-label" for="car-account" style="margin-top:8px;">${t('account','Account Number')}</label>
        <input id="car-account" class="input" value="${esc(car ? car.accountNumber || '' : '')}" />

        <label class="field-label" for="car-contact" style="margin-top:8px;">${t('contact','Contact Person')}</label>
        <input id="car-contact" class="input" value="${esc(car ? car.contactPerson || '' : '')}" />

        <label class="field-label" for="car-phone" style="margin-top:8px;">${t('phone','Phone')}</label>
        <input id="car-phone" class="input" value="${esc(car ? car.phone || '' : '')}" />

        <label class="field-label" for="car-email" style="margin-top:8px;">${t('email','Email')}</label>
        <input id="car-email" class="input" value="${esc(car ? car.email || '' : '')}" />

        <label class="field-label" for="car-notes" style="margin-top:8px;">${t('notes','Notes')}</label>
        <textarea id="car-notes" class="input" style="height:60px;">${esc(car ? car.notes || '' : '')}</textarea>
      </div>
    `;
    const title = isEdit ? t('edit','Edit Carrier') : t('add','Add Carrier');
    App.UI.Modal.open(title, body, [
      { text: App.I18n.t('common.cancel','Cancel'), variant:'ghost', onClick: () => {} },
      { text: App.I18n.t('common.save','Save'), variant:'primary', onClick: () => {
          const name = document.getElementById('car-name').value.trim();
          if (!name) {
            App.UI.Toast.show(t('nameRequired', 'Name is required'));
            return false;
          }
          const list = App.Data.carriers || [];
          const newCar = {
            id: isEdit ? car.id : App.Utils.generateId('car'),
            name: name,
            accountNumber: document.getElementById('car-account').value.trim() || null,
            contactPerson: document.getElementById('car-contact').value.trim() || null,
            phone: document.getElementById('car-phone').value.trim() || null,
            email: document.getElementById('car-email').value.trim() || null,
            notes: document.getElementById('car-notes').value.trim() || null
          };
          if (isEdit) {
            const idx = list.findIndex(x => x.id === car.id);
            if (idx >= 0) list[idx] = newCar;
          } else {
            list.push(newCar);
          }
          App.DB.save();
          App.Core.Router.navigate('carriers');
        } }
    ]);
  }
};