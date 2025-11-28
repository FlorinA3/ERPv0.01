App.UI.Views.Products = {
  _pendingReload: false,

  getProducts() {
    return (App.Store?.Products?.getState?.().items) || App.Data.products || App.Data.Products || [];
  },

  render(root) {
    const t = (key, fallback) => App.I18n.t(`common.${key}`, fallback);
    const esc = App.Utils.escapeHtml;
    const state = App.Store?.Products?.getState?.() || {};
    const products = state.items || this.getProducts();
    const stale = App.Store?.Products?.isStale?.();
    if (stale && !this._pendingReload && App.Store?.Products?.load) {
      this._pendingReload = true;
      App.Store.Products.load({}, { force: true }).finally(() => {
        this._pendingReload = false;
        if (App.Core.Router.currentRoute === 'products') {
          this.render(root);
        }
      });
    }
    const lastUpdated = state.lastLoadedAt
      ? new Date(state.lastLoadedAt).toLocaleTimeString()
      : App.I18n.t('common.never', 'Never');

    root.innerHTML = `
      <div class="card-soft">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 style="font-size:16px; font-weight:600;">${App.I18n.t('pages.products.title','Products')}</h3>
          <div style="display:flex; gap:8px; align-items:center;">
            <input type="text" id="product-search" class="input" placeholder="${App.I18n.t('common.search','Search...')}" style="width:200px;" />
            <button class="btn btn-ghost" id="btn-import-products" title="${t('importCSV', 'Import CSV')}">📥 ${t('importCSV', 'Import')}</button>
            <button class="btn btn-primary" id="btn-add-product">+ ${App.I18n.t('common.add','Add')}</button>
          </div>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>${App.I18n.t('common.artNo', 'Art. No.')}</th>
              <th>${App.I18n.t('common.name', 'Name')}</th>
              <th>${App.I18n.t('common.type', 'Type')}</th>
              <th style="text-align:right;">${App.I18n.t('products.dealerPrice', 'Dealer Price')}</th>
              <th style="text-align:right;">${App.I18n.t('common.stock', 'Stock')}</th>
              <th style="text-align:center;">BOM</th>
              <th style="text-align:right;">${App.I18n.t('common.actions', 'Actions')}</th>
            </tr>
          </thead>
          <tbody>
            ${products.map(p => {
              const stockClass = p.type !== 'Service' && (p.stock || 0) <= (p.minStock || 0) ? 'color:#f97373;' : '';
              const bomCount = (p.bom || []).length;
              const esc = App.Utils.escapeHtml;
              return `
              <tr>
                <td>${esc(p.internalArticleNumber || p.sku) || '-'}</td>
                <td><strong>${esc(p.nameDE || p.nameEN || p.name) || '-'}</strong></td>
                <td><span class="tag tag-muted">${esc(p.type || p.cat) || '-'}</span></td>
                <td style="text-align:right;">${App.Utils.formatCurrency(p.dealerPrice || p.price || 0)}</td>
                <td style="text-align:right; ${stockClass}">${p.type === 'Service' ? '-' : (p.stock ?? 0)}</td>
                <td style="text-align:center;">${bomCount > 0 ? `<span class="tag tag-info">${bomCount}</span>` : '-'}</td>
                <td style="text-align:right;">
                  <button class="btn btn-ghost btn-edit-product" data-id="${p.id}" title="${App.I18n.t('common.edit', 'Edit')}" aria-label="Edit product">✏️</button>
                  <button class="btn btn-ghost btn-bom-product" data-id="${p.id}" title="${App.I18n.t('common.editBOM', 'Edit BOM')}" aria-label="Edit bill of materials">🔧</button>
                  <button class="btn btn-ghost btn-del-product" data-id="${p.id}" title="${App.I18n.t('common.delete', 'Delete')}" aria-label="Delete product">🗑️</button>
                </td>
              </tr>`;
            }).join('') || `<tr><td colspan="7" style="text-align:center; color:var(--color-text-muted);">${App.I18n.t('common.noProducts', 'No products')}</td></tr>`}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('products-refresh')?.addEventListener('click', () => {
      App.Store?.Products?.load?.({}, { force: true });
    });
    document.getElementById('btn-add-product').onclick = () => this.openEditModal();
    document.getElementById('btn-import-products')?.addEventListener('click', () => this.openImportModal());

    root.querySelectorAll('.btn-edit-product').forEach(btn => {
      btn.addEventListener('click', () => {
        this.openEditModal(btn.getAttribute('data-id'));
      });
    });

    root.querySelectorAll('.btn-bom-product').forEach(btn => {
      btn.addEventListener('click', () => {
        this.openBOMModal(btn.getAttribute('data-id'));
      });
    });

    root.querySelectorAll('.btn-del-product').forEach(btn => {
      btn.addEventListener('click', () => {
        this.deleteProduct(btn.getAttribute('data-id'));
      });
    });

    // Search functionality
    const searchInput = document.getElementById('product-search');
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

  openEditModal(id) {
    const t = (key, fallback) => App.I18n.t(`common.${key}`, fallback);
    const esc = App.Utils.escapeHtml;

    const isNew = !id;
    const products = this.getProducts();
    const p = isNew
      ? { nameDE: '', nameEN: '', internalArticleNumber: '', type: 'Consumable', dealerPrice: 0, endCustomerPrice: 0, avgPurchasePrice: 0, stock: 0, minStock: 0, unit: 'Stk' }
      : products.find(x => x.id === id) || {};

    const types = ['Finished', 'Device', 'Consumable', 'Part', 'Service'];
    const typeOptions = types.map(typ => `<option value="${typ}" ${p.type === typ ? 'selected' : ''}>${typ}</option>`).join('');

    const body = `
      <div class="grid grid-2" style="gap:12px;">
        <div>
          <label class="field-label" for="prod-artno">${t('articleNumber', 'Article Number')}*</label>
          <input id="prod-artno" class="input" value="${esc(p.internalArticleNumber || '')}" aria-required="true" />
        </div>
        <div>
          <label class="field-label" for="prod-type">${t('type', 'Type')}</label>
          <select id="prod-type" class="input">${typeOptions}</select>
        </div>
      </div>
      <div class="grid grid-2" style="gap:12px; margin-top:8px;">
        <div>
          <label class="field-label" for="prod-namede">${t('nameDE', 'Name (DE)')}*</label>
          <input id="prod-namede" class="input" value="${esc(p.nameDE || '')}" aria-required="true" />
        </div>
        <div>
          <label class="field-label" for="prod-nameen">${t('nameEN', 'Name (EN)')}</label>
          <input id="prod-nameen" class="input" value="${esc(p.nameEN || '')}" />
        </div>
      </div>
      <div class="grid grid-3" style="gap:12px; margin-top:8px;">
        <div>
          <label class="field-label" for="prod-purchase">${t('purchasePrice', 'Purchase Price')}</label>
          <input id="prod-purchase" class="input" type="number" step="0.01" value="${p.avgPurchasePrice || 0}" />
        </div>
        <div>
          <label class="field-label" for="prod-dealer">${App.I18n.t('products.dealerPrice', 'Dealer Price')}</label>
          <input id="prod-dealer" class="input" type="number" step="0.01" value="${p.dealerPrice || 0}" />
        </div>
        <div>
          <label class="field-label" for="prod-endcust">${t('endCustomerPrice', 'End Customer')}</label>
          <input id="prod-endcust" class="input" type="number" step="0.01" value="${p.endCustomerPrice || 0}" />
        </div>
      </div>
      <div class="grid grid-3" style="gap:12px; margin-top:8px;">
        <div>
          <label class="field-label" for="prod-stock">${t('stock', 'Stock')}</label>
          <input id="prod-stock" class="input" type="number" value="${p.stock || 0}" />
        </div>
        <div>
          <label class="field-label" for="prod-minstock">${t('minStock', 'Min Stock')}</label>
          <input id="prod-minstock" class="input" type="number" value="${p.minStock || 0}" />
        </div>
        <div>
          <label class="field-label" for="prod-unit">${t('unit', 'Unit')}</label>
          <input id="prod-unit" class="input" value="${esc(p.unit || 'Stk')}" />
        </div>
      </div>
    `;

    App.UI.Modal.open(isNew ? t('addProduct', 'Add Product') : t('editProduct', 'Edit Product'), body, [
      { text: App.I18n.t('common.cancel', 'Cancel'), variant: 'ghost', onClick: () => {} },
      {
        text: App.I18n.t('common.save', 'Save'),
        variant: 'primary',
        onClick: () => {
          const artNo = document.getElementById('prod-artno').value.trim();
          const nameDE = document.getElementById('prod-namede').value.trim();
          if (!artNo || !nameDE) {
            App.UI.Toast.show(t('productRequired', 'Article number and Name (DE) are required'));
            return false;
          }

          const updated = {
            id: isNew ? App.Utils.generateId('p') : p.id,
            internalArticleNumber: artNo,
            sku: artNo,
            nameDE: nameDE,
            nameEN: document.getElementById('prod-nameen').value.trim(),
            type: document.getElementById('prod-type').value,
            avgPurchasePrice: parseFloat(document.getElementById('prod-purchase').value) || 0,
            dealerPrice: parseFloat(document.getElementById('prod-dealer').value) || 0,
            endCustomerPrice: parseFloat(document.getElementById('prod-endcust').value) || 0,
            stock: parseInt(document.getElementById('prod-stock').value, 10) || 0,
            minStock: parseInt(document.getElementById('prod-minstock').value, 10) || 0,
            unit: document.getElementById('prod-unit').value.trim() || 'Stk',
            bom: isNew ? [] : (p.bom || [])
          };

          // Validate product
          const validation = App.Validate?.product
            ? App.Validate.product(updated)
            : { isValid: true, errors: {} };
          const summary = App.UI.Validation.showErrors(document, validation.errors);
          if (!validation.isValid) {
            App.UI.Toast.show(summary || t('fixValidation', 'Please fix validation errors'), 'error');
            return false;
          }

          // Capture old product for audit
          const oldProduct = isNew ? null : JSON.parse(JSON.stringify(p));

          try {
            if (isNew) {
              await App.Store?.Products?.create?.({ ...updated, rowVersion: 1 });
            } else {
              await App.Store?.Products?.update?.(updated.id, { ...updated, rowVersion: p.rowVersion || p.row_version || 1 });
            }
          } catch (err) {
            if (err.status === 409 || err.code === 'CONFLICT' || err.code === 'CONCURRENT_UPDATE') {
              App.UI.Toast.show(App.I18n.t('common.conflictReload', 'This record was changed elsewhere. Reloading latest data.'), 'warning');
              await App.Store?.Products?.load?.({}, { force: true });
              return false;
            }
            App.UI.Toast.show(App.I18n.t('common.saveFailed', 'Save failed') + ': ' + (err.message || err), 'error');
            return false;
          }

          // Audit log
          if (App.Audit) {
            App.Audit.log(
              isNew ? 'CREATE' : 'UPDATE',
              'products',
              updated.id,
              oldProduct,
              updated
            );
          }
          App.UI.Toast.show(App.I18n.t('common.productSaved', 'Product saved'));
          App.Core.Router.navigate('products');
        }
      }
    ]);
  },

  openBOMModal(id) {
    const t = (key, fallback) => App.I18n.t(`common.${key}`, fallback);
    const esc = App.Utils.escapeHtml;

    const products = this.getProducts();
    const p = products.find(x => x.id === id);
    if (!p) return;

    const components = App.Data.components || [];

    const getBOMRowHTML = (compId = '', qty = 1) => {
      const opts = components.map(c =>
        `<option value="${c.id}" ${c.id === compId ? 'selected' : ''}>${esc(c.componentNumber)} - ${esc(c.description || '')}</option>`
      ).join('');
      return `
        <div class="bom-row" style="display:flex; gap:8px; margin-bottom:8px; align-items:center;">
          <select class="input bom-comp" style="flex:2;" aria-label="${t('component', 'Component')}">${opts}</select>
          <input type="number" class="input bom-qty" style="width:100px;" value="${qty}" min="0.01" step="0.01" placeholder="${t('perUnit', 'Per Unit')}" aria-label="${t('perUnit', 'Per Unit')}">
          <button class="btn btn-ghost bom-remove" aria-label="${t('delete', 'Delete')}">❌</button>
        </div>
      `;
    };

    const existingRows = (p.bom || []).map(b => getBOMRowHTML(b.componentId, b.quantityPerUnit)).join('');
    const productName = esc(p.nameDE || p.nameEN || p.internalArticleNumber);

    const body = `
      <div>
        <p style="font-size:13px; color:var(--color-text-muted); margin-bottom:12px;">
          ${t('defineComponents', 'Components for')} <strong>${t('oneUnitOf', '1 unit of')} ${productName}</strong>
        </p>
        <div id="bom-container" style="max-height:300px; overflow-y:auto; border:1px solid var(--color-border); padding:8px; border-radius:8px;">
          ${existingRows || `<p style="text-align:center; color:var(--color-text-muted); font-size:12px;">${t('noComponentsDefined', 'No components defined')}</p>`}
        </div>
        <button class="btn btn-ghost" id="btn-add-bom-row" style="margin-top:8px;">${t('addComponentRow', '+ Add Component')}</button>
      </div>
    `;

    App.UI.Modal.open(`${t('bomFor', 'BOM for')} ${productName}`, body, [
      { text: App.I18n.t('common.cancel', 'Cancel'), variant: 'ghost', onClick: () => {} },
      {
        text: t('saveBOM', 'Save BOM'),
        variant: 'primary',
        onClick: () => {
          const oldBom = JSON.parse(JSON.stringify(p.bom || []));
          const bom = [];
          document.querySelectorAll('.bom-row').forEach(row => {
            const compId = row.querySelector('.bom-comp').value;
            const qty = parseFloat(row.querySelector('.bom-qty').value) || 0;
            if (compId && qty > 0) {
              bom.push({ componentId: compId, quantityPerUnit: qty });
            }
          });
          p.bom = bom;
          App.DB.save();

          // Audit log for BOM change
          if (App.Audit) {
            App.Audit.log(
              'UPDATE',
              'products',
              p.id,
              { id: p.id, bom: oldBom },
              { id: p.id, bom: bom }
            );
          }

          App.UI.Toast.show(`${t('bomSaved', 'BOM saved')} (${bom.length} ${t('components', 'components')})`);
          App.Core.Router.navigate('products');
        }
      }
    ]);

    setTimeout(() => {
      const container = document.getElementById('bom-container');
      const addBtn = document.getElementById('btn-add-bom-row');

      const wireDelete = () => {
        container.querySelectorAll('.bom-remove').forEach(btn => {
          btn.onclick = () => {
            btn.closest('.bom-row').remove();
            if (container.querySelectorAll('.bom-row').length === 0) {
              container.innerHTML = `<p style="text-align:center; color:var(--color-text-muted); font-size:12px;">${App.I18n.t('common.noComponentsDefined', 'No components defined')}</p>`;
            }
          };
        });
      };

      if (addBtn) {
        addBtn.onclick = () => {
          const emptyMsg = container.querySelector('p');
          if (emptyMsg) emptyMsg.remove();
          container.insertAdjacentHTML('beforeend', getBOMRowHTML());
          wireDelete();
        };
      }
      wireDelete();
    }, 50);
  },

  deleteProduct(id) {
    const t = (key, fallback) => App.I18n.t(`common.${key}`, fallback);
    const esc = App.Utils.escapeHtml;

    const products = this.getProducts();
    const p = products.find(x => x.id === id);
    if (!p) return;

    // Check for linked orders
    const orders = App.Data.orders || [];
    const linkedOrders = orders.filter(o => (o.items || []).some(i => i.productId === id));

    // Check for linked production orders
    const productionOrders = App.Data.productionOrders || [];
    const linkedPOs = productionOrders.filter(po => po.productId === id);

    // Check for linked documents
    const documents = App.Data.documents || [];
    const linkedDocs = documents.filter(d => (d.items || []).some(i => i.productId === id));

    if (linkedOrders.length > 0 || linkedPOs.length > 0 || linkedDocs.length > 0) {
      App.UI.Modal.open(t('cannotDeleteProduct', 'Cannot Delete Product'), `
        <div style="color:var(--color-danger);">
          <p>${t('linkedProductRecords', 'This product has linked records:')}</p>
          <ul style="margin:8px 0; padding-left:20px; font-size:12px;">
            ${linkedOrders.length > 0 ? `<li>${linkedOrders.length} ${t('ordersCount', 'order(s)')}</li>` : ''}
            ${linkedPOs.length > 0 ? `<li>${linkedPOs.length} ${t('productionOrdersLinked', 'production order(s)')}</li>` : ''}
            ${linkedDocs.length > 0 ? `<li>${linkedDocs.length} ${t('documentsCount', 'document(s)')}</li>` : ''}
          </ul>
          <p style="font-size:12px; margin-top:8px;">${t('deleteProductRecordsFirst', 'Delete these records first.')}</p>
        </div>
      `, [{ text: App.I18n.t('common.close', 'Close'), variant: 'ghost', onClick: () => {} }]);
      return;
    }

    const productName = esc(p.nameDE || p.nameEN || p.internalArticleNumber);

    App.UI.Modal.open(t('deleteProduct', 'Delete Product'), `
      <p>${t('confirmDeleteProduct', 'Are you sure you want to delete')} <strong>${productName}</strong>?</p>
      <div style="font-size:12px; color:var(--color-text-muted); margin-top:8px;">
        <p>${t('artNo', 'Art. No')}: ${esc(p.internalArticleNumber || '-')}</p>
        <p>${t('stock', 'Stock')}: ${p.stock || 0} ${esc(p.unit || 'Stk')}</p>
      </div>
    `, [
      { text: App.I18n.t('common.cancel', 'Cancel'), variant: 'ghost', onClick: () => {} },
      {
        text: App.I18n.t('common.delete', 'Delete'),
        variant: 'primary',
        onClick: () => {
          // Capture product for audit before deletion
          const deletedProduct = JSON.parse(JSON.stringify(p));

          App.Store?.Products?.remove?.(id);

          // Audit log
          if (App.Audit) {
            App.Audit.log('DELETE', 'products', id, deletedProduct, null);
          }

          // Log activity
          if (App.Services.ActivityLog) {
            App.Services.ActivityLog.log('delete', 'product', id, {
              name: p.nameDE || p.nameEN,
              articleNumber: p.internalArticleNumber
            });
          }

          App.UI.Toast.show(t('productDeleted', 'Product deleted'));
          App.Core.Router.navigate('products');
        }
      }
    ]);
  },

  openImportModal() {
    const t = (key, fallback) => App.I18n.t(`common.${key}`, fallback);
    const esc = App.Utils.escapeHtml;

    const body = `
      <div>
        <p style="font-size:13px; color:var(--color-text-muted); margin-bottom:12px;">
          ${t('csvFormatHelp', 'CSV format: First row = column headers')}
        </p>
        <div style="margin-bottom:12px;">
          <strong>${t('requiredFields', 'Required fields')}:</strong> articleNumber, nameDE<br>
          <strong>${t('optionalFields', 'Optional fields')}:</strong> nameEN, type, purchasePrice, dealerPrice, endCustomerPrice, stock, minStock, unit
        </div>
        <div style="margin-bottom:12px;">
          <button class="btn btn-ghost" id="btn-download-product-template">
            📋 ${t('downloadTemplate', 'Download template')}
          </button>
        </div>
        <div style="border:2px dashed var(--color-border); border-radius:8px; padding:20px; text-align:center;">
          <input type="file" id="product-csv-input" accept=".csv,.txt" style="display:none;" />
          <button class="btn btn-primary" id="btn-select-product-csv">
            📁 ${t('selectCSVFile', 'Select CSV file')}
          </button>
          <p id="product-csv-filename" style="margin-top:8px; font-size:12px; color:var(--color-text-muted);"></p>
        </div>
        <div id="product-import-preview" style="margin-top:12px; display:none;">
          <h4 style="font-size:14px; margin-bottom:8px;">${t('importPreview', 'Import Preview')}</h4>
          <div id="product-preview-content" style="max-height:200px; overflow-y:auto; border:1px solid var(--color-border); border-radius:8px; padding:8px; font-size:12px;"></div>
          <p id="product-preview-count" style="margin-top:8px; font-size:13px; font-weight:600;"></p>
        </div>
      </div>
    `;

    let parsedData = null;

    App.UI.Modal.open(t('importCSV', 'Import CSV') + ' - ' + App.I18n.t('pages.products.title', 'Products'), body, [
      { text: App.I18n.t('common.cancel', 'Cancel'), variant: 'ghost', onClick: () => {} },
      {
        text: t('importCSV', 'Import'),
        variant: 'primary',
        onClick: async () => {
          if (!parsedData || parsedData.length === 0) {
            App.UI.Toast.show(t('noFileSelected', 'No file selected'));
            return false;
          }

          const products = this.getProducts();
          let imported = 0;
          let skipped = 0;

          parsedData.forEach(row => {
            // Check for duplicates by article number
            const exists = products.find(p =>
              p.internalArticleNumber && row.articleNumber &&
              p.internalArticleNumber.toLowerCase().trim() === String(row.articleNumber).toLowerCase().trim()
            );

            if (exists) {
              skipped++;
              return;
            }

            const newProduct = {
              id: App.Utils.generateId('p'),
              internalArticleNumber: String(row.articleNumber || '').trim(),
              sku: String(row.articleNumber || '').trim(),
              nameDE: row.nameDE || row.name || '',
              nameEN: row.nameEN || '',
              type: row.type || 'Consumable',
              avgPurchasePrice: parseFloat(row.purchasePrice) || 0,
              dealerPrice: parseFloat(row.dealerPrice) || 0,
              endCustomerPrice: parseFloat(row.endCustomerPrice) || 0,
              stock: parseInt(row.stock, 10) || 0,
              minStock: parseInt(row.minStock, 10) || 0,
              unit: row.unit || 'Stk',
              bom: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            try {
              await App.Store?.Products?.create?.({ ...newProduct, rowVersion: 1 });
              imported++;
            } catch (e) {
              console.error('Import product failed', e);
              skipped++;
            }
          });

          let message = `${t('importSuccess', 'Import successful')}: ${imported} ${t('rowsImported', 'rows imported')}`;
          if (skipped > 0) {
            message += `, ${skipped} ${t('duplicatesSkipped', 'duplicates skipped')}`;
          }
          App.UI.Toast.show(message);
          App.Core.Router.navigate('products');
        }
      }
    ]);

    // Wire up file selection
    setTimeout(() => {
      const fileInput = document.getElementById('product-csv-input');
      const selectBtn = document.getElementById('btn-select-product-csv');
      const filenameEl = document.getElementById('product-csv-filename');
      const previewEl = document.getElementById('product-import-preview');
      const previewContent = document.getElementById('product-preview-content');
      const previewCount = document.getElementById('product-preview-count');
      const templateBtn = document.getElementById('btn-download-product-template');

      // Download template
      templateBtn?.addEventListener('click', () => {
        const headers = ['articleNumber', 'nameDE', 'nameEN', 'type', 'purchasePrice', 'dealerPrice', 'endCustomerPrice', 'stock', 'minStock', 'unit'];
        const sampleRow = ['ART-001', 'Beispielprodukt', 'Sample Product', 'Consumable', '10.00', '15.00', '20.00', '100', '10', 'Stk'];
        App.Utils.exportCSV(headers, [sampleRow], 'products_template.csv');
      });

      selectBtn?.addEventListener('click', () => fileInput?.click());

      fileInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        filenameEl.textContent = file.name;

        const reader = new FileReader();
        reader.onload = (evt) => {
          const content = evt.target.result;
          const result = App.Utils.parseCSV(content);

          if (result.error) {
            App.UI.Toast.show(t('invalidCSV', 'Invalid CSV file') + ': ' + result.error);
            return;
          }

          // Map CSV fields to product fields
          const fieldMappings = {
            articleNumber: ['articlenumber', 'artnr', 'artno', 'art.nr.', 'artikelnummer', 'sku', 'number'],
            nameDE: ['namede', 'name_de', 'name (de)', 'bezeichnung', 'name', 'product'],
            nameEN: ['nameen', 'name_en', 'name (en)', 'description'],
            type: ['type', 'typ', 'category', 'kategorie'],
            purchasePrice: ['purchaseprice', 'einkaufspreis', 'ekp', 'cost', 'purchase'],
            dealerPrice: ['dealerprice', 'händlerpreis', 'dealer', 'wholesale'],
            endCustomerPrice: ['endcustomerprice', 'endkundenpreis', 'retail', 'vkp', 'price'],
            stock: ['stock', 'bestand', 'lager', 'quantity', 'menge'],
            minStock: ['minstock', 'mindestbestand', 'reorder', 'min'],
            unit: ['unit', 'einheit', 'uom']
          };

          const mapping = App.Utils.mapCSVFields(result.headers, fieldMappings);

          // Check for required fields
          const hasArticle = Object.values(mapping).includes('articleNumber');
          const hasName = Object.values(mapping).includes('nameDE');
          if (!hasArticle || !hasName) {
            const missing = [];
            if (!hasArticle) missing.push('articleNumber');
            if (!hasName) missing.push('nameDE');
            App.UI.Toast.show(t('mappingError', 'Required fields not found') + ': ' + missing.join(', '));
            return;
          }

          // Transform data using mapping
          parsedData = result.data.map(row => {
            const mapped = {};
            Object.entries(row).forEach(([key, value]) => {
              const field = mapping[key] || key.toLowerCase();
              mapped[field] = value;
            });
            return mapped;
          }).filter(row => row.articleNumber && row.nameDE);

          // Show preview
          if (parsedData.length > 0) {
            previewEl.style.display = 'block';
            const previewRows = parsedData.slice(0, 5).map(row =>
              `<div style="padding:4px 0; border-bottom:1px solid var(--color-border);">
                <strong>${esc(String(row.articleNumber || ''))}</strong> - ${esc(row.nameDE || '')}
                ${row.dealerPrice ? ` (${App.Utils.formatCurrency(row.dealerPrice)})` : ''}
              </div>`
            ).join('');
            previewContent.innerHTML = previewRows;
            previewCount.textContent = `${parsedData.length} ${t('foundRows', 'rows found')}`;
          }
        };
        reader.readAsText(file);
      });
    }, 50);
  }
};
