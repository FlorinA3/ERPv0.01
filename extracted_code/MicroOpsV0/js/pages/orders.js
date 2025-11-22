App.UI.Views.Orders = {
  render(root) {
    const orders = App.Data.orders || [];
    // Sort orders by date descending
    orders.sort((a, b) => new Date(b.date) - new Date(a.date));

    root.innerHTML = `
      <div class="card-soft">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 style="font-size:16px; font-weight:600;">${App.I18n.t('pages.orders.title','Orders')}</h3>
          <div style="display:flex; gap:8px; align-items:center;">
            <button class="btn btn-ghost" id="ord-export-excel">${App.I18n.t('orders.exportCsv','Export CSV')}</button>
            <button class="btn btn-primary" id="btn-add-order">+ ${App.I18n.t('orders.create','Create Order')}</button>
          </div>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Date</th>
              <th style="text-align:right;">Total</th>
              <th style="text-align:center;">Generate</th>
            </tr>
          </thead>
          <tbody>
            ${orders.map(o => {
              const cust = App.Data.customers.find(c => c.id === o.custId);
              let statusClass = 'tag-muted';
              const st = (o.status || '').toString().toLowerCase();
              if (st === 'paid') statusClass = 'tag-success';
              else if (st === 'shipped') statusClass = 'tag-info';
              else if (st === 'confirmed') statusClass = 'tag-primary';
              return `
                <tr>
                  <td>${o.orderId || o.id}</td>
                  <td>${cust ? cust.company : '-'}</td>
                  <td><span class="tag ${statusClass}">${o.status || 'Open'}</span></td>
                  <td>${App.Utils.formatDate(o.date)}</td>
                  <td style="text-align:right;">${App.Utils.formatCurrency(o.totalGross || o.subtotalNet || 0)}</td>
                  <td style="text-align:center;">
                    <button class="btn btn-ghost btn-gen-delivery" data-id="${o.id}" title="Create Delivery Note">📦</button>
                    <button class="btn btn-ghost btn-gen-invoice" data-id="${o.id}" title="Create Invoice">🧾</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('btn-add-order').onclick = () => this.openCreateModal();
    
    // Export Logic
    const exp = document.getElementById('ord-export-excel');
    if (exp) {
      exp.onclick = () => {
        const rows = [];
        rows.push('ID,Customer,Status,Date,Total');
        orders.forEach(o => {
          const cust = App.Data.customers.find(c => c.id === o.custId);
          rows.push([
            o.orderId || o.id,
            cust ? cust.company : '',
            o.status || '',
            App.Utils.formatDate(o.date),
            o.totalGross
          ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
        });
        const csv = rows.join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'orders.csv';
        a.click();
        URL.revokeObjectURL(url);
      };
    }
    
    // Wiring up the Generate buttons to the Documents module logic
    root.querySelectorAll('.btn-gen-delivery').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        // We can access Views directly or via a cleaner event bus, but direct call works for SPA
        if (App.UI.Views.Documents && App.UI.Views.Documents.generateFromOrder) {
          App.UI.Views.Documents.generateFromOrder(id, 'delivery');
        } else {
          alert("Documents module not ready");
        }
      });
    });

    root.querySelectorAll('.btn-gen-invoice').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (App.UI.Views.Documents && App.UI.Views.Documents.generateFromOrder) {
          App.UI.Views.Documents.generateFromOrder(id, 'invoice');
        }
      });
    });
  },

  openCreateModal() {
    const custOptions = (App.Data.customers || [])
      .map(c => `<option value="${c.id}">${c.company}</option>`)
      .join('');

    const prodOptions = (App.Data.products || [])
      .map(p => `<option value="${p.id}">${p.nameDE || p.nameEN || p.name || p.internalArticleNumber}</option>`)
      .join('');

    const body = `
      <div>
        <label class="field-label">${App.I18n.t('orders.customer','Customer')}</label>
        <select id="ord-cust" class="input">${custOptions}</select>
        <label class="field-label" style="margin-top:8px;">${App.I18n.t('orders.items','Items')}</label>
        <div id="ord-items"></div>
        <button class="btn btn-ghost" id="ord-add-item-btn" style="margin-top:8px;">+ ${App.I18n.t('orders.addItem','Add Item')}</button>
        <div style="margin-top:12px; font-size:13px;">
          <span>${App.I18n.t('orders.total','Total')}: <strong id="ord-total-label">${App.Utils.formatCurrency(0)}</strong></span>
        </div>
      </div>
    `;

    App.UI.Modal.open('Create Order', body, [
      { text: 'Cancel', variant: 'ghost', onClick: () => {} },
      {
        text: 'Save',
        variant: 'primary',
        onClick: () => {
          const custId = document.getElementById('ord-cust').value;
          const items = [];
          const stockIssues = [];

          document.querySelectorAll('.ord-item-row').forEach(row => {
            const pid = row.querySelector('.ord-item-prod').value;
            const qty = parseInt(row.querySelector('.ord-item-qty').value, 10) || 0;
            const price = parseFloat(row.querySelector('.ord-item-price').value) || 0;
            if (pid && qty > 0) {
              items.push({ productId: pid, qty, unitPrice: price, lineNet: qty * price });

              // Check stock availability
              const stockCheck = App.Services.Validation.checkStockAvailability(pid, qty);
              if (!stockCheck.available) {
                const prod = (App.Data.products || []).find(p => p.id === pid);
                stockIssues.push({
                  product: prod?.nameDE || prod?.nameEN || prod?.name || pid,
                  requested: qty,
                  available: stockCheck.stock,
                  shortage: stockCheck.shortage
                });
              }
            }
          });

          if (items.length === 0) {
            App.UI.Toast.show('Add at least one item to the order');
            return false;
          }

          // If there are stock issues, show confirmation dialog
          if (stockIssues.length > 0) {
            const issuesList = stockIssues.map(i =>
              `• ${i.product}: need ${i.requested}, only ${i.available} available`
            ).join('<br>');

            App.UI.Modal.open('Stock Warning', `
              <div style="color:#f97373; margin-bottom:12px;">
                <strong>⚠️ Insufficient stock for some items:</strong>
              </div>
              <div style="font-size:13px; margin-bottom:12px;">
                ${issuesList}
              </div>
              <p style="font-size:12px; color:var(--color-text-muted);">
                Do you want to save the order anyway? Stock will go negative.
              </p>
            `, [
              { text: 'Cancel', variant: 'ghost', onClick: () => {} },
              {
                text: 'Save Anyway',
                variant: 'primary',
                onClick: () => {
                  saveOrder(custId, items);
                }
              }
            ]);
            return false;
          }

          saveOrder(custId, items);
        }
      }
    ]);

    // Extracted save function
    const saveOrder = (custId, items) => {
      const subtotal = items.reduce((acc, it) => acc + it.lineNet, 0);
      const vat = subtotal * 0.2; // Fixed 20% for now
      const total = subtotal + vat;

      const order = {
        id: App.Utils.generateId('o'),
        orderId: App.Services.NumberSequence.nextOrderNumber(),
        custId,
        createdBy: App.Services.Auth.currentUser?.id,
        status: 'confirmed',
        date: new Date().toISOString(),
        items,
        subtotalNet: subtotal,
        vatAmount: vat,
        totalGross: total,
        currency: App.Data.config?.currency || 'EUR'
      };

      // Deduct stock immediately - stock reduced when orders saved
      items.forEach(it => {
        const prod = App.Data.products.find(p => p.id === it.productId);
        if (prod && prod.type !== 'Service') {
          prod.stock = (prod.stock || 0) - it.qty;
        }
      });

      // Record stock movements
      const movements = App.Data.movements || [];
      items.forEach(it => {
        const prod = App.Data.products.find(p => p.id === it.productId);
        if (prod && prod.type !== 'Service') {
          movements.push({
            id: App.Utils.generateId('mv'),
            date: new Date().toISOString(),
            type: 'sale',
            direction: 'out',
            productId: it.productId,
            quantity: it.qty,
            reference: order.orderId,
            notes: `Sold to order ${order.orderId}`
          });
        }
      });

      App.Data.orders.push(order);
      App.DB.save();
      App.UI.Toast.show('Order saved');
      App.Core.Router.navigate('orders');
    };

    const itemsRoot = document.getElementById('ord-items');
    const addBtn = document.getElementById('ord-add-item-btn');
    const totalLabel = document.getElementById('ord-total-label');

    // Pricing Logic using PriceCascade service
    const computePrice = (prodId, qty = 1) => {
      const custId = document.getElementById('ord-cust').value;
      if (App.Services.PriceCascade) {
        const priceInfo = App.Services.PriceCascade.getPrice(prodId, custId, qty);
        return priceInfo.price;
      }
      // Fallback if service not available
      const prod = (App.Data.products || []).find(p => p.id === prodId);
      if (!prod) return 0;
      return prod.dealerPrice || prod.avgPurchasePrice || 0;
    };

    const recalcTotal = () => {
      let sum = 0;
      itemsRoot.querySelectorAll('.ord-item-row').forEach(row => {
        const qty = parseFloat(row.querySelector('.ord-item-qty').value) || 0;
        const price = parseFloat(row.querySelector('.ord-item-price').value) || 0;
        sum += qty * price;
      });
      // Add VAT estimate for display
      const total = sum * 1.2; 
      totalLabel.textContent = App.Utils.formatCurrency(total);
    };

    // Stock validation helper
    const checkStock = (prodId, qty) => {
      if (App.Services.Validation) {
        return App.Services.Validation.checkStockAvailability(prodId, qty);
      }
      return { available: true, stock: 0, shortage: 0 };
    };

    // Update stock warning for a row
    const updateStockWarning = (row) => {
      const prodSelect = row.querySelector('.ord-item-prod');
      const qtyInput = row.querySelector('.ord-item-qty');
      let warning = row.querySelector('.stock-warning');

      const prodId = prodSelect.value;
      const qty = parseInt(qtyInput.value) || 0;
      const stockInfo = checkStock(prodId, qty);
      const product = (App.Data.products || []).find(p => p.id === prodId);

      // Remove existing warning
      if (warning) warning.remove();

      if (product && product.type !== 'Service') {
        if (!stockInfo.available) {
          // Out of stock or insufficient
          warning = document.createElement('div');
          warning.className = 'stock-warning';
          warning.style.cssText = 'font-size:11px; color:#f97373; margin-top:4px;';
          warning.innerHTML = `⚠️ Only ${stockInfo.stock} in stock (need ${qty}, short ${stockInfo.shortage})`;
          row.appendChild(warning);
        } else if (stockInfo.stock <= (product.minStock || 0)) {
          // Low stock warning
          warning = document.createElement('div');
          warning.className = 'stock-warning';
          warning.style.cssText = 'font-size:11px; color:#f59e0b; margin-top:4px;';
          warning.innerHTML = `⚠️ Low stock: ${stockInfo.stock} available (min: ${product.minStock || 0})`;
          row.appendChild(warning);
        } else {
          // Show available stock
          warning = document.createElement('div');
          warning.className = 'stock-warning';
          warning.style.cssText = 'font-size:11px; color:var(--color-text-muted); margin-top:4px;';
          warning.innerHTML = `✓ ${stockInfo.stock} in stock`;
          row.appendChild(warning);
        }
      }
    };

    const addRow = () => {
      const row = document.createElement('div');
      row.className = 'ord-item-row';
      row.style.cssText = 'margin-top:6px; padding:8px; border:1px solid var(--color-border); border-radius:6px;';
      row.innerHTML = `
        <div style="display:flex; gap:4px; align-items:center;">
          <select class="input ord-item-prod" style="flex:2;">
            ${prodOptions}
          </select>
          <input type="number" class="input ord-item-qty" style="width:80px;" min="1" step="1" placeholder="${App.I18n.t('orders.qty','Qty')}" value="1" />
          <input type="number" class="input ord-item-price" style="width:100px;" placeholder="${App.I18n.t('orders.price','Price')}" value="0" />
          <button class="btn btn-ghost ord-remove-item" style="padding:4px 8px;">❌</button>
        </div>
      `;
      itemsRoot.appendChild(row);

      const prodSelect = row.querySelector('.ord-item-prod');
      const priceInput = row.querySelector('.ord-item-price');
      const qtyInput = row.querySelector('.ord-item-qty');
      const removeBtn = row.querySelector('.ord-remove-item');

      prodSelect.addEventListener('change', () => {
        const qty = parseInt(qtyInput.value) || 1;
        priceInput.value = computePrice(prodSelect.value, qty);
        updateStockWarning(row);
        recalcTotal();
      });

      qtyInput.addEventListener('input', () => {
        const qty = parseInt(qtyInput.value) || 1;
        priceInput.value = computePrice(prodSelect.value, qty);
        updateStockWarning(row);
        recalcTotal();
      });

      priceInput.addEventListener('input', recalcTotal);

      removeBtn.addEventListener('click', () => {
        if (itemsRoot.querySelectorAll('.ord-item-row').length > 1) {
          row.remove();
          recalcTotal();
        } else {
          App.UI.Toast.show('Order must have at least one item');
        }
      });

      // Init
      const qty = parseInt(qtyInput.value) || 1;
      priceInput.value = computePrice(prodSelect.value, qty);
      updateStockWarning(row);
      recalcTotal();
    };

    // Recalculate all prices when customer changes
    const custSelect = document.getElementById('ord-cust');
    if (custSelect) {
      custSelect.addEventListener('change', () => {
        // Recalculate all line item prices
        itemsRoot.querySelectorAll('.ord-item-row').forEach(row => {
          const prodSelect = row.querySelector('.ord-item-prod');
          const priceInput = row.querySelector('.ord-item-price');
          const qtyInput = row.querySelector('.ord-item-qty');
          const qty = parseInt(qtyInput.value) || 1;
          priceInput.value = computePrice(prodSelect.value, qty);
        });
        recalcTotal();
      });
    }

    if (addBtn) addBtn.onclick = () => addRow();
    addRow(); // One empty row
  }
};