App.UI.Views.Inventory = {
  activeTab: 'Finished',

  render(root) {
    const products = App.Data.products || [];
    const components = App.Data.components || [];

    const productItems = products.filter(p => p.type !== 'Service');
    const categories = ['Finished', 'Device', 'Consumable', 'Part'];
    const active = this.activeTab;

    const needsReorder = [
      ...productItems.filter(p => (p.stock || 0) <= (p.reorderPoint || p.minStock || 0) && p.stock > 0),
      ...components.filter(c => (c.stock || 0) <= (c.reorderPoint || c.safetyStock || 0) && c.stock > 0)
    ].slice(0, 10);

    const outOfStock = [
      ...productItems.filter(p => (p.stock || 0) <= 0),
      ...components.filter(c => (c.stock || 0) <= 0)
    ].slice(0, 10);

    const totalValue = productItems.reduce((sum, p) => {
      const price = p.purchasePrice || p.avgPurchasePrice || 0;
      return sum + ((p.stock || 0) * price);
    }, 0);

    const tabsHtml = categories
      .map(cat => {
        const isActive = cat === active;
        return `<button class="inv-tab ${isActive ? 'inv-tab-active' : ''}" data-cat="${cat}">${cat}</button>`;
      })
      .join('');

    const filtered = productItems.filter(p => {
      const t = (p.type || '').toLowerCase();
      return t === active.toLowerCase();
    });

    const rowsHtml = filtered.length > 0 ? filtered.map(p => {
      const stock = p.stock || 0;
      const minStock = p.minStock || 0;
      let stockClass = '';
      let stockBadge = '';

      if (stock <= 0) {
        stockClass = 'color:var(--color-danger); font-weight:500;';
        stockBadge = '<span class="tag tag-danger" style="margin-left:4px;">Out</span>';
      } else if (stock <= minStock) {
        stockClass = 'color:var(--color-warning); font-weight:500;';
        stockBadge = '<span class="tag tag-warning" style="margin-left:4px;">Low</span>';
      }

      return `
        <tr>
          <td><strong>${p.internalArticleNumber || p.sku || '-'}</strong></td>
          <td>${p.nameDE || p.nameEN || '-'}</td>
          <td style="text-align:center; ${stockClass}">${stock}${stockBadge}</td>
          <td style="text-align:center;">${minStock}</td>
          <td style="text-align:right;">${App.Utils.formatCurrency(p.dealerPrice || p.purchasePrice || 0)}</td>
          <td style="text-align:right;">
            <button class="btn btn-ghost btn-receive" data-id="${p.id}" title="${App.I18n.t('common.receiveStock', 'Receive Stock')}" aria-label="Receive stock">⬆️</button>
            <button class="btn btn-ghost btn-adjust" data-id="${p.id}" title="${App.I18n.t('common.adjustStock', 'Adjust Stock')}" aria-label="Adjust stock">🔄</button>
          </td>
        </tr>
      `;
    }).join('') : `<tr><td colspan="6" style="text-align:center; padding:12px; color:var(--color-text-muted);">No items in this category</td></tr>`;

    root.innerHTML = `
      <div class="card-soft" style="margin-bottom:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 style="font-size:16px; font-weight:600;">${App.I18n.t('pages.inventory.title','Inventory')}</h3>
          <div style="display:flex; gap:8px; align-items:center;">
            <button class="btn btn-ghost" id="inv-export">Export CSV</button>
          </div>
        </div>

        <div class="grid grid-3" style="margin-bottom:16px;">
          <div style="padding:12px; background:var(--color-bg); border-radius:6px; text-align:center;">
            <div style="font-size:11px; text-transform:uppercase; color:var(--color-text-muted);">Total Value</div>
            <div style="font-size:20px; font-weight:700; margin-top:4px;">${App.Utils.formatCurrency(totalValue)}</div>
          </div>
          <div style="padding:12px; background:var(--color-bg); border-radius:6px; text-align:center;">
            <div style="font-size:11px; text-transform:uppercase; color:var(--color-text-muted);">Low Stock Items</div>
            <div style="font-size:20px; font-weight:700; margin-top:4px; ${needsReorder.length > 0 ? 'color:#f59e0b;' : ''}">${needsReorder.length}</div>
          </div>
          <div style="padding:12px; background:var(--color-bg); border-radius:6px; text-align:center;">
            <div style="font-size:11px; text-transform:uppercase; color:var(--color-text-muted);">Out of Stock</div>
            <div style="font-size:20px; font-weight:700; margin-top:4px; ${outOfStock.length > 0 ? 'color:#dc2626;' : ''}">${outOfStock.length}</div>
          </div>
        </div>
      </div>

      ${needsReorder.length > 0 ? `
        <div class="card-soft" style="margin-bottom:16px; border-left:3px solid #f59e0b;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <h4 style="font-size:14px; font-weight:600; color:#f59e0b;">📦 Replenishment Suggestions</h4>
            <button class="btn btn-ghost" id="btn-create-all-pos" style="font-size:12px;">Create All POs</button>
          </div>
          <table class="table" style="font-size:13px;">
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align:right;">Stock</th>
                <th style="text-align:right;">Min</th>
                <th style="text-align:right;">Suggested Qty</th>
                <th>Supplier</th>
                <th style="text-align:right;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${needsReorder.map(item => {
                const isProduct = !!item.internalArticleNumber;
                const name = isProduct ? (item.nameDE || item.nameEN) : item.description;
                const sku = isProduct ? item.internalArticleNumber : item.componentNumber;
                const minStock = item.minStock || item.safetyStock || 0;
                const reorderQty = item.reorderQuantity || Math.max(minStock * 2 - (item.stock || 0), minStock);
                const supplier = item.supplierId ?
                  (App.Data.suppliers || []).find(s => s.id === item.supplierId)?.name : '-';
                const hasSupplierId = !!item.supplierId;
                return `
                  <tr>
                    <td><strong>${sku}</strong> - ${name}</td>
                    <td style="text-align:right; color:#f59e0b;">${item.stock || 0}</td>
                    <td style="text-align:right;">${minStock}</td>
                    <td style="text-align:right; font-weight:500;">${Math.ceil(reorderQty)}</td>
                    <td>${supplier}</td>
                    <td style="text-align:right;">
                      ${hasSupplierId ?
                        `<button class="btn btn-ghost btn-create-po" data-id="${item.id}" data-qty="${Math.ceil(reorderQty)}" data-supplier="${item.supplierId}" data-type="${isProduct ? 'product' : 'component'}" title="Create Purchase Order">📋</button>` :
                        `<span style="font-size:11px; color:var(--color-text-muted);">No supplier</span>`
                      }
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      <div class="card-soft">
        <div class="inv-tabs" style="display:flex; gap:8px; margin-bottom:12px;">
          ${tabsHtml}
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product</th>
              <th style="text-align:center;">Stock</th>
              <th style="text-align:center;">Min</th>
              <th style="text-align:right;">Price</th>
              <th style="text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;

    root.querySelectorAll('.inv-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeTab = btn.getAttribute('data-cat');
        this.render(root);
      });
    });

    document.getElementById('inv-export')?.addEventListener('click', () => this.exportInventory());

    root.querySelectorAll('.btn-receive').forEach(btn => {
      btn.addEventListener('click', () => this.receiveStock(btn.getAttribute('data-id')));
    });

    root.querySelectorAll('.btn-adjust').forEach(btn => {
      btn.addEventListener('click', () => this.adjustStock(btn.getAttribute('data-id')));
    });

    // Create PO buttons for replenishment
    root.querySelectorAll('.btn-create-po').forEach(btn => {
      btn.addEventListener('click', () => {
        const itemId = btn.getAttribute('data-id');
        const qty = parseInt(btn.getAttribute('data-qty')) || 1;
        const supplierId = btn.getAttribute('data-supplier');
        const itemType = btn.getAttribute('data-type');
        this.createPurchaseOrder(itemId, qty, supplierId, itemType);
      });
    });

    // Create all POs button
    document.getElementById('btn-create-all-pos')?.addEventListener('click', () => {
      this.createAllPurchaseOrders();
    });
  },

  /**
   * Create a purchase order for a specific item
   */
  createPurchaseOrder(itemId, qty, supplierId, itemType) {
    const pos = App.Data.purchaseOrders || [];
    const supplier = (App.Data.suppliers || []).find(s => s.id === supplierId);

    let itemName, itemSku;
    if (itemType === 'product') {
      const product = (App.Data.products || []).find(p => p.id === itemId);
      itemName = product?.nameDE || product?.nameEN || itemId;
      itemSku = product?.internalArticleNumber || product?.sku || itemId;
    } else {
      const component = (App.Data.components || []).find(c => c.id === itemId);
      itemName = component?.description || itemId;
      itemSku = component?.componentNumber || itemId;
    }

    const po = {
      id: App.Utils.generateId('pu'),
      poNumber: `PU-${Date.now().toString(36).toUpperCase()}`,
      supplierId: supplierId,
      status: 'draft',
      createdAt: new Date().toISOString(),
      createdBy: App.Services.Auth.currentUser?.id,
      items: [{
        itemId: itemId,
        itemType: itemType,
        quantity: qty,
        description: `${itemSku} - ${itemName}`
      }],
      notes: 'Auto-created from replenishment suggestions'
    };

    pos.push(po);
    App.Data.purchaseOrders = pos;
    App.DB.save();

    // Log activity
    if (App.Services.ActivityLog) {
      App.Services.ActivityLog.log('create', 'purchaseOrder', po.id, {
        name: po.poNumber,
        supplier: supplier?.name,
        trigger: 'replenishment_suggestion'
      });
    }

    App.UI.Toast.show(`Purchase Order ${po.poNumber} created for ${itemSku}`);
    this.render(document.getElementById('main-content'));
  },

  /**
   * Create purchase orders for all items with suppliers
   */
  createAllPurchaseOrders() {
    const products = App.Data.products || [];
    const components = App.Data.components || [];

    const needsReorder = [
      ...products.filter(p => p.type !== 'Service' && (p.stock || 0) <= (p.reorderPoint || p.minStock || 0) && p.supplierId),
      ...components.filter(c => (c.stock || 0) <= (c.reorderPoint || c.safetyStock || 0) && c.supplierId)
    ];

    if (needsReorder.length === 0) {
      App.UI.Toast.show('No items with suppliers need reordering');
      return;
    }

    // Group by supplier
    const bySupplier = {};
    needsReorder.forEach(item => {
      const sid = item.supplierId;
      if (!bySupplier[sid]) bySupplier[sid] = [];
      bySupplier[sid].push(item);
    });

    const pos = App.Data.purchaseOrders || [];
    let created = 0;

    // Create one PO per supplier
    Object.entries(bySupplier).forEach(([supplierId, items]) => {
      const supplier = (App.Data.suppliers || []).find(s => s.id === supplierId);

      const poItems = items.map(item => {
        const isProduct = !!item.internalArticleNumber;
        const minStock = item.minStock || item.safetyStock || 0;
        const reorderQty = item.reorderQuantity || Math.max(minStock * 2 - (item.stock || 0), minStock);

        return {
          itemId: item.id,
          itemType: isProduct ? 'product' : 'component',
          quantity: Math.ceil(reorderQty),
          description: `${isProduct ? item.internalArticleNumber : item.componentNumber} - ${isProduct ? (item.nameDE || item.nameEN) : item.description}`
        };
      });

      const po = {
        id: App.Utils.generateId('pu'),
        poNumber: `PU-${Date.now().toString(36).toUpperCase()}-${created}`,
        supplierId: supplierId,
        status: 'draft',
        createdAt: new Date().toISOString(),
        createdBy: App.Services.Auth.currentUser?.id,
        items: poItems,
        notes: `Auto-created from replenishment suggestions (${poItems.length} items)`
      };

      pos.push(po);
      created++;

      // Log activity
      if (App.Services.ActivityLog) {
        App.Services.ActivityLog.log('create', 'purchaseOrder', po.id, {
          name: po.poNumber,
          supplier: supplier?.name,
          itemCount: poItems.length,
          trigger: 'bulk_replenishment'
        });
      }
    });

    App.Data.purchaseOrders = pos;
    App.DB.save();

    App.UI.Toast.show(`${created} Purchase Order(s) created for ${needsReorder.length} items`);
    this.render(document.getElementById('main-content'));
  },

  receiveStock(id) {
    const products = App.Data.products || [];
    const item = products.find(p => p.id === id);
    if (!item) return;

    const body = `
      <div>
        <p style="margin-bottom:12px;">
          <strong>${item.internalArticleNumber || item.sku}</strong> - ${item.nameDE || item.nameEN}<br/>
          Current Stock: <strong>${item.stock || 0}</strong>
        </p>
        <label class="field-label">Quantity to Add</label>
        <input id="receive-qty" type="number" class="input" min="1" value="10" />
        <label class="field-label" style="margin-top:8px;">Reference (PO Number)</label>
        <input id="receive-ref" class="input" placeholder="e.g., PO-2025-0001" />
      </div>
    `;

    App.UI.Modal.open(App.I18n.t('common.receiveStock', 'Receive Stock'), body, [
      { text: 'Cancel', variant: 'ghost', onClick: () => {} },
      {
        text: 'Receive',
        variant: 'primary',
        onClick: () => {
          const qty = parseInt(document.getElementById('receive-qty').value) || 0;
          const ref = document.getElementById('receive-ref').value.trim();
          if (qty <= 0) {
            App.UI.Toast.show('Enter a valid quantity');
            return false;
          }

          item.stock = (item.stock || 0) + qty;

          const movements = App.Data.movements || [];
          movements.push({
            id: App.Utils.generateId('mv'),
            date: new Date().toISOString(),
            type: 'receipt',
            direction: 'in',
            productId: id,
            quantity: qty,
            reference: ref || 'Manual receipt',
            notes: `Received ${qty} units`
          });

          App.DB.save();
          App.UI.Toast.show(`Received ${qty} units`);
          App.Core.Router.navigate('inventory');
        }
      }
    ]);
  },

  adjustStock(id) {
    const products = App.Data.products || [];
    const item = products.find(p => p.id === id);
    if (!item) return;

    const body = `
      <div>
        <p style="margin-bottom:12px;">
          <strong>${item.internalArticleNumber || item.sku}</strong> - ${item.nameDE || item.nameEN}<br/>
          Current Stock: <strong>${item.stock || 0}</strong>
        </p>
        <label class="field-label">New Stock Level</label>
        <input id="adjust-qty" type="number" class="input" min="0" value="${item.stock || 0}" />
        <label class="field-label" style="margin-top:8px;">Reason</label>
        <select id="adjust-reason" class="input">
          <option value="count">Physical Count</option>
          <option value="damage">Damaged/Expired</option>
          <option value="correction">Correction</option>
          <option value="other">Other</option>
        </select>
        <label class="field-label" style="margin-top:8px;">Notes</label>
        <textarea id="adjust-notes" class="input" rows="2"></textarea>
      </div>
    `;

    App.UI.Modal.open(App.I18n.t('common.adjustStock', 'Adjust Stock'), body, [
      { text: 'Cancel', variant: 'ghost', onClick: () => {} },
      {
        text: 'Adjust',
        variant: 'primary',
        onClick: () => {
          const newQty = parseInt(document.getElementById('adjust-qty').value) || 0;
          const reason = document.getElementById('adjust-reason').value;
          const notes = document.getElementById('adjust-notes').value.trim();
          const diff = newQty - (item.stock || 0);

          item.stock = newQty;

          const movements = App.Data.movements || [];
          movements.push({
            id: App.Utils.generateId('mv'),
            date: new Date().toISOString(),
            type: 'adjustment',
            direction: diff >= 0 ? 'in' : 'out',
            productId: id,
            quantity: Math.abs(diff),
            reference: reason,
            notes: notes || `Adjusted from ${item.stock - diff} to ${newQty}`
          });

          App.DB.save();
          App.UI.Toast.show('Stock adjusted');
          App.Core.Router.navigate('inventory');
        }
      }
    ]);
  },

  exportInventory() {
    const products = App.Data.products || [];
    const headers = ['SKU', 'Product', 'Type', 'Stock', 'Min Stock', 'Price', 'Value'];
    const rows = products
      .filter(p => p.type !== 'Service')
      .map(p => {
        const stock = p.stock || 0;
        const price = p.purchasePrice || p.avgPurchasePrice || 0;
        return [
          p.internalArticleNumber || p.sku || '',
          p.nameDE || p.nameEN || '',
          p.type || '',
          stock,
          p.minStock || 0,
          price.toFixed(2),
          (stock * price).toFixed(2)
        ];
      });

    // Use secure CSV utility with injection protection and BOM
    App.Utils.exportCSV(headers, rows, 'inventory.csv');
  }
};
