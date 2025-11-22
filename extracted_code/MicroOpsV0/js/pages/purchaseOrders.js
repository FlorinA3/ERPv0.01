App.UI.Views.PurchaseOrders = {
  render(root) {
    const t = (key, fallback) => App.I18n.t(`purchaseOrders.${key}`, fallback);
    const esc = App.Utils.escapeHtml;
    const pos = App.Data.purchaseOrders || [];
    const suppliers = App.Data.suppliers || [];

    const getSupplierName = (supplierId) => {
      const s = suppliers.find(x => x.id === supplierId);
      return s ? s.name : supplierId;
    };

    const getStatusBadge = (status) => {
      const styles = {
        draft: 'background:#e5e7eb;color:#374151;',
        sent: 'background:#dbeafe;color:#1d4ed8;',
        confirmed: 'background:#fef3c7;color:#d97706;',
        received: 'background:#d1fae5;color:#059669;',
        closed: 'background:#f3f4f6;color:#6b7280;',
        cancelled: 'background:#fee2e2;color:#dc2626;'
      };
      return `<span class="tag" style="${styles[status] || ''}">${status?.toUpperCase() || 'DRAFT'}</span>`;
    };

    root.innerHTML = `
      <div class="card-soft">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 style="font-size:16px; font-weight:600;">${t('title', 'Purchase Orders')}</h3>
          <button class="btn btn-primary" id="btn-add-po">${t('createPO', '+ Create PO')}</button>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>${App.I18n.t('common.poNumber', 'PO Number')}</th>
              <th>${App.I18n.t('common.supplier', 'Supplier')}</th>
              <th>${App.I18n.t('common.status', 'Status')}</th>
              <th>${App.I18n.t('common.date', 'Date')}</th>
              <th>${App.I18n.t('purchaseOrders.expected', 'Expected')}</th>
              <th style="text-align:right;">${App.I18n.t('common.total', 'Total')}</th>
              <th style="text-align:right;">${App.I18n.t('common.actions', 'Actions')}</th>
            </tr>
          </thead>
          <tbody>
            ${pos.length > 0 ? pos.map(po => `
              <tr>
                <td><strong>${esc(po.poNumber)}</strong></td>
                <td>${esc(getSupplierName(po.supplierId))}</td>
                <td>${getStatusBadge(po.status)}</td>
                <td>${po.orderDate || '-'}</td>
                <td>${po.expectedDate || '-'}</td>
                <td style="text-align:right;">${App.Utils.formatCurrency(po.totalNet || 0)}</td>
                <td style="text-align:right;">
                  <button class="btn btn-ghost btn-edit-po" data-id="${po.id}" title="${App.I18n.t('common.edit', 'Edit')}" aria-label="${t('editPO', 'Edit purchase order')}">✏️</button>
                  <button class="btn btn-ghost btn-receive-po" data-id="${po.id}" title="${App.I18n.t('common.receive', 'Receive')}" aria-label="${t('receivingPO', 'Receive stock')}" ${po.status === 'received' || po.status === 'closed' ? 'disabled' : ''}>📥</button>
                  <button class="btn btn-ghost btn-view-po" data-id="${po.id}" title="${App.I18n.t('common.view', 'View')}" aria-label="${App.I18n.t('common.purchaseOrderDetails', 'View purchase order')}">👁️</button>
                </td>
              </tr>
            `).join('') : `<tr><td colspan="7" style="text-align:center;color:var(--color-text-muted);">${t('noPurchaseOrders', 'No purchase orders')}</td></tr>`}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('btn-add-po')?.addEventListener('click', () => this.openPOModal());

    root.querySelectorAll('.btn-edit-po').forEach(btn => {
      btn.addEventListener('click', () => this.openPOModal(btn.getAttribute('data-id')));
    });

    root.querySelectorAll('.btn-receive-po').forEach(btn => {
      btn.addEventListener('click', () => this.receiveOrder(btn.getAttribute('data-id')));
    });

    root.querySelectorAll('.btn-view-po').forEach(btn => {
      btn.addEventListener('click', () => this.viewOrder(btn.getAttribute('data-id')));
    });
  },

  openPOModal(id) {
    const pos = App.Data.purchaseOrders || [];
    const isEdit = !!id;
    const po = isEdit ? pos.find(p => p.id === id) : {};

    const suppliers = App.Data.suppliers || [];
    const components = App.Data.components || [];
    const products = App.Data.products || [];

    const supplierOpts = suppliers.map(s =>
      `<option value="${s.id}" ${po.supplierId === s.id ? 'selected' : ''}>${s.name}</option>`
    ).join('');

    const today = new Date().toISOString().split('T')[0];
    const statuses = ['draft', 'sent', 'confirmed', 'received', 'closed', 'cancelled'];
    const statusOpts = statuses.map(s =>
      `<option value="${s}" ${(po.status || 'draft') === s ? 'selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`
    ).join('');

    const itemOpts = [
      '<option value="">-- Select Item --</option>',
      '<optgroup label="Components">',
      ...components.map(c => `<option value="comp:${c.id}">${c.componentNumber} - ${c.description}</option>`),
      '</optgroup>',
      '<optgroup label="Products">',
      ...products.map(p => `<option value="prod:${p.id}">${p.internalArticleNumber} - ${p.nameDE || p.nameEN}</option>`),
      '</optgroup>'
    ].join('');

    const getLineRow = (line = {}) => `
      <div class="po-line-row" style="display:flex; gap:8px; margin-bottom:8px; align-items:center;">
        <select class="input po-line-item" style="flex:2;">${itemOpts}</select>
        <input type="number" class="input po-line-qty" style="width:80px;" value="${line.quantity || 1}" min="1" placeholder="Qty">
        <input type="number" class="input po-line-price" style="width:100px;" value="${line.unitPrice || 0}" step="0.01" placeholder="Price">
        <button class="btn btn-ghost po-line-remove">❌</button>
      </div>
    `;

    const existingLines = (po.lines || []).map(l => getLineRow(l)).join('');

    const body = `
      <div class="grid grid-2" style="gap:12px;">
        <div>
          <label class="field-label">PO Number</label>
          <input id="po-number" class="input" value="${po.poNumber || this.generatePONumber()}" />
        </div>
        <div>
          <label class="field-label">Status</label>
          <select id="po-status" class="input">${statusOpts}</select>
        </div>
      </div>
      <div style="margin-top:8px;">
        <label class="field-label">Supplier *</label>
        <select id="po-supplier" class="input">${supplierOpts}</select>
      </div>
      <div class="grid grid-2" style="gap:12px; margin-top:8px;">
        <div>
          <label class="field-label">Order Date</label>
          <input id="po-date" class="input" type="date" value="${po.orderDate || today}" />
        </div>
        <div>
          <label class="field-label">Expected Delivery</label>
          <input id="po-expected" class="input" type="date" value="${po.expectedDate || ''}" />
        </div>
      </div>
      <div style="margin-top:12px;">
        <label class="field-label">Line Items</label>
        <div id="po-lines-container" style="max-height:200px; overflow-y:auto; border:1px solid var(--color-border); padding:8px; border-radius:8px;">
          ${existingLines || getLineRow()}
        </div>
        <button class="btn btn-ghost" id="btn-add-po-line" style="margin-top:8px;">+ Add Line</button>
      </div>
      <div style="margin-top:8px;">
        <label class="field-label">Notes</label>
        <textarea id="po-notes" class="input" rows="2">${po.notes || ''}</textarea>
      </div>
    `;

    App.UI.Modal.open(isEdit ? 'Edit Purchase Order' : 'Create Purchase Order', body, [
      { text: 'Cancel', variant: 'ghost', onClick: () => {} },
      {
        text: 'Save',
        variant: 'primary',
        onClick: () => {
          const supplierId = document.getElementById('po-supplier').value;
          if (!supplierId) {
            App.UI.Toast.show('Supplier is required');
            return false;
          }

          const lines = [];
          let totalNet = 0;
          document.querySelectorAll('.po-line-row').forEach(row => {
            const itemVal = row.querySelector('.po-line-item').value;
            const qty = parseFloat(row.querySelector('.po-line-qty').value) || 0;
            const price = parseFloat(row.querySelector('.po-line-price').value) || 0;
            if (itemVal && qty > 0) {
              const [type, itemId] = itemVal.split(':');
              const lineNet = qty * price;
              totalNet += lineNet;
              lines.push({
                itemType: type === 'comp' ? 'component' : 'product',
                itemId,
                quantity: qty,
                unitPrice: price,
                lineNet
              });
            }
          });

          const newPO = {
            id: isEdit ? po.id : App.Utils.generateId('po'),
            poNumber: document.getElementById('po-number').value.trim(),
            supplierId,
            status: document.getElementById('po-status').value,
            orderDate: document.getElementById('po-date').value,
            expectedDate: document.getElementById('po-expected').value || null,
            lines,
            totalNet,
            notes: document.getElementById('po-notes').value.trim(),
            createdAt: isEdit ? po.createdAt : new Date().toISOString(),
            createdBy: App.Services.Auth.currentUser?.id
          };

          if (isEdit) {
            const idx = pos.findIndex(p => p.id === id);
            if (idx >= 0) pos[idx] = newPO;
          } else {
            pos.push(newPO);
          }

          App.DB.save();
          App.UI.Toast.show(App.I18n.t('common.poSaved', 'Purchase order saved'));
          App.Core.Router.navigate('purchaseOrders');
        }
      }
    ]);

    setTimeout(() => {
      const container = document.getElementById('po-lines-container');
      const addBtn = document.getElementById('btn-add-po-line');

      const wireDelete = () => {
        container.querySelectorAll('.po-line-remove').forEach(btn => {
          btn.onclick = () => {
            if (container.querySelectorAll('.po-line-row').length > 1) {
              btn.closest('.po-line-row').remove();
            }
          };
        });
      };

      if (addBtn) {
        addBtn.onclick = () => {
          container.insertAdjacentHTML('beforeend', getLineRow());
          wireDelete();
        };
      }
      wireDelete();
    }, 50);
  },

  receiveOrder(id) {
    const pos = App.Data.purchaseOrders || [];
    const po = pos.find(p => p.id === id);
    if (!po) return;

    const body = `
      <p>Receiving PO: <strong>${po.poNumber}</strong></p>
      <p style="font-size:13px; color:var(--color-text-muted); margin-top:8px;">
        This will add ${po.lines?.length || 0} line items to stock.
      </p>
      <div style="margin-top:12px;">
        <label class="field-label">Receive Date</label>
        <input id="receive-date" class="input" type="date" value="${new Date().toISOString().split('T')[0]}" />
      </div>
    `;

    App.UI.Modal.open(App.I18n.t('common.receivePurchaseOrder', 'Receive Purchase Order'), body, [
      { text: 'Cancel', variant: 'ghost', onClick: () => {} },
      {
        text: 'Receive',
        variant: 'primary',
        onClick: () => {
          const receiveDate = document.getElementById('receive-date').value;
          const movements = App.Data.movements || [];

          (po.lines || []).forEach(line => {
            if (line.itemType === 'component') {
              const comp = (App.Data.components || []).find(c => c.id === line.itemId);
              if (comp) {
                comp.stock = (comp.stock || 0) + line.quantity;
                movements.push({
                  id: App.Utils.generateId('mv'),
                  date: receiveDate,
                  type: 'purchase',
                  direction: 'in',
                  componentId: line.itemId,
                  quantity: line.quantity,
                  reference: po.poNumber,
                  notes: 'Received from PO'
                });
              }
            } else {
              const prod = (App.Data.products || []).find(p => p.id === line.itemId);
              if (prod) {
                prod.stock = (prod.stock || 0) + line.quantity;
                movements.push({
                  id: App.Utils.generateId('mv'),
                  date: receiveDate,
                  type: 'purchase',
                  direction: 'in',
                  productId: line.itemId,
                  quantity: line.quantity,
                  reference: po.poNumber,
                  notes: 'Received from PO'
                });
              }
            }
          });

          po.status = 'received';
          po.receivedDate = receiveDate;
          App.DB.save();
          App.UI.Toast.show(App.I18n.t('common.poReceived', 'PO received and stock updated'));
          App.Core.Router.navigate('purchaseOrders');
        }
      }
    ]);
  },

  viewOrder(id) {
    const pos = App.Data.purchaseOrders || [];
    const po = pos.find(p => p.id === id);
    if (!po) return;

    const suppliers = App.Data.suppliers || [];
    const supplier = suppliers.find(s => s.id === po.supplierId);

    const lineItems = (po.lines || []).map(l => {
      let name = '';
      if (l.itemType === 'component') {
        const c = (App.Data.components || []).find(x => x.id === l.itemId);
        name = c ? `${c.componentNumber} - ${c.description}` : l.itemId;
      } else {
        const p = (App.Data.products || []).find(x => x.id === l.itemId);
        name = p ? `${p.internalArticleNumber} - ${p.nameDE || p.nameEN}` : l.itemId;
      }
      return `<tr>
        <td>${name}</td>
        <td style="text-align:right;">${l.quantity}</td>
        <td style="text-align:right;">${App.Utils.formatCurrency(l.unitPrice)}</td>
        <td style="text-align:right;">${App.Utils.formatCurrency(l.lineNet)}</td>
      </tr>`;
    }).join('');

    const body = `
      <div style="margin-bottom:12px;">
        <strong>PO Number:</strong> ${po.poNumber}<br>
        <strong>Supplier:</strong> ${supplier?.name || '-'}<br>
        <strong>Status:</strong> ${po.status}<br>
        <strong>Order Date:</strong> ${po.orderDate}<br>
        <strong>Expected:</strong> ${po.expectedDate || '-'}
      </div>
      <table class="table">
        <thead>
          <tr><th>Item</th><th style="text-align:right;">Qty</th><th style="text-align:right;">Price</th><th style="text-align:right;">Total</th></tr>
        </thead>
        <tbody>${lineItems}</tbody>
        <tfoot>
          <tr><td colspan="3" style="text-align:right;"><strong>Total:</strong></td><td style="text-align:right;"><strong>${App.Utils.formatCurrency(po.totalNet)}</strong></td></tr>
        </tfoot>
      </table>
      ${po.notes ? `<p style="margin-top:8px; font-size:12px; color:var(--color-text-muted);">Notes: ${po.notes}</p>` : ''}
    `;

    App.UI.Modal.open(App.I18n.t('common.purchaseOrderDetails', 'Purchase Order Details'), body, [
      { text: 'Close', variant: 'ghost', onClick: () => {} }
    ]);
  },

  generatePONumber() {
    const config = App.Data.config || {};
    const seq = config.numberSequences || {};
    const year = new Date().getFullYear();
    const next = (seq.lastPurchaseOrderNumber || 0) + 1;
    seq.lastPurchaseOrderNumber = next;
    config.numberSequences = seq;
    App.DB.save();
    return `PO-${year}-${String(next).padStart(4, '0')}`;
  }
};
