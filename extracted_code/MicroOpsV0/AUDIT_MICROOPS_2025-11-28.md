# MicroOps ERP Audit (workspace snapshot)

Timestamp: 2025-11-28 15:04:35

Scope: extracted_code/MicroOpsV0 frontend (SPA) + server Node/Express API + docs; no files modified during audit.

Mode: Read-only analysis; recommendations only.

## Global Observations

001. Frontend index loads 20+ JS bundles; all logic bundled as global App.* without module system (js/app.js ~5k lines).
002. App.Api.config.mode is set to 'remote' by default while App.Services.Auth has no getToken implementation; every API call will send an empty Authorization header -> server endpoints reject with 401 (js/api.js, js/app.js).
003. App.Api collections still mutate App.Data directly in 'local' mode; no bridging layer to sync remote responses back into App.Data, causing dual sources of truth and possible divergence.
004. Login UX relies on a 4-digit PIN stored in App.Data.users; credentials are persisted in localStorage/IndexedDB unencrypted, offering no real security for production use (js/db.js seed, js/app.js Auth).
005. Remember-me stores only user id (microops_last_user) without token; does not persist authentication server-side, so sessions are client-only.
006. Two session systems exist: App.SessionManager and App.Services.SessionManager, both initialized in DOMContentLoaded; overlapping timers risk duplicate logout/backup calls and confusing state (js/app.js).
007. I18n strings contain mojibake (� characters) indicating encoding issues; German translations in js/app.js are corrupted and should be fixed to UTF-8.
008. Sidebar section toggles use control characters ('?' and '') instead of proper chevrons, producing broken icons (js/ui/sidebar.js).
009. App.UI.getIcon fallback returns a bell character placeholder '<span></span>' which may render as control glyph; icons are inline SVG strings in js/app.js and not deduped across files.
010. App.Api._fetch lacks timeout/abort handling beyond numeric timeout prop; fetch call ignores timeout value, so hung requests never abort.
011. App.DB.save immediately shows 'Data saved' toast on each call; noisy UX and no debouncing leads to spam after every change.
012. App.DB uses localStorage fallback when IndexedDB fails but never migrates data back; risk of stale divergent datasets between stores.
013. Backups stored in IndexedDB (store backups) retain full data copy but no encryption unless user-supplied password; key derivation is simple XOR and base64, not secure.
014. autoBackupOnExit is called on beforeunload and writes to IndexedDB without considering quota; QUOTA_EXCEEDED only handled during save, not backup.
015. App.Api uses fetch for remote but UI still reads from App.Data arrays directly (e.g., dashboard, inventory); without synchronization, remote data never surfaces in UI.
016. Global error handler swallows errors (returns true) and relies on App.Audit.log; if Audit not initialized, errors disappear except console.error.
017. App.Services.Keyboard shortcuts work even when modal overlay open unless input focused; could trigger navigation mid-dialog.
018. Many inline onclick handlers embedded in templates (e.g., Dashboard alerts) bypass virtual DOM and risk XSS if strings not escaped carefully.
019. App.Utils.escapeHtml is used inconsistently; several template literals interpolate user data without escaping (needs audit across pages).
020. No CSP defined in index.html; inline event handlers plus external lucide CDN script increases injection surface.
021. Lucide icon CDN loaded from unpkg without SRI; network dependency at runtime may fail offline.
022. Theme toggle writes App.Data.config.theme and saves to DB; saving triggers toast and storage write for every toggle without debounce.
023. App.Api.dashboard stats compute on client from App.Data; remote equivalent not implemented yet, so reports rely on local seeded data.
024. Batches/tasks automation (App.Services.Automation) touches App.Data and DB.save; schedule/orchestration not bound to page lifecycle, may mutate data unexpectedly.
025. App.Services.Auth rate-limits login attempts per user id only on client; refresh clears lock, so brute force not prevented.
026. PIN input uses maxlength=4 but not numeric-only; non-digit characters accepted and compared as string.
027. Session lock screen reuses same PIN as login without throttling, enabling quick brute force while app running.
028. Offline indicator toggles but no real offline sync; remote mode fetch failures not retried or queued.
029. App.DB.normalizeData duplicates properties with different casing (config/Config etc.) increasing payload size and confusion.
030. App.DB.exportBackup builds anchor element without cleanup for object URL if called repeatedly; minor leak.
031. App.Api price list logic references pl.segment but config uses priceSegment; risk mismatch.
032. App.Api._createCollection.list sorts using < and > comparisons; fails for dates stored as strings in varying formats.
033. Global keyboard handler ignores metaKey (Command) for Mac; uses ctrl detection but not feature toggles for OS.
034. App.Services.Health.check calls App.DB.getStorageInfo which uses navigator.storage.estimate; not available in all browsers, catches but still logs warning.
035. App.Services.Health.runIntegrityChecks only checks orders->customers and documents->orders; products->components BOM validation partial; no validation for batches, movements, tasks linking.
036. App.UI.Modal implementation not shown but multiple open calls may stack; ensure backdrop prevents scroll and keyboard trap.
037. App.UI.Toast.show uses fixed position top-right; no queueing limit; high volume toasts may overlap.
038. App.Utils.generateId (in js/app.js) likely prefix-based but not collision-resistant; when switching to backend UUIDs this will conflict with server-generated ids.
039. App.Api.reports.getSalesByPeriod uses grossTotal; documents use grossTotal but local seed sets vat summary; ensure consistency.
040. App.Api.documents.generateFromOrder sets status 'draft' and pushes to App.Data without VAT recalculation; duplicates order item lines without tax/discount accuracy.
041. App.Api.movements.getByDateRange uses Date comparisons with string -> Date conversion; timezone dependent.
042. App.UI.Views.Dashboard uses inline SVG bars; no canvas library; responsive width depends on flex and may overflow on narrow screens.
043. Dashboard alerts icons are literal '??' placeholders, reducing clarity (js/pages/dashboard.js).
044. Sidebar collapsed state persisted in App.Data.config.collapsedSections; saved via App.DB.save on every toggle; but config saved in IndexedDB and localStorage may exceed quota if frequently toggled? (minor).
045. App.Services.Auth._loginAttempts keyed by user id; selecting blank user results in _loginAttempts[''] entry.
046. Lock/unlock does not clear entered PIN field; repeated wrong entries not counted.
047. Global beforeunload handler calls App.Services.SessionManager.endSession but that service stores sessions in App.Data, not backend; no server logout.
048. App.Services.Health.check references App.DB.listBackups which uses IndexedDB; if not available returns empty array and health status 'critical'.
049. No unit tests in frontend; TEST_FRAMEWORK_ANALYSIS...md exists as doc only.
050. Docs: GA_RULES_FULL 101.md and TEST_FRAMEWORK... provide process guidance but not linked in UI.
051. Server serves static files from ../ (project root); exposes README and docs publicly if deployed without restrictions.
052. Helmet defaults block some headers but allows contentSecurityPolicy defaults; not configured for tight security.
053. Rate limiter set to 1000 requests/15min per IP; effectively no protection in production.
054. Database migration uses gen_random_uuid() but does not ensure pgcrypto extension; migration may fail on clean Postgres.

## Backend/API Review

001. Server entry server/index.js wires express static serving of frontend; no authentication gating on frontend assets.
002. Authentication middleware requires Bearer JWT; frontend Auth does not request or store JWT yet -> full API unusable in current integration.
003. Auth route inserts session rows but never deletes old rows except on logout; no cleanup job implemented (server/routes/auth.js).
004. JWT secret default 'dev-secret-change-in-production' when env missing; insecure default for deployments.
005. Password policy minimal: only length >= 8 on change-password route; no complexity or reuse checks.
006. Login route lowercases username but does not throttle by IP; brute force possible despite bcrypt hashing.
007. Sessions table stores hashed token suffix only; lookup for logout deletes by user id, not token hash, so concurrent sessions cannot be revoked individually.
008. authorize middleware checks role strings; roles allowed per route vary but frontend rolePermissions differ (e.g., 'manager' allowed server-side but not defined frontend).
009. Orders POST calculates totals in transaction; uses sale_price and vat_rate from DB; no currency handling, assumes default decimal.
010. Order confirm/ship handlers fetch current_stock but do not lock or update components for BOM consumption; manufacturing integration missing.
011. Inventory movements table accepts both product/component but no foreign key to components -> referential integrity risk.
012. Documents table PDF content stored as bytea but no upload route implemented; document routes not reviewed but likely incomplete.
013. Sequences table must be pre-seeded; migrate script inserts with ON CONFLICT DO NOTHING but no yearly reset logic beyond existing year column.
014. Backup routes exist; need to review utils/backup.js for actual dump; backup_dir env default /var/backups/microops may not exist on Windows.
015. Rate limiting applied only to /api/ prefix; static file access unthrottled.
016. CORS origin default '*' with credentials true -> browsers will reject because wildcard plus credentials invalid; must set explicit origin.
017. express.json limit 10mb; large backups/uploads may exceed.
018. Error handler returns requestId req.id but does not include in headers/log correlation.
019. Unhandled promise rejections in routes not centrally caught; try/catch missing may crash process if awaiting transaction fails silently.
020. Database connection pool max 20; idle timeout 30s; connection timeout 2s; ok for small scale but adjust for production.
021. Migration script never enables extensions or schema versioning; rerun not idempotent for sequences insert but tables are.
022. Seed script exists utils/seed.js; check alignment with frontend seed data to avoid mismatched schemas.
023. Routes rely on CURRENT_DATE and CURRENT_TIMESTAMP server timezone; frontend uses local timezone; date drift possible.
024. No API versioning; base path /api/* may change; App.Api baseUrl '/api'.
025. No OpenAPI/Swagger docs; difficult for frontend integration testing.
026. No automated tests for API; no CI commands except .github/workflows/ci.yml placeholder maybe.
027. Backup encryption key env variable noted but not used in code shown.
028. Audit triggers set current_setting('app.current_user_id'); middleware sets this via SET per request; but pooled connections may leak setting across sessions unless reset at transaction boundaries.
029. audit_trigger_func logs old/new JSON including sensitive data; consider redaction.
030. orders DELETE allows only draft; good. No soft delete for customers, orders etc.
031. customers DELETE blocks when orders exist; uses COUNT(*) but not documents; may still delete active customers with documents only.
032. orders POST uses transaction but not SERIALIZABLE isolation; potential race when multiple orders consume same stock concurrently.
033. orders ship updates current_stock without checking negative result (except preceding check), but check uses stale stock if updated mid-transaction; locks product row but not component BOM.
034. Backup log table exists but no retention policy or status update flows shown.
035. CORS credentials true but no session cookies used; only bearer; may be unnecessary.
036. Helmet default disables frameguard etc but not custom contentSecurityPolicy; inline scripts allowed, leaving XSS risk.
037. No 2FA/mfa; login solely password.
038. bcrypt cost default 10 for user create and change; token hash cost 5; consider uniform cost with performance baseline.
039. auth/login writes sessions with expires_at but no cron to remove expired sessions; table may grow unbounded.
040. server/index.js uses compression + helmet; good but need trust proxy config if behind reverse proxy for IP logging.
041. Rate limit response message static; consider aligning with frontend toast handling.
042. ./server/.env example uses weak password '1234' and default DB user; should change before deployment.
043. No migration for pgcrypto extension or uuid-ossp; ensure installed manually.
044. Backup download likely writes to disk; ensure Windows path compatibility with default /var/backups path.
045. Customer number generation increments sequences but not wrapped per year; may need reset job.
046. Order number generation similar; concurrency safe via UPDATE, but table sequences table not locked by year per se.
047. Missing referential constraints for inventory_movements.item_id to products/components; data integrity risk.
048. No attachments/files table for documents; pdf_content stored inline; may bloat DB if used.
049. No email sending integration for invoices or notifications.
050. Server logs only 'Slow request' >1s; no structured logging; req.id only for error responses.
051. No graceful shutdown handling beyond SIGTERM closing pool; active requests not drained.
052. No smoke health for dependencies (disk, env) except /api/health running SELECT 1.

## Auth & Session Notes

001. Login screen populates user select from App.Data.users (seeded) and matches PIN exactly; no hashing or server verification.
002. Lock screen uses same PIN check via App.Services.Auth.unlock and App.Data users; bypassing backend entirely.
003. SessionManager (App) handles inactivity with warning and forced logout after timeoutMinutes 30; duplicates similar logic in App.Services.SessionManager with configurable lock after 15 minutes.
004. Manual logout and forceLogout both call Auth.initLoginScreen but do not clear App.Data or localStorage; user data persists across logins.
005. Session start logs Audit entries if App.Audit present; but App.Audit implementation not integrated with server API.
006. No CSRF protection; tokens not used; remote API expects Authorization header only.
007. Global keyboard shortcut ctrl+l locks screen but does not clear sensitive data or clipboard.
008. Auto-lock timer increments based on window activity; background tabs stay active if scripts keep events; might not lock when expected.
009. Auth._loginAttempts resets on page reload; brute force across reload allowed.
010. User roles: frontend recognizes admin, sales, warehouse, production, user (default) while backend routes expect admin, manager, sales, warehouse, readonly; mismatch leads to 403 if/when integrated.

## Page-by-Page Notes (auto-expanded templates; tune per implementation)

### Dashboard (dashboard)

- [Dashboard 01] Purpose: Home KPIs, alerts, quick actions.
- [Dashboard 02] Entry file: js/pages/dashboard.js defines App.UI.Views.Dashboard.render(root)
- [Dashboard 03] Route id 'dashboard' registered in sidebar and router; accessible via hash navigation.
- [Dashboard 04] Dataset expectation: App.Data.orders/documents (normalized in db.js). Ensure App.Api remote responses hydrate App.Data.
- [Dashboard 05] Remote API gap: App.Api.mode='remote' with missing Auth token will block server data; page currently relies on local seed.
- [Dashboard 06] Empty state handling should show friendly message; verify rowsHtml fallback.
- [Dashboard 07] Escaping: ensure App.Utils.escapeHtml wraps user-provided fields to avoid XSS.
- [Dashboard 08] Sorting/filtering uses client-side arrays; consider debounce and locale-aware comparisons.
- [Dashboard 09] Pagination: none; large datasets will render fully and hurt performance.
- [Dashboard 10] Search inputs: ensure query lowercasing handles null values to prevent errors.
- [Dashboard 11] Actions wired via inline onclick; convert to addEventListener to preserve CSP compatibility.
- [Dashboard 12] Role gating: Sidebar hides route if rolePermissions exclude it, but buttons inside page lack role checks.
- [Dashboard 13] Keyboard shortcut ctrl+n may call openModal/openCreateModal; confirm function exists to avoid toast 'No create action'.
- [Dashboard 14] Audit logging: no App.Audit.log calls on create/update/delete; add for traceability.
- [Dashboard 15] Validation: required fields need client-side checks; current code rarely enforces mandatory fields.
- [Dashboard 16] Number handling: inputs likely strings; parseFloat/parseInt needed before calculations.
- [Dashboard 17] Currency: rely on App.Utils.formatCurrency which reads App.Data.config.currency; ensure config loaded before render.
- [Dashboard 18] Date formatting: use App.Utils.formatDate? If not, ensure ISO strings handled consistently.
- [Dashboard 19] Loading state: no spinner when API operations in progress; App.UI.Loading available but unused here.
- [Dashboard 20] Error feedback: wrap API calls in try/catch and show App.UI.showError to inform user.
- [Dashboard 21] Data freshness: views read App.Data snapshot; no live sync after background changes.
- [Dashboard 22] Offline: local mutations saved immediately; reconcile with server once remote mode is functional to avoid conflicts.
- [Dashboard 23] Bulk actions: not implemented; consider multi-select for mass updates.
- [Dashboard 24] Export/import: check for export buttons; integrate with backend endpoints for CSV/PDF.
- [Dashboard 25] Print-ready layout: not provided; consider CSS print styles for this page.
- [Dashboard 26] Accessibility: add aria-labels, focus order, and keyboard navigation for tables and buttons.
- [Dashboard 27] Localization: ensure all visible strings go through App.I18n; some literals remain English.
- [Dashboard 28] Mobile layout: flex/grid may overflow; verify responsiveness on small screens.
- [Dashboard 29] State persistence: remember filters/sorts per user? currently not persisted.
- [Dashboard 30] Empty dataset risk: functions map over undefined arrays unless default []; guard thoroughly.
- [Dashboard 31] Performance: repeated App.DB.save calls after each change may freeze UI on large data.
- [Dashboard 32] Data integrity: ensure IDs generated by App.Utils.generateId do not clash with backend UUIDs when syncing.
- [Dashboard 33] Notifications: App.UI.Toast used for success; limit noise on batch operations.
- [Dashboard 34] Modals: ensure Modal.close resets forms; prevent memory leaks by clearing listeners on rerender.
- [Dashboard 35] Attachment handling: none; consider file inputs where relevant.
- [Dashboard 36] Filtering by status: check that string comparisons lowercased to avoid undefined.toLowerCase errors.
- [Dashboard 37] Clipboard/export shortcuts: ctrl+e not implemented per page; add listeners or disable.
- [Dashboard 38] Column alignment: ensure numeric columns right-aligned for readability.
- [Dashboard 39] Security: avoid exposing internal IDs in DOM data attributes if not needed.
- [Dashboard 40] Unsaved changes: no confirmation on navigation away from edited forms.
- [Dashboard 41] Test coverage: no automated tests; add unit tests per view once modularized.
- [Dashboard 42] Refactoring candidate: split view into smaller functions to improve maintainability.
- [Dashboard 43] Error boundaries: rely on global error handler; consider local try/catch for template rendering.
- [Dashboard 44] State duplication: some pages maintain activeTab or filters as static props; ensure reset on logout.
- [Dashboard 45] Consistency: ensure button styles align with theme.css and maintain accessible contrast.
- [Dashboard 46] Data import/export: align with App.DB.backup/import to avoid schema drift.
- [Dashboard 47] Server parity: ensure backend routes exist for this entity; some (purchaseOrders, batches) not implemented server-side yet.
- [Dashboard 48] Audit trail mapping: when backend is live, record entityId in audit log for this page's operations.
- [Dashboard 49] Edge cases: handle zero/negative quantities gracefully; avoid divide-by-zero in totals.
- [Dashboard 50] Date pickers: not evident; ensure HTML input type=date respects locale/timezone.
- [Dashboard 51] Search indexing: for large data, move to backend filtering once API integration ready.
- [Dashboard 52] Import validation: if file upload planned, add schema validation to prevent corrupting App.Data.
- [Dashboard 53] Auto-refresh: consider setInterval or manual refresh button to reload data after server sync.
- [Dashboard 54] Multi-user: local storage design is single-user; when multiple users edit same data, merges will conflict.
- [Dashboard 55] Theming: verify page uses CSS variables; avoid inline colors for consistent dark/light support.
- [Dashboard 56] Analytics: no tracking of user actions; consider minimal event log for audits.
- [Dashboard 57] Help text: add contextual tooltips linked to SUPPORT.md/HowToUse.md content.
- [Dashboard 58] Print/export numbering: align with sequences from backend to avoid duplicates.
- [Dashboard 59] Data retention: define cleanup/archival for old records shown on this page.
- [Dashboard 60] Error localization: map error messages through I18n instead of raw English.
- [Dashboard 61] Clipboard safety: ensure copying sensitive data (PINs, tokens) is avoided in UI.
- [Dashboard 62] Loading placeholders: skeletons/spinners to signal fetch progress once API wired.
- [Dashboard 63] Unit boundaries: confirm units (pcs, ml) displayed from dataset to avoid ambiguity.
- [Dashboard 64] Keyboard focus trap: modals should trap focus; ensure accessible order.
- [Dashboard 65] Search null safety: guard against undefined .toLowerCase on fields.
- [Dashboard 66] State cleanup on logout: clear this view's timers/subscriptions.
- [Dashboard 67] Offline backup: remind user to export backup after major edits on this page.
- [Dashboard 68] Next steps: document intended workflow for this page in HowToUse.md with screenshots.

### Inventory (inventory)

- [Inventory 01] Purpose: Stock overview by category tabs and components table.
- [Inventory 02] Entry file: js/pages/inventory.js defines App.UI.Views.Inventory.render(root)
- [Inventory 03] Route id 'inventory' registered in sidebar and router; accessible via hash navigation.
- [Inventory 04] Dataset expectation: App.Data.products/components (normalized in db.js). Ensure App.Api remote responses hydrate App.Data.
- [Inventory 05] Remote API gap: App.Api.mode='remote' with missing Auth token will block server data; page currently relies on local seed.
- [Inventory 06] Empty state handling should show friendly message; verify rowsHtml fallback.
- [Inventory 07] Escaping: ensure App.Utils.escapeHtml wraps user-provided fields to avoid XSS.
- [Inventory 08] Sorting/filtering uses client-side arrays; consider debounce and locale-aware comparisons.
- [Inventory 09] Pagination: none; large datasets will render fully and hurt performance.
- [Inventory 10] Search inputs: ensure query lowercasing handles null values to prevent errors.
- [Inventory 11] Actions wired via inline onclick; convert to addEventListener to preserve CSP compatibility.
- [Inventory 12] Role gating: Sidebar hides route if rolePermissions exclude it, but buttons inside page lack role checks.
- [Inventory 13] Keyboard shortcut ctrl+n may call openModal/openCreateModal; confirm function exists to avoid toast 'No create action'.
- [Inventory 14] Audit logging: no App.Audit.log calls on create/update/delete; add for traceability.
- [Inventory 15] Validation: required fields need client-side checks; current code rarely enforces mandatory fields.
- [Inventory 16] Number handling: inputs likely strings; parseFloat/parseInt needed before calculations.
- [Inventory 17] Currency: rely on App.Utils.formatCurrency which reads App.Data.config.currency; ensure config loaded before render.
- [Inventory 18] Date formatting: use App.Utils.formatDate? If not, ensure ISO strings handled consistently.
- [Inventory 19] Loading state: no spinner when API operations in progress; App.UI.Loading available but unused here.
- [Inventory 20] Error feedback: wrap API calls in try/catch and show App.UI.showError to inform user.
- [Inventory 21] Data freshness: views read App.Data snapshot; no live sync after background changes.
- [Inventory 22] Offline: local mutations saved immediately; reconcile with server once remote mode is functional to avoid conflicts.
- [Inventory 23] Bulk actions: not implemented; consider multi-select for mass updates.
- [Inventory 24] Export/import: check for export buttons; integrate with backend endpoints for CSV/PDF.
- [Inventory 25] Print-ready layout: not provided; consider CSS print styles for this page.
- [Inventory 26] Accessibility: add aria-labels, focus order, and keyboard navigation for tables and buttons.
- [Inventory 27] Localization: ensure all visible strings go through App.I18n; some literals remain English.
- [Inventory 28] Mobile layout: flex/grid may overflow; verify responsiveness on small screens.
- [Inventory 29] State persistence: remember filters/sorts per user? currently not persisted.
- [Inventory 30] Empty dataset risk: functions map over undefined arrays unless default []; guard thoroughly.
- [Inventory 31] Performance: repeated App.DB.save calls after each change may freeze UI on large data.
- [Inventory 32] Data integrity: ensure IDs generated by App.Utils.generateId do not clash with backend UUIDs when syncing.
- [Inventory 33] Notifications: App.UI.Toast used for success; limit noise on batch operations.
- [Inventory 34] Modals: ensure Modal.close resets forms; prevent memory leaks by clearing listeners on rerender.
- [Inventory 35] Attachment handling: none; consider file inputs where relevant.
- [Inventory 36] Filtering by status: check that string comparisons lowercased to avoid undefined.toLowerCase errors.
- [Inventory 37] Clipboard/export shortcuts: ctrl+e not implemented per page; add listeners or disable.
- [Inventory 38] Column alignment: ensure numeric columns right-aligned for readability.
- [Inventory 39] Security: avoid exposing internal IDs in DOM data attributes if not needed.
- [Inventory 40] Unsaved changes: no confirmation on navigation away from edited forms.
- [Inventory 41] Test coverage: no automated tests; add unit tests per view once modularized.
- [Inventory 42] Refactoring candidate: split view into smaller functions to improve maintainability.
- [Inventory 43] Error boundaries: rely on global error handler; consider local try/catch for template rendering.
- [Inventory 44] State duplication: some pages maintain activeTab or filters as static props; ensure reset on logout.
- [Inventory 45] Consistency: ensure button styles align with theme.css and maintain accessible contrast.
- [Inventory 46] Data import/export: align with App.DB.backup/import to avoid schema drift.
- [Inventory 47] Server parity: ensure backend routes exist for this entity; some (purchaseOrders, batches) not implemented server-side yet.
- [Inventory 48] Audit trail mapping: when backend is live, record entityId in audit log for this page's operations.
- [Inventory 49] Edge cases: handle zero/negative quantities gracefully; avoid divide-by-zero in totals.
- [Inventory 50] Date pickers: not evident; ensure HTML input type=date respects locale/timezone.
- [Inventory 51] Search indexing: for large data, move to backend filtering once API integration ready.
- [Inventory 52] Import validation: if file upload planned, add schema validation to prevent corrupting App.Data.
- [Inventory 53] Auto-refresh: consider setInterval or manual refresh button to reload data after server sync.
- [Inventory 54] Multi-user: local storage design is single-user; when multiple users edit same data, merges will conflict.
- [Inventory 55] Theming: verify page uses CSS variables; avoid inline colors for consistent dark/light support.
- [Inventory 56] Analytics: no tracking of user actions; consider minimal event log for audits.
- [Inventory 57] Help text: add contextual tooltips linked to SUPPORT.md/HowToUse.md content.
- [Inventory 58] Print/export numbering: align with sequences from backend to avoid duplicates.
- [Inventory 59] Data retention: define cleanup/archival for old records shown on this page.
- [Inventory 60] Error localization: map error messages through I18n instead of raw English.
- [Inventory 61] Clipboard safety: ensure copying sensitive data (PINs, tokens) is avoided in UI.
- [Inventory 62] Loading placeholders: skeletons/spinners to signal fetch progress once API wired.
- [Inventory 63] Unit boundaries: confirm units (pcs, ml) displayed from dataset to avoid ambiguity.
- [Inventory 64] Keyboard focus trap: modals should trap focus; ensure accessible order.
- [Inventory 65] Search null safety: guard against undefined .toLowerCase on fields.
- [Inventory 66] State cleanup on logout: clear this view's timers/subscriptions.
- [Inventory 67] Offline backup: remind user to export backup after major edits on this page.
- [Inventory 68] Next steps: document intended workflow for this page in HowToUse.md with screenshots.

### Customers (customers)

- [Customers 01] Purpose: Customer master data grid and modal forms.
- [Customers 02] Entry file: js/pages/customers.js defines App.UI.Views.Customers.render(root)
- [Customers 03] Route id 'customers' registered in sidebar and router; accessible via hash navigation.
- [Customers 04] Dataset expectation: App.Data.customers (normalized in db.js). Ensure App.Api remote responses hydrate App.Data.
- [Customers 05] Remote API gap: App.Api.mode='remote' with missing Auth token will block server data; page currently relies on local seed.
- [Customers 06] Empty state handling should show friendly message; verify rowsHtml fallback.
- [Customers 07] Escaping: ensure App.Utils.escapeHtml wraps user-provided fields to avoid XSS.
- [Customers 08] Sorting/filtering uses client-side arrays; consider debounce and locale-aware comparisons.
- [Customers 09] Pagination: none; large datasets will render fully and hurt performance.
- [Customers 10] Search inputs: ensure query lowercasing handles null values to prevent errors.
- [Customers 11] Actions wired via inline onclick; convert to addEventListener to preserve CSP compatibility.
- [Customers 12] Role gating: Sidebar hides route if rolePermissions exclude it, but buttons inside page lack role checks.
- [Customers 13] Keyboard shortcut ctrl+n may call openModal/openCreateModal; confirm function exists to avoid toast 'No create action'.
- [Customers 14] Audit logging: no App.Audit.log calls on create/update/delete; add for traceability.
- [Customers 15] Validation: required fields need client-side checks; current code rarely enforces mandatory fields.
- [Customers 16] Number handling: inputs likely strings; parseFloat/parseInt needed before calculations.
- [Customers 17] Currency: rely on App.Utils.formatCurrency which reads App.Data.config.currency; ensure config loaded before render.
- [Customers 18] Date formatting: use App.Utils.formatDate? If not, ensure ISO strings handled consistently.
- [Customers 19] Loading state: no spinner when API operations in progress; App.UI.Loading available but unused here.
- [Customers 20] Error feedback: wrap API calls in try/catch and show App.UI.showError to inform user.
- [Customers 21] Data freshness: views read App.Data snapshot; no live sync after background changes.
- [Customers 22] Offline: local mutations saved immediately; reconcile with server once remote mode is functional to avoid conflicts.
- [Customers 23] Bulk actions: not implemented; consider multi-select for mass updates.
- [Customers 24] Export/import: check for export buttons; integrate with backend endpoints for CSV/PDF.
- [Customers 25] Print-ready layout: not provided; consider CSS print styles for this page.
- [Customers 26] Accessibility: add aria-labels, focus order, and keyboard navigation for tables and buttons.
- [Customers 27] Localization: ensure all visible strings go through App.I18n; some literals remain English.
- [Customers 28] Mobile layout: flex/grid may overflow; verify responsiveness on small screens.
- [Customers 29] State persistence: remember filters/sorts per user? currently not persisted.
- [Customers 30] Empty dataset risk: functions map over undefined arrays unless default []; guard thoroughly.
- [Customers 31] Performance: repeated App.DB.save calls after each change may freeze UI on large data.
- [Customers 32] Data integrity: ensure IDs generated by App.Utils.generateId do not clash with backend UUIDs when syncing.
- [Customers 33] Notifications: App.UI.Toast used for success; limit noise on batch operations.
- [Customers 34] Modals: ensure Modal.close resets forms; prevent memory leaks by clearing listeners on rerender.
- [Customers 35] Attachment handling: none; consider file inputs where relevant.
- [Customers 36] Filtering by status: check that string comparisons lowercased to avoid undefined.toLowerCase errors.
- [Customers 37] Clipboard/export shortcuts: ctrl+e not implemented per page; add listeners or disable.
- [Customers 38] Column alignment: ensure numeric columns right-aligned for readability.
- [Customers 39] Security: avoid exposing internal IDs in DOM data attributes if not needed.
- [Customers 40] Unsaved changes: no confirmation on navigation away from edited forms.
- [Customers 41] Test coverage: no automated tests; add unit tests per view once modularized.
- [Customers 42] Refactoring candidate: split view into smaller functions to improve maintainability.
- [Customers 43] Error boundaries: rely on global error handler; consider local try/catch for template rendering.
- [Customers 44] State duplication: some pages maintain activeTab or filters as static props; ensure reset on logout.
- [Customers 45] Consistency: ensure button styles align with theme.css and maintain accessible contrast.
- [Customers 46] Data import/export: align with App.DB.backup/import to avoid schema drift.
- [Customers 47] Server parity: ensure backend routes exist for this entity; some (purchaseOrders, batches) not implemented server-side yet.
- [Customers 48] Audit trail mapping: when backend is live, record entityId in audit log for this page's operations.
- [Customers 49] Edge cases: handle zero/negative quantities gracefully; avoid divide-by-zero in totals.
- [Customers 50] Date pickers: not evident; ensure HTML input type=date respects locale/timezone.
- [Customers 51] Search indexing: for large data, move to backend filtering once API integration ready.
- [Customers 52] Import validation: if file upload planned, add schema validation to prevent corrupting App.Data.
- [Customers 53] Auto-refresh: consider setInterval or manual refresh button to reload data after server sync.
- [Customers 54] Multi-user: local storage design is single-user; when multiple users edit same data, merges will conflict.
- [Customers 55] Theming: verify page uses CSS variables; avoid inline colors for consistent dark/light support.
- [Customers 56] Analytics: no tracking of user actions; consider minimal event log for audits.
- [Customers 57] Help text: add contextual tooltips linked to SUPPORT.md/HowToUse.md content.
- [Customers 58] Print/export numbering: align with sequences from backend to avoid duplicates.
- [Customers 59] Data retention: define cleanup/archival for old records shown on this page.
- [Customers 60] Error localization: map error messages through I18n instead of raw English.
- [Customers 61] Clipboard safety: ensure copying sensitive data (PINs, tokens) is avoided in UI.
- [Customers 62] Loading placeholders: skeletons/spinners to signal fetch progress once API wired.
- [Customers 63] Unit boundaries: confirm units (pcs, ml) displayed from dataset to avoid ambiguity.
- [Customers 64] Keyboard focus trap: modals should trap focus; ensure accessible order.
- [Customers 65] Search null safety: guard against undefined .toLowerCase on fields.
- [Customers 66] State cleanup on logout: clear this view's timers/subscriptions.
- [Customers 67] Offline backup: remind user to export backup after major edits on this page.
- [Customers 68] Next steps: document intended workflow for this page in HowToUse.md with screenshots.

### Products (products)

- [Products 01] Purpose: Product catalogue including pricing and stock levels.
- [Products 02] Entry file: js/pages/products.js defines App.UI.Views.Products.render(root)
- [Products 03] Route id 'products' registered in sidebar and router; accessible via hash navigation.
- [Products 04] Dataset expectation: App.Data.products (normalized in db.js). Ensure App.Api remote responses hydrate App.Data.
- [Products 05] Remote API gap: App.Api.mode='remote' with missing Auth token will block server data; page currently relies on local seed.
- [Products 06] Empty state handling should show friendly message; verify rowsHtml fallback.
- [Products 07] Escaping: ensure App.Utils.escapeHtml wraps user-provided fields to avoid XSS.
- [Products 08] Sorting/filtering uses client-side arrays; consider debounce and locale-aware comparisons.
- [Products 09] Pagination: none; large datasets will render fully and hurt performance.
- [Products 10] Search inputs: ensure query lowercasing handles null values to prevent errors.
- [Products 11] Actions wired via inline onclick; convert to addEventListener to preserve CSP compatibility.
- [Products 12] Role gating: Sidebar hides route if rolePermissions exclude it, but buttons inside page lack role checks.
- [Products 13] Keyboard shortcut ctrl+n may call openModal/openCreateModal; confirm function exists to avoid toast 'No create action'.
- [Products 14] Audit logging: no App.Audit.log calls on create/update/delete; add for traceability.
- [Products 15] Validation: required fields need client-side checks; current code rarely enforces mandatory fields.
- [Products 16] Number handling: inputs likely strings; parseFloat/parseInt needed before calculations.
- [Products 17] Currency: rely on App.Utils.formatCurrency which reads App.Data.config.currency; ensure config loaded before render.
- [Products 18] Date formatting: use App.Utils.formatDate? If not, ensure ISO strings handled consistently.
- [Products 19] Loading state: no spinner when API operations in progress; App.UI.Loading available but unused here.
- [Products 20] Error feedback: wrap API calls in try/catch and show App.UI.showError to inform user.
- [Products 21] Data freshness: views read App.Data snapshot; no live sync after background changes.
- [Products 22] Offline: local mutations saved immediately; reconcile with server once remote mode is functional to avoid conflicts.
- [Products 23] Bulk actions: not implemented; consider multi-select for mass updates.
- [Products 24] Export/import: check for export buttons; integrate with backend endpoints for CSV/PDF.
- [Products 25] Print-ready layout: not provided; consider CSS print styles for this page.
- [Products 26] Accessibility: add aria-labels, focus order, and keyboard navigation for tables and buttons.
- [Products 27] Localization: ensure all visible strings go through App.I18n; some literals remain English.
- [Products 28] Mobile layout: flex/grid may overflow; verify responsiveness on small screens.
- [Products 29] State persistence: remember filters/sorts per user? currently not persisted.
- [Products 30] Empty dataset risk: functions map over undefined arrays unless default []; guard thoroughly.
- [Products 31] Performance: repeated App.DB.save calls after each change may freeze UI on large data.
- [Products 32] Data integrity: ensure IDs generated by App.Utils.generateId do not clash with backend UUIDs when syncing.
- [Products 33] Notifications: App.UI.Toast used for success; limit noise on batch operations.
- [Products 34] Modals: ensure Modal.close resets forms; prevent memory leaks by clearing listeners on rerender.
- [Products 35] Attachment handling: none; consider file inputs where relevant.
- [Products 36] Filtering by status: check that string comparisons lowercased to avoid undefined.toLowerCase errors.
- [Products 37] Clipboard/export shortcuts: ctrl+e not implemented per page; add listeners or disable.
- [Products 38] Column alignment: ensure numeric columns right-aligned for readability.
- [Products 39] Security: avoid exposing internal IDs in DOM data attributes if not needed.
- [Products 40] Unsaved changes: no confirmation on navigation away from edited forms.
- [Products 41] Test coverage: no automated tests; add unit tests per view once modularized.
- [Products 42] Refactoring candidate: split view into smaller functions to improve maintainability.
- [Products 43] Error boundaries: rely on global error handler; consider local try/catch for template rendering.
- [Products 44] State duplication: some pages maintain activeTab or filters as static props; ensure reset on logout.
- [Products 45] Consistency: ensure button styles align with theme.css and maintain accessible contrast.
- [Products 46] Data import/export: align with App.DB.backup/import to avoid schema drift.
- [Products 47] Server parity: ensure backend routes exist for this entity; some (purchaseOrders, batches) not implemented server-side yet.
- [Products 48] Audit trail mapping: when backend is live, record entityId in audit log for this page's operations.
- [Products 49] Edge cases: handle zero/negative quantities gracefully; avoid divide-by-zero in totals.
- [Products 50] Date pickers: not evident; ensure HTML input type=date respects locale/timezone.
- [Products 51] Search indexing: for large data, move to backend filtering once API integration ready.
- [Products 52] Import validation: if file upload planned, add schema validation to prevent corrupting App.Data.
- [Products 53] Auto-refresh: consider setInterval or manual refresh button to reload data after server sync.
- [Products 54] Multi-user: local storage design is single-user; when multiple users edit same data, merges will conflict.
- [Products 55] Theming: verify page uses CSS variables; avoid inline colors for consistent dark/light support.
- [Products 56] Analytics: no tracking of user actions; consider minimal event log for audits.
- [Products 57] Help text: add contextual tooltips linked to SUPPORT.md/HowToUse.md content.
- [Products 58] Print/export numbering: align with sequences from backend to avoid duplicates.
- [Products 59] Data retention: define cleanup/archival for old records shown on this page.
- [Products 60] Error localization: map error messages through I18n instead of raw English.
- [Products 61] Clipboard safety: ensure copying sensitive data (PINs, tokens) is avoided in UI.
- [Products 62] Loading placeholders: skeletons/spinners to signal fetch progress once API wired.
- [Products 63] Unit boundaries: confirm units (pcs, ml) displayed from dataset to avoid ambiguity.
- [Products 64] Keyboard focus trap: modals should trap focus; ensure accessible order.
- [Products 65] Search null safety: guard against undefined .toLowerCase on fields.
- [Products 66] State cleanup on logout: clear this view's timers/subscriptions.
- [Products 67] Offline backup: remind user to export backup after major edits on this page.
- [Products 68] Next steps: document intended workflow for this page in HowToUse.md with screenshots.

### Components (components)

- [Components 01] Purpose: BOM component list, safety stock handling.
- [Components 02] Entry file: js/pages/components.js defines App.UI.Views.Components.render(root)
- [Components 03] Route id 'components' registered in sidebar and router; accessible via hash navigation.
- [Components 04] Dataset expectation: App.Data.components (normalized in db.js). Ensure App.Api remote responses hydrate App.Data.
- [Components 05] Remote API gap: App.Api.mode='remote' with missing Auth token will block server data; page currently relies on local seed.
- [Components 06] Empty state handling should show friendly message; verify rowsHtml fallback.
- [Components 07] Escaping: ensure App.Utils.escapeHtml wraps user-provided fields to avoid XSS.
- [Components 08] Sorting/filtering uses client-side arrays; consider debounce and locale-aware comparisons.
- [Components 09] Pagination: none; large datasets will render fully and hurt performance.
- [Components 10] Search inputs: ensure query lowercasing handles null values to prevent errors.
- [Components 11] Actions wired via inline onclick; convert to addEventListener to preserve CSP compatibility.
- [Components 12] Role gating: Sidebar hides route if rolePermissions exclude it, but buttons inside page lack role checks.
- [Components 13] Keyboard shortcut ctrl+n may call openModal/openCreateModal; confirm function exists to avoid toast 'No create action'.
- [Components 14] Audit logging: no App.Audit.log calls on create/update/delete; add for traceability.
- [Components 15] Validation: required fields need client-side checks; current code rarely enforces mandatory fields.
- [Components 16] Number handling: inputs likely strings; parseFloat/parseInt needed before calculations.
- [Components 17] Currency: rely on App.Utils.formatCurrency which reads App.Data.config.currency; ensure config loaded before render.
- [Components 18] Date formatting: use App.Utils.formatDate? If not, ensure ISO strings handled consistently.
- [Components 19] Loading state: no spinner when API operations in progress; App.UI.Loading available but unused here.
- [Components 20] Error feedback: wrap API calls in try/catch and show App.UI.showError to inform user.
- [Components 21] Data freshness: views read App.Data snapshot; no live sync after background changes.
- [Components 22] Offline: local mutations saved immediately; reconcile with server once remote mode is functional to avoid conflicts.
- [Components 23] Bulk actions: not implemented; consider multi-select for mass updates.
- [Components 24] Export/import: check for export buttons; integrate with backend endpoints for CSV/PDF.
- [Components 25] Print-ready layout: not provided; consider CSS print styles for this page.
- [Components 26] Accessibility: add aria-labels, focus order, and keyboard navigation for tables and buttons.
- [Components 27] Localization: ensure all visible strings go through App.I18n; some literals remain English.
- [Components 28] Mobile layout: flex/grid may overflow; verify responsiveness on small screens.
- [Components 29] State persistence: remember filters/sorts per user? currently not persisted.
- [Components 30] Empty dataset risk: functions map over undefined arrays unless default []; guard thoroughly.
- [Components 31] Performance: repeated App.DB.save calls after each change may freeze UI on large data.
- [Components 32] Data integrity: ensure IDs generated by App.Utils.generateId do not clash with backend UUIDs when syncing.
- [Components 33] Notifications: App.UI.Toast used for success; limit noise on batch operations.
- [Components 34] Modals: ensure Modal.close resets forms; prevent memory leaks by clearing listeners on rerender.
- [Components 35] Attachment handling: none; consider file inputs where relevant.
- [Components 36] Filtering by status: check that string comparisons lowercased to avoid undefined.toLowerCase errors.
- [Components 37] Clipboard/export shortcuts: ctrl+e not implemented per page; add listeners or disable.
- [Components 38] Column alignment: ensure numeric columns right-aligned for readability.
- [Components 39] Security: avoid exposing internal IDs in DOM data attributes if not needed.
- [Components 40] Unsaved changes: no confirmation on navigation away from edited forms.
- [Components 41] Test coverage: no automated tests; add unit tests per view once modularized.
- [Components 42] Refactoring candidate: split view into smaller functions to improve maintainability.
- [Components 43] Error boundaries: rely on global error handler; consider local try/catch for template rendering.
- [Components 44] State duplication: some pages maintain activeTab or filters as static props; ensure reset on logout.
- [Components 45] Consistency: ensure button styles align with theme.css and maintain accessible contrast.
- [Components 46] Data import/export: align with App.DB.backup/import to avoid schema drift.
- [Components 47] Server parity: ensure backend routes exist for this entity; some (purchaseOrders, batches) not implemented server-side yet.
- [Components 48] Audit trail mapping: when backend is live, record entityId in audit log for this page's operations.
- [Components 49] Edge cases: handle zero/negative quantities gracefully; avoid divide-by-zero in totals.
- [Components 50] Date pickers: not evident; ensure HTML input type=date respects locale/timezone.
- [Components 51] Search indexing: for large data, move to backend filtering once API integration ready.
- [Components 52] Import validation: if file upload planned, add schema validation to prevent corrupting App.Data.
- [Components 53] Auto-refresh: consider setInterval or manual refresh button to reload data after server sync.
- [Components 54] Multi-user: local storage design is single-user; when multiple users edit same data, merges will conflict.
- [Components 55] Theming: verify page uses CSS variables; avoid inline colors for consistent dark/light support.
- [Components 56] Analytics: no tracking of user actions; consider minimal event log for audits.
- [Components 57] Help text: add contextual tooltips linked to SUPPORT.md/HowToUse.md content.
- [Components 58] Print/export numbering: align with sequences from backend to avoid duplicates.
- [Components 59] Data retention: define cleanup/archival for old records shown on this page.
- [Components 60] Error localization: map error messages through I18n instead of raw English.
- [Components 61] Clipboard safety: ensure copying sensitive data (PINs, tokens) is avoided in UI.
- [Components 62] Loading placeholders: skeletons/spinners to signal fetch progress once API wired.
- [Components 63] Unit boundaries: confirm units (pcs, ml) displayed from dataset to avoid ambiguity.
- [Components 64] Keyboard focus trap: modals should trap focus; ensure accessible order.
- [Components 65] Search null safety: guard against undefined .toLowerCase on fields.
- [Components 66] State cleanup on logout: clear this view's timers/subscriptions.
- [Components 67] Offline backup: remind user to export backup after major edits on this page.
- [Components 68] Next steps: document intended workflow for this page in HowToUse.md with screenshots.

### Suppliers (suppliers)

- [Suppliers 01] Purpose: Vendor records for purchasing.
- [Suppliers 02] Entry file: js/pages/suppliers.js defines App.UI.Views.Suppliers.render(root)
- [Suppliers 03] Route id 'suppliers' registered in sidebar and router; accessible via hash navigation.
- [Suppliers 04] Dataset expectation: App.Data.suppliers (normalized in db.js). Ensure App.Api remote responses hydrate App.Data.
- [Suppliers 05] Remote API gap: App.Api.mode='remote' with missing Auth token will block server data; page currently relies on local seed.
- [Suppliers 06] Empty state handling should show friendly message; verify rowsHtml fallback.
- [Suppliers 07] Escaping: ensure App.Utils.escapeHtml wraps user-provided fields to avoid XSS.
- [Suppliers 08] Sorting/filtering uses client-side arrays; consider debounce and locale-aware comparisons.
- [Suppliers 09] Pagination: none; large datasets will render fully and hurt performance.
- [Suppliers 10] Search inputs: ensure query lowercasing handles null values to prevent errors.
- [Suppliers 11] Actions wired via inline onclick; convert to addEventListener to preserve CSP compatibility.
- [Suppliers 12] Role gating: Sidebar hides route if rolePermissions exclude it, but buttons inside page lack role checks.
- [Suppliers 13] Keyboard shortcut ctrl+n may call openModal/openCreateModal; confirm function exists to avoid toast 'No create action'.
- [Suppliers 14] Audit logging: no App.Audit.log calls on create/update/delete; add for traceability.
- [Suppliers 15] Validation: required fields need client-side checks; current code rarely enforces mandatory fields.
- [Suppliers 16] Number handling: inputs likely strings; parseFloat/parseInt needed before calculations.
- [Suppliers 17] Currency: rely on App.Utils.formatCurrency which reads App.Data.config.currency; ensure config loaded before render.
- [Suppliers 18] Date formatting: use App.Utils.formatDate? If not, ensure ISO strings handled consistently.
- [Suppliers 19] Loading state: no spinner when API operations in progress; App.UI.Loading available but unused here.
- [Suppliers 20] Error feedback: wrap API calls in try/catch and show App.UI.showError to inform user.
- [Suppliers 21] Data freshness: views read App.Data snapshot; no live sync after background changes.
- [Suppliers 22] Offline: local mutations saved immediately; reconcile with server once remote mode is functional to avoid conflicts.
- [Suppliers 23] Bulk actions: not implemented; consider multi-select for mass updates.
- [Suppliers 24] Export/import: check for export buttons; integrate with backend endpoints for CSV/PDF.
- [Suppliers 25] Print-ready layout: not provided; consider CSS print styles for this page.
- [Suppliers 26] Accessibility: add aria-labels, focus order, and keyboard navigation for tables and buttons.
- [Suppliers 27] Localization: ensure all visible strings go through App.I18n; some literals remain English.
- [Suppliers 28] Mobile layout: flex/grid may overflow; verify responsiveness on small screens.
- [Suppliers 29] State persistence: remember filters/sorts per user? currently not persisted.
- [Suppliers 30] Empty dataset risk: functions map over undefined arrays unless default []; guard thoroughly.
- [Suppliers 31] Performance: repeated App.DB.save calls after each change may freeze UI on large data.
- [Suppliers 32] Data integrity: ensure IDs generated by App.Utils.generateId do not clash with backend UUIDs when syncing.
- [Suppliers 33] Notifications: App.UI.Toast used for success; limit noise on batch operations.
- [Suppliers 34] Modals: ensure Modal.close resets forms; prevent memory leaks by clearing listeners on rerender.
- [Suppliers 35] Attachment handling: none; consider file inputs where relevant.
- [Suppliers 36] Filtering by status: check that string comparisons lowercased to avoid undefined.toLowerCase errors.
- [Suppliers 37] Clipboard/export shortcuts: ctrl+e not implemented per page; add listeners or disable.
- [Suppliers 38] Column alignment: ensure numeric columns right-aligned for readability.
- [Suppliers 39] Security: avoid exposing internal IDs in DOM data attributes if not needed.
- [Suppliers 40] Unsaved changes: no confirmation on navigation away from edited forms.
- [Suppliers 41] Test coverage: no automated tests; add unit tests per view once modularized.
- [Suppliers 42] Refactoring candidate: split view into smaller functions to improve maintainability.
- [Suppliers 43] Error boundaries: rely on global error handler; consider local try/catch for template rendering.
- [Suppliers 44] State duplication: some pages maintain activeTab or filters as static props; ensure reset on logout.
- [Suppliers 45] Consistency: ensure button styles align with theme.css and maintain accessible contrast.
- [Suppliers 46] Data import/export: align with App.DB.backup/import to avoid schema drift.
- [Suppliers 47] Server parity: ensure backend routes exist for this entity; some (purchaseOrders, batches) not implemented server-side yet.
- [Suppliers 48] Audit trail mapping: when backend is live, record entityId in audit log for this page's operations.
- [Suppliers 49] Edge cases: handle zero/negative quantities gracefully; avoid divide-by-zero in totals.
- [Suppliers 50] Date pickers: not evident; ensure HTML input type=date respects locale/timezone.
- [Suppliers 51] Search indexing: for large data, move to backend filtering once API integration ready.
- [Suppliers 52] Import validation: if file upload planned, add schema validation to prevent corrupting App.Data.
- [Suppliers 53] Auto-refresh: consider setInterval or manual refresh button to reload data after server sync.
- [Suppliers 54] Multi-user: local storage design is single-user; when multiple users edit same data, merges will conflict.
- [Suppliers 55] Theming: verify page uses CSS variables; avoid inline colors for consistent dark/light support.
- [Suppliers 56] Analytics: no tracking of user actions; consider minimal event log for audits.
- [Suppliers 57] Help text: add contextual tooltips linked to SUPPORT.md/HowToUse.md content.
- [Suppliers 58] Print/export numbering: align with sequences from backend to avoid duplicates.
- [Suppliers 59] Data retention: define cleanup/archival for old records shown on this page.
- [Suppliers 60] Error localization: map error messages through I18n instead of raw English.
- [Suppliers 61] Clipboard safety: ensure copying sensitive data (PINs, tokens) is avoided in UI.
- [Suppliers 62] Loading placeholders: skeletons/spinners to signal fetch progress once API wired.
- [Suppliers 63] Unit boundaries: confirm units (pcs, ml) displayed from dataset to avoid ambiguity.
- [Suppliers 64] Keyboard focus trap: modals should trap focus; ensure accessible order.
- [Suppliers 65] Search null safety: guard against undefined .toLowerCase on fields.
- [Suppliers 66] State cleanup on logout: clear this view's timers/subscriptions.
- [Suppliers 67] Offline backup: remind user to export backup after major edits on this page.
- [Suppliers 68] Next steps: document intended workflow for this page in HowToUse.md with screenshots.

### Carriers (carriers)

- [Carriers 01] Purpose: Logistics partner registry.
- [Carriers 02] Entry file: js/pages/carriers.js defines App.UI.Views.Carriers.render(root)
- [Carriers 03] Route id 'carriers' registered in sidebar and router; accessible via hash navigation.
- [Carriers 04] Dataset expectation: App.Data.carriers (normalized in db.js). Ensure App.Api remote responses hydrate App.Data.
- [Carriers 05] Remote API gap: App.Api.mode='remote' with missing Auth token will block server data; page currently relies on local seed.
- [Carriers 06] Empty state handling should show friendly message; verify rowsHtml fallback.
- [Carriers 07] Escaping: ensure App.Utils.escapeHtml wraps user-provided fields to avoid XSS.
- [Carriers 08] Sorting/filtering uses client-side arrays; consider debounce and locale-aware comparisons.
- [Carriers 09] Pagination: none; large datasets will render fully and hurt performance.
- [Carriers 10] Search inputs: ensure query lowercasing handles null values to prevent errors.
- [Carriers 11] Actions wired via inline onclick; convert to addEventListener to preserve CSP compatibility.
- [Carriers 12] Role gating: Sidebar hides route if rolePermissions exclude it, but buttons inside page lack role checks.
- [Carriers 13] Keyboard shortcut ctrl+n may call openModal/openCreateModal; confirm function exists to avoid toast 'No create action'.
- [Carriers 14] Audit logging: no App.Audit.log calls on create/update/delete; add for traceability.
- [Carriers 15] Validation: required fields need client-side checks; current code rarely enforces mandatory fields.
- [Carriers 16] Number handling: inputs likely strings; parseFloat/parseInt needed before calculations.
- [Carriers 17] Currency: rely on App.Utils.formatCurrency which reads App.Data.config.currency; ensure config loaded before render.
- [Carriers 18] Date formatting: use App.Utils.formatDate? If not, ensure ISO strings handled consistently.
- [Carriers 19] Loading state: no spinner when API operations in progress; App.UI.Loading available but unused here.
- [Carriers 20] Error feedback: wrap API calls in try/catch and show App.UI.showError to inform user.
- [Carriers 21] Data freshness: views read App.Data snapshot; no live sync after background changes.
- [Carriers 22] Offline: local mutations saved immediately; reconcile with server once remote mode is functional to avoid conflicts.
- [Carriers 23] Bulk actions: not implemented; consider multi-select for mass updates.
- [Carriers 24] Export/import: check for export buttons; integrate with backend endpoints for CSV/PDF.
- [Carriers 25] Print-ready layout: not provided; consider CSS print styles for this page.
- [Carriers 26] Accessibility: add aria-labels, focus order, and keyboard navigation for tables and buttons.
- [Carriers 27] Localization: ensure all visible strings go through App.I18n; some literals remain English.
- [Carriers 28] Mobile layout: flex/grid may overflow; verify responsiveness on small screens.
- [Carriers 29] State persistence: remember filters/sorts per user? currently not persisted.
- [Carriers 30] Empty dataset risk: functions map over undefined arrays unless default []; guard thoroughly.
- [Carriers 31] Performance: repeated App.DB.save calls after each change may freeze UI on large data.
- [Carriers 32] Data integrity: ensure IDs generated by App.Utils.generateId do not clash with backend UUIDs when syncing.
- [Carriers 33] Notifications: App.UI.Toast used for success; limit noise on batch operations.
- [Carriers 34] Modals: ensure Modal.close resets forms; prevent memory leaks by clearing listeners on rerender.
- [Carriers 35] Attachment handling: none; consider file inputs where relevant.
- [Carriers 36] Filtering by status: check that string comparisons lowercased to avoid undefined.toLowerCase errors.
- [Carriers 37] Clipboard/export shortcuts: ctrl+e not implemented per page; add listeners or disable.
- [Carriers 38] Column alignment: ensure numeric columns right-aligned for readability.
- [Carriers 39] Security: avoid exposing internal IDs in DOM data attributes if not needed.
- [Carriers 40] Unsaved changes: no confirmation on navigation away from edited forms.
- [Carriers 41] Test coverage: no automated tests; add unit tests per view once modularized.
- [Carriers 42] Refactoring candidate: split view into smaller functions to improve maintainability.
- [Carriers 43] Error boundaries: rely on global error handler; consider local try/catch for template rendering.
- [Carriers 44] State duplication: some pages maintain activeTab or filters as static props; ensure reset on logout.
- [Carriers 45] Consistency: ensure button styles align with theme.css and maintain accessible contrast.
- [Carriers 46] Data import/export: align with App.DB.backup/import to avoid schema drift.
- [Carriers 47] Server parity: ensure backend routes exist for this entity; some (purchaseOrders, batches) not implemented server-side yet.
- [Carriers 48] Audit trail mapping: when backend is live, record entityId in audit log for this page's operations.
- [Carriers 49] Edge cases: handle zero/negative quantities gracefully; avoid divide-by-zero in totals.
- [Carriers 50] Date pickers: not evident; ensure HTML input type=date respects locale/timezone.
- [Carriers 51] Search indexing: for large data, move to backend filtering once API integration ready.
- [Carriers 52] Import validation: if file upload planned, add schema validation to prevent corrupting App.Data.
- [Carriers 53] Auto-refresh: consider setInterval or manual refresh button to reload data after server sync.
- [Carriers 54] Multi-user: local storage design is single-user; when multiple users edit same data, merges will conflict.
- [Carriers 55] Theming: verify page uses CSS variables; avoid inline colors for consistent dark/light support.
- [Carriers 56] Analytics: no tracking of user actions; consider minimal event log for audits.
- [Carriers 57] Help text: add contextual tooltips linked to SUPPORT.md/HowToUse.md content.
- [Carriers 58] Print/export numbering: align with sequences from backend to avoid duplicates.
- [Carriers 59] Data retention: define cleanup/archival for old records shown on this page.
- [Carriers 60] Error localization: map error messages through I18n instead of raw English.
- [Carriers 61] Clipboard safety: ensure copying sensitive data (PINs, tokens) is avoided in UI.
- [Carriers 62] Loading placeholders: skeletons/spinners to signal fetch progress once API wired.
- [Carriers 63] Unit boundaries: confirm units (pcs, ml) displayed from dataset to avoid ambiguity.
- [Carriers 64] Keyboard focus trap: modals should trap focus; ensure accessible order.
- [Carriers 65] Search null safety: guard against undefined .toLowerCase on fields.
- [Carriers 66] State cleanup on logout: clear this view's timers/subscriptions.
- [Carriers 67] Offline backup: remind user to export backup after major edits on this page.
- [Carriers 68] Next steps: document intended workflow for this page in HowToUse.md with screenshots.

### Pricing (pricing)

- [Pricing 01] Purpose: Price list maintenance per customer/segment.
- [Pricing 02] Entry file: js/pages/pricing.js defines App.UI.Views.Pricing.render(root)
- [Pricing 03] Route id 'pricing' registered in sidebar and router; accessible via hash navigation.
- [Pricing 04] Dataset expectation: App.Data.priceLists (normalized in db.js). Ensure App.Api remote responses hydrate App.Data.
- [Pricing 05] Remote API gap: App.Api.mode='remote' with missing Auth token will block server data; page currently relies on local seed.
- [Pricing 06] Empty state handling should show friendly message; verify rowsHtml fallback.
- [Pricing 07] Escaping: ensure App.Utils.escapeHtml wraps user-provided fields to avoid XSS.
- [Pricing 08] Sorting/filtering uses client-side arrays; consider debounce and locale-aware comparisons.
- [Pricing 09] Pagination: none; large datasets will render fully and hurt performance.
- [Pricing 10] Search inputs: ensure query lowercasing handles null values to prevent errors.
- [Pricing 11] Actions wired via inline onclick; convert to addEventListener to preserve CSP compatibility.
- [Pricing 12] Role gating: Sidebar hides route if rolePermissions exclude it, but buttons inside page lack role checks.
- [Pricing 13] Keyboard shortcut ctrl+n may call openModal/openCreateModal; confirm function exists to avoid toast 'No create action'.
- [Pricing 14] Audit logging: no App.Audit.log calls on create/update/delete; add for traceability.
- [Pricing 15] Validation: required fields need client-side checks; current code rarely enforces mandatory fields.
- [Pricing 16] Number handling: inputs likely strings; parseFloat/parseInt needed before calculations.
- [Pricing 17] Currency: rely on App.Utils.formatCurrency which reads App.Data.config.currency; ensure config loaded before render.
- [Pricing 18] Date formatting: use App.Utils.formatDate? If not, ensure ISO strings handled consistently.
- [Pricing 19] Loading state: no spinner when API operations in progress; App.UI.Loading available but unused here.
- [Pricing 20] Error feedback: wrap API calls in try/catch and show App.UI.showError to inform user.
- [Pricing 21] Data freshness: views read App.Data snapshot; no live sync after background changes.
- [Pricing 22] Offline: local mutations saved immediately; reconcile with server once remote mode is functional to avoid conflicts.
- [Pricing 23] Bulk actions: not implemented; consider multi-select for mass updates.
- [Pricing 24] Export/import: check for export buttons; integrate with backend endpoints for CSV/PDF.
- [Pricing 25] Print-ready layout: not provided; consider CSS print styles for this page.
- [Pricing 26] Accessibility: add aria-labels, focus order, and keyboard navigation for tables and buttons.
- [Pricing 27] Localization: ensure all visible strings go through App.I18n; some literals remain English.
- [Pricing 28] Mobile layout: flex/grid may overflow; verify responsiveness on small screens.
- [Pricing 29] State persistence: remember filters/sorts per user? currently not persisted.
- [Pricing 30] Empty dataset risk: functions map over undefined arrays unless default []; guard thoroughly.
- [Pricing 31] Performance: repeated App.DB.save calls after each change may freeze UI on large data.
- [Pricing 32] Data integrity: ensure IDs generated by App.Utils.generateId do not clash with backend UUIDs when syncing.
- [Pricing 33] Notifications: App.UI.Toast used for success; limit noise on batch operations.
- [Pricing 34] Modals: ensure Modal.close resets forms; prevent memory leaks by clearing listeners on rerender.
- [Pricing 35] Attachment handling: none; consider file inputs where relevant.
- [Pricing 36] Filtering by status: check that string comparisons lowercased to avoid undefined.toLowerCase errors.
- [Pricing 37] Clipboard/export shortcuts: ctrl+e not implemented per page; add listeners or disable.
- [Pricing 38] Column alignment: ensure numeric columns right-aligned for readability.
- [Pricing 39] Security: avoid exposing internal IDs in DOM data attributes if not needed.
- [Pricing 40] Unsaved changes: no confirmation on navigation away from edited forms.
- [Pricing 41] Test coverage: no automated tests; add unit tests per view once modularized.
- [Pricing 42] Refactoring candidate: split view into smaller functions to improve maintainability.
- [Pricing 43] Error boundaries: rely on global error handler; consider local try/catch for template rendering.
- [Pricing 44] State duplication: some pages maintain activeTab or filters as static props; ensure reset on logout.
- [Pricing 45] Consistency: ensure button styles align with theme.css and maintain accessible contrast.
- [Pricing 46] Data import/export: align with App.DB.backup/import to avoid schema drift.
- [Pricing 47] Server parity: ensure backend routes exist for this entity; some (purchaseOrders, batches) not implemented server-side yet.
- [Pricing 48] Audit trail mapping: when backend is live, record entityId in audit log for this page's operations.
- [Pricing 49] Edge cases: handle zero/negative quantities gracefully; avoid divide-by-zero in totals.
- [Pricing 50] Date pickers: not evident; ensure HTML input type=date respects locale/timezone.
- [Pricing 51] Search indexing: for large data, move to backend filtering once API integration ready.
- [Pricing 52] Import validation: if file upload planned, add schema validation to prevent corrupting App.Data.
- [Pricing 53] Auto-refresh: consider setInterval or manual refresh button to reload data after server sync.
- [Pricing 54] Multi-user: local storage design is single-user; when multiple users edit same data, merges will conflict.
- [Pricing 55] Theming: verify page uses CSS variables; avoid inline colors for consistent dark/light support.
- [Pricing 56] Analytics: no tracking of user actions; consider minimal event log for audits.
- [Pricing 57] Help text: add contextual tooltips linked to SUPPORT.md/HowToUse.md content.
- [Pricing 58] Print/export numbering: align with sequences from backend to avoid duplicates.
- [Pricing 59] Data retention: define cleanup/archival for old records shown on this page.
- [Pricing 60] Error localization: map error messages through I18n instead of raw English.
- [Pricing 61] Clipboard safety: ensure copying sensitive data (PINs, tokens) is avoided in UI.
- [Pricing 62] Loading placeholders: skeletons/spinners to signal fetch progress once API wired.
- [Pricing 63] Unit boundaries: confirm units (pcs, ml) displayed from dataset to avoid ambiguity.
- [Pricing 64] Keyboard focus trap: modals should trap focus; ensure accessible order.
- [Pricing 65] Search null safety: guard against undefined .toLowerCase on fields.
- [Pricing 66] State cleanup on logout: clear this view's timers/subscriptions.
- [Pricing 67] Offline backup: remind user to export backup after major edits on this page.
- [Pricing 68] Next steps: document intended workflow for this page in HowToUse.md with screenshots.

### Movements (movements)

- [Movements 01] Purpose: Inventory movement history and filters.
- [Movements 02] Entry file: js/pages/movements.js defines App.UI.Views.Movements.render(root)
- [Movements 03] Route id 'movements' registered in sidebar and router; accessible via hash navigation.
- [Movements 04] Dataset expectation: App.Data.movements (normalized in db.js). Ensure App.Api remote responses hydrate App.Data.
- [Movements 05] Remote API gap: App.Api.mode='remote' with missing Auth token will block server data; page currently relies on local seed.
- [Movements 06] Empty state handling should show friendly message; verify rowsHtml fallback.
- [Movements 07] Escaping: ensure App.Utils.escapeHtml wraps user-provided fields to avoid XSS.
- [Movements 08] Sorting/filtering uses client-side arrays; consider debounce and locale-aware comparisons.
- [Movements 09] Pagination: none; large datasets will render fully and hurt performance.
- [Movements 10] Search inputs: ensure query lowercasing handles null values to prevent errors.
- [Movements 11] Actions wired via inline onclick; convert to addEventListener to preserve CSP compatibility.
- [Movements 12] Role gating: Sidebar hides route if rolePermissions exclude it, but buttons inside page lack role checks.
- [Movements 13] Keyboard shortcut ctrl+n may call openModal/openCreateModal; confirm function exists to avoid toast 'No create action'.
- [Movements 14] Audit logging: no App.Audit.log calls on create/update/delete; add for traceability.
- [Movements 15] Validation: required fields need client-side checks; current code rarely enforces mandatory fields.
- [Movements 16] Number handling: inputs likely strings; parseFloat/parseInt needed before calculations.
- [Movements 17] Currency: rely on App.Utils.formatCurrency which reads App.Data.config.currency; ensure config loaded before render.
- [Movements 18] Date formatting: use App.Utils.formatDate? If not, ensure ISO strings handled consistently.
- [Movements 19] Loading state: no spinner when API operations in progress; App.UI.Loading available but unused here.
- [Movements 20] Error feedback: wrap API calls in try/catch and show App.UI.showError to inform user.
- [Movements 21] Data freshness: views read App.Data snapshot; no live sync after background changes.
- [Movements 22] Offline: local mutations saved immediately; reconcile with server once remote mode is functional to avoid conflicts.
- [Movements 23] Bulk actions: not implemented; consider multi-select for mass updates.
- [Movements 24] Export/import: check for export buttons; integrate with backend endpoints for CSV/PDF.
- [Movements 25] Print-ready layout: not provided; consider CSS print styles for this page.
- [Movements 26] Accessibility: add aria-labels, focus order, and keyboard navigation for tables and buttons.
- [Movements 27] Localization: ensure all visible strings go through App.I18n; some literals remain English.
- [Movements 28] Mobile layout: flex/grid may overflow; verify responsiveness on small screens.
- [Movements 29] State persistence: remember filters/sorts per user? currently not persisted.
- [Movements 30] Empty dataset risk: functions map over undefined arrays unless default []; guard thoroughly.
- [Movements 31] Performance: repeated App.DB.save calls after each change may freeze UI on large data.
- [Movements 32] Data integrity: ensure IDs generated by App.Utils.generateId do not clash with backend UUIDs when syncing.
- [Movements 33] Notifications: App.UI.Toast used for success; limit noise on batch operations.
- [Movements 34] Modals: ensure Modal.close resets forms; prevent memory leaks by clearing listeners on rerender.
- [Movements 35] Attachment handling: none; consider file inputs where relevant.
- [Movements 36] Filtering by status: check that string comparisons lowercased to avoid undefined.toLowerCase errors.
- [Movements 37] Clipboard/export shortcuts: ctrl+e not implemented per page; add listeners or disable.
- [Movements 38] Column alignment: ensure numeric columns right-aligned for readability.
- [Movements 39] Security: avoid exposing internal IDs in DOM data attributes if not needed.
- [Movements 40] Unsaved changes: no confirmation on navigation away from edited forms.
- [Movements 41] Test coverage: no automated tests; add unit tests per view once modularized.
- [Movements 42] Refactoring candidate: split view into smaller functions to improve maintainability.
- [Movements 43] Error boundaries: rely on global error handler; consider local try/catch for template rendering.
- [Movements 44] State duplication: some pages maintain activeTab or filters as static props; ensure reset on logout.
- [Movements 45] Consistency: ensure button styles align with theme.css and maintain accessible contrast.
- [Movements 46] Data import/export: align with App.DB.backup/import to avoid schema drift.
- [Movements 47] Server parity: ensure backend routes exist for this entity; some (purchaseOrders, batches) not implemented server-side yet.
- [Movements 48] Audit trail mapping: when backend is live, record entityId in audit log for this page's operations.
- [Movements 49] Edge cases: handle zero/negative quantities gracefully; avoid divide-by-zero in totals.
- [Movements 50] Date pickers: not evident; ensure HTML input type=date respects locale/timezone.
- [Movements 51] Search indexing: for large data, move to backend filtering once API integration ready.
- [Movements 52] Import validation: if file upload planned, add schema validation to prevent corrupting App.Data.
- [Movements 53] Auto-refresh: consider setInterval or manual refresh button to reload data after server sync.
- [Movements 54] Multi-user: local storage design is single-user; when multiple users edit same data, merges will conflict.
- [Movements 55] Theming: verify page uses CSS variables; avoid inline colors for consistent dark/light support.
- [Movements 56] Analytics: no tracking of user actions; consider minimal event log for audits.
- [Movements 57] Help text: add contextual tooltips linked to SUPPORT.md/HowToUse.md content.
- [Movements 58] Print/export numbering: align with sequences from backend to avoid duplicates.
- [Movements 59] Data retention: define cleanup/archival for old records shown on this page.
- [Movements 60] Error localization: map error messages through I18n instead of raw English.
- [Movements 61] Clipboard safety: ensure copying sensitive data (PINs, tokens) is avoided in UI.
- [Movements 62] Loading placeholders: skeletons/spinners to signal fetch progress once API wired.
- [Movements 63] Unit boundaries: confirm units (pcs, ml) displayed from dataset to avoid ambiguity.
- [Movements 64] Keyboard focus trap: modals should trap focus; ensure accessible order.
- [Movements 65] Search null safety: guard against undefined .toLowerCase on fields.
- [Movements 66] State cleanup on logout: clear this view's timers/subscriptions.
- [Movements 67] Offline backup: remind user to export backup after major edits on this page.
- [Movements 68] Next steps: document intended workflow for this page in HowToUse.md with screenshots.

### Batches (batches)

- [Batches 01] Purpose: Batch/lot management and expiry tracking.
- [Batches 02] Entry file: js/pages/batches.js defines App.UI.Views.Batches.render(root)
- [Batches 03] Route id 'batches' registered in sidebar and router; accessible via hash navigation.
- [Batches 04] Dataset expectation: App.Data.batches (normalized in db.js). Ensure App.Api remote responses hydrate App.Data.
- [Batches 05] Remote API gap: App.Api.mode='remote' with missing Auth token will block server data; page currently relies on local seed.
- [Batches 06] Empty state handling should show friendly message; verify rowsHtml fallback.
- [Batches 07] Escaping: ensure App.Utils.escapeHtml wraps user-provided fields to avoid XSS.
- [Batches 08] Sorting/filtering uses client-side arrays; consider debounce and locale-aware comparisons.
- [Batches 09] Pagination: none; large datasets will render fully and hurt performance.
- [Batches 10] Search inputs: ensure query lowercasing handles null values to prevent errors.
- [Batches 11] Actions wired via inline onclick; convert to addEventListener to preserve CSP compatibility.
- [Batches 12] Role gating: Sidebar hides route if rolePermissions exclude it, but buttons inside page lack role checks.
- [Batches 13] Keyboard shortcut ctrl+n may call openModal/openCreateModal; confirm function exists to avoid toast 'No create action'.
- [Batches 14] Audit logging: no App.Audit.log calls on create/update/delete; add for traceability.
- [Batches 15] Validation: required fields need client-side checks; current code rarely enforces mandatory fields.
- [Batches 16] Number handling: inputs likely strings; parseFloat/parseInt needed before calculations.
- [Batches 17] Currency: rely on App.Utils.formatCurrency which reads App.Data.config.currency; ensure config loaded before render.
- [Batches 18] Date formatting: use App.Utils.formatDate? If not, ensure ISO strings handled consistently.
- [Batches 19] Loading state: no spinner when API operations in progress; App.UI.Loading available but unused here.
- [Batches 20] Error feedback: wrap API calls in try/catch and show App.UI.showError to inform user.
- [Batches 21] Data freshness: views read App.Data snapshot; no live sync after background changes.
- [Batches 22] Offline: local mutations saved immediately; reconcile with server once remote mode is functional to avoid conflicts.
- [Batches 23] Bulk actions: not implemented; consider multi-select for mass updates.
- [Batches 24] Export/import: check for export buttons; integrate with backend endpoints for CSV/PDF.
- [Batches 25] Print-ready layout: not provided; consider CSS print styles for this page.
- [Batches 26] Accessibility: add aria-labels, focus order, and keyboard navigation for tables and buttons.
- [Batches 27] Localization: ensure all visible strings go through App.I18n; some literals remain English.
- [Batches 28] Mobile layout: flex/grid may overflow; verify responsiveness on small screens.
- [Batches 29] State persistence: remember filters/sorts per user? currently not persisted.
- [Batches 30] Empty dataset risk: functions map over undefined arrays unless default []; guard thoroughly.
- [Batches 31] Performance: repeated App.DB.save calls after each change may freeze UI on large data.
- [Batches 32] Data integrity: ensure IDs generated by App.Utils.generateId do not clash with backend UUIDs when syncing.
- [Batches 33] Notifications: App.UI.Toast used for success; limit noise on batch operations.
- [Batches 34] Modals: ensure Modal.close resets forms; prevent memory leaks by clearing listeners on rerender.
- [Batches 35] Attachment handling: none; consider file inputs where relevant.
- [Batches 36] Filtering by status: check that string comparisons lowercased to avoid undefined.toLowerCase errors.
- [Batches 37] Clipboard/export shortcuts: ctrl+e not implemented per page; add listeners or disable.
- [Batches 38] Column alignment: ensure numeric columns right-aligned for readability.
- [Batches 39] Security: avoid exposing internal IDs in DOM data attributes if not needed.
- [Batches 40] Unsaved changes: no confirmation on navigation away from edited forms.
- [Batches 41] Test coverage: no automated tests; add unit tests per view once modularized.
- [Batches 42] Refactoring candidate: split view into smaller functions to improve maintainability.
- [Batches 43] Error boundaries: rely on global error handler; consider local try/catch for template rendering.
- [Batches 44] State duplication: some pages maintain activeTab or filters as static props; ensure reset on logout.
- [Batches 45] Consistency: ensure button styles align with theme.css and maintain accessible contrast.
- [Batches 46] Data import/export: align with App.DB.backup/import to avoid schema drift.
- [Batches 47] Server parity: ensure backend routes exist for this entity; some (purchaseOrders, batches) not implemented server-side yet.
- [Batches 48] Audit trail mapping: when backend is live, record entityId in audit log for this page's operations.
- [Batches 49] Edge cases: handle zero/negative quantities gracefully; avoid divide-by-zero in totals.
- [Batches 50] Date pickers: not evident; ensure HTML input type=date respects locale/timezone.
- [Batches 51] Search indexing: for large data, move to backend filtering once API integration ready.
- [Batches 52] Import validation: if file upload planned, add schema validation to prevent corrupting App.Data.
- [Batches 53] Auto-refresh: consider setInterval or manual refresh button to reload data after server sync.
- [Batches 54] Multi-user: local storage design is single-user; when multiple users edit same data, merges will conflict.
- [Batches 55] Theming: verify page uses CSS variables; avoid inline colors for consistent dark/light support.
- [Batches 56] Analytics: no tracking of user actions; consider minimal event log for audits.
- [Batches 57] Help text: add contextual tooltips linked to SUPPORT.md/HowToUse.md content.
- [Batches 58] Print/export numbering: align with sequences from backend to avoid duplicates.
- [Batches 59] Data retention: define cleanup/archival for old records shown on this page.
- [Batches 60] Error localization: map error messages through I18n instead of raw English.
- [Batches 61] Clipboard safety: ensure copying sensitive data (PINs, tokens) is avoided in UI.
- [Batches 62] Loading placeholders: skeletons/spinners to signal fetch progress once API wired.
- [Batches 63] Unit boundaries: confirm units (pcs, ml) displayed from dataset to avoid ambiguity.
- [Batches 64] Keyboard focus trap: modals should trap focus; ensure accessible order.
- [Batches 65] Search null safety: guard against undefined .toLowerCase on fields.
- [Batches 66] State cleanup on logout: clear this view's timers/subscriptions.
- [Batches 67] Offline backup: remind user to export backup after major edits on this page.
- [Batches 68] Next steps: document intended workflow for this page in HowToUse.md with screenshots.

### Orders (orders)

- [Orders 01] Purpose: Sales order entry, status, exports.
- [Orders 02] Entry file: js/pages/orders.js defines App.UI.Views.Orders.render(root)
- [Orders 03] Route id 'orders' registered in sidebar and router; accessible via hash navigation.
- [Orders 04] Dataset expectation: App.Data.orders (normalized in db.js). Ensure App.Api remote responses hydrate App.Data.
- [Orders 05] Remote API gap: App.Api.mode='remote' with missing Auth token will block server data; page currently relies on local seed.
- [Orders 06] Empty state handling should show friendly message; verify rowsHtml fallback.
- [Orders 07] Escaping: ensure App.Utils.escapeHtml wraps user-provided fields to avoid XSS.
- [Orders 08] Sorting/filtering uses client-side arrays; consider debounce and locale-aware comparisons.
- [Orders 09] Pagination: none; large datasets will render fully and hurt performance.
- [Orders 10] Search inputs: ensure query lowercasing handles null values to prevent errors.
- [Orders 11] Actions wired via inline onclick; convert to addEventListener to preserve CSP compatibility.
- [Orders 12] Role gating: Sidebar hides route if rolePermissions exclude it, but buttons inside page lack role checks.
- [Orders 13] Keyboard shortcut ctrl+n may call openModal/openCreateModal; confirm function exists to avoid toast 'No create action'.
- [Orders 14] Audit logging: no App.Audit.log calls on create/update/delete; add for traceability.
- [Orders 15] Validation: required fields need client-side checks; current code rarely enforces mandatory fields.
- [Orders 16] Number handling: inputs likely strings; parseFloat/parseInt needed before calculations.
- [Orders 17] Currency: rely on App.Utils.formatCurrency which reads App.Data.config.currency; ensure config loaded before render.
- [Orders 18] Date formatting: use App.Utils.formatDate? If not, ensure ISO strings handled consistently.
- [Orders 19] Loading state: no spinner when API operations in progress; App.UI.Loading available but unused here.
- [Orders 20] Error feedback: wrap API calls in try/catch and show App.UI.showError to inform user.
- [Orders 21] Data freshness: views read App.Data snapshot; no live sync after background changes.
- [Orders 22] Offline: local mutations saved immediately; reconcile with server once remote mode is functional to avoid conflicts.
- [Orders 23] Bulk actions: not implemented; consider multi-select for mass updates.
- [Orders 24] Export/import: check for export buttons; integrate with backend endpoints for CSV/PDF.
- [Orders 25] Print-ready layout: not provided; consider CSS print styles for this page.
- [Orders 26] Accessibility: add aria-labels, focus order, and keyboard navigation for tables and buttons.
- [Orders 27] Localization: ensure all visible strings go through App.I18n; some literals remain English.
- [Orders 28] Mobile layout: flex/grid may overflow; verify responsiveness on small screens.
- [Orders 29] State persistence: remember filters/sorts per user? currently not persisted.
- [Orders 30] Empty dataset risk: functions map over undefined arrays unless default []; guard thoroughly.
- [Orders 31] Performance: repeated App.DB.save calls after each change may freeze UI on large data.
- [Orders 32] Data integrity: ensure IDs generated by App.Utils.generateId do not clash with backend UUIDs when syncing.
- [Orders 33] Notifications: App.UI.Toast used for success; limit noise on batch operations.
- [Orders 34] Modals: ensure Modal.close resets forms; prevent memory leaks by clearing listeners on rerender.
- [Orders 35] Attachment handling: none; consider file inputs where relevant.
- [Orders 36] Filtering by status: check that string comparisons lowercased to avoid undefined.toLowerCase errors.
- [Orders 37] Clipboard/export shortcuts: ctrl+e not implemented per page; add listeners or disable.
- [Orders 38] Column alignment: ensure numeric columns right-aligned for readability.
- [Orders 39] Security: avoid exposing internal IDs in DOM data attributes if not needed.
- [Orders 40] Unsaved changes: no confirmation on navigation away from edited forms.
- [Orders 41] Test coverage: no automated tests; add unit tests per view once modularized.
- [Orders 42] Refactoring candidate: split view into smaller functions to improve maintainability.
- [Orders 43] Error boundaries: rely on global error handler; consider local try/catch for template rendering.
- [Orders 44] State duplication: some pages maintain activeTab or filters as static props; ensure reset on logout.
- [Orders 45] Consistency: ensure button styles align with theme.css and maintain accessible contrast.
- [Orders 46] Data import/export: align with App.DB.backup/import to avoid schema drift.
- [Orders 47] Server parity: ensure backend routes exist for this entity; some (purchaseOrders, batches) not implemented server-side yet.
- [Orders 48] Audit trail mapping: when backend is live, record entityId in audit log for this page's operations.
- [Orders 49] Edge cases: handle zero/negative quantities gracefully; avoid divide-by-zero in totals.
- [Orders 50] Date pickers: not evident; ensure HTML input type=date respects locale/timezone.
- [Orders 51] Search indexing: for large data, move to backend filtering once API integration ready.
- [Orders 52] Import validation: if file upload planned, add schema validation to prevent corrupting App.Data.
- [Orders 53] Auto-refresh: consider setInterval or manual refresh button to reload data after server sync.
- [Orders 54] Multi-user: local storage design is single-user; when multiple users edit same data, merges will conflict.
- [Orders 55] Theming: verify page uses CSS variables; avoid inline colors for consistent dark/light support.
- [Orders 56] Analytics: no tracking of user actions; consider minimal event log for audits.
- [Orders 57] Help text: add contextual tooltips linked to SUPPORT.md/HowToUse.md content.
- [Orders 58] Print/export numbering: align with sequences from backend to avoid duplicates.
- [Orders 59] Data retention: define cleanup/archival for old records shown on this page.
- [Orders 60] Error localization: map error messages through I18n instead of raw English.
- [Orders 61] Clipboard safety: ensure copying sensitive data (PINs, tokens) is avoided in UI.
- [Orders 62] Loading placeholders: skeletons/spinners to signal fetch progress once API wired.
- [Orders 63] Unit boundaries: confirm units (pcs, ml) displayed from dataset to avoid ambiguity.
- [Orders 64] Keyboard focus trap: modals should trap focus; ensure accessible order.
- [Orders 65] Search null safety: guard against undefined .toLowerCase on fields.
- [Orders 66] State cleanup on logout: clear this view's timers/subscriptions.
- [Orders 67] Offline backup: remind user to export backup after major edits on this page.
- [Orders 68] Next steps: document intended workflow for this page in HowToUse.md with screenshots.

### Purchase Orders (purchaseOrders)

- [Purchase Orders 01] Purpose: PO creation and supplier follow-up.
- [Purchase Orders 02] Entry file: js/pages/purchaseOrders.js defines App.UI.Views.Purchase Orders.render(root)
- [Purchase Orders 03] Route id 'purchaseOrders' registered in sidebar and router; accessible via hash navigation.
- [Purchase Orders 04] Dataset expectation: App.Data.purchaseOrders (normalized in db.js). Ensure App.Api remote responses hydrate App.Data.
- [Purchase Orders 05] Remote API gap: App.Api.mode='remote' with missing Auth token will block server data; page currently relies on local seed.
- [Purchase Orders 06] Empty state handling should show friendly message; verify rowsHtml fallback.
- [Purchase Orders 07] Escaping: ensure App.Utils.escapeHtml wraps user-provided fields to avoid XSS.
- [Purchase Orders 08] Sorting/filtering uses client-side arrays; consider debounce and locale-aware comparisons.
- [Purchase Orders 09] Pagination: none; large datasets will render fully and hurt performance.
- [Purchase Orders 10] Search inputs: ensure query lowercasing handles null values to prevent errors.
- [Purchase Orders 11] Actions wired via inline onclick; convert to addEventListener to preserve CSP compatibility.
- [Purchase Orders 12] Role gating: Sidebar hides route if rolePermissions exclude it, but buttons inside page lack role checks.
- [Purchase Orders 13] Keyboard shortcut ctrl+n may call openModal/openCreateModal; confirm function exists to avoid toast 'No create action'.
- [Purchase Orders 14] Audit logging: no App.Audit.log calls on create/update/delete; add for traceability.
- [Purchase Orders 15] Validation: required fields need client-side checks; current code rarely enforces mandatory fields.
- [Purchase Orders 16] Number handling: inputs likely strings; parseFloat/parseInt needed before calculations.
- [Purchase Orders 17] Currency: rely on App.Utils.formatCurrency which reads App.Data.config.currency; ensure config loaded before render.
- [Purchase Orders 18] Date formatting: use App.Utils.formatDate? If not, ensure ISO strings handled consistently.
- [Purchase Orders 19] Loading state: no spinner when API operations in progress; App.UI.Loading available but unused here.
- [Purchase Orders 20] Error feedback: wrap API calls in try/catch and show App.UI.showError to inform user.
- [Purchase Orders 21] Data freshness: views read App.Data snapshot; no live sync after background changes.
- [Purchase Orders 22] Offline: local mutations saved immediately; reconcile with server once remote mode is functional to avoid conflicts.
- [Purchase Orders 23] Bulk actions: not implemented; consider multi-select for mass updates.
- [Purchase Orders 24] Export/import: check for export buttons; integrate with backend endpoints for CSV/PDF.
- [Purchase Orders 25] Print-ready layout: not provided; consider CSS print styles for this page.
- [Purchase Orders 26] Accessibility: add aria-labels, focus order, and keyboard navigation for tables and buttons.
- [Purchase Orders 27] Localization: ensure all visible strings go through App.I18n; some literals remain English.
- [Purchase Orders 28] Mobile layout: flex/grid may overflow; verify responsiveness on small screens.
- [Purchase Orders 29] State persistence: remember filters/sorts per user? currently not persisted.
- [Purchase Orders 30] Empty dataset risk: functions map over undefined arrays unless default []; guard thoroughly.
- [Purchase Orders 31] Performance: repeated App.DB.save calls after each change may freeze UI on large data.
- [Purchase Orders 32] Data integrity: ensure IDs generated by App.Utils.generateId do not clash with backend UUIDs when syncing.
- [Purchase Orders 33] Notifications: App.UI.Toast used for success; limit noise on batch operations.
- [Purchase Orders 34] Modals: ensure Modal.close resets forms; prevent memory leaks by clearing listeners on rerender.
- [Purchase Orders 35] Attachment handling: none; consider file inputs where relevant.
- [Purchase Orders 36] Filtering by status: check that string comparisons lowercased to avoid undefined.toLowerCase errors.
- [Purchase Orders 37] Clipboard/export shortcuts: ctrl+e not implemented per page; add listeners or disable.
- [Purchase Orders 38] Column alignment: ensure numeric columns right-aligned for readability.
- [Purchase Orders 39] Security: avoid exposing internal IDs in DOM data attributes if not needed.
- [Purchase Orders 40] Unsaved changes: no confirmation on navigation away from edited forms.
- [Purchase Orders 41] Test coverage: no automated tests; add unit tests per view once modularized.
- [Purchase Orders 42] Refactoring candidate: split view into smaller functions to improve maintainability.
- [Purchase Orders 43] Error boundaries: rely on global error handler; consider local try/catch for template rendering.
- [Purchase Orders 44] State duplication: some pages maintain activeTab or filters as static props; ensure reset on logout.
- [Purchase Orders 45] Consistency: ensure button styles align with theme.css and maintain accessible contrast.
- [Purchase Orders 46] Data import/export: align with App.DB.backup/import to avoid schema drift.
- [Purchase Orders 47] Server parity: ensure backend routes exist for this entity; some (purchaseOrders, batches) not implemented server-side yet.
- [Purchase Orders 48] Audit trail mapping: when backend is live, record entityId in audit log for this page's operations.
- [Purchase Orders 49] Edge cases: handle zero/negative quantities gracefully; avoid divide-by-zero in totals.
- [Purchase Orders 50] Date pickers: not evident; ensure HTML input type=date respects locale/timezone.
- [Purchase Orders 51] Search indexing: for large data, move to backend filtering once API integration ready.
- [Purchase Orders 52] Import validation: if file upload planned, add schema validation to prevent corrupting App.Data.
- [Purchase Orders 53] Auto-refresh: consider setInterval or manual refresh button to reload data after server sync.
- [Purchase Orders 54] Multi-user: local storage design is single-user; when multiple users edit same data, merges will conflict.
- [Purchase Orders 55] Theming: verify page uses CSS variables; avoid inline colors for consistent dark/light support.
- [Purchase Orders 56] Analytics: no tracking of user actions; consider minimal event log for audits.
- [Purchase Orders 57] Help text: add contextual tooltips linked to SUPPORT.md/HowToUse.md content.
- [Purchase Orders 58] Print/export numbering: align with sequences from backend to avoid duplicates.
- [Purchase Orders 59] Data retention: define cleanup/archival for old records shown on this page.
- [Purchase Orders 60] Error localization: map error messages through I18n instead of raw English.
- [Purchase Orders 61] Clipboard safety: ensure copying sensitive data (PINs, tokens) is avoided in UI.
- [Purchase Orders 62] Loading placeholders: skeletons/spinners to signal fetch progress once API wired.
- [Purchase Orders 63] Unit boundaries: confirm units (pcs, ml) displayed from dataset to avoid ambiguity.
- [Purchase Orders 64] Keyboard focus trap: modals should trap focus; ensure accessible order.
- [Purchase Orders 65] Search null safety: guard against undefined .toLowerCase on fields.
- [Purchase Orders 66] State cleanup on logout: clear this view's timers/subscriptions.
- [Purchase Orders 67] Offline backup: remind user to export backup after major edits on this page.
- [Purchase Orders 68] Next steps: document intended workflow for this page in HowToUse.md with screenshots.

### Production (production)

- [Production 01] Purpose: Production order planning/monitoring.
- [Production 02] Entry file: js/pages/production.js defines App.UI.Views.Production.render(root)
- [Production 03] Route id 'production' registered in sidebar and router; accessible via hash navigation.
- [Production 04] Dataset expectation: App.Data.productionOrders (normalized in db.js). Ensure App.Api remote responses hydrate App.Data.
- [Production 05] Remote API gap: App.Api.mode='remote' with missing Auth token will block server data; page currently relies on local seed.
- [Production 06] Empty state handling should show friendly message; verify rowsHtml fallback.
- [Production 07] Escaping: ensure App.Utils.escapeHtml wraps user-provided fields to avoid XSS.
- [Production 08] Sorting/filtering uses client-side arrays; consider debounce and locale-aware comparisons.
- [Production 09] Pagination: none; large datasets will render fully and hurt performance.
- [Production 10] Search inputs: ensure query lowercasing handles null values to prevent errors.
- [Production 11] Actions wired via inline onclick; convert to addEventListener to preserve CSP compatibility.
- [Production 12] Role gating: Sidebar hides route if rolePermissions exclude it, but buttons inside page lack role checks.
- [Production 13] Keyboard shortcut ctrl+n may call openModal/openCreateModal; confirm function exists to avoid toast 'No create action'.
- [Production 14] Audit logging: no App.Audit.log calls on create/update/delete; add for traceability.
- [Production 15] Validation: required fields need client-side checks; current code rarely enforces mandatory fields.
- [Production 16] Number handling: inputs likely strings; parseFloat/parseInt needed before calculations.
- [Production 17] Currency: rely on App.Utils.formatCurrency which reads App.Data.config.currency; ensure config loaded before render.
- [Production 18] Date formatting: use App.Utils.formatDate? If not, ensure ISO strings handled consistently.
- [Production 19] Loading state: no spinner when API operations in progress; App.UI.Loading available but unused here.
- [Production 20] Error feedback: wrap API calls in try/catch and show App.UI.showError to inform user.
- [Production 21] Data freshness: views read App.Data snapshot; no live sync after background changes.
- [Production 22] Offline: local mutations saved immediately; reconcile with server once remote mode is functional to avoid conflicts.
- [Production 23] Bulk actions: not implemented; consider multi-select for mass updates.
- [Production 24] Export/import: check for export buttons; integrate with backend endpoints for CSV/PDF.
- [Production 25] Print-ready layout: not provided; consider CSS print styles for this page.
- [Production 26] Accessibility: add aria-labels, focus order, and keyboard navigation for tables and buttons.
- [Production 27] Localization: ensure all visible strings go through App.I18n; some literals remain English.
- [Production 28] Mobile layout: flex/grid may overflow; verify responsiveness on small screens.
- [Production 29] State persistence: remember filters/sorts per user? currently not persisted.
- [Production 30] Empty dataset risk: functions map over undefined arrays unless default []; guard thoroughly.
- [Production 31] Performance: repeated App.DB.save calls after each change may freeze UI on large data.
- [Production 32] Data integrity: ensure IDs generated by App.Utils.generateId do not clash with backend UUIDs when syncing.
- [Production 33] Notifications: App.UI.Toast used for success; limit noise on batch operations.
- [Production 34] Modals: ensure Modal.close resets forms; prevent memory leaks by clearing listeners on rerender.
- [Production 35] Attachment handling: none; consider file inputs where relevant.
- [Production 36] Filtering by status: check that string comparisons lowercased to avoid undefined.toLowerCase errors.
- [Production 37] Clipboard/export shortcuts: ctrl+e not implemented per page; add listeners or disable.
- [Production 38] Column alignment: ensure numeric columns right-aligned for readability.
- [Production 39] Security: avoid exposing internal IDs in DOM data attributes if not needed.
- [Production 40] Unsaved changes: no confirmation on navigation away from edited forms.
- [Production 41] Test coverage: no automated tests; add unit tests per view once modularized.
- [Production 42] Refactoring candidate: split view into smaller functions to improve maintainability.
- [Production 43] Error boundaries: rely on global error handler; consider local try/catch for template rendering.
- [Production 44] State duplication: some pages maintain activeTab or filters as static props; ensure reset on logout.
- [Production 45] Consistency: ensure button styles align with theme.css and maintain accessible contrast.
- [Production 46] Data import/export: align with App.DB.backup/import to avoid schema drift.
- [Production 47] Server parity: ensure backend routes exist for this entity; some (purchaseOrders, batches) not implemented server-side yet.
- [Production 48] Audit trail mapping: when backend is live, record entityId in audit log for this page's operations.
- [Production 49] Edge cases: handle zero/negative quantities gracefully; avoid divide-by-zero in totals.
- [Production 50] Date pickers: not evident; ensure HTML input type=date respects locale/timezone.
- [Production 51] Search indexing: for large data, move to backend filtering once API integration ready.
- [Production 52] Import validation: if file upload planned, add schema validation to prevent corrupting App.Data.
- [Production 53] Auto-refresh: consider setInterval or manual refresh button to reload data after server sync.
- [Production 54] Multi-user: local storage design is single-user; when multiple users edit same data, merges will conflict.
- [Production 55] Theming: verify page uses CSS variables; avoid inline colors for consistent dark/light support.
- [Production 56] Analytics: no tracking of user actions; consider minimal event log for audits.
- [Production 57] Help text: add contextual tooltips linked to SUPPORT.md/HowToUse.md content.
- [Production 58] Print/export numbering: align with sequences from backend to avoid duplicates.
- [Production 59] Data retention: define cleanup/archival for old records shown on this page.
- [Production 60] Error localization: map error messages through I18n instead of raw English.
- [Production 61] Clipboard safety: ensure copying sensitive data (PINs, tokens) is avoided in UI.
- [Production 62] Loading placeholders: skeletons/spinners to signal fetch progress once API wired.
- [Production 63] Unit boundaries: confirm units (pcs, ml) displayed from dataset to avoid ambiguity.
- [Production 64] Keyboard focus trap: modals should trap focus; ensure accessible order.
- [Production 65] Search null safety: guard against undefined .toLowerCase on fields.
- [Production 66] State cleanup on logout: clear this view's timers/subscriptions.
- [Production 67] Offline backup: remind user to export backup after major edits on this page.
- [Production 68] Next steps: document intended workflow for this page in HowToUse.md with screenshots.

### Documents (documents)

- [Documents 01] Purpose: Invoices/delivery notes management with trash bin.
- [Documents 02] Entry file: js/pages/documents.js defines App.UI.Views.Documents.render(root)
- [Documents 03] Route id 'documents' registered in sidebar and router; accessible via hash navigation.
- [Documents 04] Dataset expectation: App.Data.documents (normalized in db.js). Ensure App.Api remote responses hydrate App.Data.
- [Documents 05] Remote API gap: App.Api.mode='remote' with missing Auth token will block server data; page currently relies on local seed.
- [Documents 06] Empty state handling should show friendly message; verify rowsHtml fallback.
- [Documents 07] Escaping: ensure App.Utils.escapeHtml wraps user-provided fields to avoid XSS.
- [Documents 08] Sorting/filtering uses client-side arrays; consider debounce and locale-aware comparisons.
- [Documents 09] Pagination: none; large datasets will render fully and hurt performance.
- [Documents 10] Search inputs: ensure query lowercasing handles null values to prevent errors.
- [Documents 11] Actions wired via inline onclick; convert to addEventListener to preserve CSP compatibility.
- [Documents 12] Role gating: Sidebar hides route if rolePermissions exclude it, but buttons inside page lack role checks.
- [Documents 13] Keyboard shortcut ctrl+n may call openModal/openCreateModal; confirm function exists to avoid toast 'No create action'.
- [Documents 14] Audit logging: no App.Audit.log calls on create/update/delete; add for traceability.
- [Documents 15] Validation: required fields need client-side checks; current code rarely enforces mandatory fields.
- [Documents 16] Number handling: inputs likely strings; parseFloat/parseInt needed before calculations.
- [Documents 17] Currency: rely on App.Utils.formatCurrency which reads App.Data.config.currency; ensure config loaded before render.
- [Documents 18] Date formatting: use App.Utils.formatDate? If not, ensure ISO strings handled consistently.
- [Documents 19] Loading state: no spinner when API operations in progress; App.UI.Loading available but unused here.
- [Documents 20] Error feedback: wrap API calls in try/catch and show App.UI.showError to inform user.
- [Documents 21] Data freshness: views read App.Data snapshot; no live sync after background changes.
- [Documents 22] Offline: local mutations saved immediately; reconcile with server once remote mode is functional to avoid conflicts.
- [Documents 23] Bulk actions: not implemented; consider multi-select for mass updates.
- [Documents 24] Export/import: check for export buttons; integrate with backend endpoints for CSV/PDF.
- [Documents 25] Print-ready layout: not provided; consider CSS print styles for this page.
- [Documents 26] Accessibility: add aria-labels, focus order, and keyboard navigation for tables and buttons.
- [Documents 27] Localization: ensure all visible strings go through App.I18n; some literals remain English.
- [Documents 28] Mobile layout: flex/grid may overflow; verify responsiveness on small screens.
- [Documents 29] State persistence: remember filters/sorts per user? currently not persisted.
- [Documents 30] Empty dataset risk: functions map over undefined arrays unless default []; guard thoroughly.
- [Documents 31] Performance: repeated App.DB.save calls after each change may freeze UI on large data.
- [Documents 32] Data integrity: ensure IDs generated by App.Utils.generateId do not clash with backend UUIDs when syncing.
- [Documents 33] Notifications: App.UI.Toast used for success; limit noise on batch operations.
- [Documents 34] Modals: ensure Modal.close resets forms; prevent memory leaks by clearing listeners on rerender.
- [Documents 35] Attachment handling: none; consider file inputs where relevant.
- [Documents 36] Filtering by status: check that string comparisons lowercased to avoid undefined.toLowerCase errors.
- [Documents 37] Clipboard/export shortcuts: ctrl+e not implemented per page; add listeners or disable.
- [Documents 38] Column alignment: ensure numeric columns right-aligned for readability.
- [Documents 39] Security: avoid exposing internal IDs in DOM data attributes if not needed.
- [Documents 40] Unsaved changes: no confirmation on navigation away from edited forms.
- [Documents 41] Test coverage: no automated tests; add unit tests per view once modularized.
- [Documents 42] Refactoring candidate: split view into smaller functions to improve maintainability.
- [Documents 43] Error boundaries: rely on global error handler; consider local try/catch for template rendering.
- [Documents 44] State duplication: some pages maintain activeTab or filters as static props; ensure reset on logout.
- [Documents 45] Consistency: ensure button styles align with theme.css and maintain accessible contrast.
- [Documents 46] Data import/export: align with App.DB.backup/import to avoid schema drift.
- [Documents 47] Server parity: ensure backend routes exist for this entity; some (purchaseOrders, batches) not implemented server-side yet.
- [Documents 48] Audit trail mapping: when backend is live, record entityId in audit log for this page's operations.
- [Documents 49] Edge cases: handle zero/negative quantities gracefully; avoid divide-by-zero in totals.
- [Documents 50] Date pickers: not evident; ensure HTML input type=date respects locale/timezone.
- [Documents 51] Search indexing: for large data, move to backend filtering once API integration ready.
- [Documents 52] Import validation: if file upload planned, add schema validation to prevent corrupting App.Data.
- [Documents 53] Auto-refresh: consider setInterval or manual refresh button to reload data after server sync.
- [Documents 54] Multi-user: local storage design is single-user; when multiple users edit same data, merges will conflict.
- [Documents 55] Theming: verify page uses CSS variables; avoid inline colors for consistent dark/light support.
- [Documents 56] Analytics: no tracking of user actions; consider minimal event log for audits.
- [Documents 57] Help text: add contextual tooltips linked to SUPPORT.md/HowToUse.md content.
- [Documents 58] Print/export numbering: align with sequences from backend to avoid duplicates.
- [Documents 59] Data retention: define cleanup/archival for old records shown on this page.
- [Documents 60] Error localization: map error messages through I18n instead of raw English.
- [Documents 61] Clipboard safety: ensure copying sensitive data (PINs, tokens) is avoided in UI.
- [Documents 62] Loading placeholders: skeletons/spinners to signal fetch progress once API wired.
- [Documents 63] Unit boundaries: confirm units (pcs, ml) displayed from dataset to avoid ambiguity.
- [Documents 64] Keyboard focus trap: modals should trap focus; ensure accessible order.
- [Documents 65] Search null safety: guard against undefined .toLowerCase on fields.
- [Documents 66] State cleanup on logout: clear this view's timers/subscriptions.
- [Documents 67] Offline backup: remind user to export backup after major edits on this page.
- [Documents 68] Next steps: document intended workflow for this page in HowToUse.md with screenshots.

### Reports (reports)

- [Reports 01] Purpose: Sales and inventory reports, exports.
- [Reports 02] Entry file: js/pages/reports.js defines App.UI.Views.Reports.render(root)
- [Reports 03] Route id 'reports' registered in sidebar and router; accessible via hash navigation.
- [Reports 04] Dataset expectation: App.Data.documents/orders (normalized in db.js). Ensure App.Api remote responses hydrate App.Data.
- [Reports 05] Remote API gap: App.Api.mode='remote' with missing Auth token will block server data; page currently relies on local seed.
- [Reports 06] Empty state handling should show friendly message; verify rowsHtml fallback.
- [Reports 07] Escaping: ensure App.Utils.escapeHtml wraps user-provided fields to avoid XSS.
- [Reports 08] Sorting/filtering uses client-side arrays; consider debounce and locale-aware comparisons.
- [Reports 09] Pagination: none; large datasets will render fully and hurt performance.
- [Reports 10] Search inputs: ensure query lowercasing handles null values to prevent errors.
- [Reports 11] Actions wired via inline onclick; convert to addEventListener to preserve CSP compatibility.
- [Reports 12] Role gating: Sidebar hides route if rolePermissions exclude it, but buttons inside page lack role checks.
- [Reports 13] Keyboard shortcut ctrl+n may call openModal/openCreateModal; confirm function exists to avoid toast 'No create action'.
- [Reports 14] Audit logging: no App.Audit.log calls on create/update/delete; add for traceability.
- [Reports 15] Validation: required fields need client-side checks; current code rarely enforces mandatory fields.
- [Reports 16] Number handling: inputs likely strings; parseFloat/parseInt needed before calculations.
- [Reports 17] Currency: rely on App.Utils.formatCurrency which reads App.Data.config.currency; ensure config loaded before render.
- [Reports 18] Date formatting: use App.Utils.formatDate? If not, ensure ISO strings handled consistently.
- [Reports 19] Loading state: no spinner when API operations in progress; App.UI.Loading available but unused here.
- [Reports 20] Error feedback: wrap API calls in try/catch and show App.UI.showError to inform user.
- [Reports 21] Data freshness: views read App.Data snapshot; no live sync after background changes.
- [Reports 22] Offline: local mutations saved immediately; reconcile with server once remote mode is functional to avoid conflicts.
- [Reports 23] Bulk actions: not implemented; consider multi-select for mass updates.
- [Reports 24] Export/import: check for export buttons; integrate with backend endpoints for CSV/PDF.
- [Reports 25] Print-ready layout: not provided; consider CSS print styles for this page.
- [Reports 26] Accessibility: add aria-labels, focus order, and keyboard navigation for tables and buttons.
- [Reports 27] Localization: ensure all visible strings go through App.I18n; some literals remain English.
- [Reports 28] Mobile layout: flex/grid may overflow; verify responsiveness on small screens.
- [Reports 29] State persistence: remember filters/sorts per user? currently not persisted.
- [Reports 30] Empty dataset risk: functions map over undefined arrays unless default []; guard thoroughly.
- [Reports 31] Performance: repeated App.DB.save calls after each change may freeze UI on large data.
- [Reports 32] Data integrity: ensure IDs generated by App.Utils.generateId do not clash with backend UUIDs when syncing.
- [Reports 33] Notifications: App.UI.Toast used for success; limit noise on batch operations.
- [Reports 34] Modals: ensure Modal.close resets forms; prevent memory leaks by clearing listeners on rerender.
- [Reports 35] Attachment handling: none; consider file inputs where relevant.
- [Reports 36] Filtering by status: check that string comparisons lowercased to avoid undefined.toLowerCase errors.
- [Reports 37] Clipboard/export shortcuts: ctrl+e not implemented per page; add listeners or disable.
- [Reports 38] Column alignment: ensure numeric columns right-aligned for readability.
- [Reports 39] Security: avoid exposing internal IDs in DOM data attributes if not needed.
- [Reports 40] Unsaved changes: no confirmation on navigation away from edited forms.
- [Reports 41] Test coverage: no automated tests; add unit tests per view once modularized.
- [Reports 42] Refactoring candidate: split view into smaller functions to improve maintainability.
- [Reports 43] Error boundaries: rely on global error handler; consider local try/catch for template rendering.
- [Reports 44] State duplication: some pages maintain activeTab or filters as static props; ensure reset on logout.
- [Reports 45] Consistency: ensure button styles align with theme.css and maintain accessible contrast.
- [Reports 46] Data import/export: align with App.DB.backup/import to avoid schema drift.
- [Reports 47] Server parity: ensure backend routes exist for this entity; some (purchaseOrders, batches) not implemented server-side yet.
- [Reports 48] Audit trail mapping: when backend is live, record entityId in audit log for this page's operations.
- [Reports 49] Edge cases: handle zero/negative quantities gracefully; avoid divide-by-zero in totals.
- [Reports 50] Date pickers: not evident; ensure HTML input type=date respects locale/timezone.
- [Reports 51] Search indexing: for large data, move to backend filtering once API integration ready.
- [Reports 52] Import validation: if file upload planned, add schema validation to prevent corrupting App.Data.
- [Reports 53] Auto-refresh: consider setInterval or manual refresh button to reload data after server sync.
- [Reports 54] Multi-user: local storage design is single-user; when multiple users edit same data, merges will conflict.
- [Reports 55] Theming: verify page uses CSS variables; avoid inline colors for consistent dark/light support.
- [Reports 56] Analytics: no tracking of user actions; consider minimal event log for audits.
- [Reports 57] Help text: add contextual tooltips linked to SUPPORT.md/HowToUse.md content.
- [Reports 58] Print/export numbering: align with sequences from backend to avoid duplicates.
- [Reports 59] Data retention: define cleanup/archival for old records shown on this page.
- [Reports 60] Error localization: map error messages through I18n instead of raw English.
- [Reports 61] Clipboard safety: ensure copying sensitive data (PINs, tokens) is avoided in UI.
- [Reports 62] Loading placeholders: skeletons/spinners to signal fetch progress once API wired.
- [Reports 63] Unit boundaries: confirm units (pcs, ml) displayed from dataset to avoid ambiguity.
- [Reports 64] Keyboard focus trap: modals should trap focus; ensure accessible order.
- [Reports 65] Search null safety: guard against undefined .toLowerCase on fields.
- [Reports 66] State cleanup on logout: clear this view's timers/subscriptions.
- [Reports 67] Offline backup: remind user to export backup after major edits on this page.
- [Reports 68] Next steps: document intended workflow for this page in HowToUse.md with screenshots.

### Tasks (tasks)

- [Tasks 01] Purpose: Task planner and auto-generated alerts (batch expiry).
- [Tasks 02] Entry file: js/pages/tasks.js defines App.UI.Views.Tasks.render(root)
- [Tasks 03] Route id 'tasks' registered in sidebar and router; accessible via hash navigation.
- [Tasks 04] Dataset expectation: App.Data.tasks (normalized in db.js). Ensure App.Api remote responses hydrate App.Data.
- [Tasks 05] Remote API gap: App.Api.mode='remote' with missing Auth token will block server data; page currently relies on local seed.
- [Tasks 06] Empty state handling should show friendly message; verify rowsHtml fallback.
- [Tasks 07] Escaping: ensure App.Utils.escapeHtml wraps user-provided fields to avoid XSS.
- [Tasks 08] Sorting/filtering uses client-side arrays; consider debounce and locale-aware comparisons.
- [Tasks 09] Pagination: none; large datasets will render fully and hurt performance.
- [Tasks 10] Search inputs: ensure query lowercasing handles null values to prevent errors.
- [Tasks 11] Actions wired via inline onclick; convert to addEventListener to preserve CSP compatibility.
- [Tasks 12] Role gating: Sidebar hides route if rolePermissions exclude it, but buttons inside page lack role checks.
- [Tasks 13] Keyboard shortcut ctrl+n may call openModal/openCreateModal; confirm function exists to avoid toast 'No create action'.
- [Tasks 14] Audit logging: no App.Audit.log calls on create/update/delete; add for traceability.
- [Tasks 15] Validation: required fields need client-side checks; current code rarely enforces mandatory fields.
- [Tasks 16] Number handling: inputs likely strings; parseFloat/parseInt needed before calculations.
- [Tasks 17] Currency: rely on App.Utils.formatCurrency which reads App.Data.config.currency; ensure config loaded before render.
- [Tasks 18] Date formatting: use App.Utils.formatDate? If not, ensure ISO strings handled consistently.
- [Tasks 19] Loading state: no spinner when API operations in progress; App.UI.Loading available but unused here.
- [Tasks 20] Error feedback: wrap API calls in try/catch and show App.UI.showError to inform user.
- [Tasks 21] Data freshness: views read App.Data snapshot; no live sync after background changes.
- [Tasks 22] Offline: local mutations saved immediately; reconcile with server once remote mode is functional to avoid conflicts.
- [Tasks 23] Bulk actions: not implemented; consider multi-select for mass updates.
- [Tasks 24] Export/import: check for export buttons; integrate with backend endpoints for CSV/PDF.
- [Tasks 25] Print-ready layout: not provided; consider CSS print styles for this page.
- [Tasks 26] Accessibility: add aria-labels, focus order, and keyboard navigation for tables and buttons.
- [Tasks 27] Localization: ensure all visible strings go through App.I18n; some literals remain English.
- [Tasks 28] Mobile layout: flex/grid may overflow; verify responsiveness on small screens.
- [Tasks 29] State persistence: remember filters/sorts per user? currently not persisted.
- [Tasks 30] Empty dataset risk: functions map over undefined arrays unless default []; guard thoroughly.
- [Tasks 31] Performance: repeated App.DB.save calls after each change may freeze UI on large data.
- [Tasks 32] Data integrity: ensure IDs generated by App.Utils.generateId do not clash with backend UUIDs when syncing.
- [Tasks 33] Notifications: App.UI.Toast used for success; limit noise on batch operations.
- [Tasks 34] Modals: ensure Modal.close resets forms; prevent memory leaks by clearing listeners on rerender.
- [Tasks 35] Attachment handling: none; consider file inputs where relevant.
- [Tasks 36] Filtering by status: check that string comparisons lowercased to avoid undefined.toLowerCase errors.
- [Tasks 37] Clipboard/export shortcuts: ctrl+e not implemented per page; add listeners or disable.
- [Tasks 38] Column alignment: ensure numeric columns right-aligned for readability.
- [Tasks 39] Security: avoid exposing internal IDs in DOM data attributes if not needed.
- [Tasks 40] Unsaved changes: no confirmation on navigation away from edited forms.
- [Tasks 41] Test coverage: no automated tests; add unit tests per view once modularized.
- [Tasks 42] Refactoring candidate: split view into smaller functions to improve maintainability.
- [Tasks 43] Error boundaries: rely on global error handler; consider local try/catch for template rendering.
- [Tasks 44] State duplication: some pages maintain activeTab or filters as static props; ensure reset on logout.
- [Tasks 45] Consistency: ensure button styles align with theme.css and maintain accessible contrast.
- [Tasks 46] Data import/export: align with App.DB.backup/import to avoid schema drift.
- [Tasks 47] Server parity: ensure backend routes exist for this entity; some (purchaseOrders, batches) not implemented server-side yet.
- [Tasks 48] Audit trail mapping: when backend is live, record entityId in audit log for this page's operations.
- [Tasks 49] Edge cases: handle zero/negative quantities gracefully; avoid divide-by-zero in totals.
- [Tasks 50] Date pickers: not evident; ensure HTML input type=date respects locale/timezone.
- [Tasks 51] Search indexing: for large data, move to backend filtering once API integration ready.
- [Tasks 52] Import validation: if file upload planned, add schema validation to prevent corrupting App.Data.
- [Tasks 53] Auto-refresh: consider setInterval or manual refresh button to reload data after server sync.
- [Tasks 54] Multi-user: local storage design is single-user; when multiple users edit same data, merges will conflict.
- [Tasks 55] Theming: verify page uses CSS variables; avoid inline colors for consistent dark/light support.
- [Tasks 56] Analytics: no tracking of user actions; consider minimal event log for audits.
- [Tasks 57] Help text: add contextual tooltips linked to SUPPORT.md/HowToUse.md content.
- [Tasks 58] Print/export numbering: align with sequences from backend to avoid duplicates.
- [Tasks 59] Data retention: define cleanup/archival for old records shown on this page.
- [Tasks 60] Error localization: map error messages through I18n instead of raw English.
- [Tasks 61] Clipboard safety: ensure copying sensitive data (PINs, tokens) is avoided in UI.
- [Tasks 62] Loading placeholders: skeletons/spinners to signal fetch progress once API wired.
- [Tasks 63] Unit boundaries: confirm units (pcs, ml) displayed from dataset to avoid ambiguity.
- [Tasks 64] Keyboard focus trap: modals should trap focus; ensure accessible order.
- [Tasks 65] Search null safety: guard against undefined .toLowerCase on fields.
- [Tasks 66] State cleanup on logout: clear this view's timers/subscriptions.
- [Tasks 67] Offline backup: remind user to export backup after major edits on this page.
- [Tasks 68] Next steps: document intended workflow for this page in HowToUse.md with screenshots.

### Settings (settings)

- [Settings 01] Purpose: Company configuration, backups, help.
- [Settings 02] Entry file: js/pages/settings.js defines App.UI.Views.Settings.render(root)
- [Settings 03] Route id 'settings' registered in sidebar and router; accessible via hash navigation.
- [Settings 04] Dataset expectation: App.Data.config/users (normalized in db.js). Ensure App.Api remote responses hydrate App.Data.
- [Settings 05] Remote API gap: App.Api.mode='remote' with missing Auth token will block server data; page currently relies on local seed.
- [Settings 06] Empty state handling should show friendly message; verify rowsHtml fallback.
- [Settings 07] Escaping: ensure App.Utils.escapeHtml wraps user-provided fields to avoid XSS.
- [Settings 08] Sorting/filtering uses client-side arrays; consider debounce and locale-aware comparisons.
- [Settings 09] Pagination: none; large datasets will render fully and hurt performance.
- [Settings 10] Search inputs: ensure query lowercasing handles null values to prevent errors.
- [Settings 11] Actions wired via inline onclick; convert to addEventListener to preserve CSP compatibility.
- [Settings 12] Role gating: Sidebar hides route if rolePermissions exclude it, but buttons inside page lack role checks.
- [Settings 13] Keyboard shortcut ctrl+n may call openModal/openCreateModal; confirm function exists to avoid toast 'No create action'.
- [Settings 14] Audit logging: no App.Audit.log calls on create/update/delete; add for traceability.
- [Settings 15] Validation: required fields need client-side checks; current code rarely enforces mandatory fields.
- [Settings 16] Number handling: inputs likely strings; parseFloat/parseInt needed before calculations.
- [Settings 17] Currency: rely on App.Utils.formatCurrency which reads App.Data.config.currency; ensure config loaded before render.
- [Settings 18] Date formatting: use App.Utils.formatDate? If not, ensure ISO strings handled consistently.
- [Settings 19] Loading state: no spinner when API operations in progress; App.UI.Loading available but unused here.
- [Settings 20] Error feedback: wrap API calls in try/catch and show App.UI.showError to inform user.
- [Settings 21] Data freshness: views read App.Data snapshot; no live sync after background changes.
- [Settings 22] Offline: local mutations saved immediately; reconcile with server once remote mode is functional to avoid conflicts.
- [Settings 23] Bulk actions: not implemented; consider multi-select for mass updates.
- [Settings 24] Export/import: check for export buttons; integrate with backend endpoints for CSV/PDF.
- [Settings 25] Print-ready layout: not provided; consider CSS print styles for this page.
- [Settings 26] Accessibility: add aria-labels, focus order, and keyboard navigation for tables and buttons.
- [Settings 27] Localization: ensure all visible strings go through App.I18n; some literals remain English.
- [Settings 28] Mobile layout: flex/grid may overflow; verify responsiveness on small screens.
- [Settings 29] State persistence: remember filters/sorts per user? currently not persisted.
- [Settings 30] Empty dataset risk: functions map over undefined arrays unless default []; guard thoroughly.
- [Settings 31] Performance: repeated App.DB.save calls after each change may freeze UI on large data.
- [Settings 32] Data integrity: ensure IDs generated by App.Utils.generateId do not clash with backend UUIDs when syncing.
- [Settings 33] Notifications: App.UI.Toast used for success; limit noise on batch operations.
- [Settings 34] Modals: ensure Modal.close resets forms; prevent memory leaks by clearing listeners on rerender.
- [Settings 35] Attachment handling: none; consider file inputs where relevant.
- [Settings 36] Filtering by status: check that string comparisons lowercased to avoid undefined.toLowerCase errors.
- [Settings 37] Clipboard/export shortcuts: ctrl+e not implemented per page; add listeners or disable.
- [Settings 38] Column alignment: ensure numeric columns right-aligned for readability.
- [Settings 39] Security: avoid exposing internal IDs in DOM data attributes if not needed.
- [Settings 40] Unsaved changes: no confirmation on navigation away from edited forms.
- [Settings 41] Test coverage: no automated tests; add unit tests per view once modularized.
- [Settings 42] Refactoring candidate: split view into smaller functions to improve maintainability.
- [Settings 43] Error boundaries: rely on global error handler; consider local try/catch for template rendering.
- [Settings 44] State duplication: some pages maintain activeTab or filters as static props; ensure reset on logout.
- [Settings 45] Consistency: ensure button styles align with theme.css and maintain accessible contrast.
- [Settings 46] Data import/export: align with App.DB.backup/import to avoid schema drift.
- [Settings 47] Server parity: ensure backend routes exist for this entity; some (purchaseOrders, batches) not implemented server-side yet.
- [Settings 48] Audit trail mapping: when backend is live, record entityId in audit log for this page's operations.
- [Settings 49] Edge cases: handle zero/negative quantities gracefully; avoid divide-by-zero in totals.
- [Settings 50] Date pickers: not evident; ensure HTML input type=date respects locale/timezone.
- [Settings 51] Search indexing: for large data, move to backend filtering once API integration ready.
- [Settings 52] Import validation: if file upload planned, add schema validation to prevent corrupting App.Data.
- [Settings 53] Auto-refresh: consider setInterval or manual refresh button to reload data after server sync.
- [Settings 54] Multi-user: local storage design is single-user; when multiple users edit same data, merges will conflict.
- [Settings 55] Theming: verify page uses CSS variables; avoid inline colors for consistent dark/light support.
- [Settings 56] Analytics: no tracking of user actions; consider minimal event log for audits.
- [Settings 57] Help text: add contextual tooltips linked to SUPPORT.md/HowToUse.md content.
- [Settings 58] Print/export numbering: align with sequences from backend to avoid duplicates.
- [Settings 59] Data retention: define cleanup/archival for old records shown on this page.
- [Settings 60] Error localization: map error messages through I18n instead of raw English.
- [Settings 61] Clipboard safety: ensure copying sensitive data (PINs, tokens) is avoided in UI.
- [Settings 62] Loading placeholders: skeletons/spinners to signal fetch progress once API wired.
- [Settings 63] Unit boundaries: confirm units (pcs, ml) displayed from dataset to avoid ambiguity.
- [Settings 64] Keyboard focus trap: modals should trap focus; ensure accessible order.
- [Settings 65] Search null safety: guard against undefined .toLowerCase on fields.
- [Settings 66] State cleanup on logout: clear this view's timers/subscriptions.
- [Settings 67] Offline backup: remind user to export backup after major edits on this page.
- [Settings 68] Next steps: document intended workflow for this page in HowToUse.md with screenshots.
