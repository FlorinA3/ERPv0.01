App.UI.Views.Dashboard = {
  render(root) {
    const orders = App.Data.orders || [];
    const products = App.Data.products || App.Data.Products || [];
    const customers = App.Data.customers || [];
    const documents = App.Data.documents || [];
    const productionOrders = App.Data.productionOrders || [];

    const totalRevenue = documents
      .filter(d => d.type === 'invoice')
      .reduce((acc, d) => acc + (d.grossTotal || d.total || 0), 0);

    const openOrders = orders.filter(o => !['paid', 'cancelled'].includes((o.status || '').toLowerCase())).length;
    const pendingProduction = productionOrders.filter(po => po.status !== 'completed').length;

    const lowStockItems = products
      .filter(p => p.type !== 'Service' && (p.stock || 0) <= (p.minStock || 5))
      .slice(0, 5);

    const recentOrders = [...orders]
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .slice(0, 5);

    const recentDocs = [...documents]
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .slice(0, 5);

    root.innerHTML = `
      <div class="grid grid-4">
        <div class="card">
          <div style="font-size:11px; text-transform:uppercase; color:var(--color-text-muted); letter-spacing:0.08em;">${App.I18n.t('dashboard.total','Total Revenue')}</div>
          <div style="font-size:24px; font-weight:700; margin-top:6px;">${App.Utils.formatCurrency(totalRevenue)}</div>
          <div style="font-size:12px; color:var(--color-text-muted); margin-top:4px;">From ${documents.filter(d => d.type === 'invoice').length} invoices</div>
        </div>
        <div class="card">
          <div style="font-size:11px; text-transform:uppercase; color:var(--color-text-muted); letter-spacing:0.08em;">Open Orders</div>
          <div style="font-size:24px; font-weight:700; margin-top:6px; ${openOrders > 0 ? 'color:#3b82f6;' : ''}">${openOrders}</div>
          <div style="font-size:12px; color:var(--color-text-muted); margin-top:4px;">Awaiting fulfillment</div>
        </div>
        <div class="card">
          <div style="font-size:11px; text-transform:uppercase; color:var(--color-text-muted); letter-spacing:0.08em;">Production</div>
          <div style="font-size:24px; font-weight:700; margin-top:6px; ${pendingProduction > 0 ? 'color:#f59e0b;' : ''}">${pendingProduction}</div>
          <div style="font-size:12px; color:var(--color-text-muted); margin-top:4px;">Pending orders</div>
        </div>
        <div class="card">
          <div style="font-size:11px; text-transform:uppercase; color:var(--color-text-muted); letter-spacing:0.08em;">${App.I18n.t('dashboard.customers','Customers')}</div>
          <div style="font-size:24px; font-weight:700; margin-top:6px;">${customers.length}</div>
          <div style="font-size:12px; color:var(--color-text-muted); margin-top:4px;">${products.length} products</div>
        </div>
      </div>

      <div class="grid grid-2" style="margin-top:16px;">
        <div class="card-soft">
          <h4 style="font-size:14px; font-weight:600; margin-bottom:12px;">Recent Orders</h4>
          ${recentOrders.length > 0 ? `
            <div style="display:flex; flex-direction:column; gap:8px;">
              ${recentOrders.map(o => {
                const cust = customers.find(c => c.id === o.custId);
                return `
                  <div style="display:flex; justify-content:space-between; align-items:center; padding:8px; background:var(--color-bg); border-radius:6px;">
                    <div>
                      <strong>${o.orderId || o.id}</strong>
                      <span style="font-size:12px; color:var(--color-text-muted); margin-left:8px;">${cust?.company || '-'}</span>
                    </div>
                    <div style="text-align:right;">
                      <div style="font-weight:500;">${App.Utils.formatCurrency(o.totalGross || 0)}</div>
                      <div style="font-size:11px; color:var(--color-text-muted);">${o.date ? o.date.split('T')[0] : '-'}</div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          ` : '<p style="text-align:center; color:var(--color-text-muted); font-size:13px;">No orders yet</p>'}
          <button class="btn btn-ghost" style="width:100%; margin-top:8px;" onclick="App.Core.Router.navigate('orders')">View All Orders</button>
        </div>

        <div class="card-soft">
          <h4 style="font-size:14px; font-weight:600; margin-bottom:12px;">Low Stock Alerts</h4>
          ${lowStockItems.length > 0 ? `
            <div style="display:flex; flex-direction:column; gap:8px;">
              ${lowStockItems.map(p => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:8px; background:var(--color-bg); border-radius:6px;">
                  <div>
                    <strong>${p.internalArticleNumber || p.sku || '-'}</strong>
                    <span style="font-size:12px; color:var(--color-text-muted); margin-left:8px;">${p.nameDE || p.name || '-'}</span>
                  </div>
                  <div style="text-align:right;">
                    <div style="font-weight:500; color:#f87171;">${p.stock || 0} ${p.unit || 'Stk'}</div>
                    <div style="font-size:11px; color:var(--color-text-muted);">Min: ${p.minStock || 0}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : '<p style="text-align:center; color:var(--color-text-muted); font-size:13px;">All stock levels OK</p>'}
          <button class="btn btn-ghost" style="width:100%; margin-top:8px;" onclick="App.Core.Router.navigate('inventory')">View Inventory</button>
        </div>
      </div>

      <div class="card-soft" style="margin-top:16px;">
        <h4 style="font-size:14px; font-weight:600; margin-bottom:12px;">Recent Documents</h4>
        ${recentDocs.length > 0 ? `
          <table class="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Number</th>
                <th>Customer</th>
                <th>Date</th>
                <th style="text-align:right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${recentDocs.map(d => {
                const cust = customers.find(c => c.id === d.customerId);
                const icon = d.type === 'invoice' ? '🧾' : '📦';
                return `
                  <tr>
                    <td>${icon} ${d.type}</td>
                    <td><strong>${d.docNumber || d.id}</strong></td>
                    <td>${cust?.company || '-'}</td>
                    <td>${d.date ? d.date.split('T')[0] : '-'}</td>
                    <td style="text-align:right;">${d.type === 'invoice' ? App.Utils.formatCurrency(d.grossTotal || 0) : '-'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        ` : '<p style="text-align:center; color:var(--color-text-muted); font-size:13px;">No documents yet</p>'}
      </div>
    `;
  }
};
