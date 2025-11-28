/**
 * Build a public-facing configuration object that is safe to expose to the frontend.
 * Never include secrets (DB URLs, JWT secrets, credentials) here.
 */
function buildPublicConfig(config) {
  return {
    appName: config.app.name,
    appVersion: config.app.version,
    environment: config.app.environmentLabel,
    demoMode: Boolean(config.app.demoMode),
    // Documented supported browsers (aligned with BROWSER_COMPATIBILITY.md)
    supportedBrowsers: ['Chrome 90+', 'Edge 90+', 'Firefox 88+', 'Safari 14+'],
  };
}

module.exports = { buildPublicConfig };
