// Stock Movements page
App.UI.Views.Movements = {
  render(root) {
    const t = (key, fallback) => App.I18n.t(`movements.${key}`, fallback);
    const esc = App.Utils.escapeHtml;
    const movements = App.Data.movements || App.Data.Movements || [];
    root.innerHTML = `
      <div class="card-soft">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 style="font-size:16px; font-weight:600;">${App.I18n.t('pages.movements.title','Stock Movements')}</h3>
          <div style="display:flex; gap:8px;">
            <button class="btn btn-primary" id="btn-add-movement">+ ${App.I18n.t('common.add','Add')}</button>
            <button class="btn btn-primary" id="btn-export-movements">${App.I18n.t('reports.export','Export')}</button>
          </div>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>${t('date','Date')}</th>
              <th>${t('type','Type')}</th>
              <th>${t('item','Item')}</th>
              <th style="text-align:right;">${t('quantity','Qty')}</th>
              <th>${t('direction','Direction')}</th>
              <th>${t('ref','Reference')}</th>
            </tr>
          </thead>
          <tbody>
            ${movements.length > 0 ? movements.map(m => {
              const item = (m.productId && (App.Data.products||[]).find(p=>p.id===m.productId)) || (m.componentId && (App.Data.components||[]).find(c=>c.id===m.componentId)) || {};
              return `
              <tr>
                <td>${App.Utils.formatDate(m.date)}</td>
                <td>${esc(m.type || '-')}</td>
                <td>${esc(item.name || item.nameDE || item.nameEN || item.description || '-')}</td>
                <td style="text-align:right;">${m.quantity ?? '-'}</td>
                <td>${esc(m.direction || '-')}</td>
                <td>${esc(m.reference || '-')}</td>
              </tr>`;
            }).join('') : `<tr><td colspan="6" style="text-align:center; color:var(--color-text-muted);">${t('noMovements', 'No movements')}</td></tr>`}
          </tbody>
        </table>
      </div>
    `;
    // Bind add movement button
    const addBtn = document.getElementById('btn-add-movement');
    if (addBtn) {
      addBtn.onclick = () => this.openMovementModal();
    }
    // Export button - uses secure CSV utility
    const exportBtn = document.getElementById('btn-export-movements');
    if (exportBtn) {
      exportBtn.onclick = () => {
        const headers = ['Date', 'Type', 'Item', 'Qty', 'Direction', 'Reference'];
        const rows = (App.Data.movements || []).map(m => {
          const item = (m.productId && (App.Data.products||[]).find(p=>p.id===m.productId)) || (m.componentId && (App.Data.components||[]).find(c=>c.id===m.componentId)) || {};
          return [
            m.date,
            m.type,
            item.name || item.description || '',
            m.quantity,
            m.direction,
            m.reference
          ];
        });
        App.Utils.exportCSV(headers, rows, 'movements.csv');
      };
    }
  }
  ,
  /**
   * Opens a modal to add a new stock movement. Allows selecting a product or component,
   * specifying quantity and direction. On save, the movement is stored and stock
   * levels are updated accordingly.
   */
  openMovementModal() {
    const t = (key, fallback) => App.I18n.t(`movements.${key}`, fallback);
    const esc = App.Utils.escapeHtml;
    const products = (App.Data.products || []).filter(p => p.type !== 'Service');
    const components = App.Data.components || [];
    const productOptions = products.map(p => `<option value="prod:${p.id}">${esc(p.nameDE || p.nameEN || p.id)}</option>`).join('');
    const compOptions = components.map(c => `<option value="cmp:${c.id}">${esc(c.description || c.componentNumber)}</option>`).join('');
    const body = `
      <div>
        <label class="field-label" for="mv-date">${t('date','Date')}*</label>
        <input id="mv-date" class="input" type="date" value="${new Date().toISOString().split('T')[0]}" aria-required="true" />

        <label class="field-label" for="mv-type" style="margin-top:8px;">${t('type','Type')}</label>
        <select id="mv-type" class="input">
          <option value="receipt">${t('typeReceipt', 'Receipt')}</option>
          <option value="consumption">${t('typeConsumption', 'Consumption')}</option>
          <option value="production">${t('typeProduction', 'Production')}</option>
        </select>

        <label class="field-label" for="mv-item" style="margin-top:8px;">${t('item','Item')}*</label>
        <select id="mv-item" class="input" aria-required="true">
          <option value="">-</option>
          ${productOptions}
          ${compOptions}
        </select>

        <label class="field-label" for="mv-qty" style="margin-top:8px;">${t('quantity','Quantity')}*</label>
        <input id="mv-qty" class="input" type="number" step="0.01" min="0" value="1" aria-required="true" />

        <label class="field-label" for="mv-direction" style="margin-top:8px;">${t('direction','Direction')}</label>
        <select id="mv-direction" class="input">
          <option value="in">${t('directionIn', 'In')}</option>
          <option value="out">${t('directionOut', 'Out')}</option>
        </select>

        <label class="field-label" for="mv-ref" style="margin-top:8px;">${t('ref','Reference')}</label>
        <input id="mv-ref" class="input" />
      </div>
    `;
    App.UI.Modal.open(t('add','Add Movement'), body, [
      { text: App.I18n.t('common.cancel','Cancel'), variant:'ghost', onClick: () => {} },
      { text: App.I18n.t('common.save','Save'), variant:'primary', onClick: () => {
          const date = document.getElementById('mv-date').value;
          const type = document.getElementById('mv-type').value;
          const item = document.getElementById('mv-item').value;
          const qty = parseFloat(document.getElementById('mv-qty').value) || 0;
          const direction = document.getElementById('mv-direction').value;
          const ref = document.getElementById('mv-ref').value.trim() || null;
          if (!date || !item || qty <= 0) {
            App.UI.Toast.show(t('fillRequired', 'Please fill all required fields'));
            return false;
          }
          const m = {
            id: App.Utils.generateId('m'),
            date: date,
            type: type,
            direction: direction,
            quantity: qty,
            unitPrice: null,
            reference: ref
          };
          const list = App.Data.movements || [];
          // Parse item
          if (item.startsWith('prod:')) {
            m.productId = item.split(':')[1];
            // Update product stock
            const prod = (App.Data.products || []).find(p => p.id === m.productId);
            if (prod) {
              if (direction === 'in') prod.stock = (prod.stock || 0) + qty;
              else prod.stock = (prod.stock || 0) - qty;
            }
          } else if (item.startsWith('cmp:')) {
            m.componentId = item.split(':')[1];
            const cmp = (App.Data.components || []).find(c => c.id === m.componentId);
            if (cmp) {
              if (direction === 'in') cmp.stock = (cmp.stock || 0) + qty;
              else cmp.stock = (cmp.stock || 0) - qty;
            }
          }
          list.push(m);
          App.DB.save();
          App.Core.Router.navigate('movements');
        } }
    ]);
  }
};