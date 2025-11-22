// js/ui/icons.js
App.UI = App.UI || {};

App.UI.Icons = {
  // Map logical route keys to Lucide icon names
  routeToIcon: {
    dashboard:  'layout-dashboard',
    customers:  'users',
    products:   'box',
    components: 'circuit-board',
    suppliers:  'factory',
    carriers:   'truck',
    pricing:    'tags',
    inventory:  'layers',
    movements:  'arrows-left-right',
    orders:     'file-text',
    production: 'settings-2',
    documents:  'folder-kanban',
    reports:    'bar-chart-3',
    tasks:      'check-square',
    settings:   'settings'
  },

  /**
   * Returns HTML for a Lucide icon placeholder.
   * @param {string} routeId logical route or key
   */
  render(routeId) {
    const iconName = this.routeToIcon[routeId] || 'circle-help';
    return `<i data-lucide="${iconName}"></i>`;
  },

  /**
   * Converts all <i data-lucide="..."> elements under `root`
   * into SVGs via Lucide's createIcons.
   * @param {HTMLElement} [root]
   */
  refresh(root) {
    if (!window.lucide || typeof window.lucide.createIcons !== 'function') return;
    window.lucide.createIcons({
      root: root || document
    });
  }
};
