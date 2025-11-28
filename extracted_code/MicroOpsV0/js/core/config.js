/**
 * MicroOps ERP - Configuration & Debug Module
 *
 * Central configuration for the application.
 * Prevents hardcoded magic values and provides debug control.
 */

window.App = window.App || {};

App.Config = {
  // Debug mode - controls console.log verbosity in production
  debug: false, // Set to true during development

  // Session timeout settings
  sessionTimeoutMinutes: 30,
  sessionWarningMinutes: 5,

  // Default theme and locale
  defaultTheme: 'default',
  defaultLocale: 'en',

  // Storage limits
  maxBackups: 7,

  // Validation defaults
  defaultVatRate: 0.20 // 20% - can be overridden in settings
};

/**
 * Conditional logger - only logs in debug mode
 */
App.Config.log = function(...args) {
  if (this.debug) {
    console.log('[MicroOps]', ...args);
  }
};

App.Config.warn = function(...args) {
  if (this.debug) {
    console.warn('[MicroOps]', ...args);
  }
};

App.Config.error = function(...args) {
  // Always log errors, but with prefix
  console.error('[MicroOps ERROR]', ...args);
};
