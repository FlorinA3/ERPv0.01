## Purpose

Part 2 deep-dive audit expanding on missed areas: server routes (documents, inventory, backup, config), page-level behavior, data integrity, security, and operations. No project files modified; read-only review.

## Server Routes & Business Logic (new findings)

- Documents API creates invoices from orders but forbids draft orders; numbers use sequences table but no year reset logic; seq_name uses document type with credit_note alias, risk of mismatch with invoice/delivery/quote naming in UI.
- Document POST uses CURRENT_DATE for document/due dates; ignores order terms and timezone; due_date hard-coded +30 days; no currency handling; discounts and VAT copied blindly from order items, no recomputation.
- Document POST/PUT missing soft-delete; DELETE only allowed for draft but UI has trash bin concept; backend has no trash flag so restore impossible.
- PDF retrieval requires pdf_content bytea stored inline; no generation route; 404 if not present; large PDFs will bloat DB and backups.
- Mark-paid endpoint allows paid when status posted or sent, but post endpoint sets status posted only; UI may set sent; no payment amount/partial support; no AR ledger link.
- Posting invoices updates order status to invoiced but no stock/COGS booking; also no financial journal entries; inventory already reduced at shipment, but documents can be posted without shipment check.
- Inventory routes expose /products and /components with low_stock search but return only limited fields; UI expects minStock/reorderPoint etc. Data model mismatch with frontend App.Data fields (minStock vs min_stock, current_stock vs stock).
- Inventory adjust route allows arbitrary movement_type 'adjustment' meaning absolute stock set; logs difference but accepts negative values via 'loss' without reason enforcement; no lot/expiry handling despite batches feature in UI.
- Movements list joins users; no pagination safeguards against large tables; lack of index on created_at in migration may slow queries (migration adds idx_inventory_date, ok but still watch).
- Alerts endpoint counts low stock only via database min_stock; UI uses minStock/reorderPoint; mismatch will confuse users when remote mode is enabled.
- Components POST/PUT allow sku duplicates except unique constraint; no supplier FK; purchase price not used anywhere else.
- Config routes store JSON as text in config table; initialize inserts defaults with mojibake (currencySymbol '?', address contains '�'); UI may show corrupted characters; language default 'de' while frontend default 'en'.
- Sequences endpoints allow direct updates by admin; no validation for non-negative current_value; no audit logging other than DB trigger; can lead to duplicate numbers.
- Dashboard stats API counts orders not in (cancelled,invoiced) and posted invoices for monthly revenue, but UI dashboard uses local App.Data with different formulas (grossTotal of documents of type invoice). Numbers will diverge when API is used.
- Backup routes: create uses pg_dump without compression; requires pg_dump executable on host and PGPASSWORD env; failure path logs error but leaves partial .sql on disk; permissions on BACKUP_DIR default /tmp; Windows path may fail. Restore executes psql without safety (no transaction wrap), can clobber data; not idempotent.
- Backup export-data dumps multiple tables to JSON then deletes file after download; no authz beyond admin; risk of data exfiltration; no size limits.
- Backup verify recalculates checksum; if backup_log missing row returns valid true with message; does not store verification attempts or IP.
- CORS still '*' with credentials true; browsers will block cookie credentials but Authorization header still sent; consider setting explicit origin and removing credentials flag if token-only.
- Error handling returns plain {error}; no requestId except 500 handler in index.js; inconsistent error shapes across routes complicate frontend.

## Database & Migration gaps (addendum)

- Migration uses gen_random_uuid() but does not CREATE EXTENSION pgcrypto; deployment on vanilla Postgres will fail.
- inventory_movements.item_id lacks FK to products/components; data integrity not enforced; item_type string gates meaning but not constrained to existing ids.
- Sequences table initialized but not rotated yearly; current_value grows indefinitely; no uniqueness per year beyond prefix-year concat.
- audit_trigger_func stores old/new JSON with all columns; sensitive fields (password_hash, token_hash) will be logged on users table; GDPR risk.
- audit trigger does not capture actor ip/user_agent; middleware sets current_user_id via SET, but not reset per transaction; pooled connection may bleed user id if errors occur before reset.
- No indexes on foreign keys like order_items.order_id, document_items.document_id; high-volume joins will degrade.
- currency, payment terms, VAT: stored as numeric without currency codes; multi-currency impossible without schema change.
- orders total fields DECIMAL(12,2) but quantities DECIMAL(12,4); rounding strategy not codified; tax rounding per line not enforced.
- BOM table exists but not used in routes; production/consumption logic absent on server.

## Frontend Pages Missed in Part 1 (quick read)

- Orders page likely uses App.Api.orders with confirm/ship hooks; but App.Api.mode remote without token; UI expects local App.Data.orders fields (orderId, totalGross) conflicting with backend order_number/total_gross naming.
- PurchaseOrders page exists but server has no purchase order routes; entire page runs local-only, unsynced, risk of divergence once backend added.
- Production page: no server endpoints for productionOrders; page must be local; BOM/component depletion unimplemented server-side.
- Batches page: no server route; expiry tasks rely on App.Services.Automation; backend unaware of batches/lot/expiry.
- Tasks page: tasks data local only; backend has no tasks table; cross-user collaboration impossible in current API.
- Reports page: frontend aggregates from App.Data; backend offers limited reports (config dashboard stats only); numbers will mismatch.
- Settings page: toggles backups/export via App.DB and local config; does not call server/config endpoints; company settings stored only locally.
- Documents page UI includes trash bin and finalize/finalized flags; backend has no trash column and no finalization lock, so expectations diverge.
- Pricing page: App.Data.priceLists array local only; server has no price list schema; pricing logic will break when remote.

## Integration Gaps (Frontend vs Backend)

- Naming drift: frontend uses camelCase (orderId, docNumber, custId, stock) while backend uses snake_case (order_id, document_number, current_stock). A mapping layer is missing; switching to remote mode will break rendering and mutations.
- Authentication: frontend Auth uses PIN/local; backend requires username/password + JWT. No UI for password login or token storage; App.Api Authorization header empty -> all requests 401.
- Role drift: frontend roles (admin, sales, warehouse, production, user) vs backend (admin, manager, sales, warehouse, readonly). Users seeded in App.Data have roles absent on backend; authorization will deny.
- Sequences: frontend numberSequences in config (lastOrderNumber, etc.) not tied to backend sequences table; numbers will diverge and may duplicate.
- Backup/export: frontend uses App.DB.exportBackup (IndexedDB) while backend exposes /api/backup/create; two incompatible systems.
- Inventory: frontend uses stock/minStock fields; backend uses current_stock/min_stock; movement reasons, lot numbers differ; batches/expiry not present server-side.
- Tasks/Automation: UI auto-creates tasks based on batches/orders in App.Data; backend has no tasks or automation endpoints.
- Reports: frontend charts rely on App.Data documents grossTotal; backend dashboard/stats use posted invoices counts and monthly revenue. Need reconciliation or explicit mode switching.
- Health monitoring: frontend App.Services.Health expects App.DB methods; backend /api/health only checks DB connectivity.

## Security & Ops (additional)

- Backup route executes shell commands via exec without input sanitization; filename derived from timestamp but restore accepts user-supplied filename from request body with no whitelist; path traversal prevented by path.join but directory traversal still possible if filename contains '..'.
- Backup/restore runs under API process user; if service runs as root risk of privilege misuse; no resource limits or timeouts.
- No rate limiting on backup/download/verify endpoints; potential DoS or brute force file discovery.
- Password storage: backend uses bcrypt, but frontend still stores PINs in plain text; switching to backend auth requires migrating users and providing password reset flow.
- Config initialize exposes default credentials and mojibake strings; may overwrite existing config silently if run unintentionally (ON CONFLICT DO NOTHING but inserts missing keys).
- CORS with credentials true and '*' origin may break browsers yet still allow token exfil in non-browser clients; tighten to explicit origins.
- Static hosting of whole root makes docs and .env.example downloadable if deployed naïvely; restrict static dir to /public and index.html.
- Helmet default used but CSP not set; inline event handlers abundant; SRI missing for external lucide script.
- No logging/monitoring for backup operations beyond DB row; failures not alerted; no rotation of backup_log table.
- pg_dump/psql commands synchronous; large DB will block event loop thread; should offload to worker or stream.

## Data Layer & Persistence (IndexedDB vs Postgres)

- App.DB.normalizeData duplicates PascalCase keys; increases payload size and risks confusion when saving to IndexedDB; no migration versioning to evolve schema.
- localStorage fallback differs from IndexedDB content; no reconciliation if both exist; the newer data source wins arbitrarily.
- AutoBackupOnExit writes backups into IndexedDB store 'backups' but no UI to restore listing if IndexedDB unavailable; Health.check marks critical if listBackups fails.
- Export/import encryption uses XOR with password; not cryptographically safe; password optional but UI may suggest security that is not real.
- Save path shows toast on every save; frequent DB.save calls from UI state toggles can flood toasts and block main thread on slow devices.
- calculateHash simple polynomial hash prone to collisions; used for integrity check of backups; not trustworthy for corruption detection.
- DB.save retries 3 times with exponential backoff but doesn’t debounce; simultaneous saves from automation and UI may interleave and drop changes.

## UX/Accessibility/Performance (more detail)

- Sidebar toggles still use control chars; screen readers will announce nonsense; replace with SVG chevrons and aria-expanded attributes.
- Modals and toasts lack focus trapping and ARIA roles; keyboard users may get stuck behind overlays.
- Large inline templates in dashboard/inventory/pages build HTML via string concatenation; missing escape calls on multiple fields (company names, notes) -> XSS risk if data ever comes from backend.
- Charts built with div bars; no labels for values besides formatted currency stripped of symbols; not accessible to screen readers.
- Global keyboard shortcuts active even when modal open; could trigger navigation and data loss; need modal-aware guard.
- No client-side validation for numeric inputs; NaN could propagate to totals; formatting functions assume numbers.
- Mobile: grids with many columns likely overflow; no horizontal scroll wrappers or responsive collapse.
- Localization: lots of hard-coded English (buttons, alerts) and mojibake German; App.I18n.t used inconsistently.
- Performance: App.UI.Views.* render full arrays without pagination; with thousands of rows the DOM will choke; need virtual scrolling or server paging when API live.

## Operational Next Steps (prioritized)

1) Decide on single source of truth (Postgres vs IndexedDB). If Postgres: build mapping layer for field names, implement JWT login UI, and disable local mutations unless offline mode is explicit.
2) Harden auth: add username/password login, token storage, refresh/expiry handling; remove PIN auth or keep only for demo; align roles across frontend/backend.
3) Fix encoding/icons: clean I18n strings to UTF-8, replace control characters in sidebar and alerts with SVG, add CSP/SRI for external scripts.
4) Backups: restrict static serving, secure backup endpoints, add compression, path whitelist, and async worker; document restore procedure and testing.
5) Inventory/documents/orders alignment: reconcile field names and statuses; add stock/BOM logic on server or disable related UI actions until ready.
6) Add tests: smoke tests for API routes, unit tests for client utilities (App.DB, App.Api mappings), and integration for auth/role gating.
7) Migrations: add pgcrypto extension, FKs for movements, indexes for order_items/document_items, sequence/year reset strategy, and data redaction for audit logs.
8) UX polish: pagination, accessibility (aria roles, focus trap), input validation, error messaging through I18n.

