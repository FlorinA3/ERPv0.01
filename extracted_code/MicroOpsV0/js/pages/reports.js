// Reports & Master lists page
App.UI.Views.Reports = {
  render(root) {
    root.innerHTML = `
      <div class="card-soft">
        <h3 style="font-size:16px; font-weight:600; margin-bottom:16px;">${App.I18n.t('pages.reports.title','Reports & Master Lists')}</h3>
        
        <div class="grid grid-2">
          <div class="card" style="background: var(--color-bg); border: 1px solid var(--color-border);">
            <h4 style="font-weight:bold; margin-bottom:8px;">1. Orders Masterlist</h4>
            <p style="font-size:12px; color:var(--color-text-muted); margin-bottom:12px;">Complete log of all customer orders.</p>
            <button class="btn btn-primary" id="btn-rep-orders">Download CSV</button>
          </div>

          <div class="card" style="background: var(--color-bg); border: 1px solid var(--color-border);">
            <h4 style="font-weight:bold; margin-bottom:8px;">2. Delivery Log (Lieferscheine)</h4>
            <p style="font-size:12px; color:var(--color-text-muted); margin-bottom:12px;">Log of all generated delivery notes.</p>
            <button class="btn btn-primary" id="btn-rep-deliveries">Download CSV</button>
          </div>

          <div class="card" style="background: var(--color-bg); border: 1px solid var(--color-border);">
            <h4 style="font-weight:bold; margin-bottom:8px;">3. Production Summary</h4>
            <p style="font-size:12px; color:var(--color-text-muted); margin-bottom:12px;">Overview of completed production per product.</p>
            <button class="btn btn-primary" id="btn-rep-production">Download CSV</button>
          </div>

          <div class="card" style="background: var(--color-bg); border: 1px solid var(--color-border);">
            <h4 style="font-weight:bold; margin-bottom:8px;">4. Inventory Valuation</h4>
            <p style="font-size:12px; color:var(--color-text-muted); margin-bottom:12px;">Current stock value by product type.</p>
            <button class="btn btn-primary" id="btn-rep-inventory">Download CSV</button>
          </div>
        </div>
      </div>
    `;

    // Bind Events
    document.getElementById('btn-rep-orders').onclick = () => this.exportOrders();
    document.getElementById('btn-rep-deliveries').onclick = () => this.exportDeliveries();
    document.getElementById('btn-rep-production').onclick = () => this.exportProduction();
    document.getElementById('btn-rep-inventory').onclick = () => this.exportInventory();
  },

  exportCSV(filename, headers, rows) {
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    App.UI.Toast.show(`Exported ${filename}`);
  },

  exportOrders() {
    const headers = ['Date', 'Order ID', 'Customer', 'Status', 'Net', 'VAT', 'Gross'];
    const rows = (App.Data.orders || []).map(o => {
      const c = (App.Data.customers || []).find(cust => cust.id === o.custId);
      return [
        o.date.split('T')[0],
        o.orderId,
        c ? c.company : 'Unknown',
        o.status,
        (o.subtotalNet || 0).toFixed(2),
        (o.vatAmount || 0).toFixed(2),
        (o.totalGross || 0).toFixed(2)
      ];
    });
    this.exportCSV('orders_masterlist.csv', headers, rows);
  },

  exportDeliveries() {
    const headers = ['Date', 'Doc No', 'Customer', 'Ref Order', 'Item Count'];
    const rows = (App.Data.documents || [])
      .filter(d => d.type === 'delivery')
      .map(d => {
        const c = (App.Data.customers || []).find(cust => cust.id === d.customerId);
        return [
          d.date.split('T')[0],
          d.docNumber,
          c ? c.company : 'Unknown',
          d.ref || d.orderId,
          d.items ? d.items.length : 0
        ];
      });
    this.exportCSV('delivery_log.csv', headers, rows);
  },

  exportProduction() {
    const headers = ['Date', 'PO Number', 'Product', 'Quantity', 'Status'];
    const rows = (App.Data.productionOrders || []).map(p => {
      const prod = (App.Data.products || []).find(pr => pr.id === p.productId);
      return [
        (p.createdAt || '').split('T')[0],
        p.orderNumber,
        prod ? prod.nameDE || prod.name : p.productId,
        p.quantity,
        p.status
      ];
    });
    this.exportCSV('production_summary.csv', headers, rows);
  },

  exportInventory() {
    const headers = ['SKU', 'Name', 'Type', 'Stock', 'Avg Price', 'Total Value'];
    const rows = (App.Data.products || [])
      .filter(p => p.type !== 'Service')
      .map(p => {
        const stock = p.stock || 0;
        const price = p.avgPurchasePrice || 0;
        return [
          p.sku,
          p.nameDE || p.name,
          p.type,
          stock,
          price.toFixed(2),
          (stock * price).toFixed(2)
        ];
      });
    this.exportCSV('inventory_valuation.csv', headers, rows);
  }
};