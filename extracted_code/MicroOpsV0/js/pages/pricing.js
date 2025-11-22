// Price lists page
App.UI.Views.Pricing = {
  render(root) {
    const lists = App.Data.priceLists || App.Data.PriceLists || [];

    // Get scope display name
    const getScopeDisplay = (pl) => {
      if (pl.customerId) {
        const customer = (App.Data.customers || []).find(c => c.id === pl.customerId);
        return customer ? customer.company : pl.customerId;
      }
      if (pl.segmentId) {
        return pl.segmentId.charAt(0).toUpperCase() + pl.segmentId.slice(1);
      }
      return 'Default';
    };

    // Get status badge
    const getStatusBadge = (pl) => {
      const now = new Date();
      if (pl.active === false) {
        return '<span class="tag tag-muted">Inactive</span>';
      }
      if (pl.validFrom && new Date(pl.validFrom) > now) {
        return '<span class="tag tag-info">Scheduled</span>';
      }
      if (pl.validTo && new Date(pl.validTo) < now) {
        return '<span class="tag tag-muted">Expired</span>';
      }
      return '<span class="tag tag-success">Active</span>';
    };

    root.innerHTML = `
      <div class="card-soft">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 style="font-size:16px; font-weight:600;">${App.I18n.t('pages.pricing.title','Price Lists')}</h3>
          <button class="btn btn-primary" id="btn-add-pricelist">+ ${App.I18n.t('common.add','Add')}</button>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>${App.I18n.t('pricing.name','Name')}</th>
              <th>${App.I18n.t('pricing.type','Type')}</th>
              <th>${App.I18n.t('pricing.scope','Scope')}</th>
              <th>Status</th>
              <th>${App.I18n.t('pricing.validity','Validity')}</th>
              <th style="text-align:center;">Items</th>
              <th style="text-align:right;">${App.I18n.t('common.actions','Actions')}</th>
            </tr>
          </thead>
          <tbody>
            ${lists.map(pl => `
              <tr>
                <td><strong>${pl.name || '-'}</strong></td>
                <td>${pl.type === 'customer' ? '👤 Customer' : (pl.type === 'segment' ? '📊 Segment' : '📋 Default')}</td>
                <td>${getScopeDisplay(pl)}</td>
                <td>${getStatusBadge(pl)}</td>
                <td>${pl.validFrom || 'Always'} ${pl.validTo ? ' → ' + pl.validTo : ''}</td>
                <td style="text-align:center;">${(pl.entries || []).length}</td>
                <td style="text-align:right;">
                  <button class="btn btn-ghost btn-prices-pl" data-id="${pl.id}" title="${App.I18n.t('pricing.managePrices', 'Manage Prices')}" aria-label="Manage prices">💰</button>
                  <button class="btn btn-ghost btn-edit-pl" data-id="${pl.id}" title="${App.I18n.t('common.edit', 'Edit')}" aria-label="Edit price list">✏️</button>
                  <button class="btn btn-ghost btn-export-pl" data-id="${pl.id}" title="${App.I18n.t('pricing.export', 'Export CSV')}" aria-label="Export price list">📥</button>
                  <button class="btn btn-ghost btn-delete-pl" data-id="${pl.id}" title="${App.I18n.t('common.delete', 'Delete')}" aria-label="Delete price list">🗑️</button>
                </td>
              </tr>
            `).join('') || `<tr><td colspan="7" style="text-align:center; color:var(--color-text-muted);">No price lists</td></tr>`}
          </tbody>
        </table>
      </div>
    `;

    const addBtn = document.getElementById('btn-add-pricelist');
    if (addBtn) {
      addBtn.onclick = () => this.openPriceListModal();
    }

    root.querySelectorAll('.btn-prices-pl').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const pl = lists.find(p => p.id === id);
        if (pl) this.openPriceEntriesModal(pl);
      });
    });

    root.querySelectorAll('.btn-edit-pl').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const pl = lists.find(p => p.id === id);
        if (pl) this.openPriceListModal(pl);
      });
    });

    root.querySelectorAll('.btn-export-pl').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        this.exportList(id);
      });
    });

    root.querySelectorAll('.btn-delete-pl').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        this.deleteList(id);
      });
    });
  },

  deleteList(id) {
    const list = (App.Data.priceLists || []).find(pl => pl.id === id);
    if (!list) return;

    App.UI.Modal.open('Delete Price List', `
      <p>Are you sure you want to delete <strong>${list.name}</strong>?</p>
      <p style="font-size:12px; color:var(--color-text-muted); margin-top:8px;">This will remove all ${(list.entries || []).length} price entries.</p>
    `, [
      { text: 'Cancel', variant: 'ghost', onClick: () => {} },
      {
        text: 'Delete',
        variant: 'primary',
        onClick: () => {
          App.Data.priceLists = (App.Data.priceLists || []).filter(pl => pl.id !== id);
          App.DB.save();
          App.UI.Toast.show('Price list deleted');
          App.Core.Router.navigate('pricing');
        }
      }
    ]);
  },

  exportList(id) {
    const list = (App.Data.priceLists || []).find(pl => pl.id === id);
    if (!list) return;

    const headers = ['Product Name', 'SKU', 'Price', 'UVP', 'Min Order Qty'];
    const rows = (list.entries || []).map(e => {
      const p = (App.Data.products || []).find(prod => prod.id === e.productId);
      return [
        p ? p.nameDE || p.name : e.productId,
        p ? p.sku : '',
        e.price,
        e.uvp,
        e.minOrderQty
      ];
    });

    // Use secure CSV utility with injection protection and BOM
    const filename = `${list.name.replace(/\s+/g, '_')}.csv`;
    App.Utils.exportCSV(headers, rows, filename);
  },

  openPriceEntriesModal(pl) {
    const products = App.Data.products || [];
    const entries = pl.entries || [];

    // Build entries table
    const entriesHtml = entries.length > 0 ? entries.map((entry, idx) => {
      const prod = products.find(p => p.id === entry.productId);
      const name = prod ? (prod.nameDE || prod.nameEN || prod.internalArticleNumber) : entry.productId;
      const sku = prod ? prod.internalArticleNumber : '-';
      return `
        <tr data-entry-idx="${idx}">
          <td style="font-size:12px;"><strong>${sku}</strong></td>
          <td style="font-size:12px;">${name}</td>
          <td><input type="number" class="input entry-price" value="${entry.price || 0}" step="0.01" min="0" style="width:80px; padding:4px;" /></td>
          <td><input type="number" class="input entry-uvp" value="${entry.uvp || 0}" step="0.01" min="0" style="width:80px; padding:4px;" /></td>
          <td><input type="number" class="input entry-moq" value="${entry.minOrderQty || 1}" min="1" style="width:60px; padding:4px;" /></td>
        </tr>
      `;
    }).join('') : '<tr><td colspan="5" style="text-align:center; color:var(--color-text-muted);">No entries</td></tr>';

    const body = `
      <div>
        <p style="font-size:12px; color:var(--color-text-muted); margin-bottom:12px;">
          ${App.I18n.t('pricing.editPricesDesc', 'Edit individual product prices in this list. Changes are saved when you click Save.')}
        </p>
        <div style="max-height:400px; overflow-y:auto; border:1px solid var(--color-border); border-radius:6px;">
          <table class="table" style="font-size:12px; margin:0;">
            <thead style="position:sticky; top:0; background:var(--color-bg-soft);">
              <tr>
                <th style="padding:8px;">${App.I18n.t('pricing.sku', 'SKU')}</th>
                <th style="padding:8px;">${App.I18n.t('pricing.product', 'Product')}</th>
                <th style="padding:8px;">${App.I18n.t('pricing.price', 'Price (€)')}</th>
                <th style="padding:8px;">${App.I18n.t('pricing.uvp', 'UVP (€)')}</th>
                <th style="padding:8px;">${App.I18n.t('pricing.moq', 'MOQ')}</th>
              </tr>
            </thead>
            <tbody id="price-entries-body">
              ${entriesHtml}
            </tbody>
          </table>
        </div>
        <div style="margin-top:12px; font-size:12px; color:var(--color-text-muted);">
          ${entries.length} ${App.I18n.t('pricing.products', 'products')} • ${App.I18n.t('pricing.total', 'Total')}: ${App.Utils.formatCurrency(entries.reduce((sum, e) => sum + (e.price || 0), 0))}
        </div>
      </div>
    `;

    App.UI.Modal.open(`${App.I18n.t('pricing.managePrices', 'Manage Prices')} - ${pl.name}`, body, [
      { text: App.I18n.t('common.cancel', 'Cancel'), variant: 'ghost', onClick: () => {} },
      {
        text: App.I18n.t('common.save', 'Save'),
        variant: 'primary',
        onClick: () => {
          const rows = document.querySelectorAll('#price-entries-body tr[data-entry-idx]');
          let changedCount = 0;

          rows.forEach(row => {
            const idx = parseInt(row.getAttribute('data-entry-idx'));
            const entry = pl.entries[idx];
            if (!entry) return;

            const newPrice = parseFloat(row.querySelector('.entry-price').value) || 0;
            const newUvp = parseFloat(row.querySelector('.entry-uvp').value) || 0;
            const newMoq = parseInt(row.querySelector('.entry-moq').value) || 1;

            if (entry.price !== newPrice || entry.uvp !== newUvp || entry.minOrderQty !== newMoq) {
              changedCount++;
            }

            entry.price = newPrice;
            entry.uvp = newUvp;
            entry.minOrderQty = newMoq;
          });

          App.DB.save();

          // Log activity
          if (App.Services.ActivityLog) {
            App.Services.ActivityLog.log('update', 'priceList', pl.id, {
              name: pl.name,
              action: 'prices_edited',
              changedEntries: changedCount
            });
          }

          App.UI.Toast.show(`${App.I18n.t('pricing.saved', 'Prices saved')} (${changedCount} ${App.I18n.t('pricing.changed', 'changed')})`);
          App.Core.Router.navigate('pricing');
        }
      }
    ]);
  },

  openPriceListModal(pl) {
    const isEdit = !!pl;
    const customers = App.Data.customers || [];
    const customerOptions = customers.map(c => `<option value="${c.id}" ${pl && pl.customerId === c.id ? 'selected' : ''}>${c.company}</option>`).join('');
    const segments = ['dealer','endcustomer','lepage'];
    const segOptions = segments.map(s => `<option value="${s}" ${pl && pl.segmentId === s ? 'selected' : ''}>${s}</option>`).join('');
    const type = pl ? pl.type : 'segment';
    const body = `
      <div>
        <label class="field-label">${App.I18n.t('pricing.name','Name')}*</label>
        <input id="pl-name" class="input" value="${pl ? pl.name : ''}" />

        <label class="field-label" style="margin-top:8px;">${App.I18n.t('pricing.type','Type')}</label>
        <select id="pl-type" class="input">
          <option value="segment" ${type === 'segment' ? 'selected' : ''}>Segment</option>
          <option value="customer" ${type === 'customer' ? 'selected' : ''}>Customer</option>
        </select>

        <div id="pl-segment-row" style="margin-top:8px; display:${type === 'segment' ? 'block' : 'none'};">
          <label class="field-label">${App.I18n.t('pricing.segment','Segment')}</label>
          <select id="pl-segment" class="input">
            ${segOptions}
          </select>
        </div>
        <div id="pl-customer-row" style="margin-top:8px; display:${type === 'customer' ? 'block' : 'none'};">
          <label class="field-label">${App.I18n.t('pricing.customer','Customer')}</label>
          <select id="pl-customer" class="input">
            <option value="">-</option>
            ${customerOptions}
          </select>
        </div>
        <label class="field-label" style="margin-top:8px;">${App.I18n.t('pricing.validFrom','Valid From')}</label>
        <input id="pl-from" class="input" type="date" value="${pl && pl.validFrom ? pl.validFrom : ''}" />

        <label class="field-label" style="margin-top:8px;">${App.I18n.t('pricing.validTo','Valid To')}</label>
        <input id="pl-to" class="input" type="date" value="${pl && pl.validTo ? pl.validTo : ''}" />
      </div>
    `;
    const title = isEdit ? App.I18n.t('pricing.edit','Edit Price List') : App.I18n.t('pricing.add','Add Price List');
    const onSaveButtons = [
      { text: App.I18n.t('common.cancel','Cancel'), variant:'ghost', onClick: () => {} },
      { text: App.I18n.t('common.save','Save'), variant:'primary', onClick: () => {
          const name = document.getElementById('pl-name').value.trim();
          if (!name) {
            App.UI.Toast.show(App.I18n.t('pricing.name','Name') + ' is required');
            return false;
          }
          const typeVal = document.getElementById('pl-type').value;
          let segmentId = null;
          let customerId = null;
          if (typeVal === 'segment') {
            segmentId = document.getElementById('pl-segment').value;
          } else {
            customerId = document.getElementById('pl-customer').value;
          }
          const validFrom = document.getElementById('pl-from').value || null;
          const validTo = document.getElementById('pl-to').value || null;
          
          const products = App.Data.products || [];
          const entries = products.filter(p => p.type !== 'Service').map(p => {
            let price;
            if (typeVal === 'segment') {
              if (segmentId === 'dealer' || segmentId === 'lepage') {
                price = p.dealerPrice;
              } else {
                price = p.endCustomerPrice;
              }
            } else {
              price = p.dealerPrice;
            }
            return {
              productId: p.id,
              price: price,
              uvp: p.endCustomerPrice,
              minOrderQty: p.vpe || 1,
              tariffCode: p.customsCode || '',
              originCountry: p.originCountry || '',
              languages: 'DE,EN'
            };
          });
          const list = App.Data.priceLists || [];
          const newPl = {
            id: isEdit ? pl.id : App.Utils.generateId('pl'),
            name: name,
            type: typeVal,
            segmentId: segmentId || undefined,
            customerId: customerId || undefined,
            currency: 'EUR',
            validFrom: validFrom,
            validTo: validTo,
            entries: entries
          };
          if (isEdit) {
            const idx = list.findIndex(x => x.id === pl.id);
            if (idx >= 0) list[idx] = newPl;
          } else {
            list.push(newPl);
          }
          App.DB.save();
          App.Core.Router.navigate('pricing');
        } }
    ];
    App.UI.Modal.open(title, body, onSaveButtons);
    setTimeout(() => {
      const typeSel = document.getElementById('pl-type');
      if (typeSel) {
        typeSel.onchange = () => {
          const segRow = document.getElementById('pl-segment-row');
          const custRow = document.getElementById('pl-customer-row');
          if (typeSel.value === 'segment') {
            if (segRow) segRow.style.display = 'block';
            if (custRow) custRow.style.display = 'none';
          } else {
            if (segRow) segRow.style.display = 'none';
            if (custRow) custRow.style.display = 'block';
          }
        };
      }
    }, 50);
  }
};