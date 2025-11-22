// Production Orders page
App.UI.Views.Production = {
  render(root) {
    const pos = App.Data.productionOrders || App.Data.ProductionOrders || [];
    // Sort by date descending
    pos.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    root.innerHTML = `
      <div class="card-soft">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 style="font-size:16px; font-weight:600;">${App.I18n.t('pages.production.title','Production Orders')}</h3>
          <div style="display:flex; gap:8px; align-items:center;">
            <input type="text" id="production-search" class="input" placeholder="${App.I18n.t('common.search','Search...')}" style="width:200px;" />
            <button class="btn btn-ghost" id="btn-auto-settings" title="Automation Settings">⚙️ Automation</button>
            <button class="btn btn-primary" id="btn-add-po">+ ${App.I18n.t('common.add','Add')}</button>
          </div>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>${App.I18n.t('production.number','Number')}</th>
              <th>${App.I18n.t('production.product','Product')}</th>
              <th style="text-align:right;">${App.I18n.t('production.qty','Qty')}</th>
              <th>${App.I18n.t('production.status','Status')}</th>
              <th>${App.I18n.t('production.planned','Planned')}</th>
              <th style="text-align:right;">${App.I18n.t('common.actions','Actions')}</th>
            </tr>
          </thead>
          <tbody>
            ${pos.map(po => {
              const prod = (App.Data.products||[]).find(p=>p.id===po.productId) || {};
              let statusColor = 'tag-muted';
              if (po.status === 'completed') statusColor = 'tag-success';
              if (po.status === 'in_progress') statusColor = 'tag-info';
              
              return `
                <tr>
                  <td>${po.orderNumber || po.id}</td>
                  <td>${prod.nameDE || prod.nameEN || prod.name || '-'}</td>
                  <td style="text-align:right;">${po.quantity ?? '-'}</td>
                  <td><span class="tag ${statusColor}">${po.status || '-'}</span></td>
                  <td>${po.plannedStart ? App.Utils.formatDate(po.plannedStart) : '-'}</td>
                  <td style="text-align:right;">
                    <button class="btn btn-ghost btn-edit-po" data-id="${po.id}" title="Edit" aria-label="Edit production order">✏️</button>
                    ${po.status === 'planned' ? `<button class="btn btn-ghost btn-start-po" data-id="${po.id}" title="Start Production (Deduct Components)" aria-label="Start production">▶️</button>` : ''}
                    ${po.status === 'in_progress' ? `<button class="btn btn-ghost btn-complete-po" data-id="${po.id}" title="Complete & Book Stock" aria-label="Complete production">✅</button>` : ''}
                    ${po.sourceOrderId ? `<button class="btn btn-ghost btn-view-source" data-id="${po.sourceOrderId}" title="View Source Order" aria-label="View source order">🔗</button>` : ''}
                    <button class="btn btn-ghost btn-delete-po" data-id="${po.id}" title="Delete" aria-label="Delete production order">🗑️</button>
                  </td>
                </tr>`;
            }).join('') || `<tr><td colspan="6" style="text-align:center; color:var(--color-text-muted);">No production orders</td></tr>`}
          </tbody>
        </table>
      </div>
    `;

    const addBtn = document.getElementById('btn-add-po');
    if (addBtn) {
      addBtn.onclick = () => this.openPOModal();
    }

    const autoSettingsBtn = document.getElementById('btn-auto-settings');
    if (autoSettingsBtn) {
      autoSettingsBtn.onclick = () => {
        if (App.Services.Automation?.showConfigModal) {
          App.Services.Automation.showConfigModal();
        }
      };
    }

    // Event listeners for actions
    root.querySelectorAll('.btn-edit-po').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const po = pos.find(p => p.id === id);
        if (po) this.openPOModal(po);
      });
    });

    root.querySelectorAll('.btn-start-po').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const po = pos.find(p => p.id === id);
        if (po) this.startProduction(po);
      });
    });

    root.querySelectorAll('.btn-complete-po').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const po = pos.find(p => p.id === id);
        if (po) this.completeOrder(po);
      });
    });

    root.querySelectorAll('.btn-view-source').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const orderId = btn.getAttribute('data-id');
        // Navigate to orders page and show the source order
        App.Core.Router.navigate('orders');
        setTimeout(() => {
          if (App.UI.Views.Orders?.viewOrder) {
            App.UI.Views.Orders.viewOrder(orderId);
          }
        }, 100);
      });
    });

    root.querySelectorAll('.btn-delete-po').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const po = pos.find(p => p.id === id);
        if (po) this.deleteProductionOrder(po);
      });
    });

    // Search functionality
    const searchInput = document.getElementById('production-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const rows = root.querySelectorAll('tbody tr');
        rows.forEach(row => {
          const text = row.textContent.toLowerCase();
          row.style.display = query === '' || text.includes(query) ? '' : 'none';
        });
      });
    }
  },

  /**
   * Delete a production order with safety checks
   */
  deleteProductionOrder(po) {
    const prod = (App.Data.products || []).find(p => p.id === po.productId);

    // Warn if production is in progress or completed
    if (po.status === 'in_progress') {
      App.UI.Modal.open('Cannot Delete', `
        <div style="color:#f59e0b;">
          <p><strong>⚠️ Production is in progress</strong></p>
          <p style="font-size:12px; margin-top:8px;">
            Complete or cancel this production order before deleting.
            Components may have already been deducted.
          </p>
        </div>
      `, [{ text: 'Close', variant: 'ghost', onClick: () => {} }]);
      return;
    }

    if (po.status === 'completed') {
      App.UI.Modal.open('Delete Completed Order', `
        <div style="color:#f59e0b;">
          <p><strong>⚠️ This production order is completed</strong></p>
          <p style="font-size:12px; margin-top:8px;">
            Deleting will remove the record but will NOT reverse stock movements.
            The produced items will remain in inventory.
          </p>
        </div>
        <p style="margin-top:12px;">Delete <strong>${po.orderNumber}</strong> anyway?</p>
      `, [
        { text: 'Cancel', variant: 'ghost', onClick: () => {} },
        {
          text: 'Delete Record',
          variant: 'primary',
          onClick: () => {
            this._performPODelete(po, prod);
          }
        }
      ]);
      return;
    }

    // Normal deletion for planned orders
    App.UI.Modal.open('Delete Production Order', `
      <div>
        <p>Are you sure you want to delete <strong>${po.orderNumber}</strong>?</p>
        <div style="font-size:12px; color:var(--color-text-muted); margin-top:8px;">
          <p>Product: ${prod ? (prod.nameDE || prod.nameEN) : '-'}</p>
          <p>Quantity: ${po.quantity}</p>
          <p>Status: ${po.status}</p>
        </div>
      </div>
    `, [
      { text: 'Cancel', variant: 'ghost', onClick: () => {} },
      {
        text: 'Delete',
        variant: 'primary',
        onClick: () => {
          this._performPODelete(po, prod);
        }
      }
    ]);
  },

  _performPODelete(po, prod) {
    const pos = App.Data.productionOrders || [];
    App.Data.productionOrders = pos.filter(p => p.id !== po.id);
    App.DB.save();

    // Log activity
    if (App.Services.ActivityLog) {
      App.Services.ActivityLog.log('delete', 'productionOrder', po.id, {
        name: po.orderNumber,
        product: prod ? (prod.nameDE || prod.nameEN) : null,
        quantity: po.quantity,
        status: po.status
      });
    }

    App.UI.Toast.show('Production order deleted');
    App.Core.Router.navigate('production');
  },

  /**
   * Start production - deducts components from inventory
   */
  startProduction(po) {
    const prod = (App.Data.products || []).find(p => p.id === po.productId);
    if (!prod) return;

    // Build component list for confirmation
    const compList = (po.components || []).map(c => {
      const comp = (App.Data.components || []).find(x => x.id === c.componentId);
      const available = comp ? (comp.stock || 0) : 0;
      const shortage = c.quantity > available ? c.quantity - available : 0;
      return {
        name: comp?.description || comp?.componentNumber || c.componentId,
        quantity: c.quantity,
        available,
        shortage
      };
    });

    const hasShortage = compList.some(c => c.shortage > 0);

    const msg = `
      Starting Production <strong>${po.orderNumber}</strong> will:<br/>
      <ul>
        <li>Deduct components from inventory:</li>
      </ul>
      <table style="width:100%; font-size:12px; margin:8px 0;">
        <tr>
          <th style="text-align:left;">Component</th>
          <th style="text-align:right;">Required</th>
          <th style="text-align:right;">Available</th>
        </tr>
        ${compList.map(c => `
          <tr style="${c.shortage > 0 ? 'color:#f97373;' : ''}">
            <td>${c.name}</td>
            <td style="text-align:right;">${c.quantity}</td>
            <td style="text-align:right;">${c.available}${c.shortage > 0 ? ` (short ${c.shortage})` : ''}</td>
          </tr>
        `).join('')}
      </table>
      ${hasShortage ? '<p style="color:#f97373; font-size:12px;">⚠️ Warning: Some components are short. Stock will go negative.</p>' : ''}
      <p style="font-size:12px;">Confirm to start production?</p>
    `;

    App.UI.Modal.open('Start Production', msg, [
      { text: 'Cancel', variant: 'ghost', onClick: () => {} },
      { text: 'Start Production', variant: 'primary', onClick: () => {
          if (App.Services.Automation) {
            App.Services.Automation.startProduction(po.id);
          } else {
            // Fallback if automation service not available
            po.status = 'in_progress';
            App.DB.save();
            App.UI.Toast.show('Production started');
          }
          App.Core.Router.navigate('production');
        }
      }
    ]);
  },

  /**
   * Opens a modal to add or edit a production order.
   */
  openPOModal(po) {
    const isEdit = !!po;
    const products = (App.Data.products || []).filter(p => p.type !== 'Service');
    const components = App.Data.components || [];
    
    const productOptions = products.map(p => `<option value="${p.id}" ${po && po.productId === p.id ? 'selected' : ''}>${p.nameDE || p.nameEN || p.name || p.id}</option>`).join('');
    
    // Helper to generate component row HTML
    const getCompRow = (compId = '', qty = 1) => {
      const opts = components.map(c => `<option value="${c.id}" ${c.id === compId ? 'selected' : ''}>${c.description || c.componentNumber}</option>`).join('');
      return `
        <div class="po-comp-row" style="display:flex; gap:8px; margin-bottom:8px;">
          <select class="input po-comp-select" style="flex:1;">${opts}</select>
          <input type="number" class="input po-comp-qty" style="width:80px;" value="${qty}" min="0" step="0.01" placeholder="Qty">
          <button class="btn btn-ghost po-remove-comp">❌</button>
        </div>
      `;
    };

    const body = `
      <div>
        <div class="grid grid-2">
          <div>
            <label class="field-label">${App.I18n.t('production.product','Product')}*</label>
            <select id="po-product" class="input">
              <option value="">-- Select Product --</option>
              ${productOptions}
            </select>
          </div>
          <div>
            <label class="field-label">${App.I18n.t('production.qty','Quantity')}*</label>
            <input id="po-qty" class="input" type="number" min="1" step="1" value="${po && po.quantity ? po.quantity : 1}" />
          </div>
        </div>

        <div class="grid grid-2">
          <div>
            <label class="field-label">${App.I18n.t('production.start','Planned Start')}</label>
            <input id="po-start" class="input" type="date" value="${po && po.plannedStart ? po.plannedStart.split('T')[0] : ''}" />
          </div>
          <div>
            <label class="field-label">${App.I18n.t('production.end','Planned End')}</label>
            <input id="po-end" class="input" type="date" value="${po && po.plannedEnd ? po.plannedEnd.split('T')[0] : ''}" />
          </div>
        </div>

        <label class="field-label" style="margin-top:12px;">Components (BOM)</label>
        <div id="po-components-container" style="border:1px solid var(--color-border); padding:8px; border-radius:8px; margin-bottom:8px;">
          ${(po && po.components ? po.components.map(c => getCompRow(c.componentId, c.quantity)) : []).join('')}
        </div>
        <button class="btn btn-ghost" id="btn-add-comp-row" style="font-size:12px;">+ Add Component</button>

        <label class="field-label" style="margin-top:12px;">${App.I18n.t('production.notes','Notes')}</label>
        <textarea id="po-notes" class="input" style="height:60px;">${po ? po.notes || '' : ''}</textarea>
      </div>
    `;

    const title = isEdit ? App.I18n.t('production.edit','Edit Production Order') : App.I18n.t('production.add','Add Production Order');
    
    App.UI.Modal.open(title, body, [
      { text: App.I18n.t('common.cancel','Cancel'), variant:'ghost', onClick: () => {} },
      { text: App.I18n.t('common.save','Save'), variant:'primary', onClick: () => {
          const productId = document.getElementById('po-product').value;
          if (!productId) {
            App.UI.Toast.show(App.I18n.t('production.product','Product') + ' is required');
            return false;
          }
          const qty = parseInt(document.getElementById('po-qty').value) || 1;
          const start = document.getElementById('po-start').value || null;
          const end = document.getElementById('po-end').value || null;
          const notes = document.getElementById('po-notes').value.trim() || null;
          
          // Harvest components
          const comps = [];
          document.querySelectorAll('.po-comp-row').forEach(row => {
            const cId = row.querySelector('.po-comp-select').value;
            const cQty = parseFloat(row.querySelector('.po-comp-qty').value) || 0;
            if (cId && cQty > 0) comps.push({ componentId: cId, quantity: cQty });
          });

          const list = App.Data.productionOrders || [];
          const newPo = {
            id: isEdit ? po.id : App.Utils.generateId('po'),
            orderNumber: isEdit ? (po.orderNumber || po.id) : App.Services.NumberSequence.nextProductionOrderNumber(),
            productId: productId,
            quantity: qty,
            createdBy: App.Services.Auth.currentUser ? App.Services.Auth.currentUser.id : null,
            createdAt: isEdit ? po.createdAt : new Date().toISOString(),
            plannedStart: start,
            plannedEnd: end,
            status: isEdit ? po.status : 'planned',
            components: comps,
            notes: notes
          };

          if (isEdit) {
            const idx = list.findIndex(x => x.id === po.id);
            if (idx >= 0) list[idx] = newPo;
          } else {
            list.push(newPo);
          }
          App.DB.save();
          App.Core.Router.navigate('production');
        } }
    ]);

    setTimeout(() => {
      const container = document.getElementById('po-components-container');
      const addBtn = document.getElementById('btn-add-comp-row');
      const productSelect = document.getElementById('po-product');
      const qtyInput = document.getElementById('po-qty');

      const wireUpDelete = () => {
        container.querySelectorAll('.po-remove-comp').forEach(btn => {
          btn.onclick = () => btn.closest('.po-comp-row').remove();
        });
      };

      const loadBOMFromProduct = () => {
        const productId = productSelect.value;
        const poQty = parseInt(qtyInput.value) || 1;
        const product = products.find(p => p.id === productId);

        if (product && product.bom && product.bom.length > 0) {
          container.innerHTML = '';
          product.bom.forEach(b => {
            const totalQty = b.quantityPerUnit * poQty;
            container.insertAdjacentHTML('beforeend', getCompRow(b.componentId, totalQty));
          });
          wireUpDelete();
          App.UI.Toast.show(`Loaded ${product.bom.length} components from BOM`);
        }
      };

      if (productSelect && !isEdit) {
        productSelect.addEventListener('change', loadBOMFromProduct);
      }

      if (qtyInput) {
        qtyInput.addEventListener('change', () => {
          if (!isEdit && productSelect.value) {
            loadBOMFromProduct();
          }
        });
      }

      if (addBtn) {
        addBtn.onclick = () => {
          container.insertAdjacentHTML('beforeend', getCompRow());
          wireUpDelete();
        };
      }
      wireUpDelete();
    }, 50);
  },

  /**
   * Logic to complete a production order.
   * 1. Consume components from stock.
   * 2. Add finished good to stock.
   * 3. Create movement records.
   * 4. Update PO status.
   */
  completeOrder(po) {
    const prod = (App.Data.products || []).find(p => p.id === po.productId);
    if (!prod) return;

    const msg = `
      Completing Order <strong>${po.orderNumber}</strong> will:<br/>
      <ul>
        <li>Add <strong>${po.quantity}</strong> units of ${prod.nameDE || prod.name} to stock.</li>
        <li>Deduct components defined in the BOM.</li>
      </ul>
      Confirm completion?
    `;

    App.UI.Modal.open('Complete Production', msg, [
      { text: 'Cancel', variant: 'ghost', onClick: () => {} },
      { text: 'Complete Order', variant: 'primary', onClick: () => {
          // Use Automation service if available
          if (App.Services.Automation) {
            const result = App.Services.Automation.completeProduction(po.id);
            if (!result.success) {
              App.UI.Toast.show('Failed to complete production: ' + result.reason);
            }
          } else {
            // Fallback to original logic
            // 1. Add Product Stock
            prod.stock = (prod.stock || 0) + po.quantity;

            // 2. Record Production Movement (Receipt)
            const movements = App.Data.movements || [];
            movements.push({
              id: App.Utils.generateId('mv'),
              date: new Date().toISOString(),
              type: 'production',
              direction: 'in',
              productId: po.productId,
              quantity: po.quantity,
              reference: po.orderNumber,
              notes: 'Production completed'
            });

            // 3. Update PO Status
            po.status = 'completed';

            App.DB.save();
            App.UI.Toast.show('Order completed & stock updated');
          }
          App.Core.Router.navigate('production');
        }
      }
    ]);
  }
};