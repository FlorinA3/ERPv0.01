App.UI.Views.Suppliers = {
  render(root) {
    const suppliers = App.Data.suppliers || [];
    const purchaseOrders = App.Data.purchaseOrders || [];

    const getPerformanceStats = (supplierId) => {
      const pos = purchaseOrders.filter(po => po.supplierId === supplierId);
      const received = pos.filter(po => po.status === 'received' || po.status === 'closed');
      const onTime = received.filter(po => {
        if (!po.expectedDate || !po.receivedDate) return true;
        return new Date(po.receivedDate) <= new Date(po.expectedDate);
      });
      const total = received.reduce((sum, po) => sum + (po.total || 0), 0);
      return {
        orderCount: pos.length,
        receivedCount: received.length,
        onTimeRate: received.length > 0 ? Math.round((onTime.length / received.length) * 100) : 0,
        totalSpend: total
      };
    };

    root.innerHTML = `
      <div class="card-soft">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 style="font-size:16px; font-weight:600;">${App.I18n.t('pages.suppliers.title','Suppliers')}</h3>
          <div style="display:flex; gap:8px; align-items:center;">
            <input type="text" id="supplier-search" class="input" placeholder="${App.I18n.t('common.search','Search...')}" style="width:200px;" />
            <button class="btn btn-primary" id="btn-add-supplier">+ ${App.I18n.t('common.add','Add')}</button>
          </div>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>${App.I18n.t('suppliers.name', 'Name')}</th>
              <th>${App.I18n.t('suppliers.country', 'Country')}</th>
              <th>${App.I18n.t('common.paymentTerms', 'Payment Terms')}</th>
              <th style="text-align:right;">${App.I18n.t('suppliers.leadTime', 'Lead Time')}</th>
              <th style="text-align:right;">${App.I18n.t('suppliers.orders', 'Orders')}</th>
              <th style="text-align:center;">${App.I18n.t('suppliers.onTime', 'On-Time')}</th>
              <th style="text-align:right;">${App.I18n.t('suppliers.totalSpend', 'Total Spend')}</th>
              <th style="text-align:right;">${App.I18n.t('common.actions', 'Actions')}</th>
            </tr>
          </thead>
          <tbody>
            ${suppliers.length > 0 ? suppliers.map(s => {
              const stats = getPerformanceStats(s.id);
              const onTimeClass = stats.onTimeRate >= 90 ? 'color:#16a34a;' :
                                  stats.onTimeRate >= 70 ? 'color:#d97706;' : 'color:#dc2626;';
              return `
                <tr>
                  <td><strong>${s.name || '-'}</strong></td>
                  <td>${s.country || '-'}</td>
                  <td>${s.paymentTerms || '-'}</td>
                  <td style="text-align:right;">${s.leadTimeDays ? s.leadTimeDays + ' days' : '-'}</td>
                  <td style="text-align:right;">${stats.orderCount}</td>
                  <td style="text-align:center;${stats.receivedCount > 0 ? onTimeClass : ''}">${stats.receivedCount > 0 ? stats.onTimeRate + '%' : '-'}</td>
                  <td style="text-align:right;">${stats.totalSpend > 0 ? '€' + stats.totalSpend.toFixed(2) : '-'}</td>
                  <td style="text-align:right;">
                    <button class="btn btn-ghost btn-edit-sup" data-id="${s.id}" title="Edit" aria-label="Edit supplier">✏️</button>
                    <button class="btn btn-ghost btn-delete-sup" data-id="${s.id}" title="Delete" aria-label="Delete supplier">🗑️</button>
                  </td>
                </tr>
              `;
            }).join('') : `<tr><td colspan="8" style="text-align:center; color:var(--color-text-muted);">No suppliers</td></tr>`}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('btn-add-supplier')?.addEventListener('click', () => this.openSupplierModal());

    root.querySelectorAll('.btn-edit-sup').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sup = suppliers.find(s => s.id === btn.getAttribute('data-id'));
        if (sup) this.openSupplierModal(sup);
      });
    });

    root.querySelectorAll('.btn-delete-sup').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const sup = suppliers.find(s => s.id === id);
        if (!sup) return;

        const pos = purchaseOrders.filter(po => po.supplierId === id);
        if (pos.length > 0) {
          App.UI.Toast.show(`Cannot delete: ${pos.length} purchase orders linked`);
          return;
        }

        App.UI.Modal.open(App.I18n.t('common.deleteSupplier', 'Delete Supplier'), `
          <p>Are you sure you want to delete <strong>${sup.name}</strong>?</p>
        `, [
          { text: 'Cancel', variant: 'ghost', onClick: () => {} },
          {
            text: 'Delete',
            variant: 'primary',
            onClick: () => {
              const idx = suppliers.findIndex(s => s.id === id);
              if (idx >= 0) {
                suppliers.splice(idx, 1);
                App.DB.save();
                App.UI.Toast.show('Supplier deleted');
                App.Core.Router.navigate('suppliers');
              }
            }
          }
        ]);
      });
    });

    // Search functionality
    const searchInput = document.getElementById('supplier-search');
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

  openSupplierModal(sup) {
    const isEdit = !!sup;

    const paymentTermsOptions = ['Net 7', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'COD', 'Prepaid'];
    const termsOpts = paymentTermsOptions.map(t =>
      `<option value="${t}" ${sup && sup.paymentTerms === t ? 'selected' : ''}>${t}</option>`
    ).join('');

    const body = `
      <div class="grid grid-2" style="gap:12px;">
        <div>
          <label class="field-label">${App.I18n.t('suppliers.name','Name')}*</label>
          <input id="sup-name" class="input" value="${sup ? sup.name : ''}" />
        </div>
        <div>
          <label class="field-label">Supplier Code</label>
          <input id="sup-code" class="input" value="${sup ? sup.supplierCode || '' : ''}" placeholder="e.g., SUP-001" />
        </div>
      </div>

      <div class="grid grid-2" style="gap:12px; margin-top:8px;">
        <div>
          <label class="field-label">${App.I18n.t('suppliers.street','Street')}</label>
          <input id="sup-street" class="input" value="${sup ? sup.street || '' : ''}" />
        </div>
        <div>
          <label class="field-label">${App.I18n.t('suppliers.zip','ZIP')}</label>
          <input id="sup-zip" class="input" value="${sup ? sup.zip || '' : ''}" />
        </div>
      </div>

      <div class="grid grid-2" style="gap:12px; margin-top:8px;">
        <div>
          <label class="field-label">${App.I18n.t('suppliers.city','City')}</label>
          <input id="sup-city" class="input" value="${sup ? sup.city || '' : ''}" />
        </div>
        <div>
          <label class="field-label">${App.I18n.t('suppliers.country','Country')}</label>
          <input id="sup-country" class="input" value="${sup ? sup.country || '' : ''}" />
        </div>
      </div>

      <div class="grid grid-2" style="gap:12px; margin-top:8px;">
        <div>
          <label class="field-label">${App.I18n.t('suppliers.contact','Contact Person')}</label>
          <input id="sup-contact" class="input" value="${sup ? sup.contactPerson || '' : ''}" />
        </div>
        <div>
          <label class="field-label">${App.I18n.t('suppliers.phone','Phone')}</label>
          <input id="sup-phone" class="input" value="${sup ? sup.phone || '' : ''}" />
        </div>
      </div>

      <div class="grid grid-2" style="gap:12px; margin-top:8px;">
        <div>
          <label class="field-label">${App.I18n.t('suppliers.email','Email')}</label>
          <input id="sup-email" class="input" value="${sup ? sup.email || '' : ''}" />
        </div>
        <div>
          <label class="field-label">Website</label>
          <input id="sup-website" class="input" value="${sup ? sup.website || '' : ''}" placeholder="https://" />
        </div>
      </div>

      <h4 style="margin:16px 0 8px 0; font-size:14px; font-weight:600; border-bottom:1px solid var(--color-border); padding-bottom:4px;">Business Terms</h4>

      <div class="grid grid-2" style="gap:12px;">
        <div>
          <label class="field-label">Payment Terms</label>
          <select id="sup-payment-terms" class="input">
            <option value="">Select...</option>
            ${termsOpts}
          </select>
        </div>
        <div>
          <label class="field-label">Lead Time (days)</label>
          <input id="sup-lead-time" class="input" type="number" min="0" value="${sup ? sup.leadTimeDays || '' : ''}" placeholder="e.g., 14" />
        </div>
      </div>

      <div class="grid grid-2" style="gap:12px; margin-top:8px;">
        <div>
          <label class="field-label">Minimum Order Value (€)</label>
          <input id="sup-min-order" class="input" type="number" min="0" step="0.01" value="${sup ? sup.minimumOrderValue || '' : ''}" />
        </div>
        <div>
          <label class="field-label">Currency</label>
          <select id="sup-currency" class="input">
            <option value="EUR" ${!sup || sup.currency === 'EUR' ? 'selected' : ''}>EUR</option>
            <option value="USD" ${sup && sup.currency === 'USD' ? 'selected' : ''}>USD</option>
            <option value="GBP" ${sup && sup.currency === 'GBP' ? 'selected' : ''}>GBP</option>
            <option value="CHF" ${sup && sup.currency === 'CHF' ? 'selected' : ''}>CHF</option>
          </select>
        </div>
      </div>

      <div class="grid grid-2" style="gap:12px; margin-top:8px;">
        <div>
          <label class="field-label">VAT ID</label>
          <input id="sup-vat" class="input" value="${sup ? sup.vatId || '' : ''}" placeholder="e.g., DE123456789" />
        </div>
        <div>
          <label class="field-label">Rating</label>
          <select id="sup-rating" class="input">
            <option value="">Not Rated</option>
            <option value="5" ${sup && sup.rating === 5 ? 'selected' : ''}>⭐⭐⭐⭐⭐ Excellent</option>
            <option value="4" ${sup && sup.rating === 4 ? 'selected' : ''}>⭐⭐⭐⭐ Good</option>
            <option value="3" ${sup && sup.rating === 3 ? 'selected' : ''}>⭐⭐⭐ Average</option>
            <option value="2" ${sup && sup.rating === 2 ? 'selected' : ''}>⭐⭐ Below Average</option>
            <option value="1" ${sup && sup.rating === 1 ? 'selected' : ''}>⭐ Poor</option>
          </select>
        </div>
      </div>

      <div style="margin-top:8px;">
        <label class="field-label">${App.I18n.t('suppliers.notes','Notes')}</label>
        <textarea id="sup-notes" class="input" rows="2">${sup ? sup.notes || '' : ''}</textarea>
      </div>
    `;

    const title = isEdit ? App.I18n.t('suppliers.edit','Edit Supplier') : App.I18n.t('suppliers.add','Add Supplier');
    App.UI.Modal.open(title, body, [
      { text: App.I18n.t('common.cancel','Cancel'), variant: 'ghost', onClick: () => {} },
      {
        text: App.I18n.t('common.save','Save'),
        variant: 'primary',
        onClick: () => {
          const name = document.getElementById('sup-name').value.trim();
          if (!name) {
            App.UI.Toast.show(App.I18n.t('suppliers.name','Name') + ' is required');
            return false;
          }

          const list = App.Data.suppliers || [];
          const newSup = {
            id: isEdit ? sup.id : App.Utils.generateId('sup'),
            name: name,
            supplierCode: document.getElementById('sup-code').value.trim() || null,
            street: document.getElementById('sup-street').value.trim() || null,
            zip: document.getElementById('sup-zip').value.trim() || null,
            city: document.getElementById('sup-city').value.trim() || null,
            country: document.getElementById('sup-country').value.trim() || null,
            contactPerson: document.getElementById('sup-contact').value.trim() || null,
            phone: document.getElementById('sup-phone').value.trim() || null,
            email: document.getElementById('sup-email').value.trim() || null,
            website: document.getElementById('sup-website').value.trim() || null,
            paymentTerms: document.getElementById('sup-payment-terms').value || null,
            leadTimeDays: parseInt(document.getElementById('sup-lead-time').value) || null,
            minimumOrderValue: parseFloat(document.getElementById('sup-min-order').value) || null,
            currency: document.getElementById('sup-currency').value || 'EUR',
            vatId: document.getElementById('sup-vat').value.trim() || null,
            rating: parseInt(document.getElementById('sup-rating').value) || null,
            notes: document.getElementById('sup-notes').value.trim() || null,
            createdAt: isEdit ? sup.createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          if (isEdit) {
            const idx = list.findIndex(x => x.id === sup.id);
            if (idx >= 0) list[idx] = { ...list[idx], ...newSup };
          } else {
            list.push(newSup);
          }

          App.DB.save();
          App.UI.Toast.show('Supplier saved');
          App.Core.Router.navigate('suppliers');
        }
      }
    ]);
  }
};
