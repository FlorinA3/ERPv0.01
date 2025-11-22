# MicroOps ERP – Complete 0–100 Blueprint (MVP + MLP++ Merged)

## 1. System Overview & Constraints

**Purpose:**
Offline-first, small ERP for a single SME: orders, production, inventory, documents, price lists, tasks.

**Architecture:**

* Pure front-end SPA (Single Page Application).
* Tech: HTML5 + CSS3 + vanilla JS (ES6+), static JSON for seed.
* No frameworks (no React/Vue), no bundlers (no Webpack/Vite), no backend.
* Runs by opening `index.html` (or any static file server).

**Persistence:**

* Seed data: `data/microops_data.json`.
* Runtime DB stored in `localStorage` under a single key, e.g. `microops_db`.
* On startup:

  * If `localStorage` contains DB → load.
  * Else → load seed JSON → write to `localStorage`.

**Global Namespace:**

* `App` root object:

  * `App.Data` – in-memory DB.
  * `App.DB` – load/save, seed, backups.
  * `App.Router` – route handling.
  * `App.UI` – shared UI components.
  * `App.Pages` – page modules.
  * `App.I18n` – translations.

---

## 2. Navigation, Routes & Roles

### 2.1 Routes

Router IDs (fixed):

* `dashboard`
* `customers`, `products`, `components`, `suppliers`, `carriers`, `pricing`
* `inventory`, `movements`
* `orders`, `production`
* `documents`, `reports`
* `tasks`, `settings`

### 2.2 Sidebar Structure

Sections (headings, non-clickable) + items:

1. **Übersicht**

   * `dashboard` → "Dashboard"

2. **Stammdaten**

   * `customers`  → "Kunden (Stammdaten)"
   * `products`   → "Artikelstamm"
   * `components` → "E-Komponenten"
   * `suppliers`  → "Lieferanten"
   * `carriers`   → "Spediteure"
   * `pricing`    → "Preislisten"

3. **Lager & Material**

   * `inventory`  → "Lager & Materialliste"
   * `movements`  → "Lagerbewegungen"

4. **Aufträge & Produktion**

   * `orders`     → "Aufträge / Bestellungen"
   * `production` → "Produktionsaufträge"

5. **Dokumente & Auswertungen**

   * `documents`  → "Dokumente (LS & RE)"
   * `reports`    → "Masterlisten & Berichte"

6. **Organisation & Einstellungen**

   * `tasks`      → "Aufgaben / Planner"
   * `settings`   → "Einstellungen"

### 2.3 Roles & Visibility

Roles: `admin`, `sales`, `warehouse`, `production`.

* `admin`: all routes.
* `sales`:

  * Dashboard, Customers, Products, Price Lists, Orders, Documents, Reports, Tasks.
* `warehouse`:

  * Dashboard, Inventory, Movements, Components, Suppliers, Carriers, Production, Tasks.
* `production`:

  * Dashboard, Production, Components, Inventory, Movements, Tasks (configurable).

Sidebar only renders items allowed for current user role.

---

## 3. Data Model (Full DB Schema)

DB object:

```js
{
  config,
  users,
  customers,
  products,
  components,
  suppliers,
  carriers,
  priceLists,
  orders,
  documents,
  productionOrders,
  movements,
  tasks
}
```

### 3.1 config

* Company:

  * `companyName`, `street`, `zip`, `city`, `country`
  * `vatNumber`, `commercialRegisterNumber`
  * `iban`, `bic`, `bankName`
  * `currency`
* Defaults:

  * `defaultVatRate`
  * `defaultPaymentTerms`
  * `defaultDeliveryTerms`
* UI:

  * `lang` (global default)
  * `theme` (global default)
* Environment:

  * `isDemo` (bool)
  * `autoLockMinutes` (session lock)
* Numbering:

  * `numberSequences`:

    * `lastOrderNumber`
    * `lastDeliveryNumber`
    * `lastInvoiceNumber`
    * `lastProductionOrderNumber`

### 3.2 users

* `id`
* `name`
* `pin`
* `role` (`admin`, `sales`, `warehouse`, `production`)
* `preferredLang`
* `preferredTheme`
* `active` (bool)
* `createdAt`

### 3.3 customers

* `id`
* `internalId` (e.g. 230004)
* `company`
* `status` (`active`, `inactive`)
* `defaultLang`
* `accountManager`
* `vatNumber`
* `paymentTerms`
* `deliveryTerms`
* `iban`, `bic`, `bankName`
* `priceSegment` (`dealer`, `endcustomer`, `lepage`, etc.)
* `addresses` (array):

  * `id`
  * `role` (`billing`, `shipping`, `other`)
  * `isDefaultBilling`
  * `isDefaultShipping`
  * `company` (optional)
  * `street`, `zip`, `city`, `country`
* `contacts` (array):

  * `id`
  * `name`
  * `position`
  * `phone`
  * `email`
* Optional insight fields (can be derived):

  * `lastOrderDate`
  * `revenueYTD`

### 3.4 products

* `id`
* `internalArticleNumber`
* `nameDE`, `nameEN`
* `productLine` (e.g. Desinfektion, Device, SparePart, Service)
* `dosageForm`
* `volume`
* `unit` (Stk, Flasche, L, …)
* `vpe` (units per carton)
* `palletQuantity`
* `avgPurchasePrice`
* `dealerPrice`
* `endCustomerPrice`
* `currency`
* `customsCode`
* `originCountry`
* `stock` (0 for services)
* `minStock`
* `type` (`Finished`, `Device`, `Consumable`, `Part`, `Service`)
* `allowDecimalQty`
* `priceOverrides` (array of `{ segmentId, customerId?, price }`)
* `bom` (array of `{ componentId, quantityPerUnit }`)
* `lifecycleStatus` (`phaseIn`, `active`, `phaseOut`, `obsolete`)

### 3.5 components

* `id`
* `componentNumber`
* `group` (Bottle, Cap, Label, Box, Carton, Pump, etc.)
* `description`
* `version`
* `unit`
* `stock`
* `safetyStock`
* `supplierId` (preferred)
* `leadTimeDays`
* `prices` (array of `{ supplierId, price, moq, currency }`)
* `status` (`active`, `blocked`)
* `notes`

### 3.6 suppliers

* `id`
* `name`
* `street`, `zip`, `city`, `country`
* `contactPerson`
* `phone`
* `email`
* `notes`

### 3.7 carriers

* `id`
* `name`
* `accountNumber`
* `contactPerson`
* `phone`
* `email`
* `notes`

### 3.8 priceLists

* `id`
* `name` (e.g. "Preisliste 2025")
* `type` (`segment`, `customer`)
* `segmentId`
* `customerId`
* `currency`
* `validFrom`
* `validTo`
* `entries` (array):

  * `productId`
  * `price`
  * `uvp`
  * `minOrderQty`
  * `tariffCode`
  * `originCountry`
  * `languages` (string, e.g. "DE, EN")

### 3.9 orders

* `id`
* `orderId` (e.g. A2025-0075)
* `custId`
* `carrierId`
* `createdBy`
* `date`
* `plannedDelivery`
* `status` (`draft`, `confirmed`, `completed`, `cancelled`)
* `customerReference`
* `items` (array):

  * `id`
  * `productId`
  * `qty`
  * `unitPrice`
  * `discount` (percentage or fixed)
  * `lineNet`
* `totals`:

  * `subtotalNet`
  * `vatAmount`
  * `totalGross`
  * `currency`
* `deliveryNoteIds` (array)
* `invoiceIds` (array)
* `history` (array of status changes, optional)

### 3.10 documents

* `id`
* `type` (`delivery`, `invoice`, `creditNote`)
* `docNumber` (L…, R…)
* `date`
* `customerId`
* `billingAddressId`
* `shippingAddressId`
* `orderId`
* `refDeliveryId`
* `paymentTerms`
* `deliveryTerms`
* `dueDate`
* `paidAt`
* `items` (snapshot array of):

  * `productId`
  * `articleNumber`
  * `description`
  * `qty`
  * `unit`
  * `unitPrice`
  * `vatRate`
  * `lineNet`
  * `lineVat`
  * `lineTotal`
* `totals`:

  * `netTotal`
  * `grossTotal`
* `vatSummary` (array of `{ rate, base, amount }`)
* `status` (`Draft`, `Sent`, `Paid`, `Cancelled`)

### 3.11 productionOrders

* `id`
* `orderNumber`
* `productId`
* `quantity`
* `createdBy`
* `createdAt`
* `plannedStart`
* `plannedEnd`
* `status` (`planned`, `inProgress`, `qualityCheck`, `completed`, `cancelled`)
* `components` (optional BOM overrides)
* `notes`

### 3.12 movements

* `id`
* `date`
* `type` (`receipt`, `consumption`, `production`, `adjustment`)
* `direction` (`in`, `out`)
* `productId` or `componentId`
* `quantity`
* `unitPrice`
* `reference` (order id, PO id, note)
* `location` (optional, e.g. `Main`, `Cold`)
* `batch` / `lot` (optional)
* `notes`

### 3.13 tasks

* `id`
* `title`
* `category`
* `status`
* `priority`
* `assignedTo`
* `dueDate`
* `notes`

---

## 4. Authentication, Users, Safety

### 4.1 Login & Session

* Login screen:

  * User list / dropdown (name + role).
  * PIN input.
  * "Remember last user" toggle.
  * On success: set `CurrentUser`, apply user's theme/lang, go to Dashboard.
  * On failure: generic error, shake/red border, no hint.

* Session lock:

  * Inactivity > `config.autoLockMinutes` → lock overlay:

    * Show username, require PIN.
    * On success, restore current route/state.

### 4.2 User Management (Settings)

* List users (name, role, active).
* Create user:

  * name, pin, role, preferredLang, preferredTheme, active.
* Edit user.
* Soft delete / deactivate.
* Prevent deleting last admin.

### 4.3 Backup / Restore

* Backup:

  * "Download backup" → JSON of full DB.
* Restore:

  * Upload JSON, show diff/summary, confirm overwrite.

### 4.4 First-run Wizard

* If DB empty:

  * Wizard to:

    * Enter company data.
    * Default VAT, payment terms, delivery terms.
    * Create first admin user.
  * After finish, go to login.

---

## 5. i18n & Theming

### 5.1 Translations

* `App.I18n.translations` for:

  * `de`, `en`, `ro` (full)
* Keys:

  * `sidebar.*`, `orders.*`, `customers.*`, `common.*`, `documents.*`, etc.
* `App.I18n.t(key, fallback)`:

  * Fetch key in current lang.
  * Fallback: English → `fallback` param → key.

**Rule:** No user-facing string is hard-coded; everything goes through `t()`.

### 5.2 Themes

CSS variables:

* Colors:

  * `--color-bg`, `--color-bg-elevated`, `--color-border-soft`
  * `--color-text`, `--color-text-muted`
  * `--color-accent`, `--color-danger`, `--color-success`
* Layout:

  * `--radius-card`, `--shadow-soft`

Themes (on `<html>` or `<body>` via `data-theme`):

* `light`
* `dark`
* `cyberpunk`
* `vaporwave`
* `steampunk`
* `scifi`

Theme & language:

* Navbar dropdowns.
* Settings → "UI & Sprache" section.
* Stored per user; applied on login.

### 5.3 Translation Diagnostics

* In Settings:

  * Show approximate coverage per language (% keys translated).
  * Option to log missing keys in console in dev mode.

---

## 6. Pages & Features (Final State)

Below: everything each page must do (MVP + advanced merged).

### 6.1 Dashboard (`dashboard`)

* KPI cards:

  * Total customers
  * Orders YTD
  * Invoices (count/revenue)
  * Stock value
  * Open vs completed production orders
* Quick actions:

  * New Order
  * New Customer
  * New Product
  * New Production Order
* Configurable:

  * User chooses which KPIs are shown.
* Drill-down:

  * Clicking a KPI opens respective filtered page.
* Charts:

  * Revenue over time.
  * Volume by product line.

### 6.2 Customers (`customers`)

* List:

  * Search, filter by status.
* Detail/Editor:

  * Full CRUD.
  * Addresses:

    * Add/edit/delete.
    * Billing/shipping/other.
    * Enforce exactly one default billing & shipping.
  * Contacts:

    * Add/edit/delete person.
  * Commercial data:

    * VAT, IBAN/BIC, bankName, payment/delivery terms, price segment.
  * Status: active/inactive.
* Export:

  * A4 customer Stammdaten print layout (customer number, all relevant fields).
* Insights:

  * Last orders, revenue YTD, last invoice date.
  * Badges: High value / Dormant / New.
* Validation:

  * Requires default billing/shipping.
  * VAT required for EU countries (simplified rule).

### 6.3 Products (`products`)

* List + search.
* Editor:

  * All fields from data model.
  * Type selection: Finished/Device/Consumable/Part/Service.
  * Stock shown (but no changes here; use inventory).
* BOM tab:

  * List components + qty per unit.
  * Add/remove/edit component entries.
* Cost & margin:

  * BOM-based theoretical unit cost.
  * Margin vs dealer & endcustomer prices.
* Lifecycle:

  * Show lifecycle status; warn in order entry if product is `phaseOut` or `obsolete`.
* Services:

  * Automatically excluded from inventory and stock movements.

### 6.4 Components (`components`)

* List + filters by group/status.
* Editor:

  * All fields.
  * Supplier & prices array.
* "Used in products" view:

  * Table listing products whose BOM contains this component.

### 6.5 Suppliers (`suppliers`)

* List + CRUD.
* Performance:

  * Show last N receipts, average lead time vs `leadTimeDays`.
  * Simple badge (on-time / slow).

### 6.6 Carriers (`carriers`)

* List + CRUD.

### 6.7 Price Lists (`pricing`)

* List price lists.
* Create/edit:

  * Type: segment or customer.
  * Name, currency, validity period.
  * Generate entries from products.
* Edit lines (optional but nice): price, UVP, minQty, etc.
* Export:

  * CSV.
  * A4 layout with company header + table (sample-style).
* Advanced:

  * Clone list as "simulation".
  * Apply % price change to all lines.
  * Show stats on impact (avg change per product line).

### 6.8 Inventory (`inventory`)

* Stock view:

  * Tab/filters for categories (Finished, Devices, Consumables, Parts, Components).
  * Columns: item, stock, minStock, avg cost, stock value.
* Actions:

  * "Receive stock":

    * Form: qty, supplier, date, unitPrice, location/batch (optional).
    * Creates receipt movement, updates stock and avg cost.
  * "Adjust stock":

    * Positive/negative adjustment, reason.
    * Creates adjustment movement.
* Advanced:

  * Multi-location:

    * If movements have `location`, show breakdown per location.
  * Replenishment:

    * Suggest reorder qty based on safety stocks, open orders/POs, current stock.

### 6.9 Movements (`movements`)

* Tabular view:

  * Date, item, type, direction, qty, unitPrice, value, reference, location, notes.
* Filters:

  * Date range, type, product/component, location.
* Generated automatically by:

  * Receipts.
  * Production completion.
  * Adjustments.
  * Optionally manual entry (if needed).

### 6.10 Orders (`orders`)

* List:

  * Filters by status, customer, date range.
* Order wizard (creation):

  * Step 1: Customer selection + show summary (terms, open invoices).
  * Step 2: Items:

    * Add products by search.
    * Show stock info.
    * Price auto-fill from priceList or product defaults.
    * Discounts per line optional.
  * Step 3: Carrier, planned delivery, terms override, review.
* Order detail:

  * View or edit (depending on status).
  * Change status: draft → confirmed → completed / cancelled.
* Actions:

  * Generate Lieferschein(s).
  * Generate Invoice(s).
  * Export orders masterlist (CSV).

### 6.11 Documents (`documents`)

* List view:

  * filters: type, customer, date, status, paid/overdue.
* Delivery Notes (LS):

  * Auto-number: L{YYYY}{running}.
  * Created from order:

    * Copy customer, addresses, items.
    * Allow editing quantities (partial delivery).
  * A4 print template:

    * Company header, addresses, LS metadata, item table.
* Invoices:

  * Auto-number: R{YYYY}{running}.
  * Created from LS or order.
  * Data:

    * Customer billing/shipping, VAT numbers.
    * Items with prices & VAT.
    * VAT summary and totals.
    * Payment terms, bank details.
  * Mark as:

    * Sent, Paid, Cancelled.
  * Payment tracking:

    * `dueDate`, `paidAt`.
    * Overdue highlighting.
* Credit Notes:

  * Type `creditNote`.
  * Linked to original invoice.
  * Negative quantities / amounts.

### 6.12 Production Orders (`production`)

* List:

  * Filters: status, product, date.

* Editor:

  * product, quantity, plannedStart/End, notes.
  * BOM override if needed.

* Status flow:

  * `planned` → `inProgress` → `qualityCheck` → `completed` / `cancelled`.

* On completion:

  * Consume BOM components = `consumption` movements (direction out).
  * Produce product stock = `production` movement (direction in).

* Capacity:

  * Field for estimated hours per PO.
  * Simple load visualization (e.g. total hours/week).

* Cost:

  * Show components cost vs standard product cost; show variance.

### 6.13 Reports (`reports`)

* Predefined exports:

  * Orders Masterlist (CSV).
  * Delivery log.
  * Invoice log (incl. paid/overdue).
  * Inventory valuation.
  * Production summary.
  * Price lists.
* Saved presets:

  * Each report can have saved filters/groupings (e.g., "Monthly sales by product line").
* Charts:

  * Revenue by month.
  * Sales by product line.
  * Production volume.

### 6.14 Tasks (`tasks`)

* Table + Kanban:

  * Columns by status (e.g. Backlog, In Progress, Done).
* Fields:

  * title, category, status, priority, assignedTo, dueDate, notes.
* Filters:

  * My tasks, by due date.

### 6.15 Settings (`settings`)

* Company:

  * Name, address, VAT, register no, IBAN/BIC, bankName.
* Defaults:

  * VAT rate, payment terms, delivery terms, currency.
* Numbering:

  * Prefix/format and last numbers for orders, LS, invoices, production orders.
* UI & Language:

  * Global theme & lang, theme preview.
* Users:

  * Full user management (see section 4).
* DB:

  * Backup/restore.
  * Demo mode toggle (load sample data if DB empty).
* Diagnostics:

  * Translation coverage, DB health (missing references, negative stock).

---

## 7. Core Business Flows (End-to-End)

### 7.1 Order → Lieferschein → Invoice → Payment

1. Create order via wizard.
2. Confirm order.
3. From order:

   * Generate one or more Lieferscheine (partial delivery allowed).
4. Print LS (A4).
5. From LS:

   * Generate invoice.
6. Print invoice (A4).
7. Track payment:

   * Set dueDate.
   * Mark as Paid (paidAt date).
   * Overdue highlighting in lists & dashboard KPIs.

### 7.2 Production Flow

1. Create production order for a product + qty.
2. Optionally update BOM or components override.
3. Move through statuses (`planned` → `inProgress` → `qualityCheck`).
4. On "Complete":

   * Consume BOM components:

     * Decrease stock, write `consumption` movements.
   * Increase finished product stock:

     * Write `production` movement.
5. Reflect in inventory, movements, and production reports.

### 7.3 Inventory Flow

* Stock overview per product/component.
* Receive stock:

  * Adjust stock, write `receipt` movement, update avg cost.
* Adjust stock:

  * Correction; write `adjustment` movement.
* Replenishment list:

  * Show what to reorder and quantities suggested.

### 7.4 Price List Flow

* Create price list based on products.
* Adjust prices if needed.
* Export as CSV / A4.
* Optionally create simulation version.

### 7.5 Customer Stammdaten Flow

* From customer:

  * Export A4 Stammdaten sheet with:

    * Customer number, company, full addresses, VAT, bank data, terms.

---

## 8. UX & Interaction Rules

* Single consistent layout:

  * Sidebar left, main content right, navbar on top.
* Reusable components:

  * Cards, tables, modals, pill badges, input styles.
* Errors:

  * No silent failures; show inline or modal messages.
* Validations:

  * Required fields for critical operations.
  * Clear messages.
* Modals:

  * For create/edit and destructive confirmations.
* Keyboard Shortcuts:

  * Example combos:

    * `Ctrl+K` → "Command palette" for quick navigation.
    * `N` + `O` → New order.
    * `N` + `C` → New customer.
* Autosave:

  * Drafts for longer forms (orders, production orders).
  * On re-open, offer "Resume draft".

---

## 9. Definition of "Done" for This Blueprint

You consider MicroOps "0–100 complete" when:

1. All routes/pages above exist and function.
2. All CRUD operations for all master data and transactional data work.
3. i18n & theming are fully wired across the entire UI.
4. Core flows (Order→LS→Invoice, Production, Inventory, Price Lists, Stammdaten) run end-to-end with no console errors.
5. All A4 printouts (Stammdaten, LS, Invoice, PriceList) are usable for real-world operations.
6. Backup/restore works.
7. Session lock, user management, permissions work.
8. UI is consistent, responsive, and understandable for non-technical office staff.
9. No dead buttons, routes, or "stub" placeholders remain.

---

## 10. Production Readiness Features (Phases 45-47)

### 10.1 Storage & Data Persistence (Phase 45)

**IndexedDB Migration**:
- Primary storage using IndexedDB for 100MB+ capacity
- Automatic fallback to localStorage (5-10MB)
- Transparent API through `App.DB` abstraction

**Auto-Backup System**:
- Automatic backup on browser close (`beforeunload` event)
- 7 rolling backups maintained
- Automatic cleanup of older backups
- Integrity hash for corruption detection

**Backup Encryption**:
- Optional password-protected backup files
- Secure encryption for sensitive data

### 10.2 Audit Trail (Phases 45-46)

**Complete Change Tracking**:
- Logs CREATE/UPDATE/DELETE operations
- Field-by-field comparison of old/new values
- Timestamps and user identification

**Audit Services**:
- `App.Audit.log(action, entity, id, oldData, newData)`
- `App.Audit.query(filters)` for searching
- `App.Audit.getChanges(oldObj, newObj)` for diff detection

**Audit Integration**:
- All page modules integrated with audit logging
- Settings UI for viewing, filtering, and exporting audit data
- CSV export for compliance reporting

### 10.3 Security Hardening (Phase 47)

**Login Rate Limiting**:
- Maximum 5 failed attempts before lockout
- 5-minute lockout duration
- Countdown display for locked accounts
- Security events logged to audit trail

**Session Management**:
- 30-minute session timeout
- 5-minute warning before expiration
- "Extend Session" option
- Automatic logout on timeout

**XSS Protection**:
- `App.Utils.escapeHtml()` on all user inputs
- Content sanitization throughout UI

### 10.4 Health Monitoring (Phase 47)

**Health Check Service** (`App.Services.Health`):
- Storage usage monitoring (warning at 80%, critical at 95%)
- Backup age monitoring (warning after 24h, critical after 72h)
- Audit log size monitoring
- Data integrity validation

**Integrity Checks**:
- Orphan order detection (orders without customers)
- Orphan document detection (documents without orders)
- Invalid BOM reference detection
- Negative stock detection

**Global Error Boundary**:
- `window.onerror` handler for synchronous errors
- `window.onunhandledrejection` for promise rejections
- User-friendly error display with recovery option
- All errors logged to audit trail

### 10.5 Settings Tabs

New Settings tabs for production management:

1. **Backups Tab**: Auto-backup management, manual backup/restore, encryption
2. **Audit Log Tab**: Filtering, searching, and exporting audit entries
3. **System Health Tab**: Health checks, integrity validation, statistics

### 10.6 Data Validation

**Centralized Validation** (`App.Validate`):
- Entity-specific validators (customer, product, order, etc.)
- Required field enforcement
- Business rule validation
- Clear, actionable error messages

---

*Master Blueprint - MicroOps ERP Complete Specification*
