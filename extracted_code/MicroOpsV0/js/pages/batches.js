App.UI.Views.Batches = {
  render(root) {
    const batches = App.Data.batches || [];
    const products = App.Data.products || [];
    const components = App.Data.components || [];

    const getItemName = (batch) => {
      if (batch.productId) {
        const p = products.find(x => x.id === batch.productId);
        return p ? (p.nameDE || p.nameEN || p.internalArticleNumber) : batch.productId;
      }
      if (batch.componentId) {
        const c = components.find(x => x.id === batch.componentId);
        return c ? (c.description || c.componentNumber) : batch.componentId;
      }
      return '-';
    };

    const getStatusBadge = (batch) => {
      const now = new Date();
      if (batch.qcStatus === 'rejected') return '<span class="tag tag-danger">Rejected</span>';
      if (batch.qcStatus === 'quarantine') return '<span class="tag tag-warning">Quarantine</span>';
      if (batch.expiryDate && new Date(batch.expiryDate) < now) return '<span class="tag tag-danger">Expired</span>';
      if (batch.expiryDate) {
        const daysToExpiry = Math.ceil((new Date(batch.expiryDate) - now) / (1000*60*60*24));
        if (daysToExpiry <= 30) return '<span class="tag tag-warning">Expiring</span>';
      }
      if (batch.qcStatus === 'released') return '<span class="tag tag-success">Released</span>';
      return '<span class="tag tag-muted">Pending QC</span>';
    };

    root.innerHTML = `
      <div class="card-soft">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 style="font-size:16px; font-weight:600;">Batch / LOT Management</h3>
          <button class="btn btn-primary" id="btn-add-batch">+ Create Batch</button>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>${App.I18n.t('common.lotNumber', 'LOT Number')}</th>
              <th>${App.I18n.t('common.item', 'Item')}</th>
              <th>${App.I18n.t('common.type', 'Type')}</th>
              <th style="text-align:right;">${App.I18n.t('common.qty', 'Qty')}</th>
              <th>${App.I18n.t('common.expiry', 'Expiry')}</th>
              <th>${App.I18n.t('common.status', 'Status')}</th>
              <th>${App.I18n.t('common.created', 'Created')}</th>
              <th style="text-align:right;">${App.I18n.t('common.actions', 'Actions')}</th>
            </tr>
          </thead>
          <tbody>
            ${batches.length > 0 ? batches.map(b => `
              <tr>
                <td><strong>${b.lotNumber}</strong></td>
                <td>${getItemName(b)}</td>
                <td>${b.productId ? 'Product' : 'Component'}</td>
                <td style="text-align:right;">${b.quantity || 0}</td>
                <td>${b.expiryDate || '-'}</td>
                <td>${getStatusBadge(b)}</td>
                <td>${b.createdAt ? b.createdAt.split('T')[0] : '-'}</td>
                <td style="text-align:right;">
                  <button class="btn btn-ghost btn-edit-batch" data-id="${b.id}" title="${App.I18n.t('common.edit', 'Edit')}" aria-label="Edit batch">✏️</button>
                  <button class="btn btn-ghost btn-qc-batch" data-id="${b.id}" title="QC" aria-label="Quality control">🔬</button>
                  <button class="btn btn-ghost btn-trace-batch" data-id="${b.id}" title="${App.I18n.t('common.trace', 'Trace')}" aria-label="Trace batch">🔍</button>
                </td>
              </tr>
            `).join('') : '<tr><td colspan="8" style="text-align:center;color:var(--color-text-muted);">No batches</td></tr>'}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('btn-add-batch')?.addEventListener('click', () => this.openBatchModal());

    root.querySelectorAll('.btn-edit-batch').forEach(btn => {
      btn.addEventListener('click', () => this.openBatchModal(btn.getAttribute('data-id')));
    });

    root.querySelectorAll('.btn-qc-batch').forEach(btn => {
      btn.addEventListener('click', () => this.openQCModal(btn.getAttribute('data-id')));
    });

    root.querySelectorAll('.btn-trace-batch').forEach(btn => {
      btn.addEventListener('click', () => this.openTraceModal(btn.getAttribute('data-id')));
    });
  },

  openBatchModal(id) {
    const batches = App.Data.batches || [];
    const isEdit = !!id;
    const batch = isEdit ? batches.find(b => b.id === id) : {};

    const products = App.Data.products || [];
    const components = App.Data.components || [];

    const prodOpts = products.map(p =>
      `<option value="${p.id}" ${batch.productId === p.id ? 'selected' : ''}>${p.internalArticleNumber} - ${p.nameDE || p.nameEN}</option>`
    ).join('');

    const compOpts = components.map(c =>
      `<option value="${c.id}" ${batch.componentId === c.id ? 'selected' : ''}>${c.componentNumber} - ${c.description}</option>`
    ).join('');

    const today = new Date().toISOString().split('T')[0];

    const body = `
      <div class="grid grid-2" style="gap:12px;">
        <div>
          <label class="field-label">LOT Number *</label>
          <input id="batch-lot" class="input" value="${batch.lotNumber || this.generateLotNumber()}" />
        </div>
        <div>
          <label class="field-label">Type</label>
          <select id="batch-type" class="input">
            <option value="product" ${batch.productId ? 'selected' : ''}>Product</option>
            <option value="component" ${batch.componentId ? 'selected' : ''}>Component</option>
          </select>
        </div>
      </div>
      <div id="batch-product-row" style="margin-top:8px; ${batch.componentId ? 'display:none;' : ''}">
        <label class="field-label">Product</label>
        <select id="batch-product" class="input">${prodOpts}</select>
      </div>
      <div id="batch-component-row" style="margin-top:8px; ${batch.productId || !batch.componentId ? 'display:none;' : ''}">
        <label class="field-label">Component</label>
        <select id="batch-component" class="input">${compOpts}</select>
      </div>
      <div class="grid grid-2" style="gap:12px; margin-top:8px;">
        <div>
          <label class="field-label">Quantity</label>
          <input id="batch-qty" class="input" type="number" value="${batch.quantity || 0}" />
        </div>
        <div>
          <label class="field-label">Production Date</label>
          <input id="batch-proddate" class="input" type="date" value="${batch.productionDate || today}" />
        </div>
      </div>
      <div class="grid grid-2" style="gap:12px; margin-top:8px;">
        <div>
          <label class="field-label">Expiry Date</label>
          <input id="batch-expiry" class="input" type="date" value="${batch.expiryDate || ''}" />
        </div>
        <div>
          <label class="field-label">Supplier LOT (if received)</label>
          <input id="batch-supplier-lot" class="input" value="${batch.supplierLot || ''}" />
        </div>
      </div>
      <div style="margin-top:8px;">
        <label class="field-label">Notes</label>
        <textarea id="batch-notes" class="input" rows="2">${batch.notes || ''}</textarea>
      </div>
    `;

    App.UI.Modal.open(isEdit ? 'Edit Batch' : 'Create Batch', body, [
      { text: 'Cancel', variant: 'ghost', onClick: () => {} },
      {
        text: 'Save',
        variant: 'primary',
        onClick: () => {
          const lotNumber = document.getElementById('batch-lot').value.trim();
          if (!lotNumber) {
            App.UI.Toast.show('LOT number is required');
            return false;
          }

          const type = document.getElementById('batch-type').value;
          const newBatch = {
            id: isEdit ? batch.id : App.Utils.generateId('lot'),
            lotNumber,
            productId: type === 'product' ? document.getElementById('batch-product').value : null,
            componentId: type === 'component' ? document.getElementById('batch-component').value : null,
            quantity: parseFloat(document.getElementById('batch-qty').value) || 0,
            productionDate: document.getElementById('batch-proddate').value || null,
            expiryDate: document.getElementById('batch-expiry').value || null,
            supplierLot: document.getElementById('batch-supplier-lot').value.trim() || null,
            notes: document.getElementById('batch-notes').value.trim() || null,
            qcStatus: isEdit ? batch.qcStatus : 'pending',
            createdAt: isEdit ? batch.createdAt : new Date().toISOString(),
            createdBy: App.Services.Auth.currentUser?.id
          };

          if (isEdit) {
            const idx = batches.findIndex(b => b.id === id);
            if (idx >= 0) batches[idx] = { ...batches[idx], ...newBatch };
          } else {
            batches.push(newBatch);
          }

          App.DB.save();
          App.UI.Toast.show('Batch saved');
          App.Core.Router.navigate('batches');
        }
      }
    ]);

    setTimeout(() => {
      const typeSelect = document.getElementById('batch-type');
      if (typeSelect) {
        typeSelect.onchange = () => {
          document.getElementById('batch-product-row').style.display = typeSelect.value === 'product' ? 'block' : 'none';
          document.getElementById('batch-component-row').style.display = typeSelect.value === 'component' ? 'block' : 'none';
        };
      }
    }, 50);
  },

  openQCModal(id) {
    const batches = App.Data.batches || [];
    const batch = batches.find(b => b.id === id);
    if (!batch) return;

    const statuses = ['pending', 'quarantine', 'released', 'rejected'];
    const statusOpts = statuses.map(s =>
      `<option value="${s}" ${batch.qcStatus === s ? 'selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`
    ).join('');

    const body = `
      <div>
        <p style="margin-bottom:12px;">LOT: <strong>${batch.lotNumber}</strong></p>
        <label class="field-label">QC Status</label>
        <select id="qc-status" class="input">${statusOpts}</select>
        <label class="field-label" style="margin-top:8px;">Inspector</label>
        <input id="qc-inspector" class="input" value="${batch.qcInspector || ''}" />
        <label class="field-label" style="margin-top:8px;">QC Date</label>
        <input id="qc-date" class="input" type="date" value="${batch.qcDate || new Date().toISOString().split('T')[0]}" />
        <label class="field-label" style="margin-top:8px;">QC Notes</label>
        <textarea id="qc-notes" class="input" rows="3">${batch.qcNotes || ''}</textarea>
      </div>
    `;

    App.UI.Modal.open(App.I18n.t('common.qualityControl', 'Quality Control'), body, [
      { text: 'Cancel', variant: 'ghost', onClick: () => {} },
      {
        text: 'Save QC',
        variant: 'primary',
        onClick: () => {
          batch.qcStatus = document.getElementById('qc-status').value;
          batch.qcInspector = document.getElementById('qc-inspector').value.trim();
          batch.qcDate = document.getElementById('qc-date').value;
          batch.qcNotes = document.getElementById('qc-notes').value.trim();
          App.DB.save();
          App.UI.Toast.show('QC status updated');
          App.Core.Router.navigate('batches');
        }
      }
    ]);
  },

  openTraceModal(id) {
    const batches = App.Data.batches || [];
    const batch = batches.find(b => b.id === id);
    if (!batch) return;

    const movements = App.Data.movements || [];
    const productionOrders = App.Data.productionOrders || [];

    const relatedMovements = movements.filter(m => m.batchId === id || m.sourceBatchId === id);
    const usedInProduction = productionOrders.filter(po =>
      (po.componentBatches || []).some(cb => cb.batchId === id)
    );
    const producedFrom = productionOrders.filter(po => po.outputBatchId === id);

    const body = `
      <div>
        <h4 style="margin-bottom:8px;">LOT: ${batch.lotNumber}</h4>

        <div style="margin-top:12px;">
          <strong>Forward Traceability (Used In):</strong>
          ${usedInProduction.length > 0 ? `
            <ul style="margin:8px 0 0 16px; font-size:13px;">
              ${usedInProduction.map(po => `<li>Production Order ${po.orderNumber}</li>`).join('')}
            </ul>
          ` : '<p style="font-size:13px; color:var(--color-text-muted);">Not used in any production</p>'}
        </div>

        <div style="margin-top:12px;">
          <strong>Reverse Traceability (Produced From):</strong>
          ${producedFrom.length > 0 ? `
            <ul style="margin:8px 0 0 16px; font-size:13px;">
              ${producedFrom.map(po => `<li>Production Order ${po.orderNumber}</li>`).join('')}
            </ul>
          ` : '<p style="font-size:13px; color:var(--color-text-muted);">Not a production output</p>'}
        </div>

        <div style="margin-top:12px;">
          <strong>Stock Movements:</strong>
          ${relatedMovements.length > 0 ? `
            <div style="max-height:150px; overflow-y:auto; margin-top:8px;">
              ${relatedMovements.map(m => `
                <div style="padding:6px; border-bottom:1px solid var(--color-border); font-size:12px;">
                  ${m.date?.split('T')[0] || '-'} | ${m.type} | ${m.direction} | Qty: ${m.quantity}
                </div>
              `).join('')}
            </div>
          ` : '<p style="font-size:13px; color:var(--color-text-muted);">No movements recorded</p>'}
        </div>
      </div>
    `;

    App.UI.Modal.open(App.I18n.t('common.batchTraceability', 'Batch Traceability'), body, [
      { text: 'Close', variant: 'ghost', onClick: () => {} }
    ]);
  },

  generateLotNumber() {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const seq = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
    return `${yy}${mm}${dd}-${seq}`;
  }
};
