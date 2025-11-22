App.Core.Router = {
  currentRoute: 'dashboard',

  init() {
    // Handle browser back/forward buttons
    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.route) {
        this.navigate(e.state.route, false);
      }
    });
  },

  navigate(route, pushState = true) {
    if (!route) route = 'dashboard';

    // Check role-based access control
    if (App.Services.Auth && !App.Services.Auth.canAccess(route)) {
      // User doesn't have permission - redirect to dashboard or show error
      if (route !== 'dashboard') {
        App.UI.Toast.show(App.I18n.t('common.accessDenied', 'Access denied'));
        route = 'dashboard';
      } else {
        // Even dashboard is denied - this shouldn't happen
        return;
      }
    }

    this.currentRoute = route;

    // Update browser history
    if (pushState) {
      history.pushState({ route }, '', `#${route}`);
    }

    // Update the page title using the i18n system
    const titleEl = document.getElementById('page-title');
    if (titleEl) {
      const nice = route.charAt(0).toUpperCase() + route.slice(1);
      titleEl.textContent = App.I18n.t('pages.' + route + '.title', nice);
    }

    // Update sidebar active state
    if (App.UI.Sidebar && App.UI.Sidebar.setActive) {
      App.UI.Sidebar.setActive(route);
    }

    // Render the page
    const root = document.getElementById('page-content');
    if (!root) return;

    const key = route.charAt(0).toUpperCase() + route.slice(1);
    const view = App.UI.Views[key];
    if (!view || typeof view.render !== 'function') {
      root.innerHTML = `<div class="card-soft" style="padding: 24px; text-align: center;">
        <h3 style="margin-bottom: 8px;">Page not found</h3>
        <p style="color: var(--color-text-muted);">The route "${route}" does not exist.</p>
      </div>`;
      return;
    }

    view.render(root);
  },

  /**
   * Get current route from URL hash
   */
  getCurrentFromHash() {
    const hash = window.location.hash.slice(1);
    return hash || 'dashboard';
  }
};
