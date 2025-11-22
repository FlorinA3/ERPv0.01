App.UI.Views.Dashboard = {
  render(root) {
    const orders = App.Data.orders || [];
    const products = App.Data.products || [];
    const components = App.Data.components || [];
    const customers = App.Data.customers || [];
    const documents = App.Data.documents || [];
    const productionOrders = App.Data.productionOrders || [];
    const tasks = App.Data.tasks || [];
    const purchaseOrders = App.Data.purchaseOrders || [];

    const invoices = documents.filter(d => d.type === 'invoice');
    const totalRevenue = invoices.reduce((acc, d) => acc + (d.grossTotal || d.total || 0), 0);
    const collectedAmount = invoices.reduce((acc, d) => acc + (d.paidAmount || 0), 0);

    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    // Monthly revenue
    const monthlyRevenue = invoices
      .filter(d => {
        const date = new Date(d.date);
        return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
      })
      .reduce((sum, d) => sum + (d.grossTotal || 0), 0);

    // Overdue invoices
    const overdueInvoices = invoices.filter(d => {
      if ((d.paidAmount || 0) >= (d.grossTotal || 0)) return false;
      if (!d.dueDate) return false;
      return new Date(d.dueDate) < now;
    });
    const overdueAmount = overdueInvoices.reduce((sum, d) => sum + ((d.grossTotal || 0) - (d.paidAmount || 0)), 0);

    // Unpaid invoices
    const unpaidInvoices = invoices.filter(d => (d.paidAmount || 0) < (d.grossTotal || 0));
    const unpaidAmount = unpaidInvoices.reduce((sum, d) => sum + ((d.grossTotal || 0) - (d.paidAmount || 0)), 0);

    // Orders stats
    const openOrders = orders.filter(o => !['paid', 'cancelled', 'delivered'].includes((o.status || '').toLowerCase())).length;
    const shippedOrders = orders.filter(o => o.status?.toLowerCase() === 'shipped').length;

    // Production stats
    const pendingProduction = productionOrders.filter(po => po.status !== 'completed' && po.status !== 'cancelled').length;
    const inProgressProduction = productionOrders.filter(po => po.status === 'in_progress').length;

    // Inventory stats
    const lowStockProducts = products.filter(p => p.type !== 'Service' && (p.stock || 0) <= (p.minStock || 0) && (p.stock || 0) > 0);
    const lowStockComponents = components.filter(c => (c.stock || 0) <= (c.safetyStock || 0) && (c.stock || 0) > 0);
    const outOfStockProducts = products.filter(p => p.type !== 'Service' && (p.stock || 0) <= 0);
    const outOfStockComponents = components.filter(c => (c.stock || 0) <= 0);

    // Tasks stats
    const overdueTasks = tasks.filter(t => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < now);
    const todayTasks = tasks.filter(t => {
      if (t.status === 'done') return false;
      if (!t.dueDate) return false;
      const due = new Date(t.dueDate);
      return due.toDateString() === now.toDateString();
    });

    // Purchase orders awaiting
    const awaitingPOs = purchaseOrders.filter(po => ['sent', 'confirmed'].includes(po.status?.toLowerCase())).length;

    // New customers this month
    const newCustomers = customers.filter(c => {
      if (!c.createdAt) return false;
      const date = new Date(c.createdAt);
      return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    }).length;

    // Recent orders
    const recentOrders = [...orders]
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .slice(0, 5);

    // Calculate collection rate
    const collectionRate = totalRevenue > 0 ? Math.round((collectedAmount / totalRevenue) * 100) : 100;

    root.innerHTML = `
      <div class="card-soft" style="margin-bottom:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 style="font-size:16px; font-weight:600;">Dashboard Overview</h3>
          <div style="font-size:12px; color:var(--color-text-muted);">
            Press <kbd style="background:var(--color-bg); padding:2px 6px; border-radius:4px; border:1px solid var(--color-border);">F1</kbd> for shortcuts
          </div>
        </div>

        <!-- Primary KPIs -->
        <div class="grid grid-4" style="margin-bottom:16px;">
          <div style="padding:16px; background:var(--color-bg); border-radius:8px; text-align:center;">
            <div style="font-size:11px; text-transform:uppercase; color:var(--color-text-muted); letter-spacing:0.05em;">Total Revenue</div>
            <div style="font-size:24px; font-weight:700; margin-top:6px;">${App.Utils.formatCurrency(totalRevenue)}</div>
            <div style="font-size:12px; color:var(--color-text-muted); margin-top:4px;">${invoices.length} invoices</div>
          </div>
          <div style="padding:16px; background:var(--color-bg); border-radius:8px; text-align:center;">
            <div style="font-size:11px; text-transform:uppercase; color:var(--color-text-muted); letter-spacing:0.05em;">This Month</div>
            <div style="font-size:24px; font-weight:700; margin-top:6px; color:#10b981;">${App.Utils.formatCurrency(monthlyRevenue)}</div>
            <div style="font-size:12px; color:var(--color-text-muted); margin-top:4px;">Collection: ${collectionRate}%</div>
          </div>
          <div style="padding:16px; background:var(--color-bg); border-radius:8px; text-align:center; ${unpaidAmount > 0 ? 'border-left:3px solid #f59e0b;' : ''}">
            <div style="font-size:11px; text-transform:uppercase; color:var(--color-text-muted); letter-spacing:0.05em;">Outstanding</div>
            <div style="font-size:24px; font-weight:700; margin-top:6px; ${unpaidAmount > 0 ? 'color:#f59e0b;' : ''}">${App.Utils.formatCurrency(unpaidAmount)}</div>
            <div style="font-size:12px; color:var(--color-text-muted); margin-top:4px;">${unpaidInvoices.length} unpaid</div>
          </div>
          <div style="padding:16px; background:var(--color-bg); border-radius:8px; text-align:center; ${overdueAmount > 0 ? 'border-left:3px solid #dc2626;' : ''}">
            <div style="font-size:11px; text-transform:uppercase; color:var(--color-text-muted); letter-spacing:0.05em;">Overdue</div>
            <div style="font-size:24px; font-weight:700; margin-top:6px; ${overdueAmount > 0 ? 'color:#dc2626;' : ''}">${App.Utils.formatCurrency(overdueAmount)}</div>
            <div style="font-size:12px; color:var(--color-text-muted); margin-top:4px;">${overdueInvoices.length} overdue</div>
          </div>
        </div>

        <!-- Secondary KPIs -->
        <div class="grid grid-6" style="gap:8px;">
          <div style="padding:12px; background:var(--color-bg); border-radius:6px; text-align:center; cursor:pointer;" onclick="App.Core.Router.navigate('orders')">
            <div style="font-size:10px; text-transform:uppercase; color:var(--color-text-muted);">Open Orders</div>
            <div style="font-size:18px; font-weight:600; margin-top:4px; ${openOrders > 0 ? 'color:#3b82f6;' : ''}">${openOrders}</div>
          </div>
          <div style="padding:12px; background:var(--color-bg); border-radius:6px; text-align:center; cursor:pointer;" onclick="App.Core.Router.navigate('orders')">
            <div style="font-size:10px; text-transform:uppercase; color:var(--color-text-muted);">Shipped</div>
            <div style="font-size:18px; font-weight:600; margin-top:4px; ${shippedOrders > 0 ? 'color:#4f46e5;' : ''}">${shippedOrders}</div>
          </div>
          <div style="padding:12px; background:var(--color-bg); border-radius:6px; text-align:center; cursor:pointer;" onclick="App.Core.Router.navigate('production')">
            <div style="font-size:10px; text-transform:uppercase; color:var(--color-text-muted);">Production</div>
            <div style="font-size:18px; font-weight:600; margin-top:4px; ${inProgressProduction > 0 ? 'color:#8b5cf6;' : ''}">${pendingProduction}</div>
          </div>
          <div style="padding:12px; background:var(--color-bg); border-radius:6px; text-align:center; cursor:pointer;" onclick="App.Core.Router.navigate('purchaseOrders')">
            <div style="font-size:10px; text-transform:uppercase; color:var(--color-text-muted);">Awaiting POs</div>
            <div style="font-size:18px; font-weight:600; margin-top:4px; ${awaitingPOs > 0 ? 'color:#06b6d4;' : ''}">${awaitingPOs}</div>
          </div>
          <div style="padding:12px; background:var(--color-bg); border-radius:6px; text-align:center; cursor:pointer;" onclick="App.Core.Router.navigate('customers')">
            <div style="font-size:10px; text-transform:uppercase; color:var(--color-text-muted);">New Customers</div>
            <div style="font-size:18px; font-weight:600; margin-top:4px; ${newCustomers > 0 ? 'color:#10b981;' : ''}">${newCustomers}</div>
          </div>
          <div style="padding:12px; background:var(--color-bg); border-radius:6px; text-align:center; cursor:pointer;" onclick="App.Core.Router.navigate('tasks')">
            <div style="font-size:10px; text-transform:uppercase; color:var(--color-text-muted);">Tasks Due</div>
            <div style="font-size:18px; font-weight:600; margin-top:4px; ${overdueTasks.length > 0 ? 'color:#dc2626;' : ''}">${todayTasks.length + overdueTasks.length}</div>
          </div>
        </div>
      </div>

      <!-- Alerts Section -->
      ${this._renderAlerts(overdueInvoices, overdueTasks, outOfStockProducts, outOfStockComponents, customers)}

      <!-- Quick Actions -->
      <div class="card-soft" style="margin-bottom:16px;">
        <h4 style="font-size:14px; font-weight:600; margin-bottom:12px;">Quick Actions</h4>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button class="btn btn-primary" onclick="App.UI.Views.Orders.openCreateModal()">+ New Order</button>
          <button class="btn btn-ghost" onclick="App.UI.Views.Customers.openModal()">+ New Customer</button>
          <button class="btn btn-ghost" onclick="App.Core.Router.navigate('inventory')">Check Inventory</button>
          <button class="btn btn-ghost" onclick="App.Core.Router.navigate('reports')">View Reports</button>
          <button class="btn btn-ghost" onclick="App.Core.Router.navigate('purchaseOrders')">Create PO</button>
        </div>
      </div>

      <div class="grid grid-2" style="gap:16px;">
        <!-- Recent Orders -->
        <div class="card-soft">
          <h4 style="font-size:14px; font-weight:600; margin-bottom:12px;">Recent Orders</h4>
          ${recentOrders.length > 0 ? `
            <div style="display:flex; flex-direction:column; gap:8px;">
              ${recentOrders.map(o => {
                const cust = customers.find(c => c.id === o.custId);
                const statusColors = {
                  draft: '#6b7280', confirmed: '#3b82f6', processing: '#f59e0b',
                  shipped: '#4f46e5', delivered: '#10b981', paid: '#16a34a', cancelled: '#dc2626'
                };
                const color = statusColors[(o.status || 'draft').toLowerCase()] || '#6b7280';
                return `
                  <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:var(--color-bg); border-radius:6px; border-left:3px solid ${color};">
                    <div>
                      <strong>${o.orderId || o.id}</strong>
                      <span style="font-size:12px; color:var(--color-text-muted); margin-left:8px;">${cust?.company || '-'}</span>
                    </div>
                    <div style="text-align:right;">
                      <div style="font-weight:500;">${App.Utils.formatCurrency(o.totalGross || 0)}</div>
                      <div style="font-size:11px; color:${color};">${o.status || 'draft'}</div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          ` : '<p style="text-align:center; color:var(--color-text-muted); font-size:13px; padding:20px;">No orders yet</p>'}
          <button class="btn btn-ghost" style="width:100%; margin-top:12px;" onclick="App.Core.Router.navigate('orders')">View All Orders</button>
        </div>

        <!-- Inventory Alerts -->
        <div class="card-soft">
          <h4 style="font-size:14px; font-weight:600; margin-bottom:12px;">Inventory Status</h4>
          ${this._renderInventoryStatus(lowStockProducts, lowStockComponents, outOfStockProducts, outOfStockComponents)}
          <button class="btn btn-ghost" style="width:100%; margin-top:12px;" onclick="App.Core.Router.navigate('inventory')">View Inventory</button>
        </div>
      </div>

      <!-- Sales Chart -->
      <div class="card-soft" style="margin-top:16px;">
        <h4 style="font-size:14px; font-weight:600; margin-bottom:12px;">Monthly Sales Trend</h4>
        <div id="dashboard-chart"></div>
      </div>
    `;

    // Render chart
    this._renderSalesChart(invoices);
  },

  _renderAlerts(overdueInvoices, overdueTasks, outOfStockProducts, outOfStockComponents, customers) {
    const alerts = [];

    // Backup reminder check
    const config = App.Data.config || {};
    const lastBackupAt = config.lastBackupAt;
    const backupReminderDays = config.backupReminderDays || 7;

    if (lastBackupAt) {
      const daysSinceBackup = Math.floor((Date.now() - new Date(lastBackupAt).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceBackup >= backupReminderDays) {
        alerts.push({
          type: 'warning',
          icon: '💾',
          message: `Last backup was ${daysSinceBackup} days ago - consider backing up your data`,
          action: "App.Core.Router.navigate('settings')"
        });
      }
    } else {
      // No backup ever made
      alerts.push({
        type: 'warning',
        icon: '💾',
        message: 'No backup found - please backup your data',
        action: "App.Core.Router.navigate('settings')"
      });
    }

    if (overdueInvoices.length > 0) {
      alerts.push({
        type: 'error',
        icon: '⚠️',
        message: `${overdueInvoices.length} overdue invoice${overdueInvoices.length > 1 ? 's' : ''} need attention`,
        action: "App.Core.Router.navigate('documents')"
      });
    }

    if (overdueTasks.length > 0) {
      alerts.push({
        type: 'warning',
        icon: '📋',
        message: `${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}`,
        action: "App.Core.Router.navigate('tasks')"
      });
    }

    const totalOutOfStock = outOfStockProducts.length + outOfStockComponents.length;
    if (totalOutOfStock > 0) {
      alerts.push({
        type: 'error',
        icon: '📦',
        message: `${totalOutOfStock} item${totalOutOfStock > 1 ? 's' : ''} out of stock`,
        action: "App.Core.Router.navigate('inventory')"
      });
    }

    if (alerts.length === 0) return '';

    return `
      <div class="card-soft" style="margin-bottom:16px; padding:12px;">
        ${alerts.map(a => {
          const bgColor = a.type === 'error' ? '#fef2f2' : '#fffbeb';
          const borderColor = a.type === 'error' ? '#dc2626' : '#f59e0b';
          return `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:${bgColor}; border-left:3px solid ${borderColor}; border-radius:4px; margin-bottom:8px; cursor:pointer;" onclick="${a.action}">
              <span>${a.icon} ${a.message}</span>
              <span style="font-size:12px; color:var(--color-text-muted);">View →</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  _renderInventoryStatus(lowStockProducts, lowStockComponents, outOfStockProducts, outOfStockComponents) {
    const items = [
      ...outOfStockProducts.slice(0, 3).map(p => ({
        name: p.internalArticleNumber || p.sku || p.nameDE,
        stock: 0,
        min: p.minStock || 0,
        type: 'Out of Stock',
        color: '#dc2626'
      })),
      ...outOfStockComponents.slice(0, 2).map(c => ({
        name: c.componentNumber || c.description,
        stock: 0,
        min: c.safetyStock || 0,
        type: 'Out of Stock',
        color: '#dc2626'
      })),
      ...lowStockProducts.slice(0, 3).map(p => ({
        name: p.internalArticleNumber || p.sku || p.nameDE,
        stock: p.stock || 0,
        min: p.minStock || 0,
        type: 'Low Stock',
        color: '#f59e0b'
      })),
      ...lowStockComponents.slice(0, 2).map(c => ({
        name: c.componentNumber || c.description,
        stock: c.stock || 0,
        min: c.safetyStock || 0,
        type: 'Low Stock',
        color: '#f59e0b'
      }))
    ].slice(0, 5);

    if (items.length === 0) {
      return '<p style="text-align:center; color:#10b981; font-size:13px; padding:20px;">✓ All stock levels OK</p>';
    }

    return `
      <div style="display:flex; flex-direction:column; gap:8px;">
        ${items.map(item => `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:8px; background:var(--color-bg); border-radius:6px; border-left:3px solid ${item.color};">
            <div>
              <strong style="font-size:12px;">${item.name}</strong>
              <div style="font-size:11px; color:${item.color};">${item.type}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-weight:500; color:${item.color};">${item.stock}</div>
              <div style="font-size:10px; color:var(--color-text-muted);">min: ${item.min}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  _renderSalesChart(invoices) {
    const container = document.getElementById('dashboard-chart');
    if (!container) return;

    // Get last 6 months of data
    const monthlyData = {};
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[key] = 0;
    }

    invoices.forEach(inv => {
      const date = new Date(inv.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData[key] !== undefined) {
        monthlyData[key] += inv.grossTotal || 0;
      }
    });

    const months = Object.keys(monthlyData);
    const values = Object.values(monthlyData);
    const maxValue = Math.max(...values, 1);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    container.innerHTML = `
      <div style="display:flex; align-items:flex-end; gap:12px; height:150px; padding:10px 0;">
        ${months.map((month, i) => {
          const value = values[i];
          const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
          const monthNum = parseInt(month.split('-')[1]) - 1;
          const isCurrentMonth = i === months.length - 1;
          return `
            <div style="flex:1; display:flex; flex-direction:column; align-items:center;">
              <div style="font-size:10px; color:var(--color-text-muted); margin-bottom:4px;">${App.Utils.formatCurrency(value).replace(/[^\d.,]/g, '')}</div>
              <div style="width:100%; height:${Math.max(height, 4)}%; background:${isCurrentMonth ? '#3b82f6' : '#e5e7eb'}; border-radius:4px; min-height:4px;"></div>
              <div style="font-size:11px; color:var(--color-text-muted); margin-top:8px;">${monthNames[monthNum]}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
};
