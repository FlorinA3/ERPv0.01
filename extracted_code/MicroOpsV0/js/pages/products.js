App.UI.Views.Products = {
  render(root) {
    const products = App.Data.Products || [];

    root.innerHTML = `
      <div class="card-soft">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 style="font-size:16px; font-weight:600;">Products</h3>
          <button class="btn btn-primary" id="btn-add-product">Add Product</button>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Name</th>
              <th>Category</th>
              <th style="text-align:right;">Price</th>
              <th style="text-align:right;">Stock</th>
              <th style="text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${products.map(p => `
              <tr>
                <td>${p.sku || '-'}</td>
                <td>${p.name || '-'}</td>
                <td>${p.cat || '-'}</td>
                <td style="text-align:right;">${App.Utils.formatCurrency(p.price)}</td>
                <td style="text-align:right;">${p.stock ?? '-'}</td>
                <td style="text-align:right;">
                  <button class="btn btn-ghost btn-edit-product" data-id="${p.id}">Edit</button>
                  <button class="btn btn-ghost btn-del-product" data-id="${p.id}">Delete</button>
                </td>
              </tr>
            `).join('')}
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

    root.querySelectorAll('.btn-del-product').forEach(btn => {
      btn.addEventListener('click', () => {
        this.deleteProduct(btn.getAttribute('data-id'));
      });
    });
  },

  openEditModal(id) {
    const isNew = !id;
    const p = isNew
      ? { name: '', sku: '', cat: '', price: 0, stock: 0 }
      : App.Data.Products.find(x => x.id === id) || { name: '', sku: '', cat: '', price: 0, stock: 0 };

    const body = `
      <div>
        <label class="field-label">Name</label>
        <input id="prod-name" class="input" value="${p.name || ''}" />
        <label class="field-label">SKU</label>
        <input id="prod-sku" class="input" value="${p.sku || ''}" />
        <label class="field-label">Category</label>
        <input id="prod-cat" class="input" value="${p.cat || ''}" />
        <label class="field-label">Price</label>
        <input id="prod-price" class="input" type="number" step="0.01" value="${p.price || 0}" />
        <label class="field-label">Stock</label>
        <input id="prod-stock" class="input" type="number" value="${p.stock || 0}" />
      </div>
    `;

    App.UI.Modal.open(isNew ? 'Add Product' : 'Edit Product', body, [
      { text: 'Cancel', variant: 'ghost', onClick: () => {} },
      {
        text: 'Save',
        variant: 'primary',
        onClick: () => {
          const n = {
            id: isNew ? App.Utils.generateId('p') : p.id,
            name: document.getElementById('prod-name').value.trim(),
            sku: document.getElementById('prod-sku').value.trim(),
            cat: document.getElementById('prod-cat').value.trim(),
            price: parseFloat(document.getElementById('prod-price').value) || 0,
            stock: parseInt(document.getElementById('prod-stock').value, 10) || 0
          };
          if (isNew) {
            App.Data.Products.push(n);
          } else {
            const idx = App.Data.Products.findIndex(x => x.id === n.id);
            if (idx >= 0) App.Data.Products[idx] = n;
          }
          App.DB.save();
          App.UI.Toast.show('Product saved');
          App.Core.Router.navigate('products');
        }
      }
    ]);
  },

  deleteProduct(id) {
    App.UI.Modal.open('Delete Product', 'Are you sure you want to delete this product?', [
      { text: 'Cancel', variant: 'ghost', onClick: () => {} },
      {
        text: 'Delete',
        variant: 'primary',
        onClick: () => {
          App.Data.Products = App.Data.Products.filter(p => p.id !== id);
          App.DB.save();
          App.UI.Toast.show('Product deleted');
          App.Core.Router.navigate('products');
        }
      }
    ]);
  }
};
