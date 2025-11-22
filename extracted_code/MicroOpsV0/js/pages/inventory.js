 

App.UI.Views.Inventory = {
  
  activeTab: 'Devices',

  
  render(root) {
    const items = (App.Data.products || App.Data.Products || []).filter(it => {
      // Exclude services from inventory listing per specification
      const type = (it.type || '').toLowerCase();
      return type !== 'services' && type !== 'service';
    });
    // Inventory categories excluding services; align with specification
    const categories = ['Devices', 'Consumables', 'Parts', 'Components'];
    const active = this.activeTab;

    
    const tabsHtml = categories
      .map(cat => {
        const isActive = cat === active;
        return `<button class="inv-tab ${isActive ? 'inv-tab-active' : ''}" data-cat="${cat}">${cat}</button>`;
      })
      .join('');

    
    const filtered = items.filter(it => {
      const t = (it.type || '').toString().trim().toLowerCase();
      return t === active.toLowerCase();
    });

    
    const rowsHtml = filtered
      .map(it => {
        const price = App.Utils.formatCurrency(it.price);
        const stock = it.stock != null ? `${it.stock}` : '-';
        const isLow = (it.stock || 0) <= 5;
        return `
          <tr${isLow ? ' class="inv-low-stock"' : ''}>
            <td>${it.name || '-'}</td>
            <td>${it.sku || '-'}</td>
            <td style="text-align:center;">${stock}</td>
            <td style="text-align:right;">${price}</td>
            <td style="text-align:right;">
              <button class="btn btn-ghost btn-receive" data-id="${it.id}">⬆️</button>
              <button class="btn btn-ghost btn-edit" data-id="${it.id}">✏️</button>
              <button class="btn btn-ghost btn-delete" data-id="${it.id}">🗑️</button>
            </td>
          </tr>
        `;
      })
      .join('');

    root.innerHTML = `
      <div class="card-soft">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 style="font-size:16px; font-weight:600;">Inventory</h3>
          <div style="display:flex; gap:8px; align-items:center;">
            <button class="btn btn-ghost" id="inv-export-excel">Export XLSX</button>
            <button class="btn btn-ghost" id="inv-export-pdf">Export PDF</button>
            <button class="btn btn-primary" id="inv-add-new">+ Add New</button>
          </div>
        </div>
        <div class="inv-tabs" style="display:flex; gap:8px; margin-bottom:12px;">
          ${tabsHtml}
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>SKU</th>
              <th style="text-align:center;">Stock</th>
              <th style="text-align:right;">Price</th>
              <th style="text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || `<tr><td colspan="5" style="text-align:center; padding:12px; color:var(--color-text-muted);">No items in this category</td></tr>`}
          </tbody>
        </table>
      </div>
    `;

    
    root.querySelectorAll('.inv-tab').forEach(btn => {
      btn.addEventListener('click', ev => {
        this.activeTab = btn.getAttribute('data-cat');
        this.render(root);
      });
    });

    
    const addBtn = document.getElementById('inv-add-new');
    if (addBtn) {
      addBtn.onclick = () => this.openEditModal(null);
    }

    
    root.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.openEditModal(id);
      });
    });
    root.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.deleteItem(id);
      });
    });
    root.querySelectorAll('.btn-receive').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.receiveStock(id);
      });
    });

    
    const exportExcel = document.getElementById('inv-export-excel');
    if (exportExcel) {
      exportExcel.onclick = () => {
        const csvRows = [];
        csvRows.push('Type,Name,SKU,Category,Unit,Price,Stock');
        (App.Data.Products || []).forEach(p => {
          csvRows.push([
            p.type || '',
            p.name || '',
            p.sku || '',
            p.cat || '',
            p.unit || '',
            p.price || 0,
            p.stock || 0
          ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
        });
        const csv = csvRows.join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'inventory.csv';
        a.click();
        URL.revokeObjectURL(url);
      };
    }

    const exportPdf = document.getElementById('inv-export-pdf');
    if (exportPdf) {
      exportPdf.onclick = () => {
    
        let html = '<html><head><title>Inventory</title>';
        html += '<style>body{font-family:sans-serif;padding:20px;} table{width:100%;border-collapse:collapse;} th,td{border:1px solid #ccc;padding:6px;text-align:left;} th{background:#f0f0f0;}</style>';
        html += '</head><body>';
        html += '<h1>Inventory</h1>';
        html += '<table><thead><tr><th>Type</th><th>Name</th><th>SKU</th><th>Category</th><th>Unit</th><th>Price</th><th>Stock</th></tr></thead><tbody>';
        (App.Data.Products || []).forEach(p => {
          html += `<tr><td>${p.type || ''}</td><td>${p.name || ''}</td><td>${p.sku || ''}</td><td>${p.cat || ''}</td><td>${p.unit || ''}</td><td>${App.Utils.formatCurrency(p.price)}</td><td>${p.stock || 0}</td></tr>`;
        });
        html += '</tbody></table>';
        html += '</body></html>';
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const win = window.open(url, '_blank');
        if (win) {
          win.focus();
        }
      };
    }
  },

  
  openEditModal(id) {
    const isNew = !id;
    const item = isNew
      ? { type: this.activeTab, name: '', sku: '', cat: '', unit: 'pcs', price: 0, stock: 0 }
      : (App.Data.Products.find(p => p.id === id) || { type: this.activeTab, name: '', sku: '', cat: '', unit: 'pcs', price: 0, stock: 0 });

        
    const body = `
      <div class="grid" style="gap:8px;">
        <label class="field-label" for="inv-type">Type</label>
        <select id="inv-type" class="input">
          <option value="Devices" ${item.type === 'Devices' ? 'selected' : ''}>Devices</option>
          <option value="Consumables" ${item.type === 'Consumables' ? 'selected' : ''}>Consumables</option>
          <option value="Parts" ${item.type === 'Parts' ? 'selected' : ''}>Parts</option>
          <option value="Components" ${item.type === 'Components' ? 'selected' : ''}>Components</option>
        </select>
        <label class="field-label" for="inv-name">Name</label>
        <input id="inv-name" class="input" value="${item.name || ''}" />
        <label class="field-label" for="inv-sku">SKU</label>
        <input id="inv-sku" class="input" value="${item.sku || ''}" />
        <label class="field-label" for="inv-cat">Category</label>
        <input id="inv-cat" class="input" value="${item.cat || ''}" />
        <label class="field-label" for="inv-unit">Unit</label>
        <input id="inv-unit" class="input" value="${item.unit || ''}" />
        <label class="field-label" for="inv-price">Price</label>
        <input id="inv-price" type="number" step="0.01" class="input" value="${item.price || 0}" />
        <label class="field-label" for="inv-stock">Stock</label>
        <input id="inv-stock" type="number" class="input" value="${item.stock || 0}" />
      </div>
    `;

    App.UI.Modal.open(isNew ? 'Add Item' : 'Edit Item', body, [
      { text: 'Cancel', variant: 'ghost', onClick: () => {} },
      {
        text: 'Save',
        variant: 'primary',
        onClick: () => {
          const n = {
            id: isNew ? App.Utils.generateId('p') : item.id,
            type: document.getElementById('inv-type').value,
            name: document.getElementById('inv-name').value.trim(),
            sku: document.getElementById('inv-sku').value.trim(),
            cat: document.getElementById('inv-cat').value.trim(),
            unit: document.getElementById('inv-unit').value.trim() || 'pcs',
            price: parseFloat(document.getElementById('inv-price').value) || 0,
            stock: parseInt(document.getElementById('inv-stock').value, 10) || 0
          };
          if (isNew) {
            App.Data.Products.push(n);
          } else {
            const idx = App.Data.Products.findIndex(x => x.id === n.id);
            if (idx >= 0) App.Data.Products[idx] = n;
          }
          App.DB.save();
          App.UI.Toast.show('Item saved');
          this.activeTab = n.type;
          App.Core.Router.navigate('inventory');
        }
      }
    ]);
  },

  
  deleteItem(id) {
    const item = App.Data.Products.find(p => p.id === id);
    if (!item) return;
    App.UI.Modal.open('Delete Item', `Are you sure you want to delete <strong>${item.name}</strong>? This action cannot be undone.`, [
      { text: 'Cancel', variant: 'ghost', onClick: () => {} },
      {
        text: 'Delete',
        variant: 'primary',
        onClick: () => {
          App.Data.Products = App.Data.Products.filter(p => p.id !== id);
          App.DB.save();
          App.UI.Toast.show('Item deleted');
          App.Core.Router.navigate('inventory');
        }
      }
    ]);
  },

  
  receiveStock(id) {
    const item = App.Data.Products.find(p => p.id === id);
    if (!item) return;
    const body = `
      <div>
        <p style="margin-bottom:8px;">Add stock for <strong>${item.name}</strong>:</p>
        <input id="receive-qty" type="number" class="input" value="0" />
      </div>
    `;
    App.UI.Modal.open('Receive Stock', body, [
      { text: 'Cancel', variant: 'ghost', onClick: () => {} },
      {
        text: 'Add',
        variant: 'primary',
        onClick: () => {
          const qty = parseInt(document.getElementById('receive-qty').value, 10) || 0;
          item.stock = (item.stock || 0) + qty;
          App.DB.save();
          App.UI.Toast.show('Stock updated');
          App.Core.Router.navigate('inventory');
        }
      }
    ]);
  }
};