App.UI.Views.Components = {
  render(root) {
    const t = (key, fallback) => App.I18n.t(`components.${key}`, fallback);
    const esc = App.Utils.escapeHtml;
    const comps = App.Data.components || [];
    const suppliers = App.Data.suppliers || [];

    const getSupplierInfo = (supplierId) => {
      if (!supplierId) return { name: '-', leadTime: null };
      const sup = suppliers.find(s => s.id === supplierId);
      return sup ? { name: esc(sup.name), leadTime: sup.leadTimeDays } : { name: '-', leadTime: null };
    };

    const getStockStatus = (comp) => {
      if (comp.stock <= 0) return '<span class="tag tag-danger">Out</span>';
      if (comp.stock <= (comp.safetyStock || 0)) return '<span class="tag tag-warning">Low</span>';
      return '<span class="tag tag-success">OK</span>';
    };

    root.innerHTML = `
      <div class="card-soft">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 style="font-size:16px; font-weight:600;">${App.I18n.t('pages.components.title', 'Components')}</h3>
          <button class="btn btn-primary" id="btn-add-component">+ ${App.I18n.t('common.add','Add')}</button>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>${t('number','Component No')}</th>
              <th>${t('description','Description')}</th>
              <th>${t('unit','Unit')}</th>
              <th style="text-align:right;">${t('stock','Stock')}</th>
              <th style="text-align:center;">${t('status','Status')}</th>
              <th>${t('supplier','Preferred Supplier')}</th>
              <th style="text-align:right;">${t('purchasePrice','Purchase Price (€)')}</th>
              <th style="text-align:right;">${App.I18n.t('common.actions','Actions')}</th>
            </tr>
          </thead>
          <tbody>
            ${comps.length > 0 ? comps.map(c => {
              const supInfo = getSupplierInfo(c.supplierId);
              return `
                <tr>
                  <td><strong>${esc(c.componentNumber || '-')}</strong></td>
                  <td>${esc(c.description || '-')}</td>
                  <td>${esc(c.unit || '-')}</td>
                  <td style="text-align:right;">${c.stock ?? 0}${c.safetyStock ? ` <small style="color:var(--color-text-muted);">(min: ${c.safetyStock})</small>` : ''}</td>
                  <td style="text-align:center;">${getStockStatus(c)}</td>
                  <td>${supInfo.name}${supInfo.leadTime ? ` <small style="color:var(--color-text-muted);">(${supInfo.leadTime}d)</small>` : ''}</td>
                  <td style="text-align:right;">${c.purchasePrice ? '€' + c.purchasePrice.toFixed(2) : '-'}</td>
                  <td style="text-align:right;">
                    <button class="btn btn-ghost btn-edit-comp" data-id="${c.id}" title="${App.I18n.t('common.edit', 'Edit')}" aria-label="${t('edit', 'Edit Component')}">✏️</button>
                    <button class="btn btn-ghost btn-delete-comp" data-id="${c.id}" title="${App.I18n.t('common.delete', 'Delete')}" aria-label="${App.I18n.t('common.deleteComponent', 'Delete Component')}">🗑️</button>
                  </td>
                </tr>
              `;
            }).join('') : `<tr><td colspan="8" style="text-align:center; color:var(--color-text-muted);">${t('noComponents', 'No components')}</td></tr>`}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('btn-add-component')?.addEventListener('click', () => this.openComponentModal());

    root.querySelectorAll('.btn-edit-comp').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const comp = comps.find(c => c.id === btn.getAttribute('data-id'));
        if (comp) this.openComponentModal(comp);
      });
    });

    root.querySelectorAll('.btn-delete-comp').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const comp = comps.find(c => c.id === id);
        if (!comp) return;

        const products = App.Data.products || [];
        const usedIn = products.filter(p => (p.bom || []).some(b => b.componentId === id));
        if (usedIn.length > 0) {
          App.UI.Toast.show(`${t('cannotDelete', 'Cannot delete: Used in')} ${usedIn.length} ${t('productBOMs', 'product BOMs')}`);
          return;
        }

        App.UI.Modal.open(App.I18n.t('common.deleteComponent', 'Delete Component'), `
          <p>${t('confirmDelete', 'Are you sure you want to delete')} <strong>${esc(comp.componentNumber)}</strong>?</p>
        `, [
          { text: App.I18n.t('common.cancel', 'Cancel'), variant: 'ghost', onClick: () => {} },
          {
            text: App.I18n.t('common.delete', 'Delete'),
            variant: 'primary',
            onClick: () => {
              const idx = comps.findIndex(c => c.id === id);
              if (idx >= 0) {
                comps.splice(idx, 1);
                App.DB.save();
                App.UI.Toast.show(App.I18n.t('common.componentDeleted', 'Component deleted'));
                App.Core.Router.navigate('components');
              }
            }
          }
        ]);
      });
    });
  },

  openComponentModal(comp) {
    const t = (key, fallback) => App.I18n.t(`components.${key}`, fallback);
    const esc = App.Utils.escapeHtml;
    const isEdit = !!comp;
    const suppliers = App.Data.suppliers || [];
    const supplierOptions = suppliers.map(s =>
      `<option value="${s.id}" ${comp && comp.supplierId === s.id ? 'selected' : ''}>${esc(s.name)}${s.leadTimeDays ? ` (${s.leadTimeDays}d)` : ''}</option>`
    ).join('');

    const body = `
      <div class="grid grid-2" style="gap:12px;">
        <div>
          <label class="field-label" for="cmp-number">${t('number','Component No')}*</label>
          <input id="cmp-number" class="input" value="${esc(comp ? comp.componentNumber : '')}" placeholder="e.g., E0001" aria-required="true" />
        </div>
        <div>
          <label class="field-label" for="cmp-group">${t('group','Group')}</label>
          <input id="cmp-group" class="input" value="${esc(comp ? comp.group || '' : '')}" placeholder="e.g., Packaging" />
        </div>
      </div>

      <div style="margin-top:8px;">
        <label class="field-label" for="cmp-description">${t('description','Description')}*</label>
        <input id="cmp-description" class="input" value="${esc(comp ? comp.description || '' : '')}" aria-required="true" />
      </div>

      <div class="grid grid-2" style="gap:12px; margin-top:8px;">
        <div>
          <label class="field-label" for="cmp-unit">${t('unit','Unit')}</label>
          <select id="cmp-unit" class="input">
            <option value="pcs" ${comp && comp.unit === 'pcs' ? 'selected' : ''}>pcs (pieces)</option>
            <option value="kg" ${comp && comp.unit === 'kg' ? 'selected' : ''}>kg</option>
            <option value="L" ${comp && comp.unit === 'L' ? 'selected' : ''}>L (liters)</option>
            <option value="m" ${comp && comp.unit === 'm' ? 'selected' : ''}>m (meters)</option>
            <option value="roll" ${comp && comp.unit === 'roll' ? 'selected' : ''}>roll</option>
            <option value="box" ${comp && comp.unit === 'box' ? 'selected' : ''}>box</option>
          </select>
        </div>
        <div>
          <label class="field-label" for="cmp-status">${t('status','Status')}</label>
          <select id="cmp-status" class="input">
            <option value="active" ${!comp || comp.status === 'active' ? 'selected' : ''}>${t('statusActive', 'Active')}</option>
            <option value="blocked" ${comp && comp.status === 'blocked' ? 'selected' : ''}>${t('statusBlocked', 'Blocked')}</option>
            <option value="discontinued" ${comp && comp.status === 'discontinued' ? 'selected' : ''}>${t('statusDiscontinued', 'Discontinued')}</option>
          </select>
        </div>
      </div>

      <h4 style="margin:16px 0 8px 0; font-size:14px; font-weight:600; border-bottom:1px solid var(--color-border); padding-bottom:4px;">${t('stockManagement', 'Stock Management')}</h4>

      <div class="grid grid-2" style="gap:12px;">
        <div>
          <label class="field-label" for="cmp-stock">${t('stock','Current Stock')}</label>
          <input id="cmp-stock" class="input" type="number" min="0" step="0.01" value="${comp && comp.stock != null ? comp.stock : 0}" />
        </div>
        <div>
          <label class="field-label" for="cmp-safety">${t('safetyStock','Safety Stock')}</label>
          <input id="cmp-safety" class="input" type="number" min="0" step="0.01" value="${comp && comp.safetyStock != null ? comp.safetyStock : 0}" />
        </div>
      </div>

      <div class="grid grid-2" style="gap:12px; margin-top:8px;">
        <div>
          <label class="field-label" for="cmp-reorder">${t('reorderPoint', 'Reorder Point')}</label>
          <input id="cmp-reorder" class="input" type="number" min="0" step="0.01" value="${comp ? comp.reorderPoint || '' : ''}" />
        </div>
        <div>
          <label class="field-label" for="cmp-reorder-qty">${t('reorderQuantity', 'Reorder Quantity')}</label>
          <input id="cmp-reorder-qty" class="input" type="number" min="0" step="0.01" value="${comp ? comp.reorderQuantity || '' : ''}" />
        </div>
      </div>

      <h4 style="margin:16px 0 8px 0; font-size:14px; font-weight:600; border-bottom:1px solid var(--color-border); padding-bottom:4px;">${t('purchasing', 'Purchasing')}</h4>

      <div class="grid grid-2" style="gap:12px;">
        <div>
          <label class="field-label" for="cmp-supplier">${t('supplier','Preferred Supplier')}</label>
          <select id="cmp-supplier" class="input">
            <option value="">${t('select', 'Select...')}</option>
            ${supplierOptions}
          </select>
        </div>
        <div>
          <label class="field-label" for="cmp-price">${t('purchasePrice','Purchase Price (€)')}</label>
          <input id="cmp-price" class="input" type="number" min="0" step="0.01" value="${comp ? comp.purchasePrice || '' : ''}" />
        </div>
      </div>

      <div class="grid grid-2" style="gap:12px; margin-top:8px;">
        <div>
          <label class="field-label" for="cmp-lead">${t('leadTime','Lead Time (days)')}</label>
          <input id="cmp-lead" class="input" type="number" min="0" step="1" value="${comp && comp.leadTimeDays != null ? comp.leadTimeDays : ''}" />
        </div>
        <div>
          <label class="field-label" for="cmp-moq">${t('minOrderQty', 'Min Order Qty')}</label>
          <input id="cmp-moq" class="input" type="number" min="0" step="0.01" value="${comp ? comp.minimumOrderQty || '' : ''}" />
        </div>
      </div>

      <div style="margin-top:8px;">
        <label class="field-label" for="cmp-supplier-part">${t('supplierPartNumber', 'Supplier Part Number')}</label>
        <input id="cmp-supplier-part" class="input" value="${esc(comp ? comp.supplierPartNumber || '' : '')}" />
      </div>

      <div style="margin-top:8px;">
        <label class="field-label" for="cmp-notes">${t('notes','Notes')}</label>
        <textarea id="cmp-notes" class="input" rows="2">${esc(comp ? comp.notes || '' : '')}</textarea>
      </div>
    `;

    const title = isEdit ? t('edit','Edit Component') : t('add','Add Component');
    App.UI.Modal.open(title, body, [
      { text: App.I18n.t('common.cancel','Cancel'), variant: 'ghost', onClick: () => {} },
      {
        text: App.I18n.t('common.save','Save'),
        variant: 'primary',
        onClick: () => {
          const number = document.getElementById('cmp-number').value.trim();
          if (!number) {
            App.UI.Toast.show(t('numberRequired', 'Component number is required'));
            return false;
          }

          const list = App.Data.components || [];
          const newComp = {
            id: isEdit ? comp.id : App.Utils.generateId('cmp'),
            componentNumber: number,
            group: document.getElementById('cmp-group').value.trim() || null,
            description: document.getElementById('cmp-description').value.trim() || null,
            unit: document.getElementById('cmp-unit').value || 'pcs',
            stock: parseFloat(document.getElementById('cmp-stock').value) || 0,
            safetyStock: parseFloat(document.getElementById('cmp-safety').value) || 0,
            reorderPoint: parseFloat(document.getElementById('cmp-reorder').value) || null,
            reorderQuantity: parseFloat(document.getElementById('cmp-reorder-qty').value) || null,
            supplierId: document.getElementById('cmp-supplier').value || null,
            purchasePrice: parseFloat(document.getElementById('cmp-price').value) || null,
            leadTimeDays: parseInt(document.getElementById('cmp-lead').value) || null,
            minimumOrderQty: parseFloat(document.getElementById('cmp-moq').value) || null,
            supplierPartNumber: document.getElementById('cmp-supplier-part').value.trim() || null,
            status: document.getElementById('cmp-status').value,
            notes: document.getElementById('cmp-notes').value.trim() || null,
            prices: comp && comp.prices ? comp.prices : [],
            createdAt: isEdit ? comp.createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          if (isEdit) {
            const idx = list.findIndex(c => c.id === comp.id);
            if (idx >= 0) list[idx] = { ...list[idx], ...newComp };
          } else {
            list.push(newComp);
          }

          App.DB.save();
          App.UI.Toast.show(App.I18n.t('common.componentSaved', 'Component saved'));
          App.Core.Router.navigate('components');
        }
      }
    ]);
  }
};
