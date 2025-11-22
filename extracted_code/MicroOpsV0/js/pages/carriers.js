// Carriers page
App.UI.Views.Carriers = {
  render(root) {
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
              <th>${App.I18n.t('carriers.name','Name')}</th>
              <th>${App.I18n.t('carriers.account','Account')}</th>
              <th>${App.I18n.t('carriers.contact','Contact')}</th>
              <th style="text-align:right;">${App.I18n.t('common.actions','Actions')}</th>
            </tr>
          </thead>
          <tbody>
            ${carriers.map(c => `
              <tr>
                <td>${c.name || '-'}</td>
                <td>${c.accountNumber || '-'}</td>
                <td>${c.contactPerson || '-'}</td>
                <td style="text-align:right;">
                  <button class="btn btn-ghost btn-edit-carrier" data-id="${c.id}" title="Edit" aria-label="Edit carrier">✏️</button>
                  <button class="btn btn-ghost btn-del-carrier" data-id="${c.id}" title="Delete" aria-label="Delete carrier">🗑️</button>
                </td>
              </tr>
            `).join('') || `<tr><td colspan="4" style="text-align:center; color:var(--color-text-muted);">No carriers</td></tr>`}
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
    const carriers = App.Data.carriers || [];
    const carrier = carriers.find(c => c.id === id);
    if (!carrier) return;

    // Check if carrier is used in any orders
    const orders = App.Data.orders || [];
    const usedInOrders = orders.filter(o => o.carrierId === id);

    if (usedInOrders.length > 0) {
      App.UI.Modal.open('Cannot Delete Carrier', `
        <div style="color:#dc2626;">
          <p>This carrier is used in <strong>${usedInOrders.length}</strong> order(s).</p>
          <p style="font-size:12px; margin-top:8px;">Remove the carrier from these orders first.</p>
        </div>
      `, [
        { text: 'Close', variant: 'ghost', onClick: () => {} }
      ]);
      return;
    }

    App.UI.Modal.open('Delete Carrier', `
      <p>Are you sure you want to delete <strong>${carrier.name}</strong>?</p>
    `, [
      { text: 'Cancel', variant: 'ghost', onClick: () => {} },
      {
        text: 'Delete',
        variant: 'primary',
        onClick: () => {
          App.Data.carriers = carriers.filter(c => c.id !== id);
          App.DB.save();
          App.UI.Toast.show('Carrier deleted');
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
    const isEdit = !!car;
    const body = `
      <div>
        <label class="field-label">${App.I18n.t('carriers.name','Name')}*</label>
        <input id="car-name" class="input" value="${car ? car.name : ''}" />

        <label class="field-label" style="margin-top:8px;">${App.I18n.t('carriers.account','Account Number')}</label>
        <input id="car-account" class="input" value="${car ? car.accountNumber || '' : ''}" />

        <label class="field-label" style="margin-top:8px;">${App.I18n.t('carriers.contact','Contact Person')}</label>
        <input id="car-contact" class="input" value="${car ? car.contactPerson || '' : ''}" />

        <label class="field-label" style="margin-top:8px;">${App.I18n.t('carriers.phone','Phone')}</label>
        <input id="car-phone" class="input" value="${car ? car.phone || '' : ''}" />

        <label class="field-label" style="margin-top:8px;">${App.I18n.t('carriers.email','Email')}</label>
        <input id="car-email" class="input" value="${car ? car.email || '' : ''}" />

        <label class="field-label" style="margin-top:8px;">${App.I18n.t('carriers.notes','Notes')}</label>
        <textarea id="car-notes" class="input" style="height:60px;">${car ? car.notes || '' : ''}</textarea>
      </div>
    `;
    const title = isEdit ? App.I18n.t('carriers.edit','Edit Carrier') : App.I18n.t('carriers.add','Add Carrier');
    App.UI.Modal.open(title, body, [
      { text: App.I18n.t('common.cancel','Cancel'), variant:'ghost', onClick: () => {} },
      { text: App.I18n.t('common.save','Save'), variant:'primary', onClick: () => {
          const name = document.getElementById('car-name').value.trim();
          if (!name) {
            App.UI.Toast.show(App.I18n.t('carriers.name','Name') + ' is required');
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