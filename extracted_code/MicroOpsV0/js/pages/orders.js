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
          document.querySelectorAll('.ord-item-row').forEach(row => {
            const pid = row.querySelector('.ord-item-prod').value;
            const qty = parseInt(row.querySelector('.ord-item-qty').value, 10) || 0;
            const price = parseFloat(row.querySelector('.ord-item-price').value) || 0;
            if (pid && qty > 0) items.push({ productId: pid, qty, unitPrice: price, lineNet: qty * price });
          });
          
          const subtotal = items.reduce((acc, it) => acc + it.lineNet, 0);
          const vat = subtotal * 0.2; // Fixed 20% for now
          const total = subtotal + vat;

          const order = {
            id: App.Utils.generateId('o'),
            orderId: `A${new Date().getFullYear()}-${Math.floor(Math.random()*1000)}`, // Simple ID gen
            custId,
            status: 'confirmed', // Defaulting to confirmed for workflow speed
            date: new Date().toISOString(),
            items,
            subtotalNet: subtotal,
            vatAmount: vat,
            totalGross: total
          };
          
          // Deduct stock immediately? Spec says "stock reduced when orders saved".
          items.forEach(it => {
            const prod = App.Data.products.find(p => p.id === it.productId);
            if (prod && prod.type !== 'Service') {
              prod.stock = (prod.stock || 0) - it.qty;
              if (prod.stock < 0) prod.stock = 0;
            }
          });

          App.Data.orders.push(order);
          App.DB.save();
          App.UI.Toast.show('Order saved');
          App.Core.Router.navigate('orders');
        }
      }
    ]);

    const itemsRoot = document.getElementById('ord-items');
    const addBtn = document.getElementById('ord-add-item-btn');
    const totalLabel = document.getElementById('ord-total-label');

    // Pricing Logic (Simplified)
    const computePrice = (prodId) => {
      const prod = (App.Data.products || []).find(p => p.id === prodId);
      // Real logic would check price list here. Returning dealerPrice default.
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

    const addRow = () => {
      const row = document.createElement('div');
      row.className = 'ord-item-row';
      row.style.marginTop = '6px';
      row.innerHTML = `
        <select class="input ord-item-prod" style="width:45%; display:inline-block; margin-right:4px;">
          ${prodOptions}
        </select>
        <input type="number" class="input ord-item-qty" style="width:20%; display:inline-block; margin-right:4px;" min="0" step="1" placeholder="${App.I18n.t('orders.qty','Qty')}" value="1" />
        <input type="number" class="input ord-item-price" style="width:25%; display:inline-block;" placeholder="${App.I18n.t('orders.price','Price')}" value="0" />
      `;
      itemsRoot.appendChild(row);
      
      const prodSelect = row.querySelector('.ord-item-prod');
      const priceInput = row.querySelector('.ord-item-price');
      const qtyInput = row.querySelector('.ord-item-qty');

      prodSelect.addEventListener('change', () => {
        priceInput.value = computePrice(prodSelect.value);
        recalcTotal();
      });
      qtyInput.addEventListener('input', recalcTotal);
      priceInput.addEventListener('input', recalcTotal);
      
      // Init
      priceInput.value = computePrice(prodSelect.value);
      recalcTotal();
    };

    if (addBtn) addBtn.onclick = () => addRow();
    addRow(); // One empty row
  }
};