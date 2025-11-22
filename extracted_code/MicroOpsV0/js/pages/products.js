App.UI.Views.Products = {
  render(root) {
    const products = App.Data.products || App.Data.Products || [];

    root.innerHTML = `
      <div class="card-soft">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 style="font-size:16px; font-weight:600;">${App.I18n.t('pages.products.title','Products')}</h3>
          <button class="btn btn-primary" id="btn-add-product">+ ${App.I18n.t('common.add','Add')}</button>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>Art. No.</th>
              <th>Name</th>
              <th>Type</th>
              <th style="text-align:right;">Dealer Price</th>
              <th style="text-align:right;">Stock</th>
              <th style="text-align:center;">BOM</th>
              <th style="text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${products.map(p => {
              const stockClass = p.type !== 'Service' && (p.stock || 0) <= (p.minStock || 0) ? 'color:#f97373;' : '';
              const bomCount = (p.bom || []).length;
              return `
              <tr>
                <td>${p.internalArticleNumber || p.sku || '-'}</td>
                <td><strong>${p.nameDE || p.nameEN || p.name || '-'}</strong></td>
                <td><span class="tag tag-muted">${p.type || p.cat || '-'}</span></td>
                <td style="text-align:right;">${App.Utils.formatCurrency(p.dealerPrice || p.price || 0)}</td>
                <td style="text-align:right; ${stockClass}">${p.type === 'Service' ? '-' : (p.stock ?? 0)}</td>
                <td style="text-align:center;">${bomCount > 0 ? `<span class="tag tag-info">${bomCount}</span>` : '-'}</td>
                <td style="text-align:right;">
                  <button class="btn btn-ghost btn-edit-product" data-id="${p.id}" title="Edit">✏️</button>
                  <button class="btn btn-ghost btn-bom-product" data-id="${p.id}" title="Edit BOM">🔧</button>
                  <button class="btn btn-ghost btn-del-product" data-id="${p.id}" title="Delete">🗑️</button>
                </td>
              </tr>`;
            }).join('') || `<tr><td colspan="7" style="text-align:center; color:var(--color-text-muted);">No products</td></tr>`}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('btn-add-product').onclick = () => this.openEditModal();

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
  },

  openEditModal(id) {
    const isNew = !id;
    const products = App.Data.products || App.Data.Products || [];
    const p = isNew
      ? { nameDE: '', nameEN: '', internalArticleNumber: '', type: 'Consumable', dealerPrice: 0, endCustomerPrice: 0, avgPurchasePrice: 0, stock: 0, minStock: 0, unit: 'Stk' }
      : products.find(x => x.id === id) || {};

    const types = ['Finished', 'Device', 'Consumable', 'Part', 'Service'];
    const typeOptions = types.map(t => `<option value="${t}" ${p.type === t ? 'selected' : ''}>${t}</option>`).join('');

    const body = `
      <div class="grid grid-2" style="gap:12px;">
        <div>
          <label class="field-label">Article Number *</label>
          <input id="prod-artno" class="input" value="${p.internalArticleNumber || ''}" />
        </div>
        <div>
          <label class="field-label">Type</label>
          <select id="prod-type" class="input">${typeOptions}</select>
        </div>
      </div>
      <div class="grid grid-2" style="gap:12px; margin-top:8px;">
        <div>
          <label class="field-label">Name (DE) *</label>
          <input id="prod-namede" class="input" value="${p.nameDE || ''}" />
        </div>
        <div>
          <label class="field-label">Name (EN)</label>
          <input id="prod-nameen" class="input" value="${p.nameEN || ''}" />
        </div>
      </div>
      <div class="grid grid-3" style="gap:12px; margin-top:8px;">
        <div>
          <label class="field-label">Purchase Price</label>
          <input id="prod-purchase" class="input" type="number" step="0.01" value="${p.avgPurchasePrice || 0}" />
        </div>
        <div>
          <label class="field-label">Dealer Price</label>
          <input id="prod-dealer" class="input" type="number" step="0.01" value="${p.dealerPrice || 0}" />
        </div>
        <div>
          <label class="field-label">End Customer</label>
          <input id="prod-endcust" class="input" type="number" step="0.01" value="${p.endCustomerPrice || 0}" />
        </div>
      </div>
      <div class="grid grid-3" style="gap:12px; margin-top:8px;">
        <div>
          <label class="field-label">Stock</label>
          <input id="prod-stock" class="input" type="number" value="${p.stock || 0}" />
        </div>
        <div>
          <label class="field-label">Min Stock</label>
          <input id="prod-minstock" class="input" type="number" value="${p.minStock || 0}" />
        </div>
        <div>
          <label class="field-label">Unit</label>
          <input id="prod-unit" class="input" value="${p.unit || 'Stk'}" />
        </div>
      </div>
    `;

    App.UI.Modal.open(isNew ? 'Add Product' : 'Edit Product', body, [
      { text: 'Cancel', variant: 'ghost', onClick: () => {} },
      {
        text: 'Save',
        variant: 'primary',
        onClick: () => {
          const artNo = document.getElementById('prod-artno').value.trim();
          const nameDE = document.getElementById('prod-namede').value.trim();
          if (!artNo || !nameDE) {
            App.UI.Toast.show('Article number and Name (DE) are required');
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

          if (isNew) {
            products.push(updated);
          } else {
            const idx = products.findIndex(x => x.id === updated.id);
            if (idx >= 0) products[idx] = { ...products[idx], ...updated };
          }
          App.DB.save();
          App.UI.Toast.show('Product saved');
          App.Core.Router.navigate('products');
        }
      }
    ]);
  },

  openBOMModal(id) {
    const products = App.Data.products || App.Data.Products || [];
    const p = products.find(x => x.id === id);
    if (!p) return;

    const components = App.Data.components || [];

    const getBOMRowHTML = (compId = '', qty = 1) => {
      const opts = components.map(c =>
        `<option value="${c.id}" ${c.id === compId ? 'selected' : ''}>${c.componentNumber} - ${c.description || ''}</option>`
      ).join('');
      return `
        <div class="bom-row" style="display:flex; gap:8px; margin-bottom:8px; align-items:center;">
          <select class="input bom-comp" style="flex:2;">${opts}</select>
          <input type="number" class="input bom-qty" style="width:100px;" value="${qty}" min="0.01" step="0.01" placeholder="Per Unit">
          <button class="btn btn-ghost bom-remove">❌</button>
        </div>
      `;
    };

    const existingRows = (p.bom || []).map(b => getBOMRowHTML(b.componentId, b.quantityPerUnit)).join('');

    const body = `
      <div>
        <p style="font-size:13px; color:var(--color-text-muted); margin-bottom:12px;">
          Define components needed to produce <strong>1 unit</strong> of ${p.nameDE || p.nameEN || p.internalArticleNumber}
        </p>
        <div id="bom-container" style="max-height:300px; overflow-y:auto; border:1px solid var(--color-border); padding:8px; border-radius:8px;">
          ${existingRows || '<p style="text-align:center; color:var(--color-text-muted); font-size:12px;">No components defined</p>'}
        </div>
        <button class="btn btn-ghost" id="btn-add-bom-row" style="margin-top:8px;">+ Add Component</button>
      </div>
    `;

    App.UI.Modal.open(`BOM - ${p.nameDE || p.internalArticleNumber}`, body, [
      { text: 'Cancel', variant: 'ghost', onClick: () => {} },
      {
        text: 'Save BOM',
        variant: 'primary',
        onClick: () => {
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
          App.UI.Toast.show(`BOM saved (${bom.length} components)`);
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
              container.innerHTML = '<p style="text-align:center; color:var(--color-text-muted); font-size:12px;">No components defined</p>';
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
    const products = App.Data.products || App.Data.Products || [];
    const p = products.find(x => x.id === id);
    if (!p) return;

    App.UI.Modal.open('Delete Product', `
      <p>Are you sure you want to delete <strong>${p.nameDE || p.nameEN || p.internalArticleNumber}</strong>?</p>
    `, [
      { text: 'Cancel', variant: 'ghost', onClick: () => {} },
      {
        text: 'Delete',
        variant: 'primary',
        onClick: () => {
          App.Data.products = products.filter(x => x.id !== id);
          App.DB.save();
          App.UI.Toast.show('Product deleted');
          App.Core.Router.navigate('products');
        }
      }
    ]);
  }
};
