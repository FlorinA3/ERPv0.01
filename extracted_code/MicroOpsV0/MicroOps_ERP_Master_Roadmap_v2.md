# MicroOps ERP – Master Implementation Roadmap v2 (GA Roadmap)

**Objective**  
Merge the two existing plans into one **final execution document** that takes MicroOps ERP from:

- **Current:** High‑fidelity prototype, strong UI, partial backend, lots of risk  
- **Target:** **GA‑ready, on‑prem, multi‑user ERP** you can run in your company and sell to similar SMEs

This roadmap merges:

1. The **6‑Phase GA roadmap** (architecture, domain rules, multi‑user, ops, UX, compliance, tests), and  
2. The more **code‑level "Master Implementation Roadmap"** (concrete tasks like changing FLOAT -> DECIMAL, splitting `app.js`, adding auth services, etc.).  

You should treat this as your **single source of truth** for "what to do, in which order, until I can sell this."


---
## How to Use This Document

1. **Do not skip phases.**  
   Each phase depends on the previous ones. If you try to polish UI (Phase 5) while your data model or concurrency is still moving (Phases 1–3), you will rework everything.

2. **Complete every item in a phase before moving on.**  
   - Each bullet exists because it corresponds to at least one risk or failure from the audits.  
   - "Done" means: implemented, sanity‑tested, and not obviously breaking anything else.

3. **At the end of each phase, run focused tests.**  
   - Only move forward when you could look a real customer in the eye and say: "This part is solid."

4. **Keep this file in your repo as `MicroOps_ERP_Master_Roadmap_v2.md`.**  
   - Track progress by turning bullets into checkboxes, or mirroring the structure into your issue tracker.


---
## Global Critical Warnings

Before any phase details, keep these three in mind:
- **Stop inventing new features until the foundation is fixed.**  
  No more random buttons, extra pages, or clever UX until Phase 2 is solid. You are still building on sand.
- **Floating‑point money is illegal and dangerous.**  
  Any use of JS `number` math like `0.1 + 0.2` or DB FLOAT for prices must be replaced by decimal/integer cents logic and DECIMAL columns.
- **PIN login is not authentication.**  
  It’s a convenience UI. Real auth must be JWT + hashed passwords, enforced in the backend.


---
# Phase 1 – Architecture, Auth & Single Source of Truth (The Iron‑Clad Core)

**High‑Level Goal**  
Turn MicroOps into a real client–server ERP where:

- The **backend (Postgres + Node)** is the **only source of truth** for business data.
- **Auth + roles** are enforced server‑side via JWT, not just PIN checks in the UI.
- Local `App.Data` / IndexedDB is only a **cache or snapshot**, never the primary database.

This phase merges:

- 6‑Phase Plan – Phase 1 (architecture, auth, remote‑first)  
- Implementation Roadmap – Phase 1 (Iron‑Clad Backend) + Phase 2 (Adapter layer basics)


## 1.0 Exit Criteria

You only leave Phase 1 when all of this is true:

- Logging in through the UI calls a real backend endpoint (e.g. `/api/auth/login`) and returns a **JWT**.  
- All authenticated API calls from the UI send `Authorization: Bearer <token>` and are rejected without it.  
- The **role matrix** (e.g. `admin / sales / warehouse / production / readonly`) is **consistent** between frontend and backend, and enforced on all sensitive routes.  
- For core entities (Customers, Products/Components, Orders, Documents, Inventory, Settings), **all CREATE/UPDATE/DELETE operations go through the backend**; `App.Data` never invents or persists truth by itself.  
- "Remote mode" is real: core flows work against the Postgres backend with no hidden fallback to pseudo‑local data, and any dedicated "demo/local mode" is behind an explicit flag.  


## 1.1 Backend Data Model & Schema Hardening

Focus: make the DB an honest, safe representation of your business domain.

- [ ] **Fix monetary types (DB)**  
  - Change all monetary columns from FLOAT/REAL to DECIMAL:
    - Example: `DECIMAL(12,4)` for unit prices, `DECIMAL(12,2)` for totals.  
  - Ensure all sums, VAT, discounts depend on these DECIMAL fields.  
  - Add explicit comments in schema for money fields.

- [ ] **Introduce or enforce foreign keys**  
  - `inventory_movements.item_id` -> `products.id` or `components.id`.  
  - `order_items.product_id` -> `products.id`.  
  - Documents link to customers, orders, shipments with proper FK constraints.  
  - No "orphaned" rows allowed.

- [ ] **Soft delete instead of destructive delete**  
  - Add `deleted_at` (TIMESTAMP) to key master tables (Customers, Products, PriceLists, etc.).  
  - Change delete operations to `UPDATE ... SET deleted_at = now()` instead of `DELETE`.  
  - Ensure UI hides deleted records by default, with manual "show deleted" if needed.

- [ ] **Legal sequences for documents**  
  - Create a robust sequence system (table or PG sequences) for invoices, credit notes, etc.  
  - Support patterns like `YYYY-000001`; reset each January 1 or maintain continuous sequence per legal requirements.  
  - Guarantee no reuse after posting and no collisions.

- [ ] **Add server‑side validation layer**  
  - Introduce a schema validation library (e.g. `zod`, `joi`, or custom validation) on backend for request bodies:  
    - Numbers are numbers (not strings),  
    - Quantities ≥ 0,  
    - Required fields present,  
    - Dates valid and in range,  
    - Enums for statuses/roles.


## 1.2 Security, Authentication & Config

Focus: replace PIN toy auth with real auth and remove unsafe config exposure.

- [ ] **Implement username/password login with JWT**  
  - Backend:
    - `POST /api/auth/login` accepts credentials.  
    - Validates via hashed password (`bcrypt` or similar).  
    - Returns `{ token, user: { id, name, role } }`.  
  - Store passwords hashed; never store PIN as password.

- [ ] **Secure configuration API**  
  - Remove any endpoint that dumps full config (DB URLs, SMTP secrets, IBANs).  
  - Create a filtered `/api/config/public` endpoint that only returns safe values (company name, invoice defaults, UI options).  
  - Store sensitive config in environment variables, not in code or static JSON.

- [ ] **Backend input sanitization**  
  - For all `POST`/`PUT` endpoints, validate and sanitize inputs using your validation layer.  
  - Ensure type coercion is deliberate (e.g. parseInt for quantities).  
  - Reject requests with unexpected fields or missing required values.

- [ ] **Fix backup vulnerability**  
  - If you currently call `pg_dump` or `psql` by passing user‑controlled strings to `exec`, remove it.  
  - Replace with:
    - A fixed, controlled command for backup (`pg_dump` with hardcoded params except target path).  
    - A strict filename pattern (timestamped, no user text).  
  - Expose backup/restore **only to admin roles** and never from browser without strong controls.

- [ ] **Align CORS, session and token expiry**  
  - Set correct CORS origin(s) for your SPA host.  
  - Decide token lifetime + refresh strategy.  
  - Ensure expired tokens return 401 and UI forces re‑login.


## 1.3 API & Adapter Layer – Remote‑First Architecture

Focus: all reads/writes should eventually pass through a clean API + adapter, not scattered fetch calls and direct App.Data pokes.

- [ ] **Create a central API service module (e.g. `js/api.js`)**  
  - Provide methods like `api.get(path, params)`, `api.post(path, body)`, etc.  
  - Add an interceptor that injects the JWT into `Authorization` header for each call.  
  - Handle 401/403/500 and propagate errors in a structured way.

- [ ] **Create an auth service (e.g. `js/services/auth.js`)**  
  - Implement `login`, `logout`, `getCurrentUser`, `getToken`.  
  - Store JWT in memory + `localStorage` (or similar) with care.  
  - On 401 from any request, trigger a controlled logout flow.

- [ ] **Introduce a DTO mapping layer (snake_case ↔ camelCase)**  
  - Create a mapping utility that converts backend field names (snake_case) to frontend naming (camelCase) and back.  
  - Apply this centrally, not scattered in every view.  
  - This prevents "field name chaos" and simplifies later refactors.

- [ ] **Switch read paths from App.Data -> API**  
  - For each module, in this order:
    1. Customers  
    2. Products/Components  
    3. PriceLists  
    4. Orders  
    5. Documents (invoices, offers, delivery notes)  
  - Replace direct `App.Data.*` "reads" with `await api.get(...)` and then store results in your central store.  
  - Add proper loading indicators around every async fetch.


## 1.4 Demote Local State from "Truth" to "Cache"

Focus: centralise state handling and ensure local state always reflects backend reality.

- [ ] **Introduce a Store abstraction (simple state manager)**  
  - Create `store/index.js` (or similar) with:  
    - `getState()`,  
    - `dispatch(action)`,  
    - `subscribe(listener)`.  
  - All components should read data from the store, not from random global objects.

- [ ] **Wrap App.Data in the Store**  
  - Initially, you can still keep App.Data under the hood, but:  
    - Only API responses are allowed to mutate it;  
    - No UI component should directly push into App.Data arrays;  
    - All changes go through store actions like `CUSTOMER_LIST_LOADED`, `ORDER_UPDATED`.

- [ ] **Remove / sandbox "demo data loads" for production**  
  - Keep any data seeding for dev builds only.  
  - In production build, data loads must come from the backend only.

- [ ] **Phase‑1 smoke tests**  
  - Through Postman and through the UI, verify:  
    - Login -> create customer -> create product -> create order -> ship -> invoice.  
    - All visible data is coming from the DB (no fallback to local seeds).


---
# Phase 2 – Domain Model, Business Rules & Legal Core (The Brain)

**High‑Level Goal**  
Make the **business logic correct and auditable** for a real Austrian manufacturing + medical‑like environment:

- Orders, shipments, and invoices follow a **clear, enforced state machine**.  
- Inventory movements are **balanced, linked, and traceable**.  
- VAT, rounding, and document numbering satisfy basic legal expectations.  
- Pricing, discounts, and sequences behave predictably and entirely server‑side.

This phase merges:

- 6‑Phase Plan – Phase 2 (domain model, FSM, finance logic)  
- Implementation Roadmap – Phase 1.3 (inventory transactions), Phase 3 (business logic & workflow), and parts of Phase 1.1/1.3.


## 2.0 Exit Criteria

Move on to Phase 3 only when:

- Orders and Documents have server‑side **finite state machines** and the backend rejects illegal transitions.  
- Inventory is updated exclusively through **InventoryMovement** records linked to their cause.  
- It’s hard/impossible to create negative stock, edit posted/paid invoices, or skip required steps in the order -> shipment -> invoice pipeline.  
- VAT computations and rounding are tested and correct.  
- Invoice/credit numbering is unique, year‑aware (if required), and immutable after posting.  


## 2.1 Canonical Domain Model & Relationships

- [ ] **Document the core entities and relationships**  
  - Customer, Product, Component, PriceList, Order, OrderItem, Shipment, Document (Invoice/Credit/Offer), Payment, InventoryMovement, Batch/Lot, Task.  
  - Write a simple ER diagram and keep it in the repo.

- [ ] **Enforce foreign keys and referential integrity**  
  - Ensure every InventoryMovement has a reference to a specific doc/order/adjustment reason.  
  - Prevent deletion of referenced entities (use soft delete as defined in Phase 1).

- [ ] **Consolidate document types**  
  - Decide what is a `Document` vs a "view":
    - Offers/Quotes, Invoices, Credit Notes, Delivery Notes.  
  - Ensure each has its own type and appropriate legal rules.


## 2.2 Server‑Side Finite State Machines (FSMs)

- [ ] **Order FSM**  
  - Define statuses: at least `Draft`, `Confirmed`, `InProduction`, `ReadyToShip`, `Shipped`, `Invoiced`, `Closed`, `Cancelled`.  
  - Implement transitions server‑side:  
    - Reject "Ship" for Draft orders.  
    - Reject "Invoice" when no shipped quantity or explicit override is allowed.

- [ ] **Document FSM (Invoices & Credits)**  
  - Define statuses: `Draft`, `Posted`, `Paid`.  
  - Once a document is `Posted` or `Paid`, prevent any edit to financial fields or deletion.  
  - Implement credit notes as separate documents that link back to the original invoice.  
  - For partial payments, either support them properly or explicitly disallow with clear messaging.

- [ ] **UI enforcement of FSM**  
  - Disable or hide buttons for actions that the backend would reject (Edit/Delete once Posted).  
  - Show clear error messages when backend blocks illegal transitions.


## 2.3 Inventory Integrity & Movement Logic

- [ ] **Atomic inventory update for shipments**  
  - Implement a server transaction:  
    1. Lock the product/stock rows.  
    2. Check available stock ≥ requested shipment quantity.  
    3. Deduct the stock.  
    4. Insert an InventoryMovement row (with type SHIPMENT, reference to shipment/doc).  
    5. Update order/shipment status.  
  - Ensure double‑clicking "Ship" or retrying cannot double‑deduct.

- [ ] **Guard against negative stock**  
  - Decide: either strictly forbid negative stock, or allow only via a special adjustment path.  
  - Enforce this rule server‑side, not just UI warnings.

- [ ] **Production & BOM flows (v1 decision)**  
  - Either:
    - Implement basic BOM consumption + finished goods production as InventoryMovements, **or**  
    - Explicitly turn off BOM features in v1 with feature flag and clear labels.


## 2.4 VAT, Totals, and Calculation Rules

- [ ] **Monetary calculation library on backend**  
  - Implement utilities that operate in integer cents or use a decimal library.  
  - Apply them consistently to:
    - Line totals,  
    - Discounts,  
    - VAT per line,  
    - Document totals.

- [ ] **Per‑line rounding**  
  - Round each line to 2 decimal places, then sum lines.  
  - VAT summaries must match the sum of line VAT amounts for each rate.

- [ ] **Configurable VAT rates**  
  - Move VAT percentages into a configuration source (per product or tax table).  
  - Ensure historical documents preserve historical VAT values.

- [ ] **Test suite for tricky cases**  
  - Implement unit tests for:
    - 0.1 + 0.2 patterns,  
    - Mixed VAT rates,  
    - Large invoices with many lines,  
    - Edge discount rules (percentage vs fixed).


## 2.5 Document & Sequence Logic (Legal Core)

- [ ] **Sequence enforcement**  
  - Add a sequence generator that is server‑side only and handles concurrency.  
  - For each new posted invoice or credit note, allocate a new sequence number that cannot be reused.

- [ ] **Immutability of posted documents**  
  - Once an invoice or credit is `Posted`, only allow changes to strictly non‑financial metadata (e.g. internal notes), if at all.  
  - Prefer full immutability: changes require a credit + new invoice.

- [ ] **Traceability and re‑print behavior**  
  - Store the version of legal text and layout used at posting time.  
  - For reprints, automatically mark the document as "Copy" and log who printed it and when.


## 2.6 Frontend Validation to Support Domain Rules

- [ ] **Centralised validation schemas per entity**  
  - Example: `OrderValidationSchema`, `InvoiceValidationSchema`, `CustomerValidationSchema`.  
  - Validate required fields, numeric ranges, date formats, and domain‑specific rules (e.g., you cannot create an invoice without a customer).

- [ ] **UI reflects server rules**  
  - Ensure the UI cannot send obviously invalid data (e.g. negative quantity, empty VAT rate).  
  - Provide inline errors and disable submit until the form is valid.

- [ ] **Phase‑2 domain scenario tests**  
  - Walk real workflows end‑to‑end:
    - Standard order -> ship -> invoice -> payment.  
    - Return/credit flow.  
    - Partial shipment and final invoice.  
  - Verify:
    - Inventory levels,  
    - Document totals,  
    - Status sequences,  
    - Audit trail correctness.


---
# Phase 3 – Multi‑User Safety, Offline Policy & State Management (The Shield)

**High‑Level Goal**  
Make MicroOps **safe for 2–5 concurrent users** and predictable when offline/online state changes:

- Written invariants for data integrity and safety.  
- Clear concurrency strategy (optimistic locking, DB locks where needed).  
- Offline rules are explicit and enforced.  
- Global state access is centralised through a store; no "random mutations" that bypass rules.

This phase is largely from the 6‑Phase Plan – Phase 3, plus the concurrency bits in the Implementation Roadmap.


## 3.0 Exit Criteria

You leave Phase 3 only when:

- Critical entities obey defined invariants under concurrent use.  
- Conflicts are detected and surfaced to the user, not silently lost.  
- Offline writes to stock and financial documents are blocked or strictly controlled.  
- Multi‑tab and multi‑user use does not corrupt data.  


## 3.1 Non‑Negotiable Invariants

- [x] Write an `INVARIANTS.md` that at minimum covers:  
  - No negative stock (or only under a controlled "allow negative" flag with logging).  
  - One document number -> one actual document; no reuse or duplicates.  
  - Posted/paid invoices are immutable.  
  - Inventory is always reconciled via InventoryMovements; direct stock overrides are adjustments with reasons.  
  - Offline clients cannot post stock movements or financial documents.


## 3.2 Concurrency Strategies Per Entity

- [x] **Optimistic concurrency for master data**  
  - For Customers, Products, etc., include a version or `updated_at` field.  
  - Backend rejects updates if the version in the request does not match DB; return 409 Conflict.

- [x] **Strict transaction & locking for inventory and financial operations**  
  - Use DB transactions + `SELECT ... FOR UPDATE` or equivalent to serialize competing operations on the same stock or invoice.  
  - Ensure dedupe/idempotency guards for "Ship" and "Mark Paid" actions.

- [x] **Atomic "Ship Order" and "Post Invoice" operations**  
  - Wrap all related operations (status change, movement records, totals) into a single transaction to prevent partial state.

- [x] **UI conflict handling**  
  - When backend returns 409, display a clear message: "This record was changed by another user. Reload to see the latest version."  
  - Optionally log conflict events for analysis.


## 3.3 State Management & Multi‑Tab Behaviour

- [x] **Enforce all state changes through the Store**  
  - No direct `App.Data.push` from views.  
  - All updates must be done by dispatching actions that call backend, then update the store with server response.

- [ ] **Multi‑tab coordination**  
  - Prevent background tabs from running scheduled tasks or repeated polling.  
  - Implement tab "leadership" (using BroadcastChannel or localStorage heartbeat) if you need background sync.

- [x] **App.DB / IndexedDB versioning and safety**  
  - Define a schema and version for IndexedDB.  
  - Implement migrations; on failure, clear and resync from server.  
  - Only cache safe data (e.g. master data, last few documents), not secrets.

- [x] **Stale data indicators**  
  - Show last refresh timestamp on key views.  
  - Warn users when data is older than a threshold if they are making decisions based on it.

*Status (Phase 3.3):* Core entities now flow through store modules with TTL-based refresh and tab-sync notifications; IndexedDB/localStorage act as cache/backup (debounced saves), and UI shows refresh timestamps. Remaining for 3.4: offline write queue with conflict UX, and broader row_version coverage for transactional entities.


## 3.4 Offline Policy & Tests

- [x] **Explicit offline rules for GA v1**  
  - Decide:
    - Offline read-only allowed for some screens.  
    - Offline drafts allowed for new orders/notes, but clearly marked unsynced.  
    - No posting of stock or invoices offline.

- [x] **Enforce offline behaviour in code**  
  - Detect offline status and block disallowed actions.  
  - Queue drafts separately, with a visible "Sync" process when back online.  
  - Ensure backend rejects attempts to post from old offline versions.

- [x] **Multi-user and offline scenario tests**  
  - Two sales reps editing the same order.  
  - Warehouse vs sales working on same SKU and order.  
  - Offline-then-online sequence where drafts must be reconciled or rejected.  
  - Confirm all these behave within your invariants.

*Status (Phase 3.4):* Offline rules for GA v1 are now explicit and enforced in UI/API guards (read + draft only when offline). Legacy local-only stock/financial flows remain demo-only behind config. A robust offline write queue and reconciliation flow is deferred to a post-GA phase (Phase 4+).


---
# Phase 4 – Deployment, Backup/Restore & Monitoring (On‑Prem Reality)

**High‑Level Goal**  
Make MicroOps **installable and operable on a Windows server** with confidence:

- Clean, repeatable packaging for dev/test/prod.  
- Scripted backups and tested restores.  
- Basic monitoring and logging so you see problems early.

This merges:

- 6‑Phase Plan – Phase 4 (deployment, DR, monitoring)  
- Implementation Roadmap – Phase 1 backup fix, Phase 6 backups & deployment.


## 4.0 Exit Criteria

You move to Phase 5 only when:

- You can take a clean Windows machine, follow your docs, and get MicroOps running in less than a day.  
- Nightly backups run automatically, are stored safely, and you have successfully restored one to a staging DB.  
- Minimal health checks, logs and alerts exist (even if simple).  


## 4.1 Packaging & Environments

- [x] **Define packaging model**  
  - Backend ZIP outlined with Node server, migrations, config templates, and install script (see `docs/DEPLOYMENT_WINDOWS.md`).  
  - Frontend packaged as static SPA assets (`index.html`, `css/`, `js/`) with no secrets; kept separate from backend.

- [x] **Environment-specific config**  
  - `.env.example` plus `.env.development`, `.env.test`, `.env.production` templates created.  
  - DB connection, JWT, ports, logging paths documented and loaded per `NODE_ENV`.  
  - Windows on-prem setup steps added for administrators.

- [x] **Windows service & shared drive considerations**  
  - NSSM-based service template added (`scripts/install_service_windows.ps1`) with limited-account guidance.  
  - Network share guidance for static frontend, NTFS permissions, and path-length cautions documented.


## 4.2 Backup/Restore & DR Runbook

- [x] **Safe backup implementation**  
  - Node CLI `server/utils/backupDb.js` wraps `pg_dump`, writes timestamped SQL files to `BACKUP_DIR`, and prunes via `BACKUP_RETENTION_DAYS`.

- [x] **Scheduled backups**  
  - Windows Task Scheduler-ready script `scripts/backup_db_windows.ps1` provided; docs include scheduling steps and defaults.

- [x] **Restore scripts and tests**  
  - Windows restore helper `scripts/restore_db_windows.ps1` plus staging restore checklist in `docs/BACKUP_RESTORE_WINDOWS.md`.

- [x] **Disaster scenarios**  
  - RPO/RTO guidance and scenario runbooks (disk failure, ransomware, config loss, accidental deletion, hardware swap) documented in `docs/DR_RUNBOOK_WINDOWS.md`.


## 4.3 Monitoring, Logging & Health

- [x] **Structured logging**  
  - JSON-per-line logger with request/user IDs, durations, and daily log files (`LOG_DIR`, `LOG_LEVEL`, `LOG_RETENTION_DAYS`) with pruning.

- [x] **Health endpoint**  
  - `/api/health` and `/api/health/deep` report DB connectivity, env/log/backup directory checks, uptime/app version; non-OK returns HTTP 503.

- [x] **Minimal monitoring & alerts**  
  - Windows-friendly `scripts/check_health_windows.ps1` for Task Scheduler to monitor health; logs contain `requestId` for correlation.

- [x] **Deployment & rollback checklist**  
  - Deployment doc updated with logging/monitoring sections and health-check scheduling; DR runbook references health checks and log locations.


---
# Phase 5 – Frontend UX, Performance & Maintainability (The Face & Skeleton)

**High‑Level Goal**  
Transform the frontend from a "works but messy" prototype into **maintainable, fast, and pleasant software**:

- `app.js` is split into modules; code is linted and structured.  
- Lists are paginated and searchable, not loading thousands of rows.  
- UI uses a consistent design system; printing is clean and professional.  
- Forms are validated, errors are clear, and UX does not fight the user.

This phase merges:

- 6‑Phase Plan – Phase 5 (UX, performance, maintainability)  
- Implementation Roadmap – Phases 2–5 (adapter, data hydration, mega‑file split, CSS variables, pagination, etc.).


## 5.0 Exit Criteria

You leave Phase 5 only when:

- Frontend modules are structured and understandable by another dev.  
- Orders, products, documents lists handle many records without freezing.  
- Print outputs (invoices, delivery notes) are visually correct on paper/PDF.  
- Majority of everyday operations feel smooth and predictable to a user.  


## 5.1 Modularisation & Code Hygiene

- [x] **Split `app.js` into modules** *(Phase 5.1 - Partial)*
  - Created core modules:
    - `js/core/config.js` – Configuration, debug flags, conditional logging
    - `js/ui/helpers.js` – Toast, Loading, Validation, escapeHtml utilities
    - `js/core/lockScreen.js` – Event handlers for session lock/unlock
  - Removed inline `onclick` handlers from lock screen HTML
  - Added backward-compatibility shims in app.js for seamless integration
  - Updated script load order in index.html (core modules → app.js → pages)
  - **Remaining:** Continue splitting auth.js, router.js, formatters.js in future phases

- [ ] **Enable ES6 modules & bundling (optional but recommended)**
  - Use `<script type="module">` and `import/export`.
  - Optionally introduce a bundler (Vite/Webpack/Rollup) for builds.
  - **Note:** Current phase uses vanilla script tags; ES6 modules deferred to avoid breaking changes

- [ ] **Add ESLint & Prettier**
  - Configure rules and run them.
  - Fix major warnings (unused variables, implicit globals, obvious smells).

- [ ] **Fix encoding issues (Mojibake)**
  - Ensure all source files (especially with German text) are saved in UTF‑8.
  - Clean up broken characters in UI and templates.


## 5.2 Design System & Theming

- [x] **Create a `theme.css` with CSS variables** *(Phase 5.2 - Complete)*
  - Added comprehensive design token system to `base.css`:
    - Color tokens: `--color-primary`, `--color-danger`, `--color-success`, `--color-bg`, etc.
    - Spacing scale: `--space-xs` through `--space-2xl` (4px to 32px)
    - Border radius tokens: `--radius-xs` through `--radius-xl`
    - Shadow tokens: `--shadow-sm`, `--shadow-md`, `--shadow-soft`, `--shadow-lg`
  - Multiple theme variants: Dark (default), Light, Cyberpunk, Vaporwave, Steampunk, Sci-Fi

- [x] **Refactor UI components** *(Phase 5.2 - Complete)*
  - Updated buttons, badges, cards, modals, alerts to use design tokens
  - Removed hardcoded gradients and hex codes from `components.css` and `layout.css`
  - Replaced scattered color values with theme token references
  - All components now respect theme switching via `data-theme` attribute

- [x] **Icons & feedback** *(Phase 5.2 - Complete)*
  - Created local SVG icon helper module (`js/ui/icons.js`) with 40+ icons
  - Offline-safe icon set based on Lucide (no CDN dependency for core icons)
  - Icons for: status (check, x, warning, info), actions (edit, delete, print, download), navigation, business, system
  - Clear hover/focus/active states on all interactive elements via CSS tokens


## 5.3 Performance: Pagination, Search & Large Data

- [ ] **Server‑side pagination & filters**  
  - For Orders, Products, Documents, implement API parameters: `?page=1&limit=50&search=...`.  
  - Make sure DB queries have necessary indexes.

- [ ] **Frontend pagination UI**  
  - Add pagination controls (Next/Prev, page numbers).  
  - Show counts (e.g. "1–50 of 1234").

- [ ] **Optimise table rendering**  
  - Use table or virtual lists to avoid thousands of DOM nodes.  
  - Ensure empty states show friendly messages.

- [ ] **Measure and target performance**  
  - Aim for:
    - Orders list page render < ~200–300 ms on typical data.  
    - No obvious freezes when filters change.


## 5.4 Forms, Validation & Error Handling

- [ ] **Frontend validation aligned with backend rules**  
  - Use schemas (or at least shared rule modules) to validate before submit.  
  - Block submission if invalid; show inline messages near fields.

- [ ] **Double‑submit protection**  
  - Disable submit buttons while awaiting API responses.  
  - Avoid creating duplicates on double clicks or network retries.

- [ ] **Global error handler**  
  - Use `window.onerror` and `unhandledrejection` handlers to capture unexpected issues.  
  - Show user‑friendly error modals, and log details for support.

- [ ] **Loading & empty states**  
  - Show spinners or skeletons while loading.  
  - Show "No orders found" / "No products yet" for empty lists.


## 5.5 Printing & Layout Polish

- [ ] **Final A4 templates**  
  - Fine‑tune invoice and delivery note templates for:
    - Margins,  
    - Fonts,  
    - Headers/footers,  
    - Legal text region,  
    - Totals box,  
    - Multi‑page behavior (repeating header and page numbers).

- [ ] **Print testing on real devices**  
  - Test on at least one laser printer and PDF export.  
  - Ensure no clipping at 100% scale, no missing totals or text.

- [ ] **Reprints and "Copy" marking**  
  - Provide clear marking for reprints.  
  - Log who reprinted and when.


## 5.6 Accessibility & Device Support

- [ ] **Keyboard navigation**  
  - Ensure tab order is sensible.  
  - Trap focus inside modals.

- [ ] **Mobile/tablet usability**  
  - Add `overflow-x: auto` for wide tables.  
  - Increase touch target sizes where needed.

- [ ] **Color‑independent cues**  
  - Use icons or text plus color, not color‑only, to convey critical states (errors, warnings).


---
# Phase 6 – Security, Compliance, Documentation, Test Harness & GA Launch (Go‑To‑Market)

**High‑Level Goal**  
Tie everything together for **GA readiness**:

- Solid security & GDPR hygiene.  
- Documentation so others can use and operate MicroOps without you.  
- Automated test harness for daily workflows.  
- Master GA checklist passes; you can run it internally and sign your name under v1.0.


## 6.0 Exit Criteria

You can call the product GA and move to selling when:

- All **Critical** and **High** risks from the audits are either fixed or explicitly accepted with documented mitigations.  
- The **Master GA Checklist** derived from your audits is "PASS" for all high‑priority items.  
- A new admin + user can get productive from your docs alone.  
- The workflow tests run clean on a fresh environment.  


## 6.1 Security & GDPR Hygiene

- [ ] **Role‑based access to sensitive data**  
  - Only allowed roles see IBAN/BIC, internal notes, and cost/margin fields.  
  - Warehouse and production should not see financial secrets.

- [ ] **Audit trails for critical changes**  
  - Log who/when/what for:
    - Master data changes (customers, products, prices),  
    - Document posts, payments, cancellations,  
    - Stock adjustments and movements.

- [ ] **Customer data export**  
  - Implement a way to export all data for a given customer (JSON/CSV + docs list).  
  - Use it to satisfy GDPR access requests.

- [ ] **Deletion & retention policies**  
  - Decide for each data type (invoices, customers, logs):
    - How long it is retained.  
    - Whether it can be deleted or must be anonymized instead.  
  - Implement jobs or manual procedures to enforce retention periods.

- [ ] **Log retention & masking**  
  - Ensure logs do not store full IBANs or other sensitive fields; mask them.  
  - Configure log retention and deletion schedule.

- [ ] **User provisioning/deprovisioning**  
  - Document and implement steps to add users, assign roles, and remove access when employees leave.


## 6.2 Integrations Needed for v1

- [ ] **Email sending with templates**  
  - Configure SMTP with TLS.  
  - Implement sending of invoices and delivery notes as PDF attachments.  
  - Use editable templates with placeholders for document number, totals, payment terms.

- [ ] **Accounting export**  
  - Provide an export (CSV/Excel) for your Steuerberater with required columns.  
  - Run at least one test import with them or a sample tool.

- [ ] **API documentation (optional but valuable)**  
  - Generate a minimal OpenAPI or markdown document listing main endpoints and payloads.  
  - Useful for future automation or integration projects.


## 6.3 Documentation & Training

- [ ] **User guide**  
  - For Sales, Warehouse, Production:  
    - Login, navigation, search, create order, ship, invoice, basic reports.

- [ ] **Admin guide**  
  - For Admin/Owner/IT:  
    - Initial setup (company master data, VAT, numbering, roles, legal texts).  
    - Backup/restore procedures.  
    - Updating the app.

- [ ] **Ops runbook**  
  - For whoever runs the server:  
    - Starting/stopping services.  
    - Checking health.  
    - Responding to common incidents (DB down, disk full, backup failed, printer issues).

- [ ] **Known limitations list**  
  - Clearly state what v1 does *not* do yet (e.g. no multi‑currency, limited production features).  
  - This avoids disappointment and keeps sales promises honest.


## 6.4 Test Harness & Workflow Automation

- [ ] **Finalize the workflow test harness**  
  - Use your existing Playwright/automation harness as base.  
  - Map each scenario file (e.g. 01_email_to_invoice, 02_procurement_and_production, 03_inventory_cycle) to real workflows.

- [ ] **Cover core flows in tests**  
  - At minimum:  
    - Auth (login/logout, roles).  
    - CRUD for customers/products.  
    - Order -> shipment -> invoice -> payment.  
    - Stock adjustments and cycle counts.  
    - Printing (basic presence of key fields).  
    - Backup/restore sanity checks.

- [ ] **One‑command test run**  
  - e.g. `python tests/run_workflow_checks.py --headless`  
  - Should spin up, run suites, and report clear PASS/FAIL per workflow.


## 6.5 GA Checklist & Launch

- [ ] **Instantiate the Master GA Checklist**  
  - Take the GA checklist from your audits/final coverage document.  
  - Convert into a Markdown checklist or issue list.  
  - For each item:
    - Mark PASS/FAIL.  
    - If FAIL, either fix it or explicitly accept and note why.

- [ ] **Internal pilot**  
  - Run MicroOps fully in your own company for a defined period (e.g. 1–2 months).  
  - Use it for real orders, shipments, invoices, while keeping export/Excel as backup.  
  - Capture issues and fix the painful ones.

- [ ] **Tag `v1.0.0-GA` and prepare first external customer**  
  - When you’re comfortable with internal usage and GA checklist is green on criticals:  
    - Tag the release.  
    - Prepare a simple installation & onboarding kit.  
    - Start with one friendly SME customer and learn from that rollout.


---

## Final Notes

- **This roadmap is intentionally ambitious.**  
  It is meant to reflect what you actually need to run MicroOps as a serious, auditable, on‑prem ERP — not just a cool personal project.

- **Use Phase 1–3 to make the system safe and correct.**  
  Only then is it worth refining UI and polishing the outer shell.

- **Treat this file as living.**  
  As you discover new realities in your company (or with first customers), update this roadmap and your GA checklist accordingly.
