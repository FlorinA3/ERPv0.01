App.Core.Router = {
  currentRoute: 'dashboard',

  init() {
    
  },

  navigate(route) {
    if (!route) route = 'dashboard';
    this.currentRoute = route;

    // Update the page title using the i18n system
    const titleEl = document.getElementById('page-title');
    if (titleEl) {
      const nice = route.charAt(0).toUpperCase() + route.slice(1);
      titleEl.textContent = App.I18n.t('pages.' + route + '.title', nice);
    }

    
    if (App.UI.Sidebar && App.UI.Sidebar.setActive) {
      App.UI.Sidebar.setActive(route);
    }

    
    const root = document.getElementById('page-content');
    if (!root) return;

    const key = route.charAt(0).toUpperCase() + route.slice(1);
    const view = App.UI.Views[key];
    if (!view || typeof view.render !== 'function') {
      root.innerHTML = `<div class="card-soft">Unknown route: ${route}</div>`;
      return;
    }

    view.render(root);
  }
};
