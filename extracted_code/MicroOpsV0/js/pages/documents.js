App.UI.Views.Documents = {
  render(root) {
    const docs = App.Data.documents || App.Data.Documents || [];
    // Sort descending by date
    docs.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    root.innerHTML = `
      <div class="card-soft">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 style="font-size:16px; font-weight:600;">${App.I18n.t('pages.documents.title','Documents')}</h3>
          <div style="display:flex; gap:8px; align-items:center;">
            <button class="btn btn-ghost" id="btn-add-delivery">+ ${App.I18n.t('documents.createDelivery','Delivery Note')}</button>
            <button class="btn btn-primary" id="btn-add-invoice">+ ${App.I18n.t('documents.createInvoice','Invoice')}</button>
          </div>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Number</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Ref</th>
              <th style="text-align:right;">Total</th>
              <th style="text-align:center;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${docs.map(d => {
              const cust = App.Data.customers.find(c => c.id === d.customerId);
              const isInv = d.type === 'invoice';
              const icon = isInv ? '🧾' : '📦';
              return `
                <tr>
                  <td><span title="${d.type}">${icon}</span></td>
                  <td>${d.docNumber || d.id}</td>
                  <td>${cust ? cust.company : '-'}</td>
                  <td>${App.Utils.formatDate(d.date)}</td>
                  <td>${d.ref || d.orderId || '-'}</td>
                  <td style="text-align:right;">${isInv ? App.Utils.formatCurrency(d.grossTotal || d.total) : '-'}</td>
                  <td style="text-align:center;">
                    <button class="btn btn-ghost btn-doc-view" data-id="${d.id}" title="View/Print">👁️</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
    document.getElementById('btn-add-invoice').onclick = () => this.openCreateModal('invoice');
    document.getElementById('btn-add-delivery').onclick = () => this.openCreateModal('delivery');
    
    root.querySelectorAll('.btn-doc-view').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.printDocument(id);
      });
    });
  },

  /**
   * Modal to create a manual document or from an order.
   */
  openCreateModal(type) {
    const custOptions = (App.Data.customers || [])
      .map(c => `<option value="${c.id}">${c.company}</option>`)
      .join('');
    const orderOptions = (App.Data.orders || [])
      .filter(o => o.status !== 'draft') // Only confirmed orders
      .map(o => `<option value="${o.id}">${o.orderId} (${App.Utils.formatDate(o.date)})</option>`)
      .join('');
      
    const title = type === 'delivery' ? 'Create Delivery Note' : 'Create Invoice';
    const body = `
      <div>
        <label class="field-label">Source</label>
        <select id="doc-src" class="input">
          <option value="order">From Order</option>
          <option value="manual">Manual (Blank)</option>
        </select>
        
        <div id="doc-order-section" style="margin-top:8px;">
          <label class="field-label">Select Order</label>
          <select id="doc-order" class="input">${orderOptions}</select>
        </div>
        
        <div id="doc-manual-section" style="margin-top:8px; display:none;">
          <label class="field-label">Customer</label>
          <select id="doc-cust" class="input">${custOptions}</select>
          <p style="font-size:12px; color:var(--color-text-muted); margin-top:4px;">Manual creation creates a blank document draft.</p>
        </div>
      </div>
    `;

    App.UI.Modal.open(title, body, [
      { text: 'Cancel', variant: 'ghost', onClick: () => {} },
      {
        text: 'Generate',
        variant: 'primary',
        onClick: () => {
          const source = document.getElementById('doc-src').value;
          if (source === 'order') {
            const ordId = document.getElementById('doc-order').value;
            if(!ordId) return false;
            this.generateFromOrder(ordId, type);
          } else {
            const custId = document.getElementById('doc-cust').value;
            if(!custId) return false;
            this.createManual(custId, type);
          }
        }
      }
    ]);

    setTimeout(() => {
      const src = document.getElementById('doc-src');
      const orderSec = document.getElementById('doc-order-section');
      const manualSec = document.getElementById('doc-manual-section');
      src.onchange = () => {
        if (src.value === 'order') {
          orderSec.style.display = '';
          manualSec.style.display = 'none';
        } else {
          orderSec.style.display = 'none';
          manualSec.style.display = '';
        }
      };
    }, 0);
  },

  /**
   * Generates a document from an order object, saving it to DB.
   */
  generateFromOrder(orderId, type) {
    const o = App.Data.orders.find(x => x.id === orderId);
    if (!o) return;
    const cust = App.Data.customers.find(c => c.id === o.custId);
    
    // Generate document number using NumberSequence service
    const docNum = type === 'delivery'
      ? App.Services.NumberSequence.nextDeliveryNumber()
      : App.Services.NumberSequence.nextInvoiceNumber();

    // Address logic
    const billAddr = cust.addresses.find(a => a.id === o.billingAddressId) || cust.addresses.find(a => a.role === 'billing') || cust.addresses[0];
    const shipAddr = cust.addresses.find(a => a.id === o.shippingAddressId) || cust.addresses.find(a => a.role === 'shipping') || cust.addresses[0];

    // Map items
    const items = o.items.map(i => {
      const p = App.Data.products.find(p => p.id === i.productId);
      return {
        productId: i.productId,
        articleNumber: p ? (p.internalArticleNumber || p.sku) : '-',
        description: p ? (p.nameDE || p.nameEN) : 'Unknown Product',
        qty: i.qty,
        unit: p ? p.unit : 'Stk',
        unitPrice: i.unitPrice,
        vatRate: 0.2, // Default Austria VAT, should come from product/settings
        lineNet: i.lineNet || (i.qty * i.unitPrice),
        lineVat: (i.lineNet || (i.qty * i.unitPrice)) * 0.2,
        lineTotal: (i.lineNet || (i.qty * i.unitPrice)) * 1.2
      };
    });

    const subNet = items.reduce((sum, i) => sum + i.lineNet, 0);
    const vatAmt = subNet * 0.2;
    const total = subNet + vatAmt;

    const doc = {
      id: App.Utils.generateId('d'),
      type: type,
      docNumber: docNum,
      date: new Date().toISOString(),
      customerId: cust.id,
      billingAddressId: billAddr ? billAddr.id : null,
      shippingAddressId: shipAddr ? shipAddr.id : null,
      orderId: o.id,
      ref: o.customerReference,
      paymentTerms: cust.paymentTerms,
      deliveryTerms: cust.deliveryTerms,
      items: items,
      netTotal: subNet,
      vatSummary: [{ rate: 0.2, base: subNet, amount: vatAmt }],
      grossTotal: total,
      status: 'Draft'
    };

    // Save
    App.Data.documents.push(doc);
    App.DB.save();
    App.UI.Toast.show(`${type === 'invoice' ? 'Invoice' : 'Delivery Note'} generated`);
    App.Core.Router.navigate('documents');
  },

  createManual(custId, type) {
    // Basic stub for manual creation
    alert("Manual creation is complex - generated via Order for now.");
  },

  /**
   * Generates and opens a print-ready HTML window for the document.
   * Matches the style of "R20250068".
   */
  printDocument(id) {
    const d = App.Data.documents.find(x => x.id === id);
    if (!d) return;
    const cust = App.Data.customers.find(c => c.id === d.customerId);
    const conf = App.Data.config || {};
    
    const billAddr = (cust.addresses || []).find(a => a.id === d.billingAddressId) || (cust.addresses || [])[0] || {};
    const shipAddr = (cust.addresses || []).find(a => a.id === d.shippingAddressId) || billAddr;

    const isInv = d.type === 'invoice';
    const title = isInv ? 'Rechnung / Invoice' : 'Lieferschein / Delivery Note';
    
    // Format items
    const rows = d.items.map(i => `
      <tr>
        <td>${i.articleNumber || ''}</td>
        <td>${i.description || ''}</td>
        <td style="text-align:right">${i.qty}</td>
        <td>${i.unit || ''}</td>
        ${isInv ? `<td style="text-align:right">${App.Utils.formatCurrency(i.unitPrice)}</td>` : ''}
        ${isInv ? `<td style="text-align:right">${App.Utils.formatCurrency(i.lineNet)}</td>` : ''}
      </tr>
    `).join('');

    // Format totals (Invoice only)
    let totalsHtml = '';
    if (isInv) {
      totalsHtml = `
        <div class="totals-block">
          <div class="row"><span class="label">Netto / Net:</span> <span class="val">${App.Utils.formatCurrency(d.netTotal)}</span></div>
          <div class="row"><span class="label">MwSt / VAT (20%):</span> <span class="val">${App.Utils.formatCurrency(d.grossTotal - d.netTotal)}</span></div>
          <div class="row bold"><span class="label">Gesamt / Total:</span> <span class="val">${App.Utils.formatCurrency(d.grossTotal)}</span></div>
        </div>
      `;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${d.docNumber}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; font-size: 12px; margin: 0; padding: 40px; }
          .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
          .company-info { font-size: 11px; color: #666; }
          .doc-title { font-size: 24px; font-weight: bold; color: #000; text-transform: uppercase; }
          .doc-meta { text-align: right; margin-top: 10px; font-size: 13px; }
          
          .addresses { display: flex; gap: 40px; margin-bottom: 40px; }
          .addr-box { flex: 1; border: 1px solid #eee; padding: 15px; border-radius: 4px; }
          .addr-title { font-weight: bold; margin-bottom: 5px; font-size: 11px; text-transform: uppercase; color: #888; }
          
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { text-align: left; border-bottom: 2px solid #333; padding: 8px; font-size: 11px; text-transform: uppercase; }
          td { border-bottom: 1px solid #eee; padding: 8px; vertical-align: top; }
          
          .totals-block { width: 300px; margin-left: auto; margin-top: 20px; }
          .totals-block .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
          .totals-block .bold { font-weight: bold; font-size: 14px; border-top: 1px solid #333; padding-top: 5px; }
          
          .footer { margin-top: 60px; font-size: 10px; color: #888; border-top: 1px solid #eee; padding-top: 10px; display: flex; justify-content: space-between; }
          
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="company-info">
              <strong>${conf.companyName || 'MicroOps Global'}</strong><br/>
              Tax ID: ${cust.vatNumber || '-'}<br/>
              Email: info@microops.com
            </div>
          </div>
          <div>
            <div class="doc-title">${title}</div>
            <div class="doc-meta">
              <strong>No:</strong> ${d.docNumber}<br/>
              <strong>Date:</strong> ${d.date.split('T')[0]}<br/>
              <strong>Ref:</strong> ${d.ref || '-'}
            </div>
          </div>
        </div>

        <div class="addresses">
          <div class="addr-box">
            <div class="addr-title">Billing Address</div>
            <strong>${cust.company}</strong><br/>
            ${billAddr.street || ''}<br/>
            ${billAddr.zip || ''} ${billAddr.city || ''}<br/>
            ${billAddr.country || ''}<br/>
            ${cust.vatNumber ? 'VAT: ' + cust.vatNumber : ''}
          </div>
          <div class="addr-box">
            <div class="addr-title">Shipping Address</div>
            <strong>${cust.company}</strong><br/>
            ${shipAddr.street || ''}<br/>
            ${shipAddr.zip || ''} ${shipAddr.city || ''}<br/>
            ${shipAddr.country || ''}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th width="15%">Art. No.</th>
              <th width="40%">Description</th>
              <th width="10%" style="text-align:right">Qty</th>
              <th width="10%">Unit</th>
              ${isInv ? `<th width="12%" style="text-align:right">Price</th>` : ''}
              ${isInv ? `<th width="13%" style="text-align:right">Total</th>` : ''}
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        ${totalsHtml}

        <div class="footer">
          <div>
            <strong>Terms:</strong> ${d.paymentTerms || '-'}<br/>
            <strong>Delivery:</strong> ${d.deliveryTerms || '-'}
          </div>
          <div>
            <strong>Bank:</strong> ${conf.bankName || '-'}<br/>
            <strong>IBAN:</strong> ${cust.iban || '-'}
          </div>
          <div>
            MicroOps ERP Generated
          </div>
        </div>
        
        <div class="no-print" style="position:fixed; bottom:20px; right:20px;">
          <button onclick="window.print()" style="padding:10px 20px; background:#333; color:#fff; border:none; cursor:pointer;">PRINT</button>
        </div>
      </body>
      </html>
    `;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
  }
};