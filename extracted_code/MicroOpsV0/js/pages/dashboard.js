App.UI.Views.Dashboard = {
  render(root) {
    const orders = App.Data.orders || [];
    const products = App.Data.products || [];
    const customers = App.Data.customers || [];
    const documents = App.Data.documents || [];
    const productionOrders = App.Data.productionOrders || [];

    const invoices = documents.filter(d => d.type === 'invoice');
    const totalRevenue = invoices.reduce((acc, d) => acc + (d.grossTotal || d.total || 0), 0);

    const now = new Date();
    const overdueInvoices = invoices.filter(d => {
      if ((d.paidAmount || 0) >= (d.grossTotal || 0)) return false;
      if (!d.dueDate) return false;
      return new Date(d.dueDate) < now;
    });
    const overdueAmount = overdueInvoices.reduce((sum, d) => sum + ((d.grossTotal || 0) - (d.paidAmount || 0)), 0);

    const unpaidInvoices = invoices.filter(d => (d.paidAmount || 0) < (d.grossTotal || 0));
    const unpaidAmount = unpaidInvoices.reduce((sum, d) => sum + ((d.grossTotal || 0) - (d.paidAmount || 0)), 0);

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
          <div style="font-size:12px; color:var(--color-text-muted); margin-top:4px;">From ${invoices.length} invoices</div>
        </div>
        <div class="card">
          <div style="font-size:11px; text-transform:uppercase; color:var(--color-text-muted); letter-spacing:0.08em;">Unpaid Invoices</div>
          <div style="font-size:24px; font-weight:700; margin-top:6px; ${unpaidAmount > 0 ? 'color:#f59e0b;' : ''}">${App.Utils.formatCurrency(unpaidAmount)}</div>
          <div style="font-size:12px; color:var(--color-text-muted); margin-top:4px;">${unpaidInvoices.length} invoices outstanding</div>
        </div>
        <div class="card" ${overdueInvoices.length > 0 ? 'style="border-left:3px solid #dc2626;"' : ''}>
          <div style="font-size:11px; text-transform:uppercase; color:var(--color-text-muted); letter-spacing:0.08em;">Overdue</div>
          <div style="font-size:24px; font-weight:700; margin-top:6px; ${overdueAmount > 0 ? 'color:#dc2626;' : ''}">${App.Utils.formatCurrency(overdueAmount)}</div>
          <div style="font-size:12px; color:var(--color-text-muted); margin-top:4px;">${overdueInvoices.length} invoices past due</div>
        </div>
        <div class="card">
          <div style="font-size:11px; text-transform:uppercase; color:var(--color-text-muted); letter-spacing:0.08em;">Open Orders</div>
          <div style="font-size:24px; font-weight:700; margin-top:6px; ${openOrders > 0 ? 'color:#3b82f6;' : ''}">${openOrders}</div>
          <div style="font-size:12px; color:var(--color-text-muted); margin-top:4px;">${pendingProduction} in production</div>
        </div>
      </div>

      ${overdueInvoices.length > 0 ? `
        <div class="card-soft" style="margin-top:16px; border-left:3px solid #dc2626;">
          <h4 style="font-size:14px; font-weight:600; margin-bottom:12px; color:#dc2626;">⚠️ Overdue Invoices</h4>
          <table class="table" style="font-size:13px;">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Due Date</th>
                <th style="text-align:right;">Amount</th>
                <th style="text-align:right;">Balance</th>
                <th style="text-align:center;">Days</th>
              </tr>
            </thead>
            <tbody>
              ${overdueInvoices.slice(0, 5).map(d => {
                const cust = customers.find(c => c.id === d.customerId);
                const balance = (d.grossTotal || 0) - (d.paidAmount || 0);
                const daysOverdue = Math.ceil((now - new Date(d.dueDate)) / (1000 * 60 * 60 * 24));
                return `
                  <tr>
                    <td><strong>${d.docNumber}</strong></td>
                    <td>${cust?.company || '-'}</td>
                    <td>${d.dueDate?.split('T')[0] || '-'}</td>
                    <td style="text-align:right;">${App.Utils.formatCurrency(d.grossTotal || 0)}</td>
                    <td style="text-align:right; color:#dc2626; font-weight:500;">${App.Utils.formatCurrency(balance)}</td>
                    <td style="text-align:center; color:#dc2626;">${daysOverdue}d</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          <button class="btn btn-ghost" style="width:100%; margin-top:8px;" onclick="App.Core.Router.navigate('documents')">View All Documents</button>
        </div>
      ` : ''}

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
                <th style="text-align:center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${recentDocs.map(d => {
                const cust = customers.find(c => c.id === d.customerId);
                const icon = d.type === 'invoice' ? '🧾' : '📦';
                let status = '';
                if (d.type === 'invoice') {
                  const paid = d.paidAmount || 0;
                  const total = d.grossTotal || 0;
                  if (paid >= total) {
                    status = '<span class="tag tag-success">Paid</span>';
                  } else if (d.dueDate && new Date(d.dueDate) < now) {
                    status = '<span class="tag" style="background:#fee2e2;color:#dc2626;">Overdue</span>';
                  } else if (paid > 0) {
                    status = '<span class="tag" style="background:#dbeafe;color:#1d4ed8;">Partial</span>';
                  } else {
                    status = '<span class="tag" style="background:#fef3c7;color:#d97706;">Open</span>';
                  }
                }
                return `
                  <tr>
                    <td>${icon} ${d.type}</td>
                    <td><strong>${d.docNumber || d.id}</strong></td>
                    <td>${cust?.company || '-'}</td>
                    <td>${d.date ? d.date.split('T')[0] : '-'}</td>
                    <td style="text-align:right;">${d.type === 'invoice' ? App.Utils.formatCurrency(d.grossTotal || 0) : '-'}</td>
                    <td style="text-align:center;">${status}</td>
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
