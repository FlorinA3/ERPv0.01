// js/ui/sidebar.js

App.UI.Sidebar = {
  routes: [
    { type: 'section', id: 'sec-overview', labelKey: 'sidebar.overview' },
    { id: 'dashboard',  icon: 'dashboard',  labelKey: 'sidebar.dashboard' },

    { type: 'section', id: 'sec-masterdata', labelKey: 'sidebar.masterdata' },
    { id: 'customers',  icon: 'customers',  labelKey: 'sidebar.customers' },
    { id: 'products',   icon: 'products',   labelKey: 'sidebar.products' },
    { id: 'components', icon: 'components', labelKey: 'sidebar.components' },
    { id: 'suppliers',  icon: 'suppliers',  labelKey: 'sidebar.suppliers' },
    { id: 'carriers',   icon: 'carriers',   labelKey: 'sidebar.carriers' },

    { type: 'section', id: 'sec-pricing', labelKey: 'sidebar.pricingSection' },
    { id: 'pricing',   icon: 'pricing',   labelKey: 'sidebar.pricing' },

    { type: 'section', id: 'sec-inventory', labelKey: 'sidebar.inventory' },
    { id: 'inventory', icon: 'inventory',  labelKey: 'sidebar.inventoryPage' },
    { id: 'movements', icon: 'movements',  labelKey: 'sidebar.movements' },
    { id: 'batches',   icon: 'components', labelKey: 'sidebar.batches' },
    { id: 'orders',    icon: 'orders',     labelKey: 'sidebar.ordersPage' },
    { id: 'production',icon: 'production', labelKey: 'sidebar.production' },

    { type: 'section', id: 'sec-docs', labelKey: 'sidebar.docs' },
    { id: 'documents', icon: 'documents',  labelKey: 'sidebar.documents' },
    { id: 'reports',   icon: 'reports',    labelKey: 'sidebar.reports' },

    { type: 'section', id: 'sec-org', labelKey: 'sidebar.organisation' },
    { id: 'tasks',     icon: 'tasks',      labelKey: 'sidebar.tasks' },
    { id: 'settings',  icon: 'settings',   labelKey: 'sidebar.settings' }
  ],

  collapsedSections: new Set(),

  rolePermissions(role) {
    switch (role) {
      case 'admin':
        return new Set(this.routes.filter(r => !r.type).map(r => r.id));
      case 'sales':
        return new Set(['dashboard','customers','products','pricing','orders','documents','reports','tasks']);
      case 'warehouse':
      case 'user':
        return new Set(['dashboard','inventory','movements','batches','components','suppliers','carriers','production','tasks']);
      case 'production':
        return new Set(['dashboard','production','inventory','movements','components','tasks']);
      default:
        return new Set(['dashboard']);
    }
  },

  init() {
    const root = document.getElementById('sidebar-root');
    if (!root) return;

    // restore collapsed sections from config (if present)
    this.collapsedSections = new Set(
      (App.Data?.config?.collapsedSections || []).filter(Boolean)
    );

    const role = App.Services.Auth.currentUser ? App.Services.Auth.currentUser.role : null;
    const allowed = this.rolePermissions(role || 'guest');

    let html = '<nav class="sidebar-menu">';
    let currentSectionId = null;

    this.routes.forEach((r) => {
      if (r.type === 'section') {
        // section header row
        currentSectionId = r.id;
        const collapsed = this.collapsedSections.has(currentSectionId);
        const arrow = collapsed ? '▶' : '▼';

        html += `
          <div class="sidebar-section" data-section-id="${currentSectionId}">
            <span class="section-toggle">${arrow}</span>
            <span class="section-label">${App.I18n.t(r.labelKey, r.labelKey)}</span>
          </div>
        `;
      } else {
        // actual navigable entry
        if (!allowed.has(r.id)) return;

        const collapsed = currentSectionId && this.collapsedSections.has(currentSectionId);
        const hiddenClass = collapsed ? 'hidden' : '';
        const iconSvg = App.UI.getIcon(r.icon || r.id);

        html += `
          <div class="sidebar-item ${hiddenClass}" data-route="${r.id}" data-section-parent="${currentSectionId}">
            <span class="icon-svg">${iconSvg}</span>
            <span class="sidebar-text">${App.I18n.t(r.labelKey, r.labelKey)}</span>
          </div>
        `;
      }
    });

    html += '</nav>';
    root.innerHTML = html;

    // route navigation
    root.querySelectorAll('.sidebar-item').forEach(el => {
      el.addEventListener('click', () => {
        const route = el.getAttribute('data-route');
        if (route) {
          App.Core.Router.navigate(route);
        }
      });
    });

    // section collapse / expand
    root.querySelectorAll('.sidebar-section').forEach(sectionEl => {
      sectionEl.addEventListener('click', () => {
        const sectionId = sectionEl.getAttribute('data-section-id');
        if (!sectionId) return;

        if (this.collapsedSections.has(sectionId)) {
          this.collapsedSections.delete(sectionId);
        } else {
          this.collapsedSections.add(sectionId);
        }

        // persist to config
        if (!App.Data.config) App.Data.config = {};
        App.Data.config.collapsedSections = Array.from(this.collapsedSections);
        App.DB.save();

        // update arrow
        const toggleEl = sectionEl.querySelector('.section-toggle');
        if (toggleEl) {
          toggleEl.textContent = this.collapsedSections.has(sectionId) ? '▶' : '▼';
        }

        // show/hide items under this section
        root.querySelectorAll(`.sidebar-item[data-section-parent="${sectionId}"]`).forEach(itemEl => {
          if (this.collapsedSections.has(sectionId)) {
            itemEl.classList.add('hidden');
          } else {
            itemEl.classList.remove('hidden');
          }
        });
      });
    });

    // ensure current route is highlighted
    this.setActive(App.Core.Router.currentRoute || 'dashboard');
  },

  setActive(routeId) {
    const root = document.getElementById('sidebar-root');
    if (!root) return;

    root.querySelectorAll('.sidebar-item').forEach(el => {
      if (el.getAttribute('data-route') === routeId) {
        el.classList.add('sidebar-item-active');
      } else {
        el.classList.remove('sidebar-item-active');
      }
    });
  }
};
