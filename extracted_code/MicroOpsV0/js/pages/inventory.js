App.UI.Views.Inventory = {
  // Legacy local-mode inventory UI: mutates App.Data for offline/demo; remote/GA stock changes must go through backend inventory APIs.
  activeTab: 'Finished',

  render(root) {
    const t = (key, fallback) => App.I18n.t(`inventory.${key}`, fallback);
    const esc = App.Utils.escapeHtml;
    const products = App.Data.products || [];
    const components = App.Data.components || [];
    const localDemo = App.Config?.localOnlyDemoMode === true;
    const offline = App.Services?.Offline?.isOffline?.();

    const productItems = products.filter(p => p.type !== 'Service');
    const categories = ['Finished', 'Device', 'Consumable', 'Part', 'Components'];
    const categoryLabels = {
      'Finished': t('finished', 'Finished'),
      'Device': t('device', 'Device'),
      'Consumable': t('consumable', 'Consumable'),
      'Part': t('part', 'Part'),
      'Components': t('components', 'Components')
    };
    const active = this.activeTab;
    const isComponentsTab = active === 'Components';

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
        return `<button class="inv-tab ${isActive ? 'inv-tab-active' : ''}" data-cat="${cat}">${categoryLabels[cat] || cat}</button>`;
      })
      .join('');

    const filtered = productItems.filter(p => {
      const pType = (p.type || '').toLowerCase();
      return pType === active.toLowerCase();
    });

    // Generate table content based on whether we're showing products or components
    let tableHeaderHtml, rowsHtml;

    if (isComponentsTab) {
      tableHeaderHtml = `
        <tr>
          <th>${t('componentNo', 'Component No')}</th>
          <th>${t('description', 'Description')}</th>
          <th style="text-align:center;">${t('stock', 'Stock')}</th>
          <th style="text-align:center;">${t('min', 'Min')}</th>
          <th style="text-align:right;">${t('price', 'Price')}</th>
          <th style="text-align:right;">${t('actions', 'Actions')}</th>
        </tr>
      `;
      rowsHtml = components.length > 0 ? components.map(c => {
        const stock = c.stock || 0;
        const minStock = c.safetyStock || 0;
        let stockClass = '';
        let stockBadge = '';

        if (stock <= 0) {
          stockClass = 'color:var(--color-danger); font-weight:500;';
          stockBadge = `<span class="tag tag-danger" style="margin-left:4px;">${t('out', 'Out')}</span>`;
        } else if (stock <= minStock) {
          stockClass = 'color:var(--color-warning); font-weight:500;';
          stockBadge = `<span class="tag tag-warning" style="margin-left:4px;">${t('low', 'Low')}</span>`;
        }

        return `
          <tr>
            <td><strong>${esc(c.componentNumber || '-')}</strong></td>
            <td>${esc(c.description || '-')}</td>
            <td style="text-align:center; ${stockClass}">${stock}${stockBadge}</td>
            <td style="text-align:center;">${minStock}</td>
            <td style="text-align:right;">${App.Utils.formatCurrency(c.purchasePrice || 0)}</td>
            <td style="text-align:right;">
              <button class="btn btn-ghost btn-edit-component" data-id="${c.id}" title="${App.I18n.t('common.edit', 'Edit')}" aria-label="${App.I18n.t('common.edit', 'Edit')}">✏️</button>
              <button class="btn btn-ghost btn-receive-component" data-id="${c.id}" title="${!localDemo ? 'Local demo only (not GA)' : offline ? App.I18n.t('common.offlineMode', 'Offline – posting blocked') : App.I18n.t('common.receiveStock', 'Receive Stock')}" aria-label="${App.I18n.t('common.receiveStock', 'Receive Stock')}" ${(!localDemo || offline) ? 'disabled' : ''}>⬆️</button>
              <button class="btn btn-ghost btn-adjust-component" data-id="${c.id}" title="${!localDemo ? 'Local demo only (not GA)' : offline ? App.I18n.t('common.offlineMode', 'Offline – posting blocked') : App.I18n.t('common.adjustStock', 'Adjust Stock')}" aria-label="${App.I18n.t('common.adjustStock', 'Adjust Stock')}" ${(!localDemo || offline) ? 'disabled' : ''}>🔄</button>
              <button class="btn btn-ghost btn-delete-component" data-id="${c.id}" title="${App.I18n.t('common.delete', 'Delete')}" aria-label="${App.I18n.t('common.delete', 'Delete')}">🗑️</button>
            </td>
          </tr>
        `;
      }).join('') : `<tr><td colspan="6" style="text-align:center; padding:12px; color:var(--color-text-muted);">${t('noComponents', 'No components')}</td></tr>`;
    } else {
      tableHeaderHtml = `
        <tr>
          <th>${t('sku', 'SKU')}</th>
          <th>${t('product', 'Product')}</th>
          <th style="text-align:center;">${t('stock', 'Stock')}</th>
          <th style="text-align:center;">${t('min', 'Min')}</th>
          <th style="text-align:right;">${t('price', 'Price')}</th>
          <th style="text-align:right;">${t('actions', 'Actions')}</th>
        </tr>
      `;
      rowsHtml = filtered.length > 0 ? filtered.map(p => {
        const stock = p.stock || 0;
        const minStock = p.minStock || 0;
        let stockClass = '';
        let stockBadge = '';

        if (stock <= 0) {
          stockClass = 'color:var(--color-danger); font-weight:500;';
          stockBadge = `<span class="tag tag-danger" style="margin-left:4px;">${t('out', 'Out')}</span>`;
        } else if (stock <= minStock) {
          stockClass = 'color:var(--color-warning); font-weight:500;';
          stockBadge = `<span class="tag tag-warning" style="margin-left:4px;">${t('low', 'Low')}</span>`;
        }

        return `
          <tr>
            <td><strong>${esc(p.internalArticleNumber || p.sku || '-')}</strong></td>
            <td>${esc(p.nameDE || p.nameEN || '-')}</td>
            <td style="text-align:center; ${stockClass}">${stock}${stockBadge}</td>
            <td style="text-align:center;">${minStock}</td>
            <td style="text-align:right;">${App.Utils.formatCurrency(p.dealerPrice || p.purchasePrice || 0)}</td>
            <td style="text-align:right;">
              <button class="btn btn-ghost btn-edit-product" data-id="${p.id}" title="${App.I18n.t('common.edit', 'Edit')}" aria-label="${App.I18n.t('common.edit', 'Edit')}">✏️</button>
              <button class="btn btn-ghost btn-receive" data-id="${p.id}" title="${!localDemo ? 'Local demo only (not GA)' : offline ? App.I18n.t('common.offlineMode', 'Offline – posting blocked') : App.I18n.t('common.receiveStock', 'Receive Stock')}" aria-label="${App.I18n.t('common.receiveStock', 'Receive Stock')}" ${(!localDemo || offline) ? 'disabled' : ''}>⬆️</button>
              <button class="btn btn-ghost btn-adjust" data-id="${p.id}" title="${!localDemo ? 'Local demo only (not GA)' : offline ? App.I18n.t('common.offlineMode', 'Offline – posting blocked') : App.I18n.t('common.adjustStock', 'Adjust Stock')}" aria-label="${App.I18n.t('common.adjustStock', 'Adjust Stock')}" ${(!localDemo || offline) ? 'disabled' : ''}>🔄</button>
              <button class="btn btn-ghost btn-delete-product" data-id="${p.id}" title="${App.I18n.t('common.delete', 'Delete')}" aria-label="${App.I18n.t('common.delete', 'Delete')}">🗑️</button>
            </td>
          </tr>
        `;
      }).join('') : `<tr><td colspan="6" style="text-align:center; padding:12px; color:var(--color-text-muted);">${t('noItemsInCategory', 'No items in this category')}</td></tr>`;
    }

    root.innerHTML = `
      <div class="card-soft" style="margin-bottom:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 style="font-size:16px; font-weight:600;">${App.I18n.t('pages.inventory.title','Inventory')}</h3>
          <div style="display:flex; gap:8px; align-items:center;">
            <button class="btn btn-ghost" id="inv-export">${t('exportCsv', 'Export CSV')}</button>
          </div>
        </div>
        ${!localDemo ? `<div style="margin-bottom:12px; padding:8px 10px; background:var(--color-bg, #f8fafc); border:1px dashed var(--color-border); border-radius:6px; font-size:12px; color:var(--color-text-muted);">
          Stock receive/adjust actions are demo-only and disabled in GA backend mode. Enable App.Config.localOnlyDemoMode only for single-user local/demo use.
        </div>` : ''}

        <div class="grid grid-3" style="margin-bottom:16px;">
          <div style="padding:12px; background:var(--color-bg); border-radius:6px; text-align:center;">
            <div style="font-size:11px; text-transform:uppercase; color:var(--color-text-muted);">${t('totalValue', 'Total Value')}</div>
            <div style="font-size:20px; font-weight:700; margin-top:4px;">${App.Utils.formatCurrency(totalValue)}</div>
          </div>
          <div style="padding:12px; background:var(--color-bg); border-radius:6px; text-align:center;">
            <div style="font-size:11px; text-transform:uppercase; color:var(--color-text-muted);">${t('lowStockItems', 'Low Stock Items')}</div>
            <div style="font-size:20px; font-weight:700; margin-top:4px; ${needsReorder.length > 0 ? 'color:var(--color-warning);' : ''}">${needsReorder.length}</div>
          </div>
          <div style="padding:12px; background:var(--color-bg); border-radius:6px; text-align:center;">
            <div style="font-size:11px; text-transform:uppercase; color:var(--color-text-muted);">${t('outOfStock', 'Out of Stock')}</div>
            <div style="font-size:20px; font-weight:700; margin-top:4px; ${outOfStock.length > 0 ? 'color:var(--color-danger);' : ''}">${outOfStock.length}</div>
          </div>
        </div>
      </div>

      ${needsReorder.length > 0 ? `
        <div class="card-soft" style="margin-bottom:16px; border-left:3px solid var(--color-warning);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <h4 style="font-size:14px; font-weight:600; color:var(--color-warning);">📦 ${t('replenishmentSuggestions', 'Replenishment Suggestions')}</h4>
            <button class="btn btn-ghost" id="btn-create-all-pos" style="font-size:12px;">${t('createAllPOs', 'Create All POs')}</button>
          </div>
          <table class="table" style="font-size:13px;">
            <thead>
              <tr>
                <th>${App.I18n.t('common.item', 'Item')}</th>
                <th style="text-align:right;">${t('stock', 'Stock')}</th>
                <th style="text-align:right;">${t('min', 'Min')}</th>
                <th style="text-align:right;">${t('suggestedQty', 'Suggested Qty')}</th>
                <th>${App.I18n.t('common.supplier', 'Supplier')}</th>
                <th style="text-align:right;">${App.I18n.t('common.action', 'Action')}</th>
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
                    <td><strong>${esc(sku)}</strong> - ${esc(name)}</td>
                    <td style="text-align:right; color:var(--color-warning);">${item.stock || 0}</td>
                    <td style="text-align:right;">${minStock}</td>
                    <td style="text-align:right; font-weight:500;">${Math.ceil(reorderQty)}</td>
                    <td>${esc(supplier)}</td>
                    <td style="text-align:right;">
                      ${hasSupplierId ?
                        `<button class="btn btn-ghost btn-create-po" data-id="${item.id}" data-qty="${Math.ceil(reorderQty)}" data-supplier="${item.supplierId}" data-type="${isProduct ? 'product' : 'component'}" title="${t('createPO', 'Create Purchase Order')}" aria-label="${t('createPO', 'Create Purchase Order')}">📋</button>` :
                        `<span style="font-size:11px; color:var(--color-text-muted);">${t('noSupplier', 'No supplier')}</span>`
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
            ${tableHeaderHtml}
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

    // Edit product buttons
    root.querySelectorAll('.btn-edit-product').forEach(btn => {
      btn.addEventListener('click', () => this.editProduct(btn.getAttribute('data-id')));
    });

    // Delete product buttons
    root.querySelectorAll('.btn-delete-product').forEach(btn => {
      btn.addEventListener('click', () => this.deleteProduct(btn.getAttribute('data-id')));
    });

    // Component buttons
    root.querySelectorAll('.btn-edit-component').forEach(btn => {
      btn.addEventListener('click', () => this.editComponent(btn.getAttribute('data-id')));
    });

    root.querySelectorAll('.btn-receive-component').forEach(btn => {
      btn.addEventListener('click', () => this.receiveComponentStock(btn.getAttribute('data-id')));
    });

    root.querySelectorAll('.btn-adjust-component').forEach(btn => {
      btn.addEventListener('click', () => this.adjustComponentStock(btn.getAttribute('data-id')));
    });

    root.querySelectorAll('.btn-delete-component').forEach(btn => {
      btn.addEventListener('click', () => this.deleteComponent(btn.getAttribute('data-id')));
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
    const t = (key, fallback) => App.I18n.t(`inventory.${key}`, fallback);
    const esc = App.Utils.escapeHtml;
    const products = App.Data.products || [];
    const item = products.find(p => p.id === id);
    if (!item) return;
    if (!this._assertInventoryMutationAllowed('Receiving stock')) return;

    const body = `
      <div>
        <p style="margin-bottom:12px;">
          <strong>${esc(item.internalArticleNumber || item.sku)}</strong> - ${esc(item.nameDE || item.nameEN)}<br/>
          ${t('currentStock', 'Current Stock')}: <strong>${item.stock || 0}</strong>
        </p>
        <label class="field-label" for="receive-qty">${t('quantityToAdd', 'Quantity to Add')}</label>
        <input id="receive-qty" type="number" class="input" min="1" value="10" aria-required="true" />
        <label class="field-label" for="receive-ref" style="margin-top:8px;">${t('reference', 'Reference (PO Number)')}</label>
        <input id="receive-ref" class="input" placeholder="e.g., PO-2025-0001" />
      </div>
    `;

    App.UI.Modal.open(App.I18n.t('common.receiveStock', 'Receive Stock'), body, [
      { text: App.I18n.t('common.cancel', 'Cancel'), variant: 'ghost', onClick: () => {} },
      {
        text: t('receive', 'Receive'),
        variant: 'primary',
        onClick: () => {
          const qty = parseInt(document.getElementById('receive-qty').value) || 0;
          const ref = document.getElementById('receive-ref').value.trim();
          if (qty <= 0) {
            App.UI.Toast.show(t('enterValidQty', 'Enter a valid quantity'));
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
            notes: `${t('received', 'Received')} ${qty} ${t('units', 'units')}`
          });

          App.DB.save();
          App.UI.Toast.show(`${t('received', 'Received')} ${qty} ${t('units', 'units')}`);
          App.Core.Router.navigate('inventory');
        }
      }
    ]);
  },

  adjustStock(id) {
    const t = (key, fallback) => App.I18n.t(`inventory.${key}`, fallback);
    const esc = App.Utils.escapeHtml;
    const products = App.Data.products || [];
    const item = products.find(p => p.id === id);
    if (!item) return;
    if (!this._assertInventoryMutationAllowed('Adjusting stock')) return;

    const body = `
      <div>
        <p style="margin-bottom:12px;">
          <strong>${esc(item.internalArticleNumber || item.sku)}</strong> - ${esc(item.nameDE || item.nameEN)}<br/>
          ${t('currentStock', 'Current Stock')}: <strong>${item.stock || 0}</strong>
        </p>
        <label class="field-label" for="adjust-qty">${t('newStockLevel', 'New Stock Level')}</label>
        <input id="adjust-qty" type="number" class="input" min="0" value="${item.stock || 0}" aria-required="true" />
        <label class="field-label" for="adjust-reason" style="margin-top:8px;">${t('reason', 'Reason')}</label>
        <select id="adjust-reason" class="input">
          <option value="count">${t('reasonCount', 'Physical Count')}</option>
          <option value="damage">${t('reasonDamage', 'Damaged/Expired')}</option>
          <option value="correction">${t('reasonCorrection', 'Correction')}</option>
          <option value="other">${t('reasonOther', 'Other')}</option>
        </select>
        <label class="field-label" for="adjust-notes" style="margin-top:8px;">${t('notes', 'Notes')}</label>
        <textarea id="adjust-notes" class="input" rows="2"></textarea>
      </div>
    `;

    App.UI.Modal.open(App.I18n.t('common.adjustStock', 'Adjust Stock'), body, [
      { text: App.I18n.t('common.cancel', 'Cancel'), variant: 'ghost', onClick: () => {} },
      {
        text: t('adjust', 'Adjust'),
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
          App.UI.Toast.show(App.I18n.t('common.stockAdjusted', 'Stock adjusted'));
          App.Core.Router.navigate('inventory');
        }
      }
    ]);
  },

  editProduct(id) {
    const t = (key, fallback) => App.I18n.t(`inventory.${key}`, fallback);
    const esc = App.Utils.escapeHtml;
    const products = App.Data.products || [];
    const item = products.find(p => p.id === id);
    if (!item) return;

    const body = `
      <div class="grid" style="gap:12px;">
        <div class="grid grid-2" style="gap:12px;">
          <div>
            <label class="field-label">${App.I18n.t('common.articleNumber', 'Article Number')}</label>
            <input id="edit-sku" class="input" value="${esc(item.internalArticleNumber || item.sku || '')}" />
          </div>
          <div>
            <label class="field-label">${App.I18n.t('common.type', 'Type')}</label>
            <select id="edit-type" class="input">
              <option value="Finished" ${item.type === 'Finished' ? 'selected' : ''}>Finished</option>
              <option value="Device" ${item.type === 'Device' ? 'selected' : ''}>Device</option>
              <option value="Consumable" ${item.type === 'Consumable' ? 'selected' : ''}>Consumable</option>
              <option value="Part" ${item.type === 'Part' ? 'selected' : ''}>Part</option>
            </select>
          </div>
        </div>
        <div class="grid grid-2" style="gap:12px;">
          <div>
            <label class="field-label">${App.I18n.t('common.nameDE', 'Name (DE)')}</label>
            <input id="edit-name-de" class="input" value="${esc(item.nameDE || '')}" />
          </div>
          <div>
            <label class="field-label">${App.I18n.t('common.nameEN', 'Name (EN)')}</label>
            <input id="edit-name-en" class="input" value="${esc(item.nameEN || '')}" />
          </div>
        </div>
        <div class="grid grid-3" style="gap:12px;">
          <div>
            <label class="field-label">${t('minStock', 'Min Stock')}</label>
            <input id="edit-min-stock" type="number" class="input" value="${item.minStock || 0}" min="0" />
          </div>
          <div>
            <label class="field-label">${App.I18n.t('common.purchasePrice', 'Purchase Price')}</label>
            <input id="edit-purchase-price" type="number" step="0.01" class="input" value="${item.purchasePrice || 0}" />
          </div>
          <div>
            <label class="field-label">${App.I18n.t('common.dealerPrice', 'Dealer Price')}</label>
            <input id="edit-dealer-price" type="number" step="0.01" class="input" value="${item.dealerPrice || 0}" />
          </div>
        </div>
      </div>
    `;

    App.UI.Modal.open(App.I18n.t('common.editProduct', 'Edit Product'), body, [
      { text: App.I18n.t('common.cancel', 'Cancel'), variant: 'ghost', onClick: () => {} },
      {
        text: App.I18n.t('common.save', 'Save'),
        variant: 'primary',
        onClick: () => {
          item.internalArticleNumber = document.getElementById('edit-sku').value.trim();
          item.sku = item.internalArticleNumber;
          item.type = document.getElementById('edit-type').value;
          item.nameDE = document.getElementById('edit-name-de').value.trim();
          item.nameEN = document.getElementById('edit-name-en').value.trim();
          item.minStock = parseInt(document.getElementById('edit-min-stock').value) || 0;
          item.purchasePrice = parseFloat(document.getElementById('edit-purchase-price').value) || 0;
          item.dealerPrice = parseFloat(document.getElementById('edit-dealer-price').value) || 0;
          item.updatedAt = new Date().toISOString();

          App.DB.save();

          // Log activity
          if (App.Services.ActivityLog) {
            App.Services.ActivityLog.log('update', 'product', item.id, {
              name: item.nameDE || item.nameEN || item.internalArticleNumber
            });
          }

          App.UI.Toast.show(App.I18n.t('common.productUpdated', 'Product updated'));
          App.Core.Router.navigate('inventory');
        }
      }
    ]);
  },

  deleteProduct(id) {
    const esc = App.Utils.escapeHtml;
    const products = App.Data.products || [];
    const item = products.find(p => p.id === id);
    if (!item) return;

    const body = `
      <p>${App.I18n.t('common.confirmDeleteProduct', 'Are you sure you want to delete this product?')}</p>
      <p style="margin-top:8px;"><strong>${esc(item.internalArticleNumber || item.sku)}</strong> - ${esc(item.nameDE || item.nameEN)}</p>
      <p style="font-size:12px; color:var(--color-text-muted); margin-top:8px;">${App.I18n.t('common.actionCannotBeUndone', 'This action cannot be undone.')}</p>
    `;

    App.UI.Modal.open(App.I18n.t('common.deleteProduct', 'Delete Product'), body, [
      { text: App.I18n.t('common.cancel', 'Cancel'), variant: 'ghost', onClick: () => {} },
      {
        text: App.I18n.t('common.delete', 'Delete'),
        variant: 'primary',
        onClick: () => {
          App.Data.products = products.filter(p => p.id !== id);
          App.DB.save();

          // Log activity
          if (App.Services.ActivityLog) {
            App.Services.ActivityLog.log('delete', 'product', id, {
              name: item.nameDE || item.nameEN || item.internalArticleNumber
            });
          }

          App.UI.Toast.show(App.I18n.t('common.productDeleted', 'Product deleted'));
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
  },

  // Component CRUD methods
  editComponent(id) {
    const t = (key, fallback) => App.I18n.t(`inventory.${key}`, fallback);
    const esc = App.Utils.escapeHtml;
    const components = App.Data.components || [];
    const item = components.find(c => c.id === id);
    if (!item) return;

    const suppliers = App.Data.suppliers || [];
    const supplierOptions = suppliers.map(s =>
      `<option value="${s.id}" ${item.supplierId === s.id ? 'selected' : ''}>${esc(s.name)}</option>`
    ).join('');

    const body = `
      <div class="grid" style="gap:12px;">
        <div class="grid grid-2" style="gap:12px;">
          <div>
            <label class="field-label">${App.I18n.t('common.componentNumber', 'Component No')}</label>
            <input id="edit-comp-number" class="input" value="${esc(item.componentNumber || '')}" />
          </div>
          <div>
            <label class="field-label">${App.I18n.t('common.unit', 'Unit')}</label>
            <select id="edit-comp-unit" class="input">
              <option value="pcs" ${item.unit === 'pcs' ? 'selected' : ''}>pcs</option>
              <option value="kg" ${item.unit === 'kg' ? 'selected' : ''}>kg</option>
              <option value="L" ${item.unit === 'L' ? 'selected' : ''}>L</option>
              <option value="m" ${item.unit === 'm' ? 'selected' : ''}>m</option>
            </select>
          </div>
        </div>
        <div>
          <label class="field-label">${App.I18n.t('common.description', 'Description')}</label>
          <input id="edit-comp-desc" class="input" value="${esc(item.description || '')}" />
        </div>
        <div class="grid grid-3" style="gap:12px;">
          <div>
            <label class="field-label">${t('safetyStock', 'Safety Stock')}</label>
            <input id="edit-comp-safety" type="number" class="input" value="${item.safetyStock || 0}" min="0" />
          </div>
          <div>
            <label class="field-label">${App.I18n.t('common.purchasePrice', 'Purchase Price')}</label>
            <input id="edit-comp-price" type="number" step="0.01" class="input" value="${item.purchasePrice || 0}" />
          </div>
          <div>
            <label class="field-label">${App.I18n.t('common.supplier', 'Supplier')}</label>
            <select id="edit-comp-supplier" class="input">
              <option value="">-</option>
              ${supplierOptions}
            </select>
          </div>
        </div>
      </div>
    `;

    App.UI.Modal.open(App.I18n.t('common.editComponent', 'Edit Component'), body, [
      { text: App.I18n.t('common.cancel', 'Cancel'), variant: 'ghost', onClick: () => {} },
      {
        text: App.I18n.t('common.save', 'Save'),
        variant: 'primary',
        onClick: () => {
          item.componentNumber = document.getElementById('edit-comp-number').value.trim();
          item.unit = document.getElementById('edit-comp-unit').value;
          item.description = document.getElementById('edit-comp-desc').value.trim();
          item.safetyStock = parseInt(document.getElementById('edit-comp-safety').value) || 0;
          item.purchasePrice = parseFloat(document.getElementById('edit-comp-price').value) || 0;
          item.supplierId = document.getElementById('edit-comp-supplier').value || null;
          item.updatedAt = new Date().toISOString();

          App.DB.save();

          if (App.Services.ActivityLog) {
            App.Services.ActivityLog.log('update', 'component', item.id, {
              name: item.description || item.componentNumber
            });
          }

          App.UI.Toast.show(App.I18n.t('common.componentUpdated', 'Component updated'));
          App.Core.Router.navigate('inventory');
        }
      }
    ]);
  },

  receiveComponentStock(id) {
    const t = (key, fallback) => App.I18n.t(`inventory.${key}`, fallback);
    const esc = App.Utils.escapeHtml;
    const components = App.Data.components || [];
    const item = components.find(c => c.id === id);
    if (!item) return;
    if (!this._assertInventoryMutationAllowed('Receiving stock')) return;

    const body = `
      <div>
        <p style="margin-bottom:12px;">
          <strong>${esc(item.componentNumber)}</strong> - ${esc(item.description || '')}<br/>
          ${t('currentStock', 'Current Stock')}: <strong>${item.stock || 0}</strong>
        </p>
        <label class="field-label" for="receive-comp-qty">${t('quantityToAdd', 'Quantity to Add')}</label>
        <input id="receive-comp-qty" type="number" class="input" min="1" value="10" />
        <label class="field-label" for="receive-comp-ref" style="margin-top:8px;">${t('reference', 'Reference')}</label>
        <input id="receive-comp-ref" class="input" placeholder="e.g., PO-2025-0001" />
      </div>
    `;

    App.UI.Modal.open(App.I18n.t('common.receiveStock', 'Receive Stock'), body, [
      { text: App.I18n.t('common.cancel', 'Cancel'), variant: 'ghost', onClick: () => {} },
      {
        text: t('receive', 'Receive'),
        variant: 'primary',
        onClick: () => {
          const qty = parseInt(document.getElementById('receive-comp-qty').value) || 0;
          const ref = document.getElementById('receive-comp-ref').value.trim();
          if (qty <= 0) {
            App.UI.Toast.show(t('enterValidQty', 'Enter a valid quantity'));
            return false;
          }

          item.stock = (item.stock || 0) + qty;

          const movements = App.Data.movements || [];
          movements.push({
            id: App.Utils.generateId('mv'),
            date: new Date().toISOString(),
            type: 'receipt',
            direction: 'in',
            componentId: id,
            quantity: qty,
            reference: ref || 'Manual receipt',
            notes: `Received ${qty} units`
          });

          App.DB.save();
          App.UI.Toast.show(`${t('received', 'Received')} ${qty} ${t('units', 'units')}`);
          App.Core.Router.navigate('inventory');
        }
      }
    ]);
  },

  adjustComponentStock(id) {
    const t = (key, fallback) => App.I18n.t(`inventory.${key}`, fallback);
    const esc = App.Utils.escapeHtml;
    const components = App.Data.components || [];
    const item = components.find(c => c.id === id);
    if (!item) return;
    if (!this._assertInventoryMutationAllowed('Adjusting stock')) return;

    const body = `
      <div>
        <p style="margin-bottom:12px;">
          <strong>${esc(item.componentNumber)}</strong> - ${esc(item.description || '')}<br/>
          ${t('currentStock', 'Current Stock')}: <strong>${item.stock || 0}</strong>
        </p>
        <label class="field-label" for="adjust-comp-qty">${t('newStockLevel', 'New Stock Level')}</label>
        <input id="adjust-comp-qty" type="number" class="input" min="0" value="${item.stock || 0}" />
        <label class="field-label" for="adjust-comp-reason" style="margin-top:8px;">${t('reason', 'Reason')}</label>
        <select id="adjust-comp-reason" class="input">
          <option value="count">${t('reasonCount', 'Physical Count')}</option>
          <option value="damage">${t('reasonDamage', 'Damaged/Expired')}</option>
          <option value="correction">${t('reasonCorrection', 'Correction')}</option>
          <option value="other">${t('reasonOther', 'Other')}</option>
        </select>
      </div>
    `;

    App.UI.Modal.open(App.I18n.t('common.adjustStock', 'Adjust Stock'), body, [
      { text: App.I18n.t('common.cancel', 'Cancel'), variant: 'ghost', onClick: () => {} },
      {
        text: t('adjust', 'Adjust'),
        variant: 'primary',
        onClick: () => {
          const newQty = parseInt(document.getElementById('adjust-comp-qty').value) || 0;
          const reason = document.getElementById('adjust-comp-reason').value;
          const diff = newQty - (item.stock || 0);

          item.stock = newQty;

          const movements = App.Data.movements || [];
          movements.push({
            id: App.Utils.generateId('mv'),
            date: new Date().toISOString(),
            type: 'adjustment',
            direction: diff >= 0 ? 'in' : 'out',
            componentId: id,
            quantity: Math.abs(diff),
            reference: reason,
            notes: `Adjusted from ${item.stock - diff} to ${newQty}`
          });

          App.DB.save();
          App.UI.Toast.show(App.I18n.t('common.stockAdjusted', 'Stock adjusted'));
          App.Core.Router.navigate('inventory');
        }
      }
    ]);
  },

  deleteComponent(id) {
    const esc = App.Utils.escapeHtml;
    const components = App.Data.components || [];
    const item = components.find(c => c.id === id);
    if (!item) return;

    // Check if used in any BOMs
    const products = App.Data.products || [];
    const usedIn = products.filter(p => (p.bom || []).some(b => b.componentId === id));
    if (usedIn.length > 0) {
      App.UI.Toast.show(`Cannot delete: Used in ${usedIn.length} product BOMs`);
      return;
    }

    const body = `
      <p>${App.I18n.t('common.confirmDeleteComponent', 'Are you sure you want to delete this component?')}</p>
      <p style="margin-top:8px;"><strong>${esc(item.componentNumber)}</strong> - ${esc(item.description || '')}</p>
      <p style="font-size:12px; color:var(--color-text-muted); margin-top:8px;">${App.I18n.t('common.actionCannotBeUndone', 'This action cannot be undone.')}</p>
    `;

    App.UI.Modal.open(App.I18n.t('common.deleteComponent', 'Delete Component'), body, [
      { text: App.I18n.t('common.cancel', 'Cancel'), variant: 'ghost', onClick: () => {} },
      {
        text: App.I18n.t('common.delete', 'Delete'),
        variant: 'primary',
        onClick: () => {
          App.Data.components = components.filter(c => c.id !== id);
          App.DB.save();

          if (App.Services.ActivityLog) {
            App.Services.ActivityLog.log('delete', 'component', id, {
              name: item.description || item.componentNumber
            });
          }

          App.UI.Toast.show(App.I18n.t('common.componentDeleted', 'Component deleted'));
          App.Core.Router.navigate('inventory');
        }
      }
    ]);
  },

  // Guard to ensure stock mutations are only allowed in local demo mode and while online.
  _assertInventoryMutationAllowed(reason = 'Stock change') {
    if (!App.Config?.localOnlyDemoMode) {
      App.UI.Toast.show(
        `${reason} is disabled in GA backend mode. Enable App.Config.localOnlyDemoMode only for single-user demos.`,
        'warning'
      );
      return false;
    }
    if (App.Services?.Offline?.isOffline?.()) {
      App.UI.Toast.show('Cannot change stock while offline. Please reconnect and retry.', 'warning');
      return false;
    }
    return true;
  }
};
