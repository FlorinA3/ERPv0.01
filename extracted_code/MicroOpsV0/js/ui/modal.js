App.UI.Modal = {
  init() {
    const closeBtn = document.getElementById('modal-close-btn');
    if (closeBtn) closeBtn.onclick = () => this.close();
  },

  open(title, bodyHtml, buttons = []) {
    const backdrop = document.getElementById('modal-backdrop');
    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-body');
    const footerEl = document.getElementById('modal-footer');

    if (!backdrop || !titleEl || !bodyEl || !footerEl) return;

    titleEl.textContent = title || 'Details';
    bodyEl.innerHTML = bodyHtml || '';

    footerEl.innerHTML = '';
    if (buttons.length === 0) {
      buttons = [{ text: 'Close', variant: 'ghost', onClick: () => {} }];
    }

    buttons.forEach(btn => {
      const b = document.createElement('button');
      b.className = 'btn ' + (btn.variant === 'primary' ? 'btn-primary' : 'btn-ghost');
      b.textContent = btn.text;
      b.onclick = () => {
        const res = btn.onClick && btn.onClick();
        if (res !== false) this.close();
      };
      footerEl.appendChild(b);
    });

    backdrop.classList.remove('hidden');
  },

  close() {
    const backdrop = document.getElementById('modal-backdrop');
    if (!backdrop) return;
    backdrop.classList.add('hidden');
  }
};



App.UI.Toast = {
  show(message, variant = 'info', timeout = 2500) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const el = document.createElement('div');
    el.className = `toast toast-${variant}`;
    el.textContent = message;
    container.appendChild(el);

    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(6px)';
      setTimeout(() => el.remove(), 300);
    }, typeof variant === 'number' ? variant : timeout);
  }
};

/**
 * Banner Notification System - Top dropdown for errors/warnings
 */
App.UI.Banner = {
  currentBanner: null,

  show(message, type = 'error', options = {}) {
    this.hide(); // Remove existing banner

    const icons = {
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
      success: '✅'
    };

    const colors = {
      error: 'background:#fee2e2; color:#991b1b; border-color:#fecaca;',
      warning: 'background:#fef3c7; color:#92400e; border-color:#fde68a;',
      info: 'background:#dbeafe; color:#1e40af; border-color:#bfdbfe;',
      success: 'background:#d1fae5; color:#065f46; border-color:#a7f3d0;'
    };

    const banner = document.createElement('div');
    banner.id = 'app-banner';
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      padding: 12px 16px;
      ${colors[type] || colors.error}
      border-bottom: 2px solid;
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 10000;
      font-size: 14px;
      animation: slideDown 0.3s ease-out;
    `;

    banner.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="font-size:16px;">${icons[type] || icons.error}</span>
        <span>${message}</span>
        ${options.details ? `<button style="font-size:12px; text-decoration:underline; background:none; border:none; cursor:pointer; color:inherit;" onclick="App.UI.Banner.showDetails('${options.details.replace(/'/g, "\\'")}')">Details</button>` : ''}
      </div>
      <button style="background:none; border:none; cursor:pointer; font-size:18px; color:inherit; padding:0 4px;" onclick="App.UI.Banner.hide()">×</button>
    `;

    document.body.insertBefore(banner, document.body.firstChild);
    this.currentBanner = banner;

    // Add CSS animation if not exists
    if (!document.getElementById('banner-styles')) {
      const style = document.createElement('style');
      style.id = 'banner-styles';
      style.textContent = `
        @keyframes slideDown {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }
      `;
      document.head.appendChild(style);
    }

    // Auto-hide after timeout (default 8 seconds for errors, 5 for others)
    if (options.autoHide !== false) {
      const timeout = options.timeout || (type === 'error' ? 8000 : 5000);
      setTimeout(() => this.hide(), timeout);
    }
  },

  hide() {
    const banner = document.getElementById('app-banner');
    if (banner) {
      banner.style.animation = 'slideDown 0.3s ease-out reverse';
      setTimeout(() => banner.remove(), 300);
    }
    this.currentBanner = null;
  },

  showDetails(details) {
    App.UI.Modal.open('Error Details', `<pre style="white-space:pre-wrap; font-size:12px;">${details}</pre>`, [
      { text: 'Close', variant: 'ghost', onClick: () => {} }
    ]);
  },

  error(message, details) {
    this.show(message, 'error', { details });
  },

  warning(message) {
    this.show(message, 'warning');
  },

  info(message) {
    this.show(message, 'info');
  },

  success(message) {
    this.show(message, 'success', { timeout: 3000 });
  }
};

/**
 * Tutorial System - First-time user guides
 */
App.UI.Tutorial = {
  currentStep: 0,
  steps: [],
  overlay: null,

  // Check if tutorials are enabled
  isEnabled() {
    const cfg = App.Data.config || App.Data.Config || {};
    return cfg.tutorialsEnabled !== false;
  },

  // Toggle tutorials on/off
  setEnabled(enabled) {
    const cfg = App.Data.config || App.Data.Config || {};
    cfg.tutorialsEnabled = enabled;
    App.DB.save();
  },

  // Check if user has seen a specific tutorial
  hasSeen(tutorialId) {
    const cfg = App.Data.config || App.Data.Config || {};
    const seen = cfg.seenTutorials || [];
    return seen.includes(tutorialId);
  },

  // Mark tutorial as seen
  markSeen(tutorialId) {
    const cfg = App.Data.config || App.Data.Config || {};
    if (!cfg.seenTutorials) cfg.seenTutorials = [];
    if (!cfg.seenTutorials.includes(tutorialId)) {
      cfg.seenTutorials.push(tutorialId);
      App.DB.save();
    }
  },

  // Reset all tutorials
  reset() {
    const cfg = App.Data.config || App.Data.Config || {};
    cfg.seenTutorials = [];
    App.DB.save();
  },

  // Show tutorial for a page
  showForPage(pageId) {
    if (!this.isEnabled()) return;
    if (this.hasSeen(pageId)) return;

    const tutorials = this.getTutorials();
    const tutorial = tutorials[pageId];
    if (!tutorial) return;

    this.show(tutorial.title, tutorial.steps, pageId);
  },

  // Get all tutorials
  getTutorials() {
    const t = (key, fallback) => App.I18n.t(`tutorials.${key}`, fallback);
    return {
      dashboard: {
        title: t('dashboardTitle', 'Dashboard Overview'),
        steps: [
          { text: t('dashboardStep1', 'Welcome! This dashboard shows key business metrics at a glance.') },
          { text: t('dashboardStep2', 'The summary cards show revenue, orders, and inventory status.') },
          { text: t('dashboardStep3', 'Recent activity and quick actions are below.') },
          { text: t('dashboardStep4', 'Use the sidebar to navigate to different modules.') },
          { text: t('dashboardStep5', 'Press F1 anytime for keyboard shortcuts. Ctrl+K for global search.') }
        ]
      },
      customers: {
        title: t('customersTitle', 'Customer Management'),
        steps: [
          { text: t('customersStep1', 'Manage all your customers here.') },
          { text: t('customersStep2', 'Click "+ Add" to create a new customer.') },
          { text: t('customersStep3', 'Use the search box to filter customers.') },
          { text: t('customersStep4', 'Import customers from CSV using the Import button.') },
          { text: t('customersStep5', 'Edit or delete customers using the action buttons.') }
        ]
      },
      products: {
        title: t('productsTitle', 'Product Catalog'),
        steps: [
          { text: t('productsStep1', 'Your product catalog with pricing and stock levels.') },
          { text: t('productsStep2', 'Products can have Bills of Materials (BOM) for manufacturing.') },
          { text: t('productsStep3', 'Import products from CSV for bulk entry.') },
          { text: t('productsStep4', 'Set minimum stock levels for reorder alerts.') }
        ]
      },
      orders: {
        title: t('ordersTitle', 'Order Management'),
        steps: [
          { text: t('ordersStep1', 'Create and manage customer orders here.') },
          { text: t('ordersStep2', 'Orders flow through statuses: Draft → Confirmed → Shipped → Delivered.') },
          { text: t('ordersStep3', 'Generate delivery notes and invoices from orders.') },
          { text: t('ordersStep4', 'Export orders to CSV for reporting.') }
        ]
      },
      inventory: {
        title: t('inventoryTitle', 'Inventory Management'),
        steps: [
          { text: t('inventoryStep1', 'Monitor stock levels across all products.') },
          { text: t('inventoryStep2', 'Tabs filter by product type: Finished, Device, Consumable, Part.') },
          { text: t('inventoryStep3', 'Use Receive Stock to add inventory from purchases.') },
          { text: t('inventoryStep4', 'Adjust Stock for corrections or physical counts.') },
          { text: t('inventoryStep5', 'Replenishment suggestions show items below minimum stock.') }
        ]
      },
      settings: {
        title: t('settingsTitle', 'System Settings'),
        steps: [
          { text: t('settingsStep1', 'Configure your company information and preferences.') },
          { text: t('settingsStep2', 'Manage users and their roles.') },
          { text: t('settingsStep3', 'Set up email templates for customer communications.') },
          { text: t('settingsStep4', 'Configure log retention and security settings.') },
          { text: t('settingsStep5', 'Backup your data regularly using the Download Backup button.') }
        ]
      }
    };
  },

  // Show a tutorial
  show(title, steps, tutorialId) {
    this.steps = steps;
    this.currentStep = 0;
    this.tutorialId = tutorialId;

    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.id = 'tutorial-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.7);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    this.renderStep();
    document.body.appendChild(this.overlay);
  },

  renderStep() {
    if (!this.overlay) return;

    const step = this.steps[this.currentStep];
    const isLast = this.currentStep === this.steps.length - 1;
    const isFirst = this.currentStep === 0;

    this.overlay.innerHTML = `
      <div style="background:var(--color-surface, #1e293b); border-radius:12px; padding:24px; max-width:400px; margin:16px; box-shadow:0 20px 40px rgba(0,0,0,0.3);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <h3 style="font-size:16px; font-weight:600; margin:0;">📚 Tutorial</h3>
          <span style="font-size:12px; color:var(--color-text-muted, #94a3b8);">${this.currentStep + 1} / ${this.steps.length}</span>
        </div>
        <p style="font-size:14px; line-height:1.6; margin-bottom:20px; color:var(--color-text, #f1f5f9);">${step.text}</p>
        <div style="display:flex; justify-content:space-between; gap:8px;">
          <button id="tutorial-skip" style="padding:8px 16px; border-radius:6px; border:1px solid var(--color-border, #334155); background:transparent; color:var(--color-text, #f1f5f9); cursor:pointer; font-size:13px;">
            Skip Tutorial
          </button>
          <div style="display:flex; gap:8px;">
            ${!isFirst ? `<button id="tutorial-prev" style="padding:8px 16px; border-radius:6px; border:1px solid var(--color-border, #334155); background:transparent; color:var(--color-text, #f1f5f9); cursor:pointer; font-size:13px;">Previous</button>` : ''}
            <button id="tutorial-next" style="padding:8px 16px; border-radius:6px; border:none; background:var(--color-primary, #3b82f6); color:white; cursor:pointer; font-size:13px; font-weight:500;">
              ${isLast ? 'Done' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    `;

    // Wire up buttons
    document.getElementById('tutorial-skip')?.addEventListener('click', () => this.close());
    document.getElementById('tutorial-prev')?.addEventListener('click', () => this.prev());
    document.getElementById('tutorial-next')?.addEventListener('click', () => isLast ? this.close() : this.next());
  },

  next() {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this.renderStep();
    }
  },

  prev() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.renderStep();
    }
  },

  close() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    if (this.tutorialId) {
      this.markSeen(this.tutorialId);
    }
    this.steps = [];
    this.currentStep = 0;
  }
};
