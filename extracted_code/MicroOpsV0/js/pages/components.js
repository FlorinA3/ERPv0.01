// Components (E‑Komponenten) page
App.UI.Views.Components = {
  render(root) {
    const comps = App.Data.components || App.Data.Components || [];
    root.innerHTML = `
      <div class="card-soft">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 style="font-size:16px; font-weight:600;">${App.I18n.t('pages.components.title', 'Components')}</h3>
          <button class="btn btn-primary" id="btn-add-component">+ ${App.I18n.t('common.add','Add')}</button>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>#</th>
              <th>${App.I18n.t('components.description','Description')}</th>
              <th>${App.I18n.t('components.unit','Unit')}</th>
              <th>${App.I18n.t('components.stock','Stock')}</th>
              <th>${App.I18n.t('components.supplier','Supplier')}</th>
              <th style="text-align:right;">${App.I18n.t('common.actions','Actions')}</th>
            </tr>
          </thead>
          <tbody>
            ${comps.map((c,i) => `
              <tr>
                <td>${i+1}</td>
                <td>${c.description || '-'}</td>
                <td>${c.unit || '-'}</td>
                <td>${c.stock ?? '-'}</td>
                <td>${(App.Data.suppliers || []).find(s=>s.id===c.supplierId)?.name || '-'}</td>
                <td style="text-align:right;">
                  <button class="btn btn-ghost" data-id="${c.id}" disabled>Edit</button>
                </td>
              </tr>
            `).join('') || `<tr><td colspan="6" style="text-align:center; color:var(--color-text-muted);">No components</td></tr>`}
          </tbody>
        </table>
      </div>
    `;
    // Bind add button
    const addBtn = document.getElementById('btn-add-component');
    if (addBtn) {
      addBtn.onclick = () => this.openComponentModal();
    }
    // Make rows clickable for editing
    const rows = root.querySelectorAll('tbody tr');
    rows.forEach((row, idx) => {
      const comp = comps[idx];
      if (!comp) return;
      row.addEventListener('click', () => {
        this.openComponentModal(comp);
      });
    });
  }
  ,
  /**
   * Opens a modal to add or edit a component. When an existing component is passed
   * the form fields are pre-filled. On save, the component is added or updated
   * in the database and the view is re-rendered.
   * @param {Object} comp The component to edit, or undefined to add a new one
   */
  openComponentModal(comp) {
    const isEdit = !!comp;
    const suppliers = App.Data.suppliers || [];
    const supplierOptions = suppliers.map(s => `<option value="${s.id}" ${comp && comp.supplierId === s.id ? 'selected' : ''}>${s.name}</option>`).join('');
    const body = `
      <div>
        <label class="field-label">${App.I18n.t('components.number','Component No')}*</label>
        <input id="cmp-number" class="input" value="${comp ? comp.componentNumber : ''}" />

        <label class="field-label" style="margin-top:8px;">${App.I18n.t('components.group','Group')}</label>
        <input id="cmp-group" class="input" value="${comp ? comp.group || '' : ''}" />

        <label class="field-label" style="margin-top:8px;">${App.I18n.t('components.description','Description')}</label>
        <input id="cmp-description" class="input" value="${comp ? comp.description || '' : ''}" />

        <label class="field-label" style="margin-top:8px;">${App.I18n.t('components.unit','Unit')}</label>
        <input id="cmp-unit" class="input" value="${comp ? comp.unit || '' : ''}" />

        <label class="field-label" style="margin-top:8px;">${App.I18n.t('components.stock','Stock')}</label>
        <input id="cmp-stock" class="input" type="number" min="0" step="1" value="${comp && comp.stock != null ? comp.stock : 0}" />

        <label class="field-label" style="margin-top:8px;">${App.I18n.t('components.safetyStock','Safety Stock')}</label>
        <input id="cmp-safety" class="input" type="number" min="0" step="1" value="${comp && comp.safetyStock != null ? comp.safetyStock : 0}" />

        <label class="field-label" style="margin-top:8px;">${App.I18n.t('components.supplier','Supplier')}</label>
        <select id="cmp-supplier" class="input">
          <option value="">-</option>
          ${supplierOptions}
        </select>

        <label class="field-label" style="margin-top:8px;">${App.I18n.t('components.leadTime','Lead Time (days)')}</label>
        <input id="cmp-lead" class="input" type="number" min="0" step="1" value="${comp && comp.leadTimeDays != null ? comp.leadTimeDays : ''}" />

        <label class="field-label" style="margin-top:8px;">${App.I18n.t('components.status','Status')}</label>
        <select id="cmp-status" class="input">
          ${['active','blocked'].map(st => `<option value="${st}" ${comp && comp.status === st ? 'selected' : ''}>${st}</option>`).join('')}
        </select>

        <label class="field-label" style="margin-top:8px;">${App.I18n.t('components.notes','Notes')}</label>
        <textarea id="cmp-notes" class="input" style="height:60px;">${comp ? comp.notes || '' : ''}</textarea>
      </div>
    `;
    const title = isEdit ? App.I18n.t('components.edit','Edit Component') : App.I18n.t('components.add','Add Component');
    App.UI.Modal.open(title, body, [
      { text: App.I18n.t('common.cancel','Cancel'), variant:'ghost', onClick: () => {} },
      { text: App.I18n.t('common.save','Save'), variant:'primary', onClick: () => {
          const number = document.getElementById('cmp-number').value.trim();
          if (!number) {
            App.UI.Toast.show(App.I18n.t('components.number','Component No') + ' is required');
            return false;
          }
          const list = App.Data.components || [];
          const newComp = {
            id: isEdit ? comp.id : App.Utils.generateId('cmp'),
            componentNumber: number,
            group: document.getElementById('cmp-group').value.trim() || null,
            description: document.getElementById('cmp-description').value.trim() || null,
            unit: document.getElementById('cmp-unit').value.trim() || null,
            stock: parseFloat(document.getElementById('cmp-stock').value) || 0,
            safetyStock: parseFloat(document.getElementById('cmp-safety').value) || 0,
            supplierId: document.getElementById('cmp-supplier').value || null,
            leadTimeDays: parseInt(document.getElementById('cmp-lead').value) || null,
            status: document.getElementById('cmp-status').value,
            notes: document.getElementById('cmp-notes').value.trim() || null,
            prices: comp && comp.prices ? comp.prices : []
          };
          if (isEdit) {
            const idx = list.findIndex(c => c.id === comp.id);
            if (idx >= 0) list[idx] = newComp;
          } else {
            list.push(newComp);
          }
          App.DB.save();
          // Re-render page
          App.Core.Router.navigate('components');
        } }
    ]);
  }
};