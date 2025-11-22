App.UI.Views.Documents = {
  render(root) {
    const docs = App.Data.documents || [];
    docs.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    const getPaymentStatus = (doc) => {
      if (doc.type !== 'invoice') return '';
      const paid = doc.paidAmount || 0;
      const total = doc.grossTotal || 0;

      if (paid >= total) {
        return '<span class="tag tag-success">Paid</span>';
      }

      const now = new Date();
      const due = doc.dueDate ? new Date(doc.dueDate) : null;

      if (paid > 0 && paid < total) {
        return '<span class="tag" style="background:#dbeafe;color:#1d4ed8;">Partial</span>';
      }

      if (due && due < now) {
        const daysOverdue = Math.ceil((now - due) / (1000 * 60 * 60 * 24));
        return `<span class="tag" style="background:#fee2e2;color:#dc2626;">Overdue ${daysOverdue}d</span>`;
      }

      return '<span class="tag" style="background:#fef3c7;color:#d97706;">Open</span>';
    };

    const formatDueDate = (doc) => {
      if (doc.type !== 'invoice' || !doc.dueDate) return '-';
      return doc.dueDate.split('T')[0];
    };

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
              <th>Due Date</th>
              <th style="text-align:right;">Total</th>
              <th style="text-align:center;">Payment</th>
              <th style="text-align:center;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${docs.length > 0 ? docs.map(d => {
              const cust = App.Data.customers.find(c => c.id === d.customerId);
              const isInv = d.type === 'invoice';
              const icon = isInv ? '🧾' : '📦';
              return `
                <tr>
                  <td><span title="${d.type}">${icon}</span></td>
                  <td><strong>${d.docNumber || d.id}</strong></td>
                  <td>${cust ? cust.company : '-'}</td>
                  <td>${App.Utils.formatDate(d.date)}</td>
                  <td>${formatDueDate(d)}</td>
                  <td style="text-align:right;">${isInv ? App.Utils.formatCurrency(d.grossTotal || d.total) : '-'}</td>
                  <td style="text-align:center;">${getPaymentStatus(d)}</td>
                  <td style="text-align:center;">
                    <button class="btn btn-ghost btn-doc-view" data-id="${d.id}" title="View/Print" aria-label="View document">👁️</button>
                    ${isInv && (d.paidAmount || 0) < (d.grossTotal || 0) ? `<button class="btn btn-ghost btn-doc-pay" data-id="${d.id}" title="Record Payment" aria-label="Record payment">💰</button>` : ''}
                    ${isInv ? `<button class="btn btn-ghost btn-doc-history" data-id="${d.id}" title="Payment History" aria-label="Payment history">📋</button>` : ''}
                    <button class="btn btn-ghost btn-doc-delete" data-id="${d.id}" title="Delete" aria-label="Delete document">🗑️</button>
                  </td>
                </tr>
              `;
            }).join('') : '<tr><td colspan="8" style="text-align:center;color:var(--color-text-muted);">No documents</td></tr>'}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('btn-add-invoice')?.addEventListener('click', () => this.openCreateModal('invoice'));
    document.getElementById('btn-add-delivery')?.addEventListener('click', () => this.openCreateModal('delivery'));

    root.querySelectorAll('.btn-doc-view').forEach(btn => {
      btn.addEventListener('click', () => this.printDocument(btn.getAttribute('data-id')));
    });

    root.querySelectorAll('.btn-doc-pay').forEach(btn => {
      btn.addEventListener('click', () => this.openPaymentModal(btn.getAttribute('data-id')));
    });

    root.querySelectorAll('.btn-doc-history').forEach(btn => {
      btn.addEventListener('click', () => this.openPaymentHistory(btn.getAttribute('data-id')));
    });

    root.querySelectorAll('.btn-doc-delete').forEach(btn => {
      btn.addEventListener('click', () => this.deleteDocument(btn.getAttribute('data-id')));
    });
  },

  deleteDocument(id) {
    const documents = App.Data.documents || [];
    const doc = documents.find(d => d.id === id);
    if (!doc) return;

    const cust = (App.Data.customers || []).find(c => c.id === doc.customerId);
    const isInvoice = doc.type === 'invoice';
    const hasPaidAmount = isInvoice && (doc.paidAmount || 0) > 0;

    // Warn if invoice has payments
    if (hasPaidAmount) {
      App.UI.Modal.open('Document Has Payments', `
        <div style="color:#f59e0b;">
          <p><strong>⚠️ This invoice has recorded payments</strong></p>
          <p style="font-size:12px; margin-top:8px;">
            Paid: ${App.Utils.formatCurrency(doc.paidAmount)}<br/>
            Deleting will remove payment history.
          </p>
        </div>
      `, [
        { text: 'Cancel', variant: 'ghost', onClick: () => {} },
        {
          text: 'Delete Anyway',
          variant: 'primary',
          onClick: () => this._performDocDelete(id, doc, cust)
        }
      ]);
      return;
    }

    App.UI.Modal.open('Delete Document', `
      <div>
        <p>Are you sure you want to delete <strong>${doc.docNumber}</strong>?</p>
        <div style="font-size:12px; color:var(--color-text-muted); margin-top:8px;">
          <p>Type: ${isInvoice ? 'Invoice' : 'Delivery Note'}</p>
          <p>Customer: ${cust ? cust.company : '-'}</p>
          ${isInvoice ? `<p>Total: ${App.Utils.formatCurrency(doc.grossTotal)}</p>` : ''}
        </div>
      </div>
    `, [
      { text: 'Cancel', variant: 'ghost', onClick: () => {} },
      {
        text: 'Delete',
        variant: 'primary',
        onClick: () => this._performDocDelete(id, doc, cust)
      }
    ]);
  },

  _performDocDelete(id, doc, cust) {
    const documents = App.Data.documents || [];
    App.Data.documents = documents.filter(d => d.id !== id);
    App.DB.save();

    // Recompute order status if linked
    if (App.Services.Automation && doc.orderId) {
      App.Services.Automation.recomputeOrderStatus(doc.orderId);
    }

    // Log activity
    if (App.Services.ActivityLog) {
      App.Services.ActivityLog.log('delete', 'document', id, {
        name: doc.docNumber,
        type: doc.type,
        customer: cust?.company
      });
    }

    App.UI.Toast.show('Document deleted');
    App.Core.Router.navigate('documents');
  },

  openPaymentModal(docId) {
    const doc = App.Data.documents.find(d => d.id === docId);
    if (!doc) return;

    const remaining = (doc.grossTotal || 0) - (doc.paidAmount || 0);
    const today = new Date().toISOString().split('T')[0];

    const body = `
      <div>
        <p style="margin-bottom:12px;">
          Invoice: <strong>${doc.docNumber}</strong><br/>
          Total: <strong>${App.Utils.formatCurrency(doc.grossTotal)}</strong><br/>
          Paid: <strong>${App.Utils.formatCurrency(doc.paidAmount || 0)}</strong><br/>
          Remaining: <strong style="color:#dc2626;">${App.Utils.formatCurrency(remaining)}</strong>
        </p>

        <label class="field-label">Payment Amount (€)*</label>
        <input id="pay-amount" class="input" type="number" min="0.01" step="0.01" value="${remaining.toFixed(2)}" />

        <label class="field-label" style="margin-top:8px;">Payment Date</label>
        <input id="pay-date" class="input" type="date" value="${today}" />

        <label class="field-label" style="margin-top:8px;">Payment Method</label>
        <select id="pay-method" class="input">
          <option value="bank_transfer">Bank Transfer</option>
          <option value="cash">Cash</option>
          <option value="credit_card">Credit Card</option>
          <option value="cheque">Cheque</option>
          <option value="paypal">PayPal</option>
        </select>

        <label class="field-label" style="margin-top:8px;">Reference</label>
        <input id="pay-ref" class="input" placeholder="Transaction ID, cheque number, etc." />

        <label class="field-label" style="margin-top:8px;">Notes</label>
        <textarea id="pay-notes" class="input" rows="2"></textarea>
      </div>
    `;

    App.UI.Modal.open('Record Payment', body, [
      { text: 'Cancel', variant: 'ghost', onClick: () => {} },
      {
        text: 'Save Payment',
        variant: 'primary',
        onClick: () => {
          const amount = parseFloat(document.getElementById('pay-amount').value);
          if (!amount || amount <= 0) {
            App.UI.Toast.show('Please enter a valid amount');
            return false;
          }

          if (amount > remaining + 0.01) {
            App.UI.Toast.show('Amount exceeds remaining balance');
            return false;
          }

          const payment = {
            id: App.Utils.generateId('pay'),
            amount: amount,
            date: document.getElementById('pay-date').value,
            method: document.getElementById('pay-method').value,
            reference: document.getElementById('pay-ref').value.trim() || null,
            notes: document.getElementById('pay-notes').value.trim() || null,
            recordedAt: new Date().toISOString(),
            recordedBy: App.Services.Auth.currentUser?.id
          };

          if (!doc.payments) doc.payments = [];
          doc.payments.push(payment);
          doc.paidAmount = (doc.paidAmount || 0) + amount;

          App.DB.save();
          App.UI.Toast.show(`Payment of ${App.Utils.formatCurrency(amount)} recorded`);

          // Recompute order status based on payment
          if (App.Services.Automation && doc.orderId) {
            App.Services.Automation.recomputeOrderStatus(doc.orderId);
          }

          // Log activity
          if (App.Services.ActivityLog) {
            App.Services.ActivityLog.log('update', 'document', doc.id, {
              name: doc.docNumber,
              action: 'payment_recorded',
              amount: amount,
              method: payment.method
            });
          }

          App.Core.Router.navigate('documents');
        }
      }
    ]);
  },

  openPaymentHistory(docId) {
    const doc = App.Data.documents.find(d => d.id === docId);
    if (!doc) return;

    const payments = doc.payments || [];
    const remaining = (doc.grossTotal || 0) - (doc.paidAmount || 0);

    const paymentRows = payments.length > 0 ? payments.map(p => `
      <tr>
        <td>${p.date || '-'}</td>
        <td>${App.Utils.formatCurrency(p.amount)}</td>
        <td>${p.method || '-'}</td>
        <td>${p.reference || '-'}</td>
      </tr>
    `).join('') : '<tr><td colspan="4" style="text-align:center;color:var(--color-text-muted);">No payments recorded</td></tr>';

    const body = `
      <div>
        <div style="margin-bottom:12px; padding:12px; background:var(--color-bg); border-radius:4px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span>Total:</span>
            <strong>${App.Utils.formatCurrency(doc.grossTotal || 0)}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span>Paid:</span>
            <strong style="color:#16a34a;">${App.Utils.formatCurrency(doc.paidAmount || 0)}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; border-top:1px solid var(--color-border); padding-top:4px;">
            <span>Remaining:</span>
            <strong style="color:${remaining > 0 ? '#dc2626' : '#16a34a'};">${App.Utils.formatCurrency(remaining)}</strong>
          </div>
        </div>

        <table class="table" style="font-size:12px;">
          <thead>
            <tr>
              <th>Date</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Reference</th>
            </tr>
          </thead>
          <tbody>${paymentRows}</tbody>
        </table>
      </div>
    `;

    App.UI.Modal.open(`Payment History - ${doc.docNumber}`, body, [
      { text: 'Close', variant: 'ghost', onClick: () => {} }
    ]);
  },

  openCreateModal(type) {
    const custOptions = (App.Data.customers || [])
      .map(c => `<option value="${c.id}">${c.company}</option>`)
      .join('');
    const orderOptions = (App.Data.orders || [])
      .filter(o => o.status !== 'draft')
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

  calculateDueDate(invoiceDate, paymentTerms) {
    const date = new Date(invoiceDate);
    let days = 30;

    if (paymentTerms) {
      const match = paymentTerms.match(/Net\s*(\d+)/i);
      if (match) {
        days = parseInt(match[1]);
      } else if (paymentTerms.toLowerCase().includes('cod') || paymentTerms.toLowerCase().includes('prepaid')) {
        days = 0;
      }
    }

    date.setDate(date.getDate() + days);
    return date.toISOString();
  },

  generateFromOrder(orderId, type) {
    const o = App.Data.orders.find(x => x.id === orderId);
    if (!o) {
      App.UI.Toast.show('Order not found');
      return;
    }

    const cust = App.Data.customers.find(c => c.id === o.custId);
    const existingDocs = App.Data.documents || [];

    // Document creation guardrails
    const errors = [];

    // Strict LS to Invoice linking - invoice requires delivery note
    let refDeliveryId = null;
    if (type === 'invoice') {
      const deliveryNotes = existingDocs.filter(d => d.orderId === orderId && d.type === 'delivery');

      if (deliveryNotes.length === 0) {
        // Show modal to create delivery note first
        App.UI.Modal.open('Delivery Note Required', `
          <div>
            <div style="color:#f59e0b; margin-bottom:12px;">
              <strong>⚠️ Cannot create invoice without delivery note</strong>
            </div>
            <p style="font-size:13px; margin-bottom:12px;">
              An invoice must be linked to a delivery note for proper document tracking.
              Please create a delivery note for this order first.
            </p>
            <p style="font-size:12px; color:var(--color-text-muted);">
              Order: <strong>${o.orderId}</strong>
            </p>
          </div>
        `, [
          { text: 'Cancel', variant: 'ghost', onClick: () => {} },
          {
            text: 'Create Delivery Note First',
            variant: 'primary',
            onClick: () => {
              this.generateFromOrder(orderId, 'delivery');
            }
          }
        ]);
        return;
      }

      // If multiple delivery notes, let user select which one to link
      if (deliveryNotes.length === 1) {
        refDeliveryId = deliveryNotes[0].id;
      } else {
        // Show selection modal for multiple delivery notes
        const dnOptions = deliveryNotes.map(dn =>
          `<option value="${dn.id}">${dn.docNumber} (${dn.date?.split('T')[0] || '-'})</option>`
        ).join('');

        App.UI.Modal.open('Select Delivery Note', `
          <div>
            <p style="font-size:13px; margin-bottom:12px;">
              Multiple delivery notes exist for this order. Select which one to link to the invoice:
            </p>
            <label class="field-label">Delivery Note</label>
            <select id="select-delivery-note" class="input">
              ${dnOptions}
            </select>
          </div>
        `, [
          { text: 'Cancel', variant: 'ghost', onClick: () => {} },
          {
            text: 'Continue',
            variant: 'primary',
            onClick: () => {
              const selectedDnId = document.getElementById('select-delivery-note').value;
              this._createInvoiceWithDeliveryRef(orderId, selectedDnId);
            }
          }
        ]);
        return;
      }
    }

    // Check if delivery note already exists for this order (warn on duplicate)
    if (type === 'delivery') {
      const existingDelivery = existingDocs.find(d => d.orderId === orderId && d.type === 'delivery');
      if (existingDelivery) {
        App.UI.Modal.open('Delivery Note Exists', `
          <div>
            <p style="margin-bottom:12px;">
              A delivery note (<strong>${existingDelivery.docNumber}</strong>) already exists for this order.
            </p>
            <p style="font-size:12px; color:var(--color-text-muted);">
              Do you want to create another delivery note? (Partial shipment)
            </p>
          </div>
        `, [
          { text: 'Cancel', variant: 'ghost', onClick: () => {} },
          {
            text: 'Create Another',
            variant: 'primary',
            onClick: () => {
              this._createDocument(orderId, type, null);
            }
          }
        ]);
        return;
      }
    }

    // Continue with document creation
    this._createDocument(orderId, type, refDeliveryId);
  },

  /**
   * Internal method to create invoice with delivery reference (for multi-DN selection)
   */
  _createInvoiceWithDeliveryRef(orderId, refDeliveryId) {
    this._createDocument(orderId, 'invoice', refDeliveryId);
  },

  /**
   * Internal method to create document with all validations
   */
  _createDocument(orderId, type, refDeliveryId) {
    const o = App.Data.orders.find(x => x.id === orderId);
    if (!o) return;

    const cust = App.Data.customers.find(c => c.id === o.custId);
    const errors = [];

    if (!cust) {
      errors.push('Customer not found for this order');
    } else {
      // Check for required addresses
      const addresses = cust.addresses || [];
      const hasBilling = addresses.some(a => a.role === 'billing' || addresses.length > 0);
      const hasShipping = addresses.some(a => a.role === 'shipping' || addresses.length > 0);

      if (addresses.length === 0) {
        errors.push('Customer has no addresses configured');
      } else {
        if (!hasBilling) errors.push('Customer needs a billing address');
        if (!hasShipping && type === 'delivery') errors.push('Customer needs a shipping address for delivery notes');
      }

      // Check VAT number for invoices (optional but recommended)
      if (type === 'invoice' && !cust.vatNumber) {
        // Just a warning, not blocking
      }
    }

    // Check order has items
    if (!o.items || o.items.length === 0) {
      errors.push('Order has no line items');
    }

    // Check products exist
    if (o.items) {
      const missingProducts = o.items.filter(i => {
        const p = App.Data.products.find(p => p.id === i.productId);
        return !p;
      });
      if (missingProducts.length > 0) {
        errors.push(`${missingProducts.length} product(s) not found in order`);
      }
    }

    // If errors, show modal with issues
    if (errors.length > 0) {
      App.UI.Modal.open('Cannot Create Document', `
        <div style="color:#dc2626;">
          <p style="font-weight:600; margin-bottom:8px;">Please fix the following issues:</p>
          <ul style="margin:0; padding-left:20px;">
            ${errors.map(e => `<li style="margin-bottom:4px;">${e}</li>`).join('')}
          </ul>
        </div>
        <p style="font-size:12px; color:var(--color-text-muted); margin-top:12px;">
          Go to Customer or Order settings to add missing data.
        </p>
      `, [
        { text: 'Close', variant: 'ghost', onClick: () => {} }
      ]);
      return;
    }

    const docNum = type === 'delivery'
      ? App.Services.NumberSequence.nextDeliveryNumber()
      : App.Services.NumberSequence.nextInvoiceNumber();

    const billAddr = cust.addresses.find(a => a.id === o.billingAddressId) || cust.addresses.find(a => a.role === 'billing') || cust.addresses[0];
    const shipAddr = cust.addresses.find(a => a.id === o.shippingAddressId) || cust.addresses.find(a => a.role === 'shipping') || cust.addresses[0];

    const items = o.items.map(i => {
      const p = App.Data.products.find(p => p.id === i.productId);
      return {
        productId: i.productId,
        articleNumber: p ? (p.internalArticleNumber || p.sku) : '-',
        description: p ? (p.nameDE || p.nameEN) : 'Unknown Product',
        qty: i.qty,
        unit: p ? p.unit : 'Stk',
        unitPrice: i.unitPrice,
        vatRate: 0.2,
        lineNet: i.lineNet || (i.qty * i.unitPrice),
        lineVat: (i.lineNet || (i.qty * i.unitPrice)) * 0.2,
        lineTotal: (i.lineNet || (i.qty * i.unitPrice)) * 1.2
      };
    });

    const subNet = items.reduce((sum, i) => sum + i.lineNet, 0);
    const vatAmt = subNet * 0.2;
    const total = subNet + vatAmt;
    const invoiceDate = new Date().toISOString();

    // Auto-select language based on customer preference or country
    let docLang = 'en';
    if (cust.preferredLang) {
      docLang = cust.preferredLang;
    } else {
      // Auto-detect based on country
      const custCountry = (billAddr?.country || '').toLowerCase();
      if (['germany', 'deutschland', 'austria', 'österreich', 'switzerland', 'schweiz', 'de', 'at', 'ch'].some(c => custCountry.includes(c))) {
        docLang = 'de';
      } else if (['romania', 'rumänien', 'ro'].some(c => custCountry.includes(c))) {
        docLang = 'ro';
      }
    }

    const doc = {
      id: App.Utils.generateId('d'),
      type: type,
      docNumber: docNum,
      date: invoiceDate,
      dueDate: type === 'invoice' ? this.calculateDueDate(invoiceDate, cust.paymentTerms) : null,
      customerId: cust.id,
      billingAddressId: billAddr ? billAddr.id : null,
      shippingAddressId: shipAddr ? shipAddr.id : null,
      orderId: o.id,
      refDeliveryId: refDeliveryId, // Link invoice to delivery note
      ref: o.customerReference,
      paymentTerms: cust.paymentTerms,
      deliveryTerms: cust.deliveryTerms,
      language: docLang, // Auto-selected document language
      items: items,
      netTotal: subNet,
      vatSummary: [{ rate: 0.2, base: subNet, amount: vatAmt }],
      grossTotal: total,
      paidAmount: 0,
      payments: [],
      status: 'Draft'
    };

    App.Data.documents.push(doc);
    App.DB.save();

    // Recompute order status based on new document
    if (App.Services.Automation && doc.orderId) {
      App.Services.Automation.recomputeOrderStatus(doc.orderId);
    }

    App.UI.Toast.show(`${type === 'invoice' ? 'Invoice' : 'Delivery Note'} generated`);
    App.Core.Router.navigate('documents');
  },

  createManual(custId, type) {
    App.UI.Toast.show("Manual creation - use Order workflow for now");
  },

  printDocument(id) {
    const d = App.Data.documents.find(x => x.id === id);
    if (!d) return;
    const cust = App.Data.customers.find(c => c.id === d.customerId);
    const conf = App.Data.config || {};

    const billAddr = (cust.addresses || []).find(a => a.id === d.billingAddressId) || (cust.addresses || [])[0] || {};
    const shipAddr = (cust.addresses || []).find(a => a.id === d.shippingAddressId) || billAddr;

    const isInv = d.type === 'invoice';
    const docLang = d.language || 'en';

    // Language-specific labels
    const labels = {
      en: {
        invoiceTitle: 'Invoice',
        deliveryTitle: 'Delivery Note',
        billingAddr: 'Billing Address',
        shippingAddr: 'Shipping Address',
        artNo: 'Art. No.',
        description: 'Description',
        qty: 'Qty',
        unit: 'Unit',
        price: 'Price',
        total: 'Total',
        net: 'Net',
        vat: 'VAT',
        terms: 'Terms',
        delivery: 'Delivery',
        bank: 'Bank',
        due: 'Due',
        paid: 'Paid',
        balance: 'Balance Due'
      },
      de: {
        invoiceTitle: 'Rechnung',
        deliveryTitle: 'Lieferschein',
        billingAddr: 'Rechnungsadresse',
        shippingAddr: 'Lieferadresse',
        artNo: 'Art. Nr.',
        description: 'Beschreibung',
        qty: 'Menge',
        unit: 'Einheit',
        price: 'Preis',
        total: 'Gesamt',
        net: 'Netto',
        vat: 'MwSt',
        terms: 'Zahlungsbed.',
        delivery: 'Lieferung',
        bank: 'Bank',
        due: 'Fällig',
        paid: 'Bezahlt',
        balance: 'Offener Betrag'
      },
      ro: {
        invoiceTitle: 'Factură',
        deliveryTitle: 'Aviz de Livrare',
        billingAddr: 'Adresa de Facturare',
        shippingAddr: 'Adresa de Livrare',
        artNo: 'Nr. Art.',
        description: 'Descriere',
        qty: 'Cant.',
        unit: 'UM',
        price: 'Preț',
        total: 'Total',
        net: 'Net',
        vat: 'TVA',
        terms: 'Termeni',
        delivery: 'Livrare',
        bank: 'Bancă',
        due: 'Scadent',
        paid: 'Plătit',
        balance: 'De plată'
      }
    };

    const l = labels[docLang] || labels.en;
    const title = isInv ? l.invoiceTitle : l.deliveryTitle;

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

    let totalsHtml = '';
    if (isInv) {
      const remaining = (d.grossTotal || 0) - (d.paidAmount || 0);
      totalsHtml = `
        <div class="totals-block">
          <div class="row"><span class="label">${l.net}:</span> <span class="val">${App.Utils.formatCurrency(d.netTotal)}</span></div>
          <div class="row"><span class="label">${l.vat} (20%):</span> <span class="val">${App.Utils.formatCurrency(d.grossTotal - d.netTotal)}</span></div>
          <div class="row bold"><span class="label">${l.total}:</span> <span class="val">${App.Utils.formatCurrency(d.grossTotal)}</span></div>
          ${d.paidAmount > 0 ? `<div class="row" style="color:#16a34a;"><span class="label">${l.paid}:</span> <span class="val">-${App.Utils.formatCurrency(d.paidAmount)}</span></div>` : ''}
          ${remaining > 0 ? `<div class="row" style="color:#dc2626;"><span class="label">${l.balance}:</span> <span class="val">${App.Utils.formatCurrency(remaining)}</span></div>` : ''}
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
              ${isInv && d.dueDate ? `<strong>Due:</strong> ${d.dueDate.split('T')[0]}<br/>` : ''}
              <strong>Ref:</strong> ${d.ref || '-'}
            </div>
          </div>
        </div>

        <div class="addresses">
          <div class="addr-box">
            <div class="addr-title">${l.billingAddr}</div>
            <strong>${cust.company}</strong><br/>
            ${billAddr.street || ''}<br/>
            ${billAddr.zip || ''} ${billAddr.city || ''}<br/>
            ${billAddr.country || ''}<br/>
            ${cust.vatNumber ? 'VAT: ' + cust.vatNumber : ''}
          </div>
          <div class="addr-box">
            <div class="addr-title">${l.shippingAddr}</div>
            <strong>${cust.company}</strong><br/>
            ${shipAddr.street || ''}<br/>
            ${shipAddr.zip || ''} ${shipAddr.city || ''}<br/>
            ${shipAddr.country || ''}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th width="15%">${l.artNo}</th>
              <th width="40%">${l.description}</th>
              <th width="10%" style="text-align:right">${l.qty}</th>
              <th width="10%">${l.unit}</th>
              ${isInv ? `<th width="12%" style="text-align:right">${l.price}</th>` : ''}
              ${isInv ? `<th width="13%" style="text-align:right">${l.total}</th>` : ''}
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        ${totalsHtml}

        <div class="footer">
          <div>
            <strong>${l.terms}:</strong> ${d.paymentTerms || '-'}<br/>
            <strong>${l.delivery}:</strong> ${d.deliveryTerms || '-'}
          </div>
          <div>
            <strong>${l.bank}:</strong> ${conf.bankName || '-'}<br/>
            <strong>IBAN:</strong> ${conf.iban || '-'}
          </div>
          <div>
            MicroOps ERP Generated
          </div>
        </div>

        <div class="no-print" style="position:fixed; bottom:20px; right:20px; display:flex; gap:8px;">
          <button onclick="window.print()" style="padding:10px 20px; background:#333; color:#fff; border:none; cursor:pointer; border-radius:4px;">🖨️ PRINT</button>
          <button onclick="window.close()" style="padding:10px 20px; background:#eee; color:#333; border:none; cursor:pointer; border-radius:4px;">✕ CLOSE</button>
        </div>
      </body>
      </html>
    `;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();

    // Log activity
    if (App.Services.ActivityLog) {
      App.Services.ActivityLog.log('view', 'document', id, {
        name: d.docNumber,
        type: d.type,
        action: 'print_preview'
      });
    }
  },

  // Generate quick invoice summary for email
  generateEmailSummary(id) {
    const d = App.Data.documents.find(x => x.id === id);
    if (!d || d.type !== 'invoice') return null;

    const cust = App.Data.customers.find(c => c.id === d.customerId);
    const conf = App.Data.config || {};
    const remaining = (d.grossTotal || 0) - (d.paidAmount || 0);

    return `
Invoice: ${d.docNumber}
Date: ${d.date?.split('T')[0] || '-'}
Due: ${d.dueDate?.split('T')[0] || '-'}

Customer: ${cust?.company || '-'}
${cust?.customerNumber ? 'Customer No: ' + cust.customerNumber : ''}

Total: ${App.Utils.formatCurrency(d.grossTotal)}
${d.paidAmount > 0 ? 'Paid: ' + App.Utils.formatCurrency(d.paidAmount) : ''}
Balance Due: ${App.Utils.formatCurrency(remaining)}

Payment Details:
Bank: ${conf.bankName || '-'}
IBAN: ${conf.iban || '-'}
BIC: ${conf.bic || '-'}
Reference: ${d.docNumber}

Thank you for your business!
${conf.companyName || 'MicroOps Global'}
    `.trim();
  }
};
