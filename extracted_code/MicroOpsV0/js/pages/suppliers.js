// Suppliers page
App.UI.Views.Suppliers = {
  render(root) {
    const suppliers = App.Data.suppliers || App.Data.Suppliers || [];
    root.innerHTML = `
      <div class="card-soft">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 style="font-size:16px; font-weight:600;">${App.I18n.t('pages.suppliers.title','Suppliers')}</h3>
          <button class="btn btn-primary" id="btn-add-supplier">+ ${App.I18n.t('common.add','Add')}</button>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>${App.I18n.t('suppliers.name','Name')}</th>
              <th>${App.I18n.t('suppliers.country','Country')}</th>
              <th>${App.I18n.t('suppliers.contact','Contact')}</th>
              <th style="text-align:right;">${App.I18n.t('common.actions','Actions')}</th>
            </tr>
          </thead>
          <tbody>
            ${suppliers.map(s => `
              <tr>
                <td>${s.name || '-'}</td>
                <td>${s.country || '-'}</td>
                <td>${s.contactPerson || '-'}</td>
                <td style="text-align:right;"><button class="btn btn-ghost" disabled>Edit</button></td>
              </tr>
            `).join('') || `<tr><td colspan="4" style="text-align:center; color:var(--color-text-muted);">No suppliers</td></tr>`}
          </tbody>
        </table>
      </div>
    `;
    const addBtn = document.getElementById('btn-add-supplier');
    if (addBtn) {
      addBtn.onclick = () => this.openSupplierModal();
    }
    // Make rows clickable for editing
    const rows = root.querySelectorAll('tbody tr');
    rows.forEach((row, idx) => {
      const sup = suppliers[idx];
      if (!sup) return;
      row.addEventListener('click', () => {
        this.openSupplierModal(sup);
      });
    });
  }
  ,
  /**
   * Opens a modal to add or edit a supplier. When an existing supplier is passed
   * the form fields are pre-filled.
   */
  openSupplierModal(sup) {
    const isEdit = !!sup;
    const body = `
      <div>
        <label class="field-label">${App.I18n.t('suppliers.name','Name')}*</label>
        <input id="sup-name" class="input" value="${sup ? sup.name : ''}" />

        <label class="field-label" style="margin-top:8px;">${App.I18n.t('suppliers.street','Street')}</label>
        <input id="sup-street" class="input" value="${sup ? sup.street || '' : ''}" />

        <label class="field-label" style="margin-top:8px;">${App.I18n.t('suppliers.zip','ZIP')}</label>
        <input id="sup-zip" class="input" value="${sup ? sup.zip || '' : ''}" />

        <label class="field-label" style="margin-top:8px;">${App.I18n.t('suppliers.city','City')}</label>
        <input id="sup-city" class="input" value="${sup ? sup.city || '' : ''}" />

        <label class="field-label" style="margin-top:8px;">${App.I18n.t('suppliers.country','Country')}</label>
        <input id="sup-country" class="input" value="${sup ? sup.country || '' : ''}" />

        <label class="field-label" style="margin-top:8px;">${App.I18n.t('suppliers.contact','Contact Person')}</label>
        <input id="sup-contact" class="input" value="${sup ? sup.contactPerson || '' : ''}" />

        <label class="field-label" style="margin-top:8px;">${App.I18n.t('suppliers.phone','Phone')}</label>
        <input id="sup-phone" class="input" value="${sup ? sup.phone || '' : ''}" />

        <label class="field-label" style="margin-top:8px;">${App.I18n.t('suppliers.email','Email')}</label>
        <input id="sup-email" class="input" value="${sup ? sup.email || '' : ''}" />

        <label class="field-label" style="margin-top:8px;">${App.I18n.t('suppliers.notes','Notes')}</label>
        <textarea id="sup-notes" class="input" style="height:60px;">${sup ? sup.notes || '' : ''}</textarea>
      </div>
    `;
    const title = isEdit ? App.I18n.t('suppliers.edit','Edit Supplier') : App.I18n.t('suppliers.add','Add Supplier');
    App.UI.Modal.open(title, body, [
      { text: App.I18n.t('common.cancel','Cancel'), variant:'ghost', onClick: () => {} },
      { text: App.I18n.t('common.save','Save'), variant:'primary', onClick: () => {
          const name = document.getElementById('sup-name').value.trim();
          if (!name) {
            App.UI.Toast.show(App.I18n.t('suppliers.name','Name') + ' is required');
            return false;
          }
          const list = App.Data.suppliers || [];
          const newSup = {
            id: isEdit ? sup.id : App.Utils.generateId('sup'),
            name: name,
            street: document.getElementById('sup-street').value.trim() || null,
            zip: document.getElementById('sup-zip').value.trim() || null,
            city: document.getElementById('sup-city').value.trim() || null,
            country: document.getElementById('sup-country').value.trim() || null,
            contactPerson: document.getElementById('sup-contact').value.trim() || null,
            phone: document.getElementById('sup-phone').value.trim() || null,
            email: document.getElementById('sup-email').value.trim() || null,
            notes: document.getElementById('sup-notes').value.trim() || null
          };
          if (isEdit) {
            const idx = list.findIndex(x => x.id === sup.id);
            if (idx >= 0) list[idx] = newSup;
          } else {
            list.push(newSup);
          }
          App.DB.save();
          App.Core.Router.navigate('suppliers');
        } }
    ]);
  }
};