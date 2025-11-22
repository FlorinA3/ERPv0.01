App.UI.Views.Dashboard = {
  render(root) {
    const t = (key, fallback) => App.I18n.t(`dashboard.${key}`, fallback);
    const esc = App.Utils.escapeHtml;

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
          <h3 style="font-size:16px; font-weight:600;">${t('overview', 'Dashboard Overview')}</h3>
          <div style="font-size:12px; color:var(--color-text-muted);">
            <kbd style="background:var(--color-bg); padding:2px 6px; border-radius:4px; border:1px solid var(--color-border);">F1</kbd> ${t('pressF1', 'for shortcuts')}
          </div>
        </div>

        <!-- Primary KPIs -->
        <div class="grid grid-4" style="margin-bottom:16px;" role="group" aria-label="${t('overview', 'Dashboard Overview')}">
          <div style="padding:16px; background:var(--color-bg); border-radius:8px; text-align:center;" role="status" aria-label="${t('totalRevenue', 'Total Revenue')}">
            <div style="font-size:11px; text-transform:uppercase; color:var(--color-text-muted); letter-spacing:0.05em;">${t('totalRevenue', 'Total Revenue')}</div>
            <div style="font-size:24px; font-weight:700; margin-top:6px;">${App.Utils.formatCurrency(totalRevenue)}</div>
            <div style="font-size:12px; color:var(--color-text-muted); margin-top:4px;">${invoices.length} ${t('invoices', 'invoices')}</div>
          </div>
          <div style="padding:16px; background:var(--color-bg); border-radius:8px; text-align:center;" role="status" aria-label="${t('thisMonth', 'This Month')}">
            <div style="font-size:11px; text-transform:uppercase; color:var(--color-text-muted); letter-spacing:0.05em;">${t('thisMonth', 'This Month')}</div>
            <div style="font-size:24px; font-weight:700; margin-top:6px; color:#10b981;">${App.Utils.formatCurrency(monthlyRevenue)}</div>
            <div style="font-size:12px; color:var(--color-text-muted); margin-top:4px;">${t('collection', 'Collection')}: ${collectionRate}%</div>
          </div>
          <div style="padding:16px; background:var(--color-bg); border-radius:8px; text-align:center; ${unpaidAmount > 0 ? 'border-left:3px solid #f59e0b;' : ''}" role="status" aria-label="${t('outstanding', 'Outstanding')}">
            <div style="font-size:11px; text-transform:uppercase; color:var(--color-text-muted); letter-spacing:0.05em;">${t('outstanding', 'Outstanding')}</div>
            <div style="font-size:24px; font-weight:700; margin-top:6px; ${unpaidAmount > 0 ? 'color:#f59e0b;' : ''}">${App.Utils.formatCurrency(unpaidAmount)}</div>
            <div style="font-size:12px; color:var(--color-text-muted); margin-top:4px;">${unpaidInvoices.length} ${t('unpaid', 'unpaid')}</div>
          </div>
          <div style="padding:16px; background:var(--color-bg); border-radius:8px; text-align:center; ${overdueAmount > 0 ? 'border-left:3px solid #dc2626;' : ''}" role="status" aria-label="${t('overdue', 'Overdue')}">
            <div style="font-size:11px; text-transform:uppercase; color:var(--color-text-muted); letter-spacing:0.05em;">${t('overdue', 'Overdue')}</div>
            <div style="font-size:24px; font-weight:700; margin-top:6px; ${overdueAmount > 0 ? 'color:#dc2626;' : ''}">${App.Utils.formatCurrency(overdueAmount)}</div>
            <div style="font-size:12px; color:var(--color-text-muted); margin-top:4px;">${overdueInvoices.length} ${t('overdueLabel', 'overdue')}</div>
          </div>
        </div>

        <!-- Secondary KPIs -->
        <div class="grid grid-6" style="gap:8px;" role="group" aria-label="Secondary KPIs">
          <button style="padding:12px; background:var(--color-bg); border-radius:6px; text-align:center; cursor:pointer; border:none; width:100%;" onclick="App.Core.Router.navigate('orders')" aria-label="${t('openOrders', 'Open Orders')}: ${openOrders}">
            <div style="font-size:10px; text-transform:uppercase; color:var(--color-text-muted);">${t('openOrders', 'Open Orders')}</div>
            <div style="font-size:18px; font-weight:600; margin-top:4px; ${openOrders > 0 ? 'color:#3b82f6;' : ''}">${openOrders}</div>
          </button>
          <button style="padding:12px; background:var(--color-bg); border-radius:6px; text-align:center; cursor:pointer; border:none; width:100%;" onclick="App.Core.Router.navigate('orders')" aria-label="${t('shipped', 'Shipped')}: ${shippedOrders}">
            <div style="font-size:10px; text-transform:uppercase; color:var(--color-text-muted);">${t('shipped', 'Shipped')}</div>
            <div style="font-size:18px; font-weight:600; margin-top:4px; ${shippedOrders > 0 ? 'color:#4f46e5;' : ''}">${shippedOrders}</div>
          </button>
          <button style="padding:12px; background:var(--color-bg); border-radius:6px; text-align:center; cursor:pointer; border:none; width:100%;" onclick="App.Core.Router.navigate('production')" aria-label="${t('production', 'Production')}: ${pendingProduction}">
            <div style="font-size:10px; text-transform:uppercase; color:var(--color-text-muted);">${t('production', 'Production')}</div>
            <div style="font-size:18px; font-weight:600; margin-top:4px; ${inProgressProduction > 0 ? 'color:#8b5cf6;' : ''}">${pendingProduction}</div>
          </button>
          <button style="padding:12px; background:var(--color-bg); border-radius:6px; text-align:center; cursor:pointer; border:none; width:100%;" onclick="App.Core.Router.navigate('purchaseOrders')" aria-label="${t('awaitingPOs', 'Awaiting POs')}: ${awaitingPOs}">
            <div style="font-size:10px; text-transform:uppercase; color:var(--color-text-muted);">${t('awaitingPOs', 'Awaiting POs')}</div>
            <div style="font-size:18px; font-weight:600; margin-top:4px; ${awaitingPOs > 0 ? 'color:#06b6d4;' : ''}">${awaitingPOs}</div>
          </button>
          <button style="padding:12px; background:var(--color-bg); border-radius:6px; text-align:center; cursor:pointer; border:none; width:100%;" onclick="App.Core.Router.navigate('customers')" aria-label="${t('newCustomers', 'New Customers')}: ${newCustomers}">
            <div style="font-size:10px; text-transform:uppercase; color:var(--color-text-muted);">${t('newCustomers', 'New Customers')}</div>
            <div style="font-size:18px; font-weight:600; margin-top:4px; ${newCustomers > 0 ? 'color:#10b981;' : ''}">${newCustomers}</div>
          </button>
          <button style="padding:12px; background:var(--color-bg); border-radius:6px; text-align:center; cursor:pointer; border:none; width:100%;" onclick="App.Core.Router.navigate('tasks')" aria-label="${t('tasksDue', 'Tasks Due')}: ${todayTasks.length + overdueTasks.length}">
            <div style="font-size:10px; text-transform:uppercase; color:var(--color-text-muted);">${t('tasksDue', 'Tasks Due')}</div>
            <div style="font-size:18px; font-weight:600; margin-top:4px; ${overdueTasks.length > 0 ? 'color:#dc2626;' : ''}">${todayTasks.length + overdueTasks.length}</div>
          </button>
        </div>
      </div>

      <!-- Alerts Section -->
      ${this._renderAlerts(overdueInvoices, overdueTasks, outOfStockProducts, outOfStockComponents, customers)}

      <!-- Quick Actions -->
      <div class="card-soft" style="margin-bottom:16px;">
        <h4 style="font-size:14px; font-weight:600; margin-bottom:12px;">${t('quickActions', 'Quick Actions')}</h4>
        <div style="display:flex; gap:8px; flex-wrap:wrap;" role="group" aria-label="${t('quickActions', 'Quick Actions')}">
          <button class="btn btn-primary" onclick="App.UI.Views.Orders.openCreateModal()" title="${t('newOrder', '+ New Order')}">${t('newOrder', '+ New Order')}</button>
          <button class="btn btn-ghost" onclick="App.UI.Views.Production.openCreateModal()" title="${t('newProductionOrder', '+ New Production Order')}">${t('newProductionOrder', '+ New Production Order')}</button>
          <button class="btn btn-ghost" onclick="App.UI.Views.Customers.openEditModal()" title="${t('newCustomer', '+ New Customer')}">${t('newCustomer', '+ New Customer')}</button>
          <button class="btn btn-ghost" onclick="App.Core.Router.navigate('tasks')" title="${t('openTasks', 'Open Tasks')}">${t('openTasks', 'Open Tasks')}</button>
          <button class="btn btn-ghost" onclick="App.Core.Router.navigate('inventory')" title="${t('checkInventory', 'Check Inventory')}">${t('checkInventory', 'Check Inventory')}</button>
          <button class="btn btn-ghost" onclick="App.Core.Router.navigate('reports')" title="${t('viewReports', 'View Reports')}">${t('viewReports', 'View Reports')}</button>
          <button class="btn btn-ghost" onclick="App.Core.Router.navigate('purchaseOrders')" title="${t('createPO', 'Create PO')}">${t('createPO', 'Create PO')}</button>
        </div>
      </div>

      <div class="grid grid-2" style="gap:16px;">
        <!-- Recent Orders -->
        <div class="card-soft">
          <h4 style="font-size:14px; font-weight:600; margin-bottom:12px;">${t('recentOrders', 'Recent Orders')}</h4>
          ${recentOrders.length > 0 ? `
            <div style="display:flex; flex-direction:column; gap:8px;" role="list" aria-label="${t('recentOrders', 'Recent Orders')}">
              ${recentOrders.map(o => {
                const cust = customers.find(c => c.id === o.custId);
                const statusColors = {
                  draft: '#6b7280', confirmed: '#3b82f6', processing: '#f59e0b',
                  shipped: '#4f46e5', delivered: '#10b981', paid: '#16a34a', cancelled: '#dc2626'
                };
                const color = statusColors[(o.status || 'draft').toLowerCase()] || '#6b7280';
                return `
                  <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:var(--color-bg); border-radius:6px; border-left:3px solid ${color};" role="listitem">
                    <div>
                      <strong>${esc(o.orderId || o.id)}</strong>
                      <span style="font-size:12px; color:var(--color-text-muted); margin-left:8px;">${esc(cust?.company || '-')}</span>
                    </div>
                    <div style="text-align:right;">
                      <div style="font-weight:500;">${App.Utils.formatCurrency(o.totalGross || 0)}</div>
                      <div style="font-size:11px; color:${color};">${esc(o.status || 'draft')}</div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          ` : `<p style="text-align:center; color:var(--color-text-muted); font-size:13px; padding:20px;">${t('noOrdersYet', 'No orders yet')}</p>`}
          <button class="btn btn-ghost" style="width:100%; margin-top:12px;" onclick="App.Core.Router.navigate('orders')">${t('viewAllOrders', 'View All Orders')}</button>
        </div>

        <!-- Inventory Alerts -->
        <div class="card-soft">
          <h4 style="font-size:14px; font-weight:600; margin-bottom:12px;">${t('inventoryStatus', 'Inventory Status')}</h4>
          ${this._renderInventoryStatus(lowStockProducts, lowStockComponents, outOfStockProducts, outOfStockComponents)}
          <button class="btn btn-ghost" style="width:100%; margin-top:12px;" onclick="App.Core.Router.navigate('inventory')">${t('viewInventory', 'View Inventory')}</button>
        </div>
      </div>

      <!-- Sales Chart -->
      <div class="card-soft" style="margin-top:16px;">
        <h4 style="font-size:14px; font-weight:600; margin-bottom:12px;">${t('salesTrend', 'Monthly Sales Trend')}</h4>
        <div id="dashboard-chart" role="img" aria-label="${t('salesTrend', 'Monthly Sales Trend')}"></div>
      </div>
    `;

    // Render chart
    this._renderSalesChart(invoices);
  },

  _renderAlerts(overdueInvoices, overdueTasks, outOfStockProducts, outOfStockComponents, customers) {
    const t = (key, fallback) => App.I18n.t(`dashboard.${key}`, fallback);
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
          message: t('backupAlert', `Last backup was ${daysSinceBackup} days ago - consider backing up your data`).replace('{days}', daysSinceBackup),
          action: "App.Core.Router.navigate('settings')"
        });
      }
    } else {
      // No backup ever made
      alerts.push({
        type: 'warning',
        icon: '💾',
        message: t('noBackupAlert', 'No backup found - please backup your data'),
        action: "App.Core.Router.navigate('settings')"
      });
    }

    if (overdueInvoices.length > 0) {
      alerts.push({
        type: 'error',
        icon: '⚠️',
        message: t('overdueInvoiceAlert', `${overdueInvoices.length} overdue invoice(s) need attention`).replace('{count}', overdueInvoices.length),
        action: "App.Core.Router.navigate('documents')"
      });
    }

    if (overdueTasks.length > 0) {
      alerts.push({
        type: 'warning',
        icon: '📋',
        message: t('overdueTaskAlert', `${overdueTasks.length} overdue task(s)`).replace('{count}', overdueTasks.length),
        action: "App.Core.Router.navigate('tasks')"
      });
    }

    const totalOutOfStock = outOfStockProducts.length + outOfStockComponents.length;
    if (totalOutOfStock > 0) {
      alerts.push({
        type: 'error',
        icon: '📦',
        message: t('outOfStockAlert', `${totalOutOfStock} item(s) out of stock`).replace('{count}', totalOutOfStock),
        action: "App.Core.Router.navigate('inventory')"
      });
    }

    if (alerts.length === 0) return '';

    return `
      <div class="card-soft" style="margin-bottom:16px; padding:12px;" role="alert">
        ${alerts.map(a => {
          const bgColor = a.type === 'error' ? 'var(--color-danger-bg)' : 'var(--color-warning-bg)';
          const borderColor = a.type === 'error' ? 'var(--color-danger)' : 'var(--color-warning)';
          return `
            <button style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:${bgColor}; border-left:3px solid ${borderColor}; border-radius:4px; margin-bottom:8px; cursor:pointer; width:100%; border:none; text-align:left;" onclick="${a.action}" aria-label="${a.message}">
              <span>${a.icon} ${a.message}</span>
              <span style="font-size:12px; color:var(--color-text-muted);">${t('view', 'View →')}</span>
            </button>
          `;
        }).join('')}
      </div>
    `;
  },

  _renderInventoryStatus(lowStockProducts, lowStockComponents, outOfStockProducts, outOfStockComponents) {
    const t = (key, fallback) => App.I18n.t(`dashboard.${key}`, fallback);
    const esc = App.Utils.escapeHtml;

    const items = [
      ...outOfStockProducts.slice(0, 3).map(p => ({
        name: p.internalArticleNumber || p.sku || p.nameDE,
        stock: 0,
        min: p.minStock || 0,
        type: t('outOfStock', 'Out of Stock'),
        color: 'var(--color-danger)'
      })),
      ...outOfStockComponents.slice(0, 2).map(c => ({
        name: c.componentNumber || c.description,
        stock: 0,
        min: c.safetyStock || 0,
        type: t('outOfStock', 'Out of Stock'),
        color: 'var(--color-danger)'
      })),
      ...lowStockProducts.slice(0, 3).map(p => ({
        name: p.internalArticleNumber || p.sku || p.nameDE,
        stock: p.stock || 0,
        min: p.minStock || 0,
        type: t('lowStock', 'Low Stock'),
        color: 'var(--color-warning)'
      })),
      ...lowStockComponents.slice(0, 2).map(c => ({
        name: c.componentNumber || c.description,
        stock: c.stock || 0,
        min: c.safetyStock || 0,
        type: t('lowStock', 'Low Stock'),
        color: 'var(--color-warning)'
      }))
    ].slice(0, 5);

    if (items.length === 0) {
      return `<p style="text-align:center; color:var(--color-success); font-size:13px; padding:20px;">${t('allStockOK', '✓ All stock levels OK')}</p>`;
    }

    return `
      <div style="display:flex; flex-direction:column; gap:8px;" role="list" aria-label="${t('inventoryStatus', 'Inventory Status')}">
        ${items.map(item => `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:8px; background:var(--color-bg); border-radius:6px; border-left:3px solid ${item.color};" role="listitem">
            <div>
              <strong style="font-size:12px;">${esc(item.name)}</strong>
              <div style="font-size:11px; color:${item.color};">${item.type}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-weight:500; color:${item.color};">${item.stock}</div>
              <div style="font-size:10px; color:var(--color-text-muted);">${t('min', 'min')}: ${item.min}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  _renderSalesChart(invoices) {
    const t = (key, fallback) => App.I18n.t(`dashboard.${key}`, fallback);
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

    const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

    container.innerHTML = `
      <div style="display:flex; align-items:flex-end; gap:12px; height:150px; padding:10px 0;" role="group" aria-label="${t('salesTrend', 'Monthly Sales Trend')}">
        ${months.map((month, i) => {
          const value = values[i];
          const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
          const monthNum = parseInt(month.split('-')[1]) - 1;
          const isCurrentMonth = i === months.length - 1;
          const monthName = t(monthKeys[monthNum], monthKeys[monthNum].charAt(0).toUpperCase() + monthKeys[monthNum].slice(1));
          return `
            <div style="flex:1; display:flex; flex-direction:column; align-items:center;" aria-label="${monthName}: ${App.Utils.formatCurrency(value)}">
              <div style="font-size:10px; color:var(--color-text-muted); margin-bottom:4px;">${App.Utils.formatCurrency(value).replace(/[^\d.,]/g, '')}</div>
              <div style="width:100%; height:${Math.max(height, 4)}%; background:${isCurrentMonth ? 'var(--color-primary)' : 'var(--color-border)'}; border-radius:4px; min-height:4px;"></div>
              <div style="font-size:11px; color:var(--color-text-muted); margin-top:8px;">${monthName}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
};
