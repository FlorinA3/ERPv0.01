/**
 * MicroOps ERP - Lock Screen Event Handlers
 *
 * Handles session lock/unlock UI interactions.
 * Extracted from inline onclick handlers for better maintainability.
 */

window.App = window.App || {};
App.Core = App.Core || {};

App.Core.LockScreen = {
  init() {
    const unlockBtn = document.getElementById('lock-unlock-btn');
    const logoutBtn = document.getElementById('lock-logout-btn');
    const pinInput = document.getElementById('lock-pin');

    if (unlockBtn) {
      unlockBtn.addEventListener('click', () => {
        const pin = pinInput?.value || '';
        if (App.Services && App.Services.Auth && App.Services.Auth.unlock(pin)) {
          if (App.UI && App.UI.Toast) {
            App.UI.Toast.show('Session unlocked');
          }
        } else {
          if (pinInput) {
            pinInput.classList.add('shake');
            setTimeout(() => pinInput.classList.remove('shake'), 500);
          }
          if (App.UI && App.UI.Toast) {
            App.UI.Toast.show('Invalid PIN', 'error');
          }
        }
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (App.Services && App.Services.Auth) {
          App.Services.Auth.logout();
        }
      });
    }

    // Allow Enter key to unlock
    if (pinInput) {
      pinInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          unlockBtn?.click();
        }
      });
    }
  }
};

// Auto-initialize when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.Core.LockScreen.init());
} else {
  App.Core.LockScreen.init();
}
