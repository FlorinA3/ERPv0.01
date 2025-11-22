App.UI.Views.Orders = {
  statusFlow: ['draft', 'confirmed', 'processing', 'shipped', 'delivered', 'paid', 'cancelled'],

  render(root) {
    const orders = App.Data.orders || [];
    const carriers = App.Data.carriers || [];
    // Sort orders by date descending
    orders.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Calculate order stats
    const stats = {
      total: orders.length,
      pending: orders.filter(o => ['draft', 'confirmed', 'processing'].includes(o.status?.toLowerCase())).length,
      shipped: orders.filter(o => o.status?.toLowerCase() === 'shipped').length,
      completed: orders.filter(o => ['delivered', 'paid'].includes(o.status?.toLowerCase())).length
    };

    const getStatusBadge = (status) => {
      const st = (status || 'draft').toLowerCase();
      const styles = {
        draft: 'background:#e5e7eb;color:#374151;',
        confirmed: 'background:#dbeafe;color:#1d4ed8;',
        processing: 'background:#fef3c7;color:#d97706;',
        shipped: 'background:#e0e7ff;color:#4f46e5;',
        delivered: 'background:#d1fae5;color:#059669;',
        paid: 'background:#dcfce7;color:#16a34a;',
        cancelled: 'background:#fee2e2;color:#dc2626;'
      };
      return `<span class="tag" style="${styles[st] || ''}">${status?.toUpperCase() || 'DRAFT'}</span>`;
    };

    root.innerHTML = `
      <div class="card-soft" style="margin-bottom:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 style="font-size:16px; font-weight:600;">${App.I18n.t('pages.orders.title','Orders')}</h3>
          <div style="display:flex; gap:8px; align-items:center;">
            <input type="text" id="order-search" class="input" placeholder="${App.I18n.t('common.search','Search...')}" style="width:200px;" />
            <button class="btn btn-ghost" id="ord-export-excel">${App.I18n.t('orders.exportCsv','Export CSV')}</button>
            <button class="btn btn-primary" id="btn-add-order">+ ${App.I18n.t('orders.create','Create Order')}</button>
          </div>
        </div>

        <div class="grid grid-4" style="margin-bottom:16px;">
          <div style="padding:12px; background:var(--color-bg); border-radius:6px; text-align:center;">
            <div style="font-size:11px; text-transform:uppercase; color:var(--color-text-muted);">Total Orders</div>
            <div style="font-size:20px; font-weight:700; margin-top:4px;">${stats.total}</div>
          </div>
          <div style="padding:12px; background:var(--color-bg); border-radius:6px; text-align:center;">
            <div style="font-size:11px; text-transform:uppercase; color:var(--color-text-muted);">Pending</div>
            <div style="font-size:20px; font-weight:700; margin-top:4px; ${stats.pending > 0 ? 'color:#f59e0b;' : ''}">${stats.pending}</div>
          </div>
          <div style="padding:12px; background:var(--color-bg); border-radius:6px; text-align:center;">
            <div style="font-size:11px; text-transform:uppercase; color:var(--color-text-muted);">Shipped</div>
            <div style="font-size:20px; font-weight:700; margin-top:4px; ${stats.shipped > 0 ? 'color:#4f46e5;' : ''}">${stats.shipped}</div>
          </div>
          <div style="padding:12px; background:var(--color-bg); border-radius:6px; text-align:center;">
            <div style="font-size:11px; text-transform:uppercase; color:var(--color-text-muted);">Completed</div>
            <div style="font-size:20px; font-weight:700; margin-top:4px; ${stats.completed > 0 ? 'color:#16a34a;' : ''}">${stats.completed}</div>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Carrier</th>
              <th>Date</th>
              <th style="text-align:right;">Total</th>
              <th style="text-align:center;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${orders.length > 0 ? orders.map(o => {
              const cust = (App.Data.customers || []).find(c => c.id === o.custId);
              const carrier = o.carrierId ? carriers.find(c => c.id === o.carrierId) : null;
              const esc = App.Utils.escapeHtml;
              return `
                <tr>
                  <td><strong>${esc(o.orderId || o.id)}</strong></td>
                  <td>${cust ? esc(cust.company) : '-'}</td>
                  <td>${getStatusBadge(o.status)}</td>
                  <td>${carrier ? esc(carrier.name) : '-'}</td>
                  <td>${App.Utils.formatDate(o.date)}</td>
                  <td style="text-align:right;">${App.Utils.formatCurrency(o.totalGross || o.subtotalNet || 0)}</td>
                  <td style="text-align:center;">
                    <button class="btn btn-ghost btn-view-order" data-id="${o.id}" title="${App.I18n.t('common.viewDetails', 'View Details')}" aria-label="View order details">👁️</button>
                    <button class="btn btn-ghost btn-status-order" data-id="${o.id}" title="${App.I18n.t('common.changeStatus', 'Change Status')}" aria-label="Change order status">🔄</button>
                    <button class="btn btn-ghost btn-gen-delivery" data-id="${o.id}" title="${App.I18n.t('common.deliveryNote', 'Delivery Note')}" aria-label="Generate delivery note">📦</button>
                    <button class="btn btn-ghost btn-gen-invoice" data-id="${o.id}" title="${App.I18n.t('common.invoice', 'Invoice')}" aria-label="Generate invoice">🧾</button>
                    <button class="btn btn-ghost btn-del-order" data-id="${o.id}" title="${App.I18n.t('common.delete', 'Delete')}" aria-label="Delete order">🗑️</button>
                  </td>
                </tr>
              `;
            }).join('') : '<tr><td colspan="7" style="text-align:center; color:var(--color-text-muted);">No orders</td></tr>'}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('btn-add-order').onclick = () => this.openCreateModal();
    
    // Export Logic - uses secure CSV utility with injection protection
    const exp = document.getElementById('ord-export-excel');
    if (exp) {
      exp.onclick = () => {
        const headers = ['ID', 'Customer', 'Status', 'Date', 'Total'];
        const rows = orders.map(o => {
          const cust = App.Data.customers.find(c => c.id === o.custId);
          return [
            o.orderId || o.id,
            cust ? cust.company : '',
            o.status || '',
            App.Utils.formatDate(o.date),
            o.totalGross
          ];
        });
        App.Utils.exportCSV(headers, rows, 'orders.csv');
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
          App.UI.Toast.show('Documents module not ready');
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

    root.querySelectorAll('.btn-view-order').forEach(btn => {
      btn.addEventListener('click', () => this.viewOrder(btn.getAttribute('data-id')));
    });

    root.querySelectorAll('.btn-status-order').forEach(btn => {
      btn.addEventListener('click', () => this.changeStatus(btn.getAttribute('data-id')));
    });

    root.querySelectorAll('.btn-del-order').forEach(btn => {
      btn.addEventListener('click', () => this.deleteOrder(btn.getAttribute('data-id')));
    });

    // Search functionality
    const searchInput = document.getElementById('order-search');
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

  viewOrder(id) {
    const orders = App.Data.orders || [];
    const order = orders.find(o => o.id === id);
    if (!order) return;

    const cust = App.Data.customers.find(c => c.id === order.custId);
    const carrier = order.carrierId ? (App.Data.carriers || []).find(c => c.id === order.carrierId) : null;

    const itemsHtml = (order.items || []).map(item => {
      const prod = (App.Data.products || []).find(p => p.id === item.productId);
      return `
        <tr>
          <td>${prod ? (prod.internalArticleNumber || prod.sku) : '-'}</td>
          <td>${prod ? (prod.nameDE || prod.nameEN) : item.productId}</td>
          <td style="text-align:right;">${item.qty}</td>
          <td style="text-align:right;">${App.Utils.formatCurrency(item.unitPrice || 0)}</td>
          <td style="text-align:right;">${App.Utils.formatCurrency(item.lineNet || 0)}</td>
        </tr>
      `;
    }).join('');

    const body = `
      <div style="margin-bottom:12px;">
        <div class="grid grid-2" style="gap:16px;">
          <div>
            <strong>Order:</strong> ${order.orderId || order.id}<br>
            <strong>Date:</strong> ${App.Utils.formatDate(order.date)}<br>
            <strong>Status:</strong> ${order.status || 'Draft'}
          </div>
          <div>
            <strong>Customer:</strong> ${cust ? cust.company : '-'}<br>
            <strong>Carrier:</strong> ${carrier ? carrier.name : '-'}<br>
            ${order.trackingNumber ? `<strong>Tracking:</strong> ${order.trackingNumber}` : ''}
          </div>
        </div>
      </div>

      <table class="table" style="font-size:13px;">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Product</th>
            <th style="text-align:right;">Qty</th>
            <th style="text-align:right;">Price</th>
            <th style="text-align:right;">Total</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot>
          <tr>
            <td colspan="4" style="text-align:right;"><strong>Subtotal:</strong></td>
            <td style="text-align:right;">${App.Utils.formatCurrency(order.subtotalNet || 0)}</td>
          </tr>
          <tr>
            <td colspan="4" style="text-align:right;">VAT (20%):</td>
            <td style="text-align:right;">${App.Utils.formatCurrency(order.vatAmount || 0)}</td>
          </tr>
          <tr>
            <td colspan="4" style="text-align:right;"><strong>Total:</strong></td>
            <td style="text-align:right;"><strong>${App.Utils.formatCurrency(order.totalGross || 0)}</strong></td>
          </tr>
        </tfoot>
      </table>

      ${order.notes ? `<p style="margin-top:12px; font-size:12px; color:var(--color-text-muted);">Notes: ${order.notes}</p>` : ''}
    `;

    App.UI.Modal.open('Order Details', body, [
      { text: 'Close', variant: 'ghost', onClick: () => {} }
    ]);
  },

  changeStatus(id) {
    const orders = App.Data.orders || [];
    const order = orders.find(o => o.id === id);
    if (!order) return;

    const carriers = App.Data.carriers || [];
    const currentStatus = (order.status || 'draft').toLowerCase();

    const statusOpts = this.statusFlow.map(s =>
      `<option value="${s}" ${currentStatus === s ? 'selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`
    ).join('');

    const carrierOpts = [
      '<option value="">-- No Carrier --</option>',
      ...carriers.map(c => `<option value="${c.id}" ${order.carrierId === c.id ? 'selected' : ''}>${c.name}</option>`)
    ].join('');

    const body = `
      <div>
        <p style="margin-bottom:12px;">
          Order: <strong>${order.orderId || order.id}</strong>
        </p>

        <label class="field-label">Status</label>
        <select id="status-select" class="input">${statusOpts}</select>

        <div id="shipping-fields" style="margin-top:12px; ${['shipped', 'delivered'].includes(currentStatus) ? '' : 'display:none;'}">
          <label class="field-label">Carrier</label>
          <select id="carrier-select" class="input">${carrierOpts}</select>

          <label class="field-label" style="margin-top:8px;">Tracking Number</label>
          <input id="tracking-input" class="input" value="${order.trackingNumber || ''}" placeholder="Enter tracking number" />

          <label class="field-label" style="margin-top:8px;">Ship Date</label>
          <input id="ship-date" class="input" type="date" value="${order.shipDate || new Date().toISOString().split('T')[0]}" />
        </div>

        <div id="delivery-fields" style="margin-top:12px; ${currentStatus === 'delivered' ? '' : 'display:none;'}">
          <label class="field-label">Delivery Date</label>
          <input id="delivery-date" class="input" type="date" value="${order.deliveryDate || new Date().toISOString().split('T')[0]}" />
        </div>

        <div id="payment-fields" style="margin-top:12px; ${currentStatus === 'paid' ? '' : 'display:none;'}">
          <label class="field-label">Payment Date</label>
          <input id="payment-date" class="input" type="date" value="${order.paymentDate || new Date().toISOString().split('T')[0]}" />

          <label class="field-label" style="margin-top:8px;">Payment Method</label>
          <select id="payment-method" class="input">
            <option value="bank_transfer" ${order.paymentMethod === 'bank_transfer' ? 'selected' : ''}>Bank Transfer</option>
            <option value="credit_card" ${order.paymentMethod === 'credit_card' ? 'selected' : ''}>Credit Card</option>
            <option value="cash" ${order.paymentMethod === 'cash' ? 'selected' : ''}>Cash</option>
            <option value="paypal" ${order.paymentMethod === 'paypal' ? 'selected' : ''}>PayPal</option>
          </select>
        </div>

        <div style="margin-top:12px;">
          <label class="field-label">Notes</label>
          <textarea id="status-notes" class="input" rows="2" placeholder="Optional notes about this status change">${order.statusNotes || ''}</textarea>
        </div>
      </div>
    `;

    App.UI.Modal.open('Change Order Status', body, [
      { text: 'Cancel', variant: 'ghost', onClick: () => {} },
      {
        text: 'Update',
        variant: 'primary',
        onClick: () => {
          const newStatus = document.getElementById('status-select').value;

          order.status = newStatus;
          order.statusNotes = document.getElementById('status-notes').value.trim();
          order.lastStatusChange = new Date().toISOString();

          // Capture shipping info
          if (['shipped', 'delivered', 'paid'].includes(newStatus)) {
            order.carrierId = document.getElementById('carrier-select').value || null;
            order.trackingNumber = document.getElementById('tracking-input').value.trim() || null;
            order.shipDate = document.getElementById('ship-date').value || null;
          }

          // Capture delivery info
          if (['delivered', 'paid'].includes(newStatus)) {
            order.deliveryDate = document.getElementById('delivery-date').value || null;
          }

          // Capture payment info
          if (newStatus === 'paid') {
            order.paymentDate = document.getElementById('payment-date').value || null;
            order.paymentMethod = document.getElementById('payment-method').value || null;
          }

          // Log status change
          if (!order.statusHistory) order.statusHistory = [];
          order.statusHistory.push({
            status: newStatus,
            date: new Date().toISOString(),
            userId: App.Services.Auth.currentUser?.id,
            notes: order.statusNotes
          });

          App.DB.save();
          App.UI.Toast.show(`Order status updated to ${newStatus}`);

          // Trigger automation - generate documents based on status
          if (App.Services.Automation) {
            App.Services.Automation.onStatusChange(order.id, newStatus, currentStatus);
          }

          // Log activity
          if (App.Services.ActivityLog) {
            App.Services.ActivityLog.log('update', 'order', order.id, {
              name: order.orderId,
              action: 'status_change',
              oldStatus: currentStatus,
              newStatus: newStatus
            });
          }

          App.Core.Router.navigate('orders');
        }
      }
    ]);

    // Wire up dynamic field visibility
    setTimeout(() => {
      const statusSelect = document.getElementById('status-select');
      const shippingFields = document.getElementById('shipping-fields');
      const deliveryFields = document.getElementById('delivery-fields');
      const paymentFields = document.getElementById('payment-fields');

      if (statusSelect) {
        statusSelect.onchange = () => {
          const val = statusSelect.value;
          shippingFields.style.display = ['shipped', 'delivered', 'paid'].includes(val) ? 'block' : 'none';
          deliveryFields.style.display = ['delivered', 'paid'].includes(val) ? 'block' : 'none';
          paymentFields.style.display = val === 'paid' ? 'block' : 'none';
        };
      }
    }, 50);
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

      // Trigger automation - create production orders for products with BOM
      if (App.Services.Automation) {
        App.Services.Automation.processOrderCreation(order);

        // Create task for big orders (> 2000 EUR)
        if (order.totalGross > 2000) {
          App.Services.Automation.createTaskForOrder(order, 'Plan production');
        }
      }

      // Log activity
      if (App.Services.ActivityLog) {
        App.Services.ActivityLog.log('create', 'order', order.id, {
          name: order.orderId,
          customer: (App.Data.customers || []).find(c => c.id === custId)?.company,
          total: order.totalGross,
          itemCount: items.length
        });
      }

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

    // Update stock warning and margin indicator for a row
    const updateStockWarning = (row) => {
      const prodSelect = row.querySelector('.ord-item-prod');
      const qtyInput = row.querySelector('.ord-item-qty');
      const priceInput = row.querySelector('.ord-item-price');
      let warning = row.querySelector('.stock-warning');
      let marginIndicator = row.querySelector('.margin-indicator');

      const prodId = prodSelect.value;
      const qty = parseInt(qtyInput.value) || 0;
      const price = parseFloat(priceInput.value) || 0;
      const stockInfo = checkStock(prodId, qty);
      const product = (App.Data.products || []).find(p => p.id === prodId);

      // Remove existing warnings
      if (warning) warning.remove();
      if (marginIndicator) marginIndicator.remove();

      if (product && product.type !== 'Service') {
        // Stock warning
        if (!stockInfo.available) {
          warning = document.createElement('div');
          warning.className = 'stock-warning';
          warning.style.cssText = 'font-size:11px; color:#f97373; margin-top:4px;';

          // Check if product has BOM - suggest production order
          const hasBOM = product.bom && product.bom.length > 0;
          if (hasBOM) {
            warning.innerHTML = `
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span>⚠️ Only ${stockInfo.stock} in stock (need ${qty}, short ${stockInfo.shortage})</span>
                <button type="button" class="btn btn-ghost btn-suggest-production"
                  data-product-id="${prodId}" data-shortage="${stockInfo.shortage}"
                  style="font-size:10px; padding:2px 6px; color:#4f46e5;">
                  🏭 Create PO
                </button>
              </div>
              <div style="font-size:10px; color:#4f46e5; margin-top:2px;">
                ✨ Product has BOM - can be produced (${product.bom.length} components)
              </div>
            `;
          } else {
            warning.innerHTML = `⚠️ Only ${stockInfo.stock} in stock (need ${qty}, short ${stockInfo.shortage})`;
          }
          row.appendChild(warning);

          // Wire up production suggestion button
          const prodBtn = warning.querySelector('.btn-suggest-production');
          if (prodBtn) {
            prodBtn.onclick = (e) => {
              e.preventDefault();
              this.suggestProductionOrder(prodId, stockInfo.shortage, product);
            };
          }
        } else if (stockInfo.stock <= (product.minStock || 0)) {
          warning = document.createElement('div');
          warning.className = 'stock-warning';
          warning.style.cssText = 'font-size:11px; color:#f59e0b; margin-top:4px;';
          warning.innerHTML = `⚠️ Low stock: ${stockInfo.stock} available (min: ${product.minStock || 0})`;
          row.appendChild(warning);
        } else {
          warning = document.createElement('div');
          warning.className = 'stock-warning';
          warning.style.cssText = 'font-size:11px; color:var(--color-text-muted); margin-top:4px;';
          warning.innerHTML = `✓ ${stockInfo.stock} in stock`;
          row.appendChild(warning);
        }

        // Margin indicator (green/yellow/red)
        const purchasePrice = product.avgPurchasePrice || 0;
        if (purchasePrice > 0 && price > 0) {
          const margin = ((price - purchasePrice) / purchasePrice) * 100;
          let marginColor, marginIcon, marginText;

          if (margin >= 20) {
            marginColor = '#16a34a';
            marginIcon = '●';
            marginText = `+${margin.toFixed(0)}% margin`;
          } else if (margin >= 5) {
            marginColor = '#f59e0b';
            marginIcon = '●';
            marginText = `+${margin.toFixed(0)}% margin`;
          } else if (margin >= 0) {
            marginColor = '#dc2626';
            marginIcon = '●';
            marginText = `+${margin.toFixed(0)}% low margin`;
          } else {
            marginColor = '#dc2626';
            marginIcon = '▼';
            marginText = `${margin.toFixed(0)}% LOSS`;
          }

          marginIndicator = document.createElement('span');
          marginIndicator.className = 'margin-indicator';
          marginIndicator.style.cssText = `font-size:10px; color:${marginColor}; margin-left:8px;`;
          marginIndicator.innerHTML = `${marginIcon} ${marginText}`;
          priceInput.parentNode.insertBefore(marginIndicator, priceInput.nextSibling);
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

      priceInput.addEventListener('input', () => {
        updateStockWarning(row);
        recalcTotal();
      });

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
        const selectedCustId = custSelect.value;
        const customer = (App.Data.customers || []).find(c => c.id === selectedCustId);

        // Auto-apply customer defaults (payment terms, delivery terms, carrier)
        if (customer) {
          // Store defaults for order creation
          custSelect.dataset.paymentTerms = customer.paymentTerms || '';
          custSelect.dataset.deliveryTerms = customer.deliveryTerms || '';
          custSelect.dataset.defaultCarrier = customer.defaultCarrierId || '';
          custSelect.dataset.segment = customer.segment || '';

          // Show customer info with price preview button
          const infoText = [];
          if (customer.paymentTerms) infoText.push(`Payment: ${customer.paymentTerms}`);
          if (customer.deliveryTerms) infoText.push(`Delivery: ${customer.deliveryTerms}`);
          if (customer.segment) infoText.push(`Segment: ${customer.segment}`);

          let infoDiv = document.getElementById('customer-defaults-info');
          if (!infoDiv) {
            infoDiv = document.createElement('div');
            infoDiv.id = 'customer-defaults-info';
            infoDiv.style.cssText = 'font-size:11px; color:var(--color-text-muted); margin-top:4px; padding:6px; background:var(--color-bg); border-radius:4px; display:flex; justify-content:space-between; align-items:center;';
            custSelect.parentNode.appendChild(infoDiv);
          }

          infoDiv.innerHTML = `
            <span>${infoText.length > 0 ? infoText.join(' | ') : 'No defaults set'}</span>
            <button type="button" class="btn btn-ghost" id="btn-price-preview" style="font-size:10px; padding:2px 6px;">💰 Price Preview</button>
          `;

          // Price preview button handler
          document.getElementById('btn-price-preview').onclick = () => {
            if (App.Services.PriceCascade) {
              const prices = App.Services.PriceCascade.getAllPricesForCustomer(selectedCustId);
              const priceRows = prices.slice(0, 20).map(p => `
                <tr>
                  <td style="font-size:11px;">${p.sku || '-'}</td>
                  <td style="font-size:11px;">${p.productName || '-'}</td>
                  <td style="text-align:right; font-size:11px;">${App.Utils.formatCurrency(p.price)}</td>
                  <td style="font-size:10px; color:var(--color-text-muted);">${p.source}</td>
                </tr>
              `).join('');

              App.UI.Modal.open(`Price Preview: ${customer.company}`, `
                <div style="max-height:300px; overflow-y:auto;">
                  <p style="font-size:12px; margin-bottom:8px; color:var(--color-text-muted);">
                    Showing prices for this customer (${prices.length} products)
                  </p>
                  <table class="table" style="font-size:12px;">
                    <thead>
                      <tr>
                        <th>SKU</th>
                        <th>Product</th>
                        <th style="text-align:right;">Price</th>
                        <th>Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${priceRows || '<tr><td colspan="4">No products</td></tr>'}
                    </tbody>
                  </table>
                </div>
              `, [{ text: 'Close', variant: 'ghost', onClick: () => {} }]);
            }
          };
        }

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
  },

  /**
   * Suggest creating a production order for a product with shortage
   */
  suggestProductionOrder(productId, shortage, product) {
    const components = App.Data.components || [];

    // Check component availability for the shortage quantity
    const compList = (product.bom || []).map(b => {
      const comp = components.find(c => c.id === b.componentId);
      const required = b.quantityPerUnit * shortage;
      const available = comp ? (comp.stock || 0) : 0;
      return {
        name: comp?.description || comp?.componentNumber || b.componentId,
        required,
        available,
        shortage: required > available ? required - available : 0
      };
    });

    const hasComponentShortage = compList.some(c => c.shortage > 0);

    const body = `
      <div>
        <p style="margin-bottom:12px;">
          Create a production order to produce <strong>${shortage}</strong> units of
          <strong>${product.nameDE || product.nameEN || product.internalArticleNumber}</strong>?
        </p>

        <div style="margin-bottom:12px;">
          <strong>Components Required:</strong>
          <table class="table" style="font-size:12px; margin-top:8px;">
            <thead>
              <tr>
                <th>Component</th>
                <th style="text-align:right;">Required</th>
                <th style="text-align:right;">Available</th>
              </tr>
            </thead>
            <tbody>
              ${compList.map(c => `
                <tr style="${c.shortage > 0 ? 'color:#f97373;' : ''}">
                  <td>${c.name}</td>
                  <td style="text-align:right;">${c.required}</td>
                  <td style="text-align:right;">${c.available}${c.shortage > 0 ? ` (short ${c.shortage})` : ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        ${hasComponentShortage ? `
          <div style="padding:8px; background:#fef3c7; border-radius:4px; margin-bottom:12px;">
            <strong style="color:#d97706;">⚠️ Component Shortage</strong>
            <p style="font-size:12px; margin-top:4px; color:#92400e;">
              Some components are not available. Production order will be created but may require purchasing components first.
            </p>
          </div>
        ` : ''}

        <label class="field-label">Quantity to Produce</label>
        <input id="suggest-po-qty" class="input" type="number" min="1" value="${shortage}" />

        <label class="field-label" style="margin-top:8px;">Planned Start Date</label>
        <input id="suggest-po-date" class="input" type="date" value="${new Date().toISOString().split('T')[0]}" />
      </div>
    `;

    App.UI.Modal.open('Create Production Order', body, [
      { text: 'Cancel', variant: 'ghost', onClick: () => {} },
      {
        text: 'Create Production Order',
        variant: 'primary',
        onClick: () => {
          const qty = parseInt(document.getElementById('suggest-po-qty').value) || shortage;
          const plannedStart = document.getElementById('suggest-po-date').value;

          // Create production order
          const productionOrders = App.Data.productionOrders || [];
          const po = {
            id: App.Utils.generateId('po'),
            orderNumber: App.Services.NumberSequence.nextProductionOrderNumber(),
            productId: productId,
            quantity: qty,
            createdBy: App.Services.Auth.currentUser?.id || null,
            createdAt: new Date().toISOString(),
            plannedStart: plannedStart,
            status: 'planned',
            components: product.bom.map(b => ({
              componentId: b.componentId,
              quantity: b.quantityPerUnit * qty
            })),
            notes: 'Created from order shortage suggestion'
          };

          productionOrders.push(po);
          App.Data.productionOrders = productionOrders;
          App.DB.save();

          // Log activity
          if (App.Services.ActivityLog) {
            App.Services.ActivityLog.log('create', 'production', po.id, {
              name: po.orderNumber,
              product: product.nameDE || product.nameEN,
              quantity: qty,
              trigger: 'shortage_suggestion'
            });
          }

          App.UI.Toast.show(`Production order ${po.orderNumber} created for ${qty} units`);
        }
      }
    ]);
  },

  /**
   * Delete an order with referential integrity checks
   */
  deleteOrder(id) {
    const orders = App.Data.orders || [];
    const order = orders.find(o => o.id === id);
    if (!order) return;

    // Check for linked documents
    const documents = App.Data.documents || [];
    const linkedDocs = documents.filter(d => d.orderId === id);

    // Check for linked production orders
    const productionOrders = App.Data.productionOrders || [];
    const linkedPOs = productionOrders.filter(po => po.sourceOrderId === id);

    if (linkedDocs.length > 0 || linkedPOs.length > 0) {
      const issues = [];
      if (linkedDocs.length > 0) {
        issues.push(`<li>${linkedDocs.length} document(s) (invoices/delivery notes)</li>`);
      }
      if (linkedPOs.length > 0) {
        issues.push(`<li>${linkedPOs.length} production order(s)</li>`);
      }

      App.UI.Modal.open('Cannot Delete Order', `
        <div style="color:#dc2626;">
          <p><strong>This order has linked records:</strong></p>
          <ul style="margin:8px 0; padding-left:20px;">
            ${issues.join('')}
          </ul>
          <p style="font-size:12px;">Delete these records first or archive the order instead.</p>
        </div>
      `, [
        { text: 'Close', variant: 'ghost', onClick: () => {} }
      ]);
      return;
    }

    const cust = (App.Data.customers || []).find(c => c.id === order.custId);

    App.UI.Modal.open('Delete Order', `
      <div>
        <p style="margin-bottom:12px;">
          Are you sure you want to delete order <strong>${order.orderId}</strong>?
        </p>
        <div style="font-size:12px; color:var(--color-text-muted);">
          <p>Customer: ${cust ? cust.company : '-'}</p>
          <p>Total: ${App.Utils.formatCurrency(order.totalGross || 0)}</p>
          <p>Items: ${(order.items || []).length}</p>
        </div>
        <p style="margin-top:12px; font-size:12px; color:#f59e0b;">
          ⚠️ Stock will be restored for order items.
        </p>
      </div>
    `, [
      { text: 'Cancel', variant: 'ghost', onClick: () => {} },
      {
        text: 'Delete Order',
        variant: 'primary',
        onClick: () => {
          // Restore stock for order items
          (order.items || []).forEach(item => {
            const prod = (App.Data.products || []).find(p => p.id === item.productId);
            if (prod && prod.type !== 'Service') {
              prod.stock = (prod.stock || 0) + (item.qty || 0);
            }
          });

          // Record reversal movements
          const movements = App.Data.movements || [];
          (order.items || []).forEach(item => {
            const prod = (App.Data.products || []).find(p => p.id === item.productId);
            if (prod && prod.type !== 'Service') {
              movements.push({
                id: App.Utils.generateId('mv'),
                date: new Date().toISOString(),
                type: 'adjustment',
                direction: 'in',
                productId: item.productId,
                quantity: item.qty || 0,
                reference: order.orderId,
                notes: `Stock restored - order deleted`
              });
            }
          });

          // Delete the order
          App.Data.orders = orders.filter(o => o.id !== id);
          App.DB.save();

          // Log activity
          if (App.Services.ActivityLog) {
            App.Services.ActivityLog.log('delete', 'order', id, {
              name: order.orderId,
              customer: cust?.company,
              total: order.totalGross
            });
          }

          App.UI.Toast.show('Order deleted and stock restored');
          App.Core.Router.navigate('orders');
        }
      }
    ]);
  }
};