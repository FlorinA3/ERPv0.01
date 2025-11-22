App.UI.Views.Suppliers = {
  render(root) {
    const t = (key, fallback) => App.I18n.t(`suppliers.${key}`, fallback);
    const esc = App.Utils.escapeHtml;
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
              <th>${t('name', 'Name')}</th>
              <th>${t('country', 'Country')}</th>
              <th>${App.I18n.t('common.paymentTerms', 'Payment Terms')}</th>
              <th style="text-align:right;">${t('leadTime', 'Lead Time')}</th>
              <th style="text-align:right;">${t('orders', 'Orders')}</th>
              <th style="text-align:center;">${t('onTime', 'On-Time')}</th>
              <th style="text-align:right;">${t('totalSpend', 'Total Spend')}</th>
              <th style="text-align:right;">${App.I18n.t('common.actions', 'Actions')}</th>
            </tr>
          </thead>
          <tbody>
            ${suppliers.length > 0 ? suppliers.map(s => {
              const stats = getPerformanceStats(s.id);
              const onTimeClass = stats.onTimeRate >= 90 ? 'color:var(--color-success);' :
                                  stats.onTimeRate >= 70 ? 'color:var(--color-warning);' : 'color:var(--color-danger);';
              return `
                <tr>
                  <td><strong>${esc(s.name || '-')}</strong></td>
                  <td>${esc(s.country || '-')}</td>
                  <td>${esc(s.paymentTerms || '-')}</td>
                  <td style="text-align:right;">${s.leadTimeDays ? s.leadTimeDays + ' ' + t('days', 'days') : '-'}</td>
                  <td style="text-align:right;">${stats.orderCount}</td>
                  <td style="text-align:center;${stats.receivedCount > 0 ? onTimeClass : ''}">${stats.receivedCount > 0 ? stats.onTimeRate + '%' : '-'}</td>
                  <td style="text-align:right;">${stats.totalSpend > 0 ? '€' + stats.totalSpend.toFixed(2) : '-'}</td>
                  <td style="text-align:right;">
                    <button class="btn btn-ghost btn-edit-sup" data-id="${s.id}" title="${App.I18n.t('common.edit', 'Edit')}" aria-label="${t('edit', 'Edit Supplier')}">✏️</button>
                    <button class="btn btn-ghost btn-delete-sup" data-id="${s.id}" title="${App.I18n.t('common.delete', 'Delete')}" aria-label="${App.I18n.t('common.deleteSupplier', 'Delete Supplier')}">🗑️</button>
                  </td>
                </tr>
              `;
            }).join('') : `<tr><td colspan="8" style="text-align:center; color:var(--color-text-muted);">${t('noSuppliers', 'No suppliers')}</td></tr>`}
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
          App.UI.Toast.show(`${t('cannotDelete', 'Cannot delete:')} ${pos.length} ${t('linkedPOs', 'purchase orders linked')}`);
          return;
        }

        App.UI.Modal.open(App.I18n.t('common.deleteSupplier', 'Delete Supplier'), `
          <p>${t('confirmDelete', 'Are you sure you want to delete')} <strong>${esc(sup.name)}</strong>?</p>
        `, [
          { text: App.I18n.t('common.cancel', 'Cancel'), variant: 'ghost', onClick: () => {} },
          {
            text: App.I18n.t('common.delete', 'Delete'),
            variant: 'primary',
            onClick: () => {
              const idx = suppliers.findIndex(s => s.id === id);
              if (idx >= 0) {
                suppliers.splice(idx, 1);
                App.DB.save();
                App.UI.Toast.show(App.I18n.t('common.supplierDeleted', 'Supplier deleted'));
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
    const t = (key, fallback) => App.I18n.t(`suppliers.${key}`, fallback);
    const esc = App.Utils.escapeHtml;
    const isEdit = !!sup;

    const paymentTermsOptions = ['Net 7', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'COD', 'Prepaid'];
    const termsOpts = paymentTermsOptions.map(term =>
      `<option value="${term}" ${sup && sup.paymentTerms === term ? 'selected' : ''}>${term}</option>`
    ).join('');

    const body = `
      <div class="grid grid-2" style="gap:12px;">
        <div>
          <label class="field-label" for="sup-name">${t('name','Name')}*</label>
          <input id="sup-name" class="input" value="${esc(sup ? sup.name : '')}" aria-required="true" />
        </div>
        <div>
          <label class="field-label" for="sup-code">${t('supplierCode', 'Supplier Code')}</label>
          <input id="sup-code" class="input" value="${esc(sup ? sup.supplierCode || '' : '')}" placeholder="e.g., SUP-001" />
        </div>
      </div>

      <div class="grid grid-2" style="gap:12px; margin-top:8px;">
        <div>
          <label class="field-label" for="sup-street">${t('street','Street')}</label>
          <input id="sup-street" class="input" value="${esc(sup ? sup.street || '' : '')}" />
        </div>
        <div>
          <label class="field-label" for="sup-zip">${t('zip','ZIP')}</label>
          <input id="sup-zip" class="input" value="${esc(sup ? sup.zip || '' : '')}" />
        </div>
      </div>

      <div class="grid grid-2" style="gap:12px; margin-top:8px;">
        <div>
          <label class="field-label" for="sup-city">${t('city','City')}</label>
          <input id="sup-city" class="input" value="${esc(sup ? sup.city || '' : '')}" />
        </div>
        <div>
          <label class="field-label" for="sup-country">${t('country','Country')}</label>
          <input id="sup-country" class="input" value="${esc(sup ? sup.country || '' : '')}" />
        </div>
      </div>

      <div class="grid grid-2" style="gap:12px; margin-top:8px;">
        <div>
          <label class="field-label" for="sup-contact">${t('contact','Contact Person')}</label>
          <input id="sup-contact" class="input" value="${esc(sup ? sup.contactPerson || '' : '')}" />
        </div>
        <div>
          <label class="field-label" for="sup-phone">${t('phone','Phone')}</label>
          <input id="sup-phone" class="input" value="${esc(sup ? sup.phone || '' : '')}" />
        </div>
      </div>

      <div class="grid grid-2" style="gap:12px; margin-top:8px;">
        <div>
          <label class="field-label" for="sup-email">${t('email','Email')}</label>
          <input id="sup-email" class="input" value="${esc(sup ? sup.email || '' : '')}" />
        </div>
        <div>
          <label class="field-label" for="sup-website">${t('website', 'Website')}</label>
          <input id="sup-website" class="input" value="${esc(sup ? sup.website || '' : '')}" placeholder="https://" />
        </div>
      </div>

      <h4 style="margin:16px 0 8px 0; font-size:14px; font-weight:600; border-bottom:1px solid var(--color-border); padding-bottom:4px;">${t('businessTerms', 'Business Terms')}</h4>

      <div class="grid grid-2" style="gap:12px;">
        <div>
          <label class="field-label" for="sup-payment-terms">${App.I18n.t('common.paymentTerms', 'Payment Terms')}</label>
          <select id="sup-payment-terms" class="input">
            <option value="">${t('select', 'Select...')}</option>
            ${termsOpts}
          </select>
        </div>
        <div>
          <label class="field-label" for="sup-lead-time">${t('leadTime', 'Lead Time')} (${t('days', 'days')})</label>
          <input id="sup-lead-time" class="input" type="number" min="0" value="${sup ? sup.leadTimeDays || '' : ''}" />
        </div>
      </div>

      <div class="grid grid-2" style="gap:12px; margin-top:8px;">
        <div>
          <label class="field-label" for="sup-min-order">${t('minOrderValue', 'Minimum Order Value (€)')}</label>
          <input id="sup-min-order" class="input" type="number" min="0" step="0.01" value="${sup ? sup.minimumOrderValue || '' : ''}" />
        </div>
        <div>
          <label class="field-label" for="sup-currency">${t('currency', 'Currency')}</label>
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
          <label class="field-label" for="sup-vat">${t('vatId', 'VAT ID')}</label>
          <input id="sup-vat" class="input" value="${esc(sup ? sup.vatId || '' : '')}" placeholder="e.g., DE123456789" />
        </div>
        <div>
          <label class="field-label" for="sup-rating">${t('rating', 'Rating')}</label>
          <select id="sup-rating" class="input">
            <option value="">${t('notRated', 'Not Rated')}</option>
            <option value="5" ${sup && sup.rating === 5 ? 'selected' : ''}>⭐⭐⭐⭐⭐ ${t('excellent', 'Excellent')}</option>
            <option value="4" ${sup && sup.rating === 4 ? 'selected' : ''}>⭐⭐⭐⭐ ${t('good', 'Good')}</option>
            <option value="3" ${sup && sup.rating === 3 ? 'selected' : ''}>⭐⭐⭐ ${t('average', 'Average')}</option>
            <option value="2" ${sup && sup.rating === 2 ? 'selected' : ''}>⭐⭐ ${t('belowAverage', 'Below Average')}</option>
            <option value="1" ${sup && sup.rating === 1 ? 'selected' : ''}>⭐ ${t('poor', 'Poor')}</option>
          </select>
        </div>
      </div>

      <div style="margin-top:8px;">
        <label class="field-label" for="sup-notes">${t('notes','Notes')}</label>
        <textarea id="sup-notes" class="input" rows="2">${esc(sup ? sup.notes || '' : '')}</textarea>
      </div>
    `;

    const title = isEdit ? t('edit','Edit Supplier') : t('add','Add Supplier');
    App.UI.Modal.open(title, body, [
      { text: App.I18n.t('common.cancel','Cancel'), variant: 'ghost', onClick: () => {} },
      {
        text: App.I18n.t('common.save','Save'),
        variant: 'primary',
        onClick: () => {
          const name = document.getElementById('sup-name').value.trim();
          if (!name) {
            App.UI.Toast.show(t('nameRequired', 'Name is required'));
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
          App.UI.Toast.show(App.I18n.t('common.supplierSaved', 'Supplier saved'));
          App.Core.Router.navigate('suppliers');
        }
      }
    ]);
  }
};
