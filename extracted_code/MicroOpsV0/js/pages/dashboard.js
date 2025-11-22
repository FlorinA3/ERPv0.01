App.UI.Views.Dashboard = {
  render(root) {
    const orders = App.Data.orders || [];
    const products = App.Data.products || [];
    const customers = App.Data.customers || [];

    const totalRevenue = orders.reduce((acc, o) => acc + (o.totalGross || o.total || 0), 0);
    // Count only physical items for inventory count (exclude services if any)
    const inventoryCount = products.filter(p => p.type !== 'Service').length;
    const lowStockCount = products.filter(p => p.type !== 'Service' && (p.stock || 0) <= 5).length;
    const customerCount = customers.length;

    // Use translation keys from App.I18n
    root.innerHTML = `
      <div class="grid grid-4">
        <div class="card">
          <div style="font-size:11px; text-transform:uppercase; color:var(--color-text-muted); letter-spacing:0.08em;">${App.I18n.t('dashboard.total','Total Revenue')}</div>
          <div style="font-size:24px; font-weight:700; margin-top:6px;">${App.Utils.formatCurrency(totalRevenue)}</div>
          <div style="font-size:12px; color:var(--color-text-muted); margin-top:4px;">${App.I18n.t('dashboard.totalDesc','Sum of all orders')}</div>
        </div>
        <div class="card">
          <div style="font-size:11px; text-transform:uppercase; color:var(--color-text-muted); letter-spacing:0.08em;">${App.I18n.t('dashboard.inventory','Inventory')}</div>
          <div style="font-size:24px; font-weight:700; margin-top:6px;">${inventoryCount}</div>
          <div style="font-size:12px; color:var(--color-text-muted); margin-top:4px;">${App.I18n.t('dashboard.inventoryDesc','Items in stock')}</div>
        </div>
        <div class="card">
          <div style="font-size:11px; text-transform:uppercase; color:var(--color-text-muted); letter-spacing:0.08em;">${App.I18n.t('dashboard.lowStock','Low Stock')}</div>
          <div style="font-size:24px; font-weight:700; margin-top:6px; color:#f87171;">${lowStockCount}</div>
          <div style="font-size:12px; color:var(--color-text-muted); margin-top:4px;">${App.I18n.t('dashboard.lowStockDesc','Items <= 5 units')}</div>
        </div>
        <div class="card">
          <div style="font-size:11px; text-transform:uppercase; color:var(--color-text-muted); letter-spacing:0.08em;">${App.I18n.t('dashboard.customers','Customers')}</div>
          <div style="font-size:24px; font-weight:700; margin-top:6px;">${customerCount}</div>
          <div style="font-size:12px; color:var(--color-text-muted); margin-top:4px;">${App.I18n.t('dashboard.customersDesc','Active Accounts')}</div>
        </div>
      </div>
    `;
  }
};