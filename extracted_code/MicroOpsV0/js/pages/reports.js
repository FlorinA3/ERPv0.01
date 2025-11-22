App.UI.Views.Reports = {
  render(root) {
    const t = (key, fallback) => App.I18n.t(`reports.${key}`, fallback);
    const esc = App.Utils.escapeHtml;
    const orders = App.Data.orders || [];
    const documents = App.Data.documents || [];
    const products = App.Data.products || [];
    const customers = App.Data.customers || [];
    const invoices = documents.filter(d => d.type === 'invoice');

    const totalRevenue = invoices.reduce((sum, d) => sum + (d.grossTotal || 0), 0);
    const totalPaid = invoices.reduce((sum, d) => sum + (d.paidAmount || 0), 0);
    const totalOutstanding = totalRevenue - totalPaid;
    const avgOrderValue = orders.length > 0 ? orders.reduce((sum, o) => sum + (o.totalGross || 0), 0) / orders.length : 0;

    root.innerHTML = `
      <div class="card-soft" style="margin-bottom:16px;">
        <h3 style="font-size:16px; font-weight:600; margin-bottom:16px;">${App.I18n.t('pages.reports.title', t('title', 'Reports & Analytics'))}</h3>

        <div class="grid grid-4" style="margin-bottom:16px;">
          <div style="padding:12px; background:var(--color-bg); border-radius:6px; text-align:center;">
            <div style="font-size:11px; text-transform:uppercase; color:var(--color-text-muted);">${t('totalRevenue', 'Total Revenue')}</div>
            <div style="font-size:20px; font-weight:700; margin-top:4px;">${App.Utils.formatCurrency(totalRevenue)}</div>
          </div>
          <div style="padding:12px; background:var(--color-bg); border-radius:6px; text-align:center;">
            <div style="font-size:11px; text-transform:uppercase; color:var(--color-text-muted);">${t('collected', 'Collected')}</div>
            <div style="font-size:20px; font-weight:700; margin-top:4px; color:var(--color-success);">${App.Utils.formatCurrency(totalPaid)}</div>
          </div>
          <div style="padding:12px; background:var(--color-bg); border-radius:6px; text-align:center;">
            <div style="font-size:11px; text-transform:uppercase; color:var(--color-text-muted);">${t('outstanding', 'Outstanding')}</div>
            <div style="font-size:20px; font-weight:700; margin-top:4px; color:var(--color-warning);">${App.Utils.formatCurrency(totalOutstanding)}</div>
          </div>
          <div style="padding:12px; background:var(--color-bg); border-radius:6px; text-align:center;">
            <div style="font-size:11px; text-transform:uppercase; color:var(--color-text-muted);">${t('avgOrder', 'Avg Order')}</div>
            <div style="font-size:20px; font-weight:700; margin-top:4px;">${App.Utils.formatCurrency(avgOrderValue)}</div>
          </div>
        </div>
      </div>

      <div class="grid grid-2" style="gap:16px; margin-bottom:16px;">
        <div class="card-soft">
          <h4 style="font-size:14px; font-weight:600; margin-bottom:12px;">${t('topCustomers', 'Top 5 Customers by Revenue')}</h4>
          <div id="top-customers-list"></div>
        </div>
        <div class="card-soft">
          <h4 style="font-size:14px; font-weight:600; margin-bottom:12px;">${t('topProducts', 'Top 5 Products by Sales')}</h4>
          <div id="top-products-list"></div>
        </div>
      </div>

      <div class="card-soft" style="margin-bottom:16px;">
        <h4 style="font-size:14px; font-weight:600; margin-bottom:12px;">${t('monthlyTrend', 'Monthly Sales Trend')}</h4>
        <div id="monthly-chart"></div>
      </div>

      <div class="card-soft">
        <h4 style="font-size:14px; font-weight:600; margin-bottom:16px;">${t('exportReports', 'Export Reports')}</h4>
        <div class="grid grid-3" style="gap:12px;">
          <div style="padding:12px; background:var(--color-bg); border:1px solid var(--color-border); border-radius:6px;">
            <h5 style="font-weight:600; margin-bottom:4px;">${t('ordersMasterlist', 'Orders Masterlist')}</h5>
            <p style="font-size:11px; color:var(--color-text-muted); margin-bottom:8px;">${t('allOrdersWithDetails', 'All orders with details')}</p>
            <button class="btn btn-primary" id="btn-rep-orders" style="width:100%;">${t('downloadCsv', 'Download CSV')}</button>
          </div>
          <div style="padding:12px; background:var(--color-bg); border:1px solid var(--color-border); border-radius:6px;">
            <h5 style="font-weight:600; margin-bottom:4px;">${t('invoicesReport', 'Invoices Report')}</h5>
            <p style="font-size:11px; color:var(--color-text-muted); margin-bottom:8px;">${t('invoicePaymentsStatus', 'Invoice payments & status')}</p>
            <button class="btn btn-primary" id="btn-rep-invoices" style="width:100%;">${t('downloadCsv', 'Download CSV')}</button>
          </div>
          <div style="padding:12px; background:var(--color-bg); border:1px solid var(--color-border); border-radius:6px;">
            <h5 style="font-weight:600; margin-bottom:4px;">${t('customerReport', 'Customer Report')}</h5>
            <p style="font-size:11px; color:var(--color-text-muted); margin-bottom:8px;">${t('revenuePerCustomer', 'Revenue per customer')}</p>
            <button class="btn btn-primary" id="btn-rep-customers" style="width:100%;">${t('downloadCsv', 'Download CSV')}</button>
          </div>
          <div style="padding:12px; background:var(--color-bg); border:1px solid var(--color-border); border-radius:6px;">
            <h5 style="font-weight:600; margin-bottom:4px;">${t('productSales', 'Product Sales')}</h5>
            <p style="font-size:11px; color:var(--color-text-muted); margin-bottom:8px;">${t('unitsSoldByProduct', 'Units sold by product')}</p>
            <button class="btn btn-primary" id="btn-rep-products" style="width:100%;">${t('downloadCsv', 'Download CSV')}</button>
          </div>
          <div style="padding:12px; background:var(--color-bg); border:1px solid var(--color-border); border-radius:6px;">
            <h5 style="font-weight:600; margin-bottom:4px;">${t('inventoryValuation', 'Inventory Valuation')}</h5>
            <p style="font-size:11px; color:var(--color-text-muted); margin-bottom:8px;">${t('stockValueReport', 'Stock value report')}</p>
            <button class="btn btn-primary" id="btn-rep-inventory" style="width:100%;">${t('downloadCsv', 'Download CSV')}</button>
          </div>
          <div style="padding:12px; background:var(--color-bg); border:1px solid var(--color-border); border-radius:6px;">
            <h5 style="font-weight:600; margin-bottom:4px;">${t('productionSummary', 'Production Summary')}</h5>
            <p style="font-size:11px; color:var(--color-text-muted); margin-bottom:8px;">${t('productionOrdersLog', 'Production orders log')}</p>
            <button class="btn btn-primary" id="btn-rep-production" style="width:100%;">${t('downloadCsv', 'Download CSV')}</button>
          </div>
        </div>
      </div>
    `;

    this.renderTopCustomers(customers, invoices);
    this.renderTopProducts(products, orders);
    this.renderMonthlyChart(invoices);

    document.getElementById('btn-rep-orders')?.addEventListener('click', () => this.exportOrders());
    document.getElementById('btn-rep-invoices')?.addEventListener('click', () => this.exportInvoices());
    document.getElementById('btn-rep-customers')?.addEventListener('click', () => this.exportCustomers());
    document.getElementById('btn-rep-products')?.addEventListener('click', () => this.exportProducts());
    document.getElementById('btn-rep-inventory')?.addEventListener('click', () => this.exportInventory());
    document.getElementById('btn-rep-production')?.addEventListener('click', () => this.exportProduction());
  },

  renderTopCustomers(customers, invoices) {
    const container = document.getElementById('top-customers-list');
    if (!container) return;

    const customerRevenue = {};
    invoices.forEach(inv => {
      if (!customerRevenue[inv.customerId]) customerRevenue[inv.customerId] = 0;
      customerRevenue[inv.customerId] += inv.grossTotal || 0;
    });

    const sorted = Object.entries(customerRevenue)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (sorted.length === 0) {
      container.innerHTML = '<p style="text-align:center; color:var(--color-text-muted); font-size:13px;">No data</p>';
      return;
    }

    const maxRevenue = sorted[0][1];
    container.innerHTML = sorted.map(([custId, revenue]) => {
      const cust = customers.find(c => c.id === custId);
      const pct = maxRevenue > 0 ? (revenue / maxRevenue * 100) : 0;
      return `
        <div style="margin-bottom:8px;">
          <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:2px;">
            <span>${cust?.company || 'Unknown'}</span>
            <strong>${App.Utils.formatCurrency(revenue)}</strong>
          </div>
          <div style="height:4px; background:var(--color-border); border-radius:2px;">
            <div style="height:100%; width:${pct}%; background:#3b82f6; border-radius:2px;"></div>
          </div>
        </div>
      `;
    }).join('');
  },

  renderTopProducts(products, orders) {
    const container = document.getElementById('top-products-list');
    if (!container) return;

    const productSales = {};
    orders.forEach(order => {
      (order.items || []).forEach(item => {
        if (!productSales[item.productId]) productSales[item.productId] = { qty: 0, revenue: 0 };
        productSales[item.productId].qty += item.qty || 0;
        productSales[item.productId].revenue += item.lineNet || 0;
      });
    });

    const sorted = Object.entries(productSales)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5);

    if (sorted.length === 0) {
      container.innerHTML = '<p style="text-align:center; color:var(--color-text-muted); font-size:13px;">No data</p>';
      return;
    }

    const maxRevenue = sorted[0][1].revenue;
    container.innerHTML = sorted.map(([prodId, data]) => {
      const prod = products.find(p => p.id === prodId);
      const pct = maxRevenue > 0 ? (data.revenue / maxRevenue * 100) : 0;
      return `
        <div style="margin-bottom:8px;">
          <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:2px;">
            <span>${prod?.nameDE || prod?.nameEN || 'Unknown'} <small style="color:var(--color-text-muted);">(${data.qty} units)</small></span>
            <strong>${App.Utils.formatCurrency(data.revenue)}</strong>
          </div>
          <div style="height:4px; background:var(--color-border); border-radius:2px;">
            <div style="height:100%; width:${pct}%; background:#10b981; border-radius:2px;"></div>
          </div>
        </div>
      `;
    }).join('');
  },

  renderMonthlyChart(invoices) {
    const container = document.getElementById('monthly-chart');
    if (!container) return;

    const monthlyData = {};
    invoices.forEach(inv => {
      const date = new Date(inv.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[key]) monthlyData[key] = 0;
      monthlyData[key] += inv.grossTotal || 0;
    });

    const months = Object.keys(monthlyData).sort().slice(-6);
    if (months.length === 0) {
      container.innerHTML = '<p style="text-align:center; color:var(--color-text-muted); font-size:13px;">No data</p>';
      return;
    }

    const maxValue = Math.max(...months.map(m => monthlyData[m]));
    container.innerHTML = `
      <div style="display:flex; align-items:flex-end; gap:8px; height:120px;">
        ${months.map(month => {
          const value = monthlyData[month];
          const pct = maxValue > 0 ? (value / maxValue * 100) : 0;
          const [year, mon] = month.split('-');
          const label = new Date(year, parseInt(mon) - 1).toLocaleString('default', { month: 'short' });
          return `
            <div style="flex:1; text-align:center;">
              <div style="height:${pct}px; background:#3b82f6; border-radius:2px 2px 0 0; margin-bottom:4px;"></div>
              <div style="font-size:11px; color:var(--color-text-muted);">${label}</div>
              <div style="font-size:10px; font-weight:500;">${App.Utils.formatCurrency(value)}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  exportCSV(filename, headers, rows) {
    // Use secure CSV utility with injection protection and BOM
    App.Utils.exportCSV(headers, rows, filename);
  },

  exportOrders() {
    const headers = ['Date', 'Order ID', 'Customer', 'Customer No', 'Status', 'Net', 'VAT', 'Gross'];
    const rows = (App.Data.orders || []).map(o => {
      const c = (App.Data.customers || []).find(cust => cust.id === o.custId);
      return [
        o.date?.split('T')[0] || '',
        o.orderId,
        c?.company || 'Unknown',
        c?.customerNumber || '',
        o.status,
        (o.subtotalNet || 0).toFixed(2),
        (o.vatAmount || 0).toFixed(2),
        (o.totalGross || 0).toFixed(2)
      ];
    });
    this.exportCSV('orders_masterlist.csv', headers, rows);
  },

  exportInvoices() {
    const headers = ['Date', 'Invoice No', 'Due Date', 'Customer', 'Total', 'Paid', 'Outstanding', 'Status'];
    const rows = (App.Data.documents || [])
      .filter(d => d.type === 'invoice')
      .map(d => {
        const c = (App.Data.customers || []).find(cust => cust.id === d.customerId);
        const paid = d.paidAmount || 0;
        const total = d.grossTotal || 0;
        const outstanding = total - paid;
        let status = 'Open';
        if (paid >= total) status = 'Paid';
        else if (paid > 0) status = 'Partial';
        else if (d.dueDate && new Date(d.dueDate) < new Date()) status = 'Overdue';
        return [
          d.date?.split('T')[0] || '',
          d.docNumber,
          d.dueDate?.split('T')[0] || '',
          c?.company || 'Unknown',
          total.toFixed(2),
          paid.toFixed(2),
          outstanding.toFixed(2),
          status
        ];
      });
    this.exportCSV('invoices_report.csv', headers, rows);
  },

  exportCustomers() {
    const invoices = (App.Data.documents || []).filter(d => d.type === 'invoice');
    const customerData = {};

    invoices.forEach(inv => {
      if (!customerData[inv.customerId]) {
        customerData[inv.customerId] = { invoiceCount: 0, total: 0, paid: 0 };
      }
      customerData[inv.customerId].invoiceCount++;
      customerData[inv.customerId].total += inv.grossTotal || 0;
      customerData[inv.customerId].paid += inv.paidAmount || 0;
    });

    const headers = ['Customer No', 'Company', 'Segment', 'Invoice Count', 'Total Revenue', 'Paid', 'Outstanding'];
    const rows = (App.Data.customers || []).map(c => {
      const data = customerData[c.id] || { invoiceCount: 0, total: 0, paid: 0 };
      return [
        c.customerNumber || '',
        c.company,
        c.segment || '',
        data.invoiceCount,
        data.total.toFixed(2),
        data.paid.toFixed(2),
        (data.total - data.paid).toFixed(2)
      ];
    });
    this.exportCSV('customer_report.csv', headers, rows);
  },

  exportProducts() {
    const orders = App.Data.orders || [];
    const productSales = {};

    orders.forEach(order => {
      (order.items || []).forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { qty: 0, revenue: 0 };
        }
        productSales[item.productId].qty += item.qty || 0;
        productSales[item.productId].revenue += item.lineNet || 0;
      });
    });

    const headers = ['SKU', 'Product Name', 'Type', 'Units Sold', 'Revenue', 'Current Stock'];
    const rows = (App.Data.products || []).map(p => {
      const sales = productSales[p.id] || { qty: 0, revenue: 0 };
      return [
        p.internalArticleNumber || p.sku || '',
        p.nameDE || p.nameEN || '',
        p.type || '',
        sales.qty,
        sales.revenue.toFixed(2),
        p.stock || 0
      ];
    });
    this.exportCSV('product_sales.csv', headers, rows);
  },

  exportInventory() {
    const headers = ['SKU', 'Name', 'Type', 'Stock', 'Min Stock', 'Purchase Price', 'Total Value', 'Status'];
    const rows = (App.Data.products || [])
      .filter(p => p.type !== 'Service')
      .map(p => {
        const stock = p.stock || 0;
        const price = p.purchasePrice || p.avgPurchasePrice || 0;
        let status = 'OK';
        if (stock <= 0) status = 'Out of Stock';
        else if (stock <= (p.minStock || 0)) status = 'Low Stock';
        return [
          p.internalArticleNumber || p.sku || '',
          p.nameDE || p.nameEN || '',
          p.type || '',
          stock,
          p.minStock || 0,
          price.toFixed(2),
          (stock * price).toFixed(2),
          status
        ];
      });
    this.exportCSV('inventory_valuation.csv', headers, rows);
  },

  exportProduction() {
    const headers = ['Date', 'PO Number', 'Product', 'Quantity', 'Status', 'Components Used'];
    const rows = (App.Data.productionOrders || []).map(p => {
      const prod = (App.Data.products || []).find(pr => pr.id === p.productId);
      const compCount = (p.components || []).length;
      return [
        (p.createdAt || '').split('T')[0],
        p.orderNumber,
        prod?.nameDE || prod?.nameEN || p.productId,
        p.quantity,
        p.status,
        compCount
      ];
    });
    this.exportCSV('production_summary.csv', headers, rows);
  }
};
