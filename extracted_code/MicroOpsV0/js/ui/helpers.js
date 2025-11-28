/**
 * MicroOps ERP - UI Helper Functions
 *
 * Centralized UI utilities for toasts, loading, validation messages, and HTML escaping.
 * Extracted from app.js to improve maintainability.
 */

window.App = window.App || {};
App.UI = App.UI || {};

/**
 * HTML Escape Utility - Prevents XSS by escaping user-generated content
 */
App.UI.escapeHtml = function(text) {
  if (text == null) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
};

/**
 * Toast Notification System
 */
App.UI.Toast = {
  show(message, type = 'info', duration = 5000) {
    const container = document.getElementById('toast-container');
    if (!container) {
      App.Config.error('Toast container not found in DOM');
      return;
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      padding: 12px 20px;
      margin-bottom: 10px;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      font-weight: 500;
      max-width: 400px;
      background: var(--toast-bg-${type}, #333);
      color: var(--toast-color-${type}, #fff);
      animation: slideIn 0.3s ease;
    `;

    container.appendChild(toast);

    if (duration > 0) {
      setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }

    return toast;
  },

  success(message, duration = 3000) {
    return this.show(message, 'success', duration);
  },

  error(message, duration = 8000) {
    return this.show(message, 'error', duration);
  },

  warning(message, duration = 5000) {
    return this.show(message, 'warning', duration);
  },

  info(message, duration = 5000) {
    return this.show(message, 'info', duration);
  }
};

/**
 * Inline Validation Error Display
 */
App.UI.Validation = {
  /**
   * Clear all validation errors from a form or container
   */
  clear(root = document) {
    (root.querySelectorAll('.field-error') || []).forEach(el => el.remove());
    (root.querySelectorAll('.input-error') || []).forEach(el => {
      el.classList.remove('input-error');
      el.style.borderColor = '';
    });
  },

  /**
   * Show field-specific validation errors
   * @param {string|Element} rootOrSelector - Container or selector
   * @param {Object} errors - Map of field names to error messages
   * @returns {string} - Concatenated error summary
   */
  showErrors(rootOrSelector, errors = {}) {
    const root = typeof rootOrSelector === 'string'
      ? document.querySelector(rootOrSelector) || document
      : rootOrSelector || document;

    this.clear(root);

    const summary = [];
    Object.entries(errors || {}).forEach(([field, messages]) => {
      const target = root.querySelector(`#${field}`) ||
                     root.querySelector(`[name="${field}"]`) ||
                     root.querySelector(`[data-field="${field}"]`);

      const msgText = Array.isArray(messages) ? messages.join(', ') : String(messages);
      summary.push(msgText);

      if (target) {
        target.classList.add('input-error');
        target.style.borderColor = 'var(--color-danger)';

        const errEl = document.createElement('div');
        errEl.className = 'field-error';
        errEl.style.cssText = 'color:var(--color-danger); font-size:12px; margin-top:4px;';
        errEl.textContent = msgText;
        target.insertAdjacentElement('afterend', errEl);
      }
    });

    return summary.join(' ');
  },

  /**
   * Disable a button if validation result indicates invalid
   */
  disableIfInvalid(buttonEl, validationResult) {
    if (!buttonEl) return;
    buttonEl.disabled = validationResult && validationResult.isValid === false;
  }
};

/**
 * Loading Overlay Utility
 */
App.UI.Loading = {
  _overlay: null,

  show(message = 'Loading...') {
    if (this._overlay) return;

    this._overlay = document.createElement('div');
    this._overlay.id = 'loading-overlay';
    this._overlay.innerHTML = `
      <div style="position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:10000;">
        <div style="background:var(--color-bg-elevated, #fff); padding:24px 32px; border-radius:12px; text-align:center; box-shadow:0 8px 32px rgba(0,0,0,0.3);">
          <div style="width:32px; height:32px; border:3px solid var(--color-border); border-top-color:var(--color-primary); border-radius:50%; margin:0 auto 12px; animation:spin 1s linear infinite;"></div>
          <div style="color:var(--color-text); font-size:14px;">${App.UI.escapeHtml(message)}</div>
        </div>
      </div>
      <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
    `;
    document.body.appendChild(this._overlay);
  },

  hide() {
    if (this._overlay) {
      this._overlay.remove();
      this._overlay = null;
    }
  },

  async wrap(promise, message = 'Loading...') {
    this.show(message);
    try {
      return await promise;
    } finally {
      this.hide();
    }
  }
};
