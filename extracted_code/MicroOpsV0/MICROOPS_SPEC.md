# MicroOps ERP – Full Functional & UX Specification (DF-Pure Edition, 2025)

> **Purpose**  
> This document is the **single source of truth** for how the MicroOps ERP front‑end must behave and look.  
> It is written for **developers/agents** who implement or refactor the app.  
> It merges:  
> - The current app state (`microops_updated_final.zip`),  
> - All examples and screenshots from `sources for chat gpt.zip`,  
> - The textual spec (`instructions 101.txt`),  
> - Modern best practices for SPA ERP UX, theming, and i18n.

The goals are:

- Keep MicroOps as an **offline, local, front‑end‑only SPA** (no backend, no framework, no build‑step).
- Align every **menu, sub‑menu, page, dialog, and export** with the **real DF‑Pure workflow**:
  - Stammdaten (customers, products, components, suppliers, carriers),
  - Materialliste & Lager,
  - Masterliste Auftrag (orders),
  - Lieferscheine, Rechnungen,
  - Produktionsaufträge,
  - Preislisten (incl. Lepage, Endkunde, Ersatzteile),
  - Tasks & settings.
- Implement **proper i18n** (multi‑language) and **multi‑theme** support.
- Deliver professional‑looking **A4 PDFs / printouts** and **Excel/CSV exports** that mirror the provided examples.

---

## 1. System Context & Constraints

### 1.1 Runtime & Architecture

- The system runs as a **single HTML file** plus static assets:
  - `index.html`
  - `css/*.css`
  - `js/app.js`, `js/router.js`, `js/db.js`
  - `js/ui/*.js`
  - `js/pages/*.js`
  - `data/microops_data.json`
- **Persistence:**  
  - Initial data seed from `data/microops_data.json`.  
  - All changes stored in `localStorage` under a single key (e.g. `microops_db`).
- **No backend**:  
  - No external DB, no APIs, no bundlers.  
  - The app must load by double‑clicking `index.html`.

### 1.2 Domain Overview (from sources)

From the Excel and PDF examples and screenshots we know the business revolves around:

- **Disinfection products & medical devices**:
  - Example: Flächendesinfektion bottles (500 ml, 1 L, 5 L, 10 L),
  - Devices like Flex Fogging Unit, Flex Power Unit, Compact Vernebelungs‑Einheit, etc.
- **Master data & price sheets**:
  - Multiple price list variants:
    - General Preisliste 2025,
    - Ersatzteile price list,
    - Lepage customer‑specific price list,
    - End customer price list.
  - Columns typically include:
    - Article number,
    - Product line/category,
    - Product name,
    - Languages,
    - Wholesale price / unit,
    - Recommended sales price / unit,
    - Minimum order quantities,
    - Tariff code,
    - Country of origin.
- **Customer stammdaten PDFs**:
  - Example `Destech - 230004 ...pdf` shows:
    - Customer number,
    - Company details,
    - Addresses,
    - Commercial parameters (payment terms, delivery terms, VAT/UID, IBAN, etc.).
- **Invoices / Rechnungen**:
  - Example `R20250068 BLUUTEC GmbH 11.11.2025.pdf`:
    - Document number and date,
    - Customer details,
    - Article lines (article no, description, quantity, unit price, line totals),
    - VAT breakdown,
    - Banking details, payment terms.
- **Screenshots & HTML prototypes**:
  - `dashboard.png`, `customers.png`, `orders.png`, `inventory.png`, `documents.png`, `settings.png`, etc.
  - Special clarifications via filenames, e.g.:
    - `[services feature] from the inventory - belongs to Order menu - not inventory.png`
    - `log in screen feature.png`
    - `theme menu points to it.png`
    - `language menu points to it.png`
    - `orders , delivery note and invoice example .png`

This specification **must** honour these real‑world examples and naming conventions.

---

## 2. Global Information Architecture (Navigation)

### 2.1 Sidebar Sections & Ordering

The left sidebar is grouped into **sections** to reflect your mental model and the Excel “Masterlisten”:

1. **Übersicht**
2. **Stammdaten**
3. **Lager & Material**
4. **Aufträge & Produktion**
5. **Dokumente & Auswertungen**
6. **Organisation & Einstellungen**

Each section is a **non‑clickable heading**, followed by clickable routes.

### 2.2 Stable Route IDs (for router) vs. Labels (for UI)

Router IDs **must remain** as they are today for compatibility:

- `dashboard`, `customers`, `products`, `components`, `suppliers`, `carriers`,
- `pricing`, `inventory`, `movements`,
- `orders`, `production`,
- `documents`, `reports`,
- `tasks`, `settings`.

Sidebar labels and section groupings change as follows:

| Section                         | Route ID    | Sidebar Label (DE / EN)                       | Description / Alignment with Sources                                      |
|---------------------------------|-------------|-----------------------------------------------|---------------------------------------------------------------------------|
| Übersicht                       | `dashboard` | **Dashboard**                                 | KPIs, quick access; matches `dashboard.png`.                              |
| Stammdaten                     | `customers` | **Kunden (Stammdaten)** / Customers           | Customer master data, basis for Destech‑style Stammdaten PDFs.           |
|                                 | `products`  | **Artikelstamm** / Products                   | Product master (devices, desinfection bottles); aligns with price sheets.|
|                                 | `components`| **E‑Komponenten** / Components                | Components & packaging, as in internal component sheets.                 |
|                                 | `suppliers` | **Lieferanten** / Suppliers                   | Supplier master; links to E‑Komponenten.                                  |
|                                 | `carriers`  | **Spediteure** / Carriers                     | Transport partners (Dachser, Lagermax, Schenker, UPS, etc.).             |
|                                 | `pricing`   | **Preislisten** / Price Lists                 | Preisliste 2025, Ersatzteile, Lepage, Endkunde.                          |
| Lager & Material                | `inventory` | **Lager & Materialliste** / Inventory         | Materialliste / inventory snapshot; see `inventory*.png`.                |
|                                 | `movements` | **Lagerbewegungen** / Stock Movements         | Movement log for receipts, consumption, production.                      |
| Aufträge & Produktion           | `orders`    | **Aufträge / Bestellungen** / Orders          | Masterliste Auftrag; see `orders.png` & “create order” screenshots.      |
|                                 | `production`| **Produktionsaufträge** / Production Orders   | Production scheduling per BOM.                                           |
| Dokumente & Auswertungen        | `documents` | **Dokumente (LS & RE)** / Documents           | Lieferscheine & Rechnungen; see LS/RE screenshots and PDFs.              |
|                                 | `reports`   | **Masterlisten & Berichte** / Master Lists    | LS log, order log, Materialliste, production summary, price exports.     |
| Organisation & Einstellungen    | `tasks`     | **Aufgaben / Planner** / Tasks                | Task list/planner; categories like Programming, Vorproduktion.           |
|                                 | `settings`  | **Einstellungen** / Settings                  | Company data, numbering, VAT, theme, language, user/role management.     |

### 2.3 Sidebar Data Structure

In `js/ui/sidebar.js`:

- Routes array includes both section headers and clickable items:

```js
App.UI.Sidebar = {
  routes: [
    // Übersicht
    { type: 'section', id: 'sec-overview', label: 'Übersicht' },
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },

    // Stammdaten
    { type: 'section', id: 'sec-masterdata', label: 'Stammdaten' },
    { id: 'customers',  icon: '👥', label: 'Kunden (Stammdaten)' },
    { id: 'products',   icon: '🧪', label: 'Artikelstamm' },
    { id: 'components', icon: '🔧', label: 'E-Komponenten' },
    { id: 'suppliers',  icon: '🏭', label: 'Lieferanten' },
    { id: 'carriers',   icon: '🚚', label: 'Spediteure' },
    { id: 'pricing',    icon: '💶', label: 'Preislisten' },

    // Lager & Material
    { type: 'section', id: 'sec-stock', label: 'Lager & Material' },
    { id: 'inventory', icon: '📦', label: 'Lager & Materialliste' },
    { id: 'movements', icon: '🔄', label: 'Lagerbewegungen' },

    // Aufträge & Produktion
    { type: 'section', id: 'sec-orders', label: 'Aufträge & Produktion' },
    { id: 'orders',    icon: '🧾', label: 'Aufträge / Bestellungen' },
    { id: 'production',icon: '🏭', label: 'Produktionsaufträge' },

    // Dokumente & Auswertungen
    { type: 'section', id: 'sec-docs', label: 'Dokumente & Auswertungen' },
    { id: 'documents', icon: '📄', label: 'Dokumente (LS & RE)' },
    { id: 'reports',   icon: '📑', label: 'Masterlisten & Berichte' },

    // Organisation & Einstellungen
    { type: 'section', id: 'sec-org', label: 'Organisation & Einstellungen' },
    { id: 'tasks',     icon: '✅', label: 'Aufgaben / Planner' },
    { id: 'settings',  icon: '⚙️', label: 'Einstellungen' }
  ],
  ...
};
```

- Rendering must:
  - Show `type: 'section'` as headings (non‑clickable),
  - Show others as clickable items with `data-route` for router.

### 2.4 Role‑Based Visibility

- Existing role logic (`admin`, `sales`, `user`, `production`, etc.) remains:
  - `admin` sees all.
  - `sales` sees: Dashboard, Kunden, Artikelstamm, Preislisten, Aufträge, Dokumente, Reports, Tasks.
  - `warehouse/user` sees: Dashboard, Lager & Material, Lagerbewegungen, E‑Komponenten, Lieferanten, Spediteure, Produktion, Tasks.
- Sections only render if they contain at least one route allowed for that role.

---

## 3. Authentication & Login Screen

From `log in screen feature.png` and current code:

### 3.1 Users & Roles

- `db.users` holds:
  - `id`, `name`, `pin`, `role`.
- Roles: `admin`, `sales`, `warehouse`, `production` (extendable).

### 3.2 Login Screen Requirements

The login screen must:

- Show a list or dropdown of known users (name + role).
- Provide a PIN input for quick login.
- Optional “Remember last user” toggle (stored in localStorage).
- On successful login:
  - Set `App.Data.CurrentUser`,
  - Route to `dashboard`.
- On failed login:
  - Show a clear error (no silent fail),
  - Shake animation or red border on PIN field.

From UX best practices:

- Do not show which part (user or PIN) was wrong; keep error generic.
- Provide a small help text “Ask admin if you forgot your PIN”.

---

## 4. Data Model – Entities & Relationships

### 4.1 Persistence Layout

All entities live inside a single DB object stored in localStorage:

```js
{
  config: { ... },
  users: [ ... ],
  customers: [ ... ],
  products: [ ... ],
  components: [ ... ],
  suppliers: [ ... ],
  carriers: [ ... ],
  priceLists: [ ... ],
  orders: [ ... ],
  documents: [ ... ],
  productionOrders: [ ... ],
  movements: [ ... ],
  tasks: [ ... ]
}
```

IDs are stable strings or numbers; cross‑references by ID only.

### 4.2 Customers (Kunden)

See Destech stammdaten PDF and `customers*.png`.

Fields (minimal):

- `id` – primary key.
- `internalId` – human customer number (e.g., 230004).
- `company` – legal name.
- `status` – `active` / `inactive`.
- `defaultLang` – `de`, `en`, `ro` (others allowed).
- `accountManager` – string.
- `vatNumber` – UID.
- `paymentTerms` – e.g., “10 Tage netto”.
- `deliveryTerms` – Incoterms / comment.
- `iban`, `bic`, `bankName`.
- `priceSegment` – e.g., `lepage`, `dealer`, `endcustomer`.
- `addresses`: list of
  - `id`,
  - `role` – `billing`, `shipping`, `other`,
  - `isDefaultBilling`, `isDefaultShipping`,
  - `company`, `street`, `zip`, `city`, `country`.
- `contacts`: list of persons:
  - `name`, `position`, `phone`, `email`.

Requirements:

- Exactly one default billing and one default shipping address per customer.
- Customer detail must be exportable to a **Stammdaten PDF** roughly matching `Destech - 230004` style:
  - Customer number, company block, addresses, commercial data.

### 4.3 Products (Artikelstamm)

Aligned with price lists & internal sheets.

Fields:

- Identification:
  - `id`,
  - `internalArticleNumber` (e.g., 350500),
  - `sku` (optional).
- Description:
  - `nameDE` – main German product name,
  - `nameEN` – English name,
  - `productLine` – e.g., Desinfektion, Device, SparePart, Service,
  - `volume` – numeric + unit (500 ml, 1 L, etc.),
  - `dosageForm` – e.g., solution, spray.
- Packaging:
  - `unit` – `Stk`, `Flasche`, `L` etc.,
  - `vpe` – units per carton,
  - `palletQuantity`.
- Commercial:
  - `avgPurchasePrice`,
  - `dealerPrice`,
  - `endCustomerPrice`,
  - `currency` (assume `EUR`).
- Regulatory:
  - `customsCode` – Zolltarifnummer from price sheets,
  - `originCountry` – Ursprungsland.
- Stock:
  - `stock` – integer number of units,
  - `minStock` – safety stock.
- Pricing overrides:
  - `priceOverrides`: list of `{ segmentId, customerId?, price }`.
- BOM:
  - `bom`: list of `{ componentId, quantityPerUnit }`.
- Flags:
  - `type` – `Finished`, `Device`, `Consumable`, `Part`, `Service`,
  - `allowDecimalQty` – boolean (normally `false` for piece goods; `true` only for genuine fractional items).

Services:

- Have `type: 'Service'`.
- **Never tracked in stock** (no inventory quantity).
- Only appear as line items on orders/invoices.
- Are not shown in the **Lager & Materialliste** stock tables (see `[services feature] ...png`).

### 4.4 E‑Komponenten (Components)

Fields:

- `id`,
- `componentNumber`,
- `group` – Bottle, Cap, Label, Box, Pump, Carton, etc.,
- `description`,
- `unit` (Stk, label, etc.),
- `stock`, `safetyStock`,
- `supplierId`,
- `leadTimeDays`,
- `prices`: `{ supplierId, price, moq, currency }[]`,
- `status` – active/block,
- `notes`.

### 4.5 Suppliers & Carriers

**Suppliers**:

- `id`, `name`,
- `street`, `zip`, `city`, `country`,
- `contactPerson`, `phone`, `email`,
- `notes`.

**Carriers**:

- `id`, `name`,
- `accountNumber`,
- `contactPerson`, `phone`, `email`,
- `notes`.

### 4.6 Price Lists (Preislisten)

Price list types from Excel:

- Generic trade price list (Preisliste 2025),
- Spare parts price list (Ersatzteile),
- Customer‑specific (Lepage 05_2025),
- End‑customer price list.

Fields:

- `id`,
- `name` – e.g., “Preisliste 2025”, “Preisliste Lepage 05_2025”.
- `type` – `segment` or `customer`.
- `segmentId` – for type `segment` (e.g., `dealer`, `endcustomer`).
- `customerId` – for type `customer`.
- `currency` – `EUR`.
- `validFrom`, `validTo` – optional.
- `entries`: list of:
  - `productId`,
  - `price`,
  - `uvp` – recommended retail price,
  - `minOrderQty`,
  - `tariffCode`,
  - `originCountry`,
  - `languages` – e.g., “DE, EN”.

Excel exports must:

- Mirror the structure of the original sheets:
  - Header block (company name, validity date),
  - Columns in the order: article number, product line, product name, languages, trade price, min quantity, UVP, tariff code, origin country (adapt names to language & style).

### 4.7 Orders (Aufträge / Bestellungen)

Fields:

- `id`,
- `orderId` – e.g. `A2025-0075` or similar.
- `custId`,
- `carrierId`,
- `createdBy`,
- `date`,
- `plannedDelivery`,
- `status` – `draft`, `confirmed`, `completed`, `cancelled`.
- `customerReference`,
- `items`: list of
  - `id`,
  - `productId`,
  - `qty`,
  - `unitPrice`,
  - `discount` (percentage or absolute),
  - `lineNet`,
- Totals:
  - `subtotalNet`,
  - `vatAmount`,
  - `totalGross`,
  - `currency`.
- Links:
  - `deliveryNoteIds`: list of LS document ids,
  - `invoiceIds`: list of invoice document ids (for partials or multi‑LS scenarios).

### 4.8 Documents (Lieferscheine & Rechnungen)

Fields:

- `id`,
- `type` – `delivery` or `invoice`,
- `docNumber` – `L20250058`, `R20250068`, etc.,
- `date`,
- `customerId`,
- `billingAddressId`, `shippingAddressId`,
- `orderId`,
- `refDeliveryId` – for invoices created from a specific LS,
- `paymentTerms`, `deliveryTerms`,
- `items`: line snapshot (not live linked to product):
  - `productId`,
  - `articleNumber`,
  - `description`,
  - `qty`,
  - `unit`,
  - `unitPrice`,
  - `vatRate`,
  - `lineNet`,
  - `lineVat`,
  - `lineTotal`.
- Totals:
  - `netTotal`,
  - `vatSummary`: list of `{ rate, base, amount }`,
  - `grossTotal`.
- `status` – `Draft`, `Sent`, `Paid`, `Cancelled`.

### 4.9 Production Orders

Fields:

- `id`,
- `orderNumber`,
- `productId`,
- `quantity`,
- `createdBy`,
- `createdAt`,
- `plannedStart`, `plannedEnd`,
- `status` – `open`, `inProgress`, `completed`, `cancelled`,
- `components` – optional overrides,
- `notes`.

### 4.10 Stock Movements

Fields:

- `id`,
- `date`,
- `type` – `receipt`, `consumption`, `production`,
- `direction` – `in` / `out`,
- `productId` or `componentId`,
- `quantity`,
- `unitPrice` – optional (for valuation),
- `reference` – order number, production order, or manual note,
- `notes`.

### 4.11 Tasks & Config

Tasks as currently implemented:

- `id`, `title`, `category`, `status`, `priority`, `assignedTo`, `dueDate`, `notes`.

Config:

- Company info (used in PDFs),
- Defaults (VAT, terms),
- UI preferences (theme, lang),
- Numbering sequences for LS/RE/PO.

---

## 5. Core Business Flows

### 5.1 Order‑to‑Cash Flow

Based on Excel & PDF examples and screenshots:

1. **Order entry** (Auftrag):
   - Enter order with real customer, items, planned delivery, carrier.
   - Pricing auto‑filled from price lists / products; user may override.
2. **Delivery note creation** (Lieferschein):
   - From order, generate a LS:
     - Copy items, addresses, and header.
     - Assign LS number from numbering sequence.
   - Optionally allow partial deliveries (not mandatory in v1).
3. **Invoice creation** (Rechnung):
   - From LS (preferred) or order:
     - Copy items, apply VAT & totals.
     - Assign invoice number.
   - Document layout consistent with `R20250068` sample.
4. **Payment tracking**:
   - Simple: mark invoice `Paid` when money arrives (no ledger).
5. **Reporting**:
   - Masterliste Auftrag (order log),
   - LS log,
   - Invoice log (subset of documents),
   - Revenue and volume in reports based on documents.

### 5.2 Inventory & Production

1. **Materialliste & Inventory**:
   - Display stock for **physical goods only** (no services).
   - Show total stock value by category and overall.
2. **Wareneingang (Receipts)**:
   - User clicks “Receive stock” on inventory line,
   - Dialog: quantity, date, supplier, cost.
   - Updates product stock + writes `receipt` movement.
3. **Production orders**:
   - User creates PO for given product/quantity.
   - On completion:
     - Consume components from BOM,
     - Increase finished goods stock,
     - Write `consumption` + `production` movements.
4. **Reports**:
   - Materialliste export (inventory snapshot),
   - Production summary per year/product.

---

## 6. Internationalization (i18n) Specification

### 6.1 Goals

- Provide a real multi‑language UI:
  - Fully supported: **German**, **English**, **Romanian**.
  - Partially supported: existing other languages (French, Spanish, Portuguese, Chinese) as demo.
- All user‑facing text (labels, headings, tooltips, button captions, error messages, document headings) must go through the translation system.

### 6.2 Translation Storage

Use **in‑memory dictionaries** (message bundles) keyed by language code and path‑style keys:

```js
App.I18n = {
  translations: {
    de: {
      sidebar: {
        overview: "Übersicht",
        masterdata: "Stammdaten",
        customers: "Kunden (Stammdaten)",
        // ...
      },
      orders: {
        title: "Aufträge / Bestellungen",
        createOrder: "Auftrag anlegen",
        qty: "Menge",
        unitPrice: "Einzelpreis",
        subtotal: "Zwischensumme",
        // ...
      },
      // …
    },
    en: {
      // English counterparts
    },
    ro: {
      // Romanian counterparts
    }
  },
  currentLang: "de",
  t(key, fallback) { /* see below */ }
};
```

Helper:

```js
App.I18n.t = function(key, fallback) {
  const lang = App.Data.Config?.lang || this.currentLang || "de";
  const parts = key.split(".");
  let value = this.translations[lang];
  for (const p of parts) {
    value = value && value[p];
  }
  if (!value) {
    // fallback to English, then fallback argument, then key
    let fallbackValue = this.translations.en;
    for (const p of parts) {
      fallbackValue = fallbackValue && fallbackValue[p];
    }
    return fallbackValue || fallback || key;
  }
  return value;
};
```

Usage:

- **Never** hard‑code strings directly in views.
- Always call `App.I18n.t`:

```js
titleEl.textContent = App.I18n.t("orders.title", "Orders");
qtyHeader.textContent = App.I18n.t("common.qty", "Qty");
```

### 6.3 Number & Date Formatting

Use `Intl.NumberFormat` and `Intl.DateTimeFormat` with `Config.lang`:

- Currency formatting:
  - Use a per‑language locale (e.g. `de-AT`, `en-GB`, `ro-RO`) and `Config.currency` (usually `EUR`).
- Date formatting:
  - Use local pattern (e.g. `DD.MM.YYYY` for German, `YYYY-MM-DD` in export forms).

### 6.4 Language Selection UX

From `language menu points to it.png`:

- Navbar:
  - Dropdown with language options (flag + language name).
  - Clicking option:
    - Updates `Config.lang`,
    - Saves DB,
    - Triggers re‑render of current route.
- Settings page:
  - Section “UI & Sprache” with same options plus explanation text.
- After selecting language:
  - Sidebar labels, page titles, field labels, tooltips, and document templates must change immediately.

### 6.5 Missing Key Diagnostics

Developers should be able to inspect missing translations:

- Optionally implement a debug toggle in Settings:
  - When enabled, underline text that uses fallback language.
  - Log missing keys to console once per key.

---

## 7. Theming & Visual Design

### 7.1 Theme Goals

- Multiple themes:
  - `light`, `dark`, `cyberpunk`, `vaporwave`, `steampunk`, `scifi` (existing) plus possibility to add more later.
- All themes share the **same layout**; only color, shadows, and some accents change.
- High contrast and readability across all pages, including tables, badges, and tooltips.

### 7.2 CSS Custom Properties

Define **semantic** CSS variables in `css/base.css`:

```css
:root {
  --color-bg: #020617;
  --color-bg-elevated: #020617;
  --color-border-soft: rgba(148,163,184,0.25);
  --color-text: #e5e7eb;
  --color-text-muted: #9ca3af;
  --color-accent: #4f46e5;
  --color-danger: #f97373;
  --color-success: #22c55e;
  --shadow-soft: 0 18px 45px rgba(0,0,0,0.55);
  --radius-card: 18px;
}

/* Light theme */
:root[data-theme="light"] {
  --color-bg: #f4f6fb;
  --color-bg-elevated: #ffffff;
  --color-border-soft: rgba(15,23,42,0.08);
  --color-text: #0f172a;
  --color-text-muted: #6b7280;
  --color-accent: #2563eb;
}

/* Dark theme */
:root[data-theme="dark"] {
  --color-bg: #020617;
  --color-bg-elevated: #020617;
  --color-border-soft: rgba(148,163,184,0.25);
  --color-text: #e5e7eb;
  --color-text-muted: #9ca3af;
  --color-accent: #4f46e5;
}

/* Cyberpunk / Vaporwave / Steampunk / SciFi override the same semantic tokens */
```

Components reference only these tokens:

```css
body {
  background: var(--color-bg);
  color: var(--color-text);
}

.card-soft {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-soft);
  border: 1px solid var(--color-border-soft);
}
```

### 7.3 Theme Selection UX

From `theme menu points to it.png`:

- Navbar:
  - Theme dropdown showing theme name + small color dot or gradient.
- Settings:
  - “UI & Sprache” section with theme gallery (small previews).
- Logic:
  - On selection:
    - `document.documentElement.dataset.theme = themeId;`
    - `Config.theme = themeId; App.DB.save();`

### 7.4 Theme QA

For each theme, manually verify:

- Sidebar text vs background contrast,
- Table header vs row contrast,
- Buttons (primary, secondary, danger) in normal/hover/disabled states,
- Special states:
  - Low stock warnings,
  - Error banners,
  - Tooltips.

---

## 8. UX Rules & Forms

### 8.1 General UX Rules

- No hidden failures:
  - If action cannot proceed (missing field, invalid data), show a clear error.
- For complex pages (Orders, Production, Settings):
  - Use a clear heading and short description at the top.
- Always provide **hover text** for icon‑only buttons.

### 8.2 Validation

For each major form:

- Mark required fields with `*`.
- On submit:
  - Validate required fields,
  - Validate numeric fields >= 0,
  - For piece goods:
    - Quantities must be integers.
- On error:
  - Prevent closing modal,
  - Highlight problematic fields,
  - Show toast summarising the problem.

### 8.3 Quantities & Services

- For `type` in {`Finished`, `Device`, `Consumable`, `Part`}:
  - Default `allowDecimalQty = false`,
  - Input `step="1"` for quantities.
- For genuine fractional items (rare):
  - `allowDecimalQty = true`,
  - Input `step="0.01"` or appropriate.
- Services:
  - Always treat as `allowDecimalQty = false` unless clearly needed,
  - Appear only on Orders/Invoices, not in stock or Materialliste.

---

## 9. Page‑By‑Page Requirements (including buttons & dialogs)

### 9.1 Dashboard (`dashboard`)

- Widgets reflecting current data:
  - Open orders count & total,
  - Open invoices total (unpaid),
  - Low stock items count,
  - Open production orders,
  - Open tasks.
- Quick links:
  - Buttons for “New order”, “New production order”, “Open tasks”.
- Optional: mini timeline or “Today’s workload” list.

### 9.2 Stammdaten

#### 9.2.1 Kunden (Stammdaten) – `customers`

Matches `customers.png`, `customers - add new .png`, `edit customers.png`, and Destech PDF.

- Main table:
  - Customer number, company, country, status, account manager, price segment.
- Top bar:
  - `+ Neuer Kunde` – opens full edit modal.
  - `Export CSV` – exports customer master as CSV.
  - `Stammdaten PDF` – for selected customer, generate PDF like Destech sample.
- Row actions:
  - Edit,
  - Delete (with confirmation).

Customer edit modal sections:

1. **Stammdaten**:
   - internalId, company, status, defaultLang, accountManager.
2. **Finanzen & Konditionen**:
   - vatNumber, paymentTerms, deliveryTerms, iban, bic, bankName, priceSegment.
3. **Adressen**:
   - Table with roles (Billing, Shipping, Other),
   - Checkboxes for default billing/shipping.
4. **Kontakte**:
   - Contact persons list.

#### 9.2.2 Artikelstamm – `products`

Matches product & inventory screenshots and price list structure.

- Main table:
  - internalArticleNumber, nameDE, type, volume, unit, dealerPrice, endCustomerPrice, stock.
- Top bar:
  - `+ Neuer Artikel` – create new product.
  - `Export XLSX` – article master export.
- Row actions:
  - `Bearbeiten` – edit modal,
  - `Löschen`.

Edit modal:

- **Allgemein**:
  - Article number, product line, names, type, volume, dosage form.
- **Verpackung**:
  - unit, vpe, palletQuantity.
- **Preise**:
  - avgPurchasePrice, dealerPrice, endCustomerPrice, currency.
- **Zoll & Herkunft**:
  - customsCode, originCountry.
- **BOM**:
  - component list with quantity per unit.

#### 9.2.3 E‑Komponenten – `components`

- Table:
  - componentNumber, group, description, stock, safetyStock, supplier, leadTimeDays.
- Top bar:
  - `+ Neue Komponente`, `Export XLSX`.
- Integrations:
  - From product BOM, component rows should link or at least show supplier.

#### 9.2.4 Lieferanten & Spediteure – `suppliers`, `carriers`

- Basic CRUD pages with tables & modals as currently implemented, plus:

Suppliers:

- Export button for supplier list.

Carriers:

- Carriers used in Orders & LS must be selectable from here.

#### 9.2.5 Preislisten – `pricing`

Matches Preisliste 2025, Preisliste Ersatzteile 2025, Preisliste Lepage, Preisliste Endkunde.

- Main table:
  - Price list name, type (segment/customer), scope (e.g., “Händler”, “Lepage”, “Endkunde”), validity (from/to).
- Top bar:
  - `+ Neue Preisliste`,
  - `Preislisten exportieren` – choose which list to export.
- Edit modal:
  - Type selection:
    - Segment → select price segment (dealer, endcustomer, etc.).
    - Customer → select a customer (Lepage).
  - Entry table:
    - Product, price, UVP, minOrderQty, tariffCode, originCountry, languages.

Exports:

- For each list, generate an XLSX which:
  - Contains a header block (company name, validity date, version),
  - Contains a table with columns as in the original sheets.

### 9.3 Lager & Material

#### 9.3.1 Lager & Materialliste – `inventory`

Matches:

- `inventory.png`,
- `inventory , consumables - receive stock .png`,
- `inventory , devices -receive stock.png`,
- `inventory ,parts - received stock.png`,
- `inventory devices - edit .png`,
- `inventory, consumable - edit.png`,
- `inventory, parts - edit.png`,
- `add new button  - inventory .png`,
- `[services feature] ... belongs to Order menu - not inventory.png`.

Requirements:

- Category filter / tabs:
  - All, Finished goods, Devices, Consumables, Parts, Components.
  - **Services not shown** here.
- Table:
  - Article/component number, name, type, stock, unit, unit price, stock value.
- Top bar:
  - `+ Neuer Lagerartikel` – opens Artikelstamm modal with type pre‑selected.
  - `Materialliste als XLSX exportieren` – inventory snapshot.
- Row actions:
  - `⬆️ Wareneingang` – open small dialog:
    - Quantity,
    - Date,
    - Supplier,
    - Unit price (optional),
    - Notes.
  - `✏️ Bearbeiten` – open Artikelstamm modal.
  - `🗑️ Löschen` – with confirmation.

Service handling:

- Services are only in `Artikelstamm` & Orders/Invoices; they do **not** appear in `Lager & Materialliste`.
- Any legacy “Service” tab in inventory is removed.

#### 9.3.2 Lagerbewegungen – `movements`

- Filters:
  - Year,
  - Type (receipt, consumption, production),
  - Product/component.
- Table:
  - Date, type, product/component name, quantity, direction in/out, reference (order/PO), notes.
- Export:
  - CSV/XLSX for audit.

### 9.4 Aufträge & Produktion

#### 9.4.1 Aufträge / Bestellungen – `orders`

Matches:

- `orders.png`,
- `create order.png`,
- `orders , delivery note and invoice example .png`.

Represent **Masterliste Auftrag**.

- Main table:
  - Date, orderId, customer, status, total, LS numbers, RE numbers.
- Top bar:
  - `+ Auftrag anlegen`,
  - `Masterliste Auftrag exportieren` – order log export.
- Row actions:
  - `✏️ Bearbeiten`,
  - `🗑️ Löschen`,
  - `📦 Lieferschein erzeugen`,
  - `🧾 Rechnung erzeugen` (for orders that skip LS in special cases).

Create/Edit order modal:

1. **Header**:
   - Customer (select),
   - Contact (optional),
   - Planned delivery date,
   - Carrier (Spediteur),
   - Customer reference.
2. **Items table** with visible headers:
   - Produkt / Artikel (select),
   - Menge,
   - Einzelpreis (EUR),
   - Zwischensumme.
   - This resolves the confusion seen in the current app where a second numeric field looks like “strange +0.01”.
3. **Totals**:
   - Zwischensumme, MwSt, Gesamt.

Auto‑pricing:

- On selecting product:
  - Look up customer‑specific price list entries,
  - Else segment list (using `customer.priceSegment`),
  - Else product default price (dealer/endcustomer depending on segment),
  - Fill Einheitspreis.
- User can override; if they do:
  - Optionally show small indicator “custom price”.

Quantity rules:

- For piece goods (default):
  - Integer quantities only, step `1`.
- For future fractional goods:
  - Only allowed when `product.allowDecimalQty === true`.

#### 9.4.2 Produktionsaufträge – `production`

Matches conceptual requirements in `instructions 101.txt`.

- Main table:
  - PO number, product, quantity, status, created date, planned date.
- Top bar:
  - `+ Produktionsauftrag`.
- Create/Edit modal:
  - Product,
  - Quantity,
  - Planned start/finish,
  - Notes,
  - “Show BOM usage” panel listing required components (component, required quantity).
- Row actions:
  - `Abschließen`:
    - Show confirmation dialog summarising component consumption and stock outcome.
    - On confirm:
      - Decrease components stocks,
      - Increase finished goods stock,
      - Write movements,
      - Mark PO as `completed`.

---

### 9.5 Dokumente & Auswertungen

#### 9.5.1 Dokumente (LS & RE) – `documents`

Matches:

- `documents.png`,
- `documents - create delivery note .png`,
- `documents - create invoice.png`,
- LS/RE sample PDFs.

- Filters:
  - Type: `Lieferschein`, `Rechnung`,
  - Year,
  - Customer.
- Table:
  - Type icon, document number, date, customer, gross total, status, order ref.
- Top bar:
  - `+ Lieferschein` (manual creation),
  - `+ Rechnung` (manual creation).
- Row actions:
  - `👁️ Anzeigen / Drucken` – opens printable HTML (A4).
  - For invoices:
    - `💰 Als bezahlt markieren`.

Create LS:

- From order:
  - Pre‑select order and copy items & addresses.
- Manual:
  - Select customer, manually add lines.

Create invoice:

- Preferred: from LS:
  - Copy all data,
  - Allow editing of VAT if needed.
- Alternative: from order (if business logic allows).

#### 9.5.2 Masterlisten & Berichte – `reports`

Tabbed view:

1. **Lieferscheine‑Log**:
   - List of all LS grouped by year.
   - Export matching LS log sheet (date, LS number, order number, customer, quantities).
2. **Auftragslog (Masterliste Auftrag)**:
   - Derived from `db.orders`.
   - Columns similar to your Masterliste sheet:
     - Order date, order number, customer, article summary, LS refs, RE refs, totals.
   - Export to CSV/XLSX.
3. **Materialliste / Inventur**:
   - Inventory snapshot (Products & E‑Komponenten).
   - Export layout similar to your Materialliste.
4. **Gesamtproduktion**:
   - Aggregation by year & product:
     - Total produced quantity.
   - Export like your production summary sheet.
5. **Preislisten Export** (optional tab):
   - Entry point to generate/export specific price lists.

---

### 9.6 Organisation & Einstellungen

#### 9.6.1 Aufgaben / Planner – `tasks`

- Table:
  - Title, category, status, priority, assignedTo, dueDate.
- Filters:
  - Status, category, assignee.
- Actions:
  - `+ Neue Aufgabe`,
  - Edit / delete.
- Optional: grouping by week/month or “Today / This week / Later”.

#### 9.6.2 Einstellungen – `settings`

Sections:

1. **Firma & Stammdaten**:
   - All company info used on LS/RE and price sheets.
2. **Nummerkreise**:
   - Patterns & counters for invoices, LS, POs.
3. **Standardwerte**:
   - Default VAT rate, payment terms, delivery terms, currency.
4. **UI & Sprache**:
   - Themes (same list as navbar; show preview),
   - Languages (same as navbar),
   - Live preview of UI.
5. **Benutzer & Rollen** (phase 2):
   - List of users with name, PIN, role.
   - Basic add/edit/delete.

---

## 10. Print / PDF & Export Specification

### 10.1 LS/RE Printable Layout

HTML template for LS/RE must:

- Use A4 page size with reasonable margins (e.g., 10–15 mm).
- For printing:
  - Use `@media print` and optionally `@page` rules.
  - Hide navigation, buttons, and any non‑document chrome.
- Structure:
  1. **Header**:
     - Logo,
     - Company block,
     - Document type (Lieferschein / Rechnung),
     - Document number,
     - Date.
  2. **Customer block**:
     - Billing address,
     - Shipping address (for LS).
  3. **Metadata**:
     - Customer number,
     - Order reference,
     - Delivery note reference for invoices.
  4. **Items table**:
     - Columns: article number, product description, quantity, unit, unit price, line net, VAT, line total (for invoices).
  5. **Totals**:
     - Net, VAT breakdown, gross.
  6. **Footer**:
     - Payment terms, bank info, legal text, contact info.

Document language:

- Headings and column labels must be i18n‑driven:
  - Use customer’s `defaultLang` OR global `Config.lang` as primary language.

### 10.2 Customer Stammdaten PDF

From the Stammdaten page, for each customer:

- Generate a PDF/printable view containing:
  - Customer number, company name,
  - All addresses,
  - Payment & delivery terms,
  - VAT/UID,
  - IBAN/bank,
  - Account manager,
  - Notes if any.

Layout:

- Similar to your existing Destech sample:
  - Clean table layout with group headings (e.g., Adressen, Konditionen).

### 10.3 Price List Excel / PDF

For each price list:

- Excel export:
  - Include header (company, contact, validity),
  - One sheet per list (general, Ersatzteile, Lepage, Endkunde),
  - Column headings adapted from source sheets.
- Optional PDF/HTML print:
  - Fit to A4 width, multiple pages allowed.

### 10.4 Technical Hints

- While exporting CSV/XLSX:
  - Ensure numbers are not quoted strings,
  - Dates in standard format (for further processing in Excel).

---

## 11. Implementation Roadmap (for Agents/Developers)

To bring `microops_updated_final.zip` in line with this spec:

1. **Navigation & IA**
   - Implement sidebar sections and labels.
   - Keep route IDs stable.
2. **Data Model Alignments**
   - Ensure `data/microops_data.json` uses fields defined here.
   - Remove obsolete fields; add missing ones.
3. **i18n Engine**
   - Introduce `App.I18n` with dictionaries.
   - Replace hard‑coded strings across UI with `App.I18n.t`.
4. **Themes**
   - Refine CSS custom properties.
   - Ensure all existing themes are consistent and readable on all pages.
5. **Orders & Pricing**
   - Implement auto‑pricing via price lists and product defaults.
   - Enforce integer quantities for piece goods.
   - Fix item row UI and labels to avoid “mystery +0.01” situations.
6. **Documents & Branding**
   - Add logo asset and integrate into LS/RE and Stammdaten PDFs.
   - Improve A4 print styles and match sample invoices visually.
7. **Reports & Masterlisten**
   - Extend `reports` page with LS log, order log, Materialliste, production summary, and price list exports.
8. **Inventory & Services**
   - Remove services from inventory views; keep them only as non‑stock products in Artikelstamm and Orders/Invoices.
9. **Validation & Tooltips**
   - Implement visible validation errors and extensive tooltips across all critical actions and forms.
10. **Testing with Demo Data**
    - Seed realistic demo data:
      - Customers like BLUUTEC, Lepage, etc.,
      - Real products (Flex units, disinfectants, hand hygiene),
      - Price lists per examples,
      - Orders → LS → RE,
      - Production orders and movements.
    - Manually verify flows and master lists.

---

## 12. Acceptance Checklist

The implementation is “done” when:

- [ ] Sidebar sections and labels match this spec.
- [ ] All screens referenced by PNGs exist with equivalent or improved functionality.
- [ ] i18n is working for at least DE/EN/RO across all pages and documents.
- [ ] Themes are visually coherent; no unreadable combinations.
- [ ] Orders auto‑price correctly; quantities behave as per business logic (no fractional bottles).
- [ ] Services are no longer mis‑placed under inventory.
- [ ] LS/RE documents and customer Stammdaten PDFs are visually close to the supplied examples.
- [ ] Masterliste exports (orders, LS log, Materialliste, price lists, production summary) match the intent and structure of the Excel sheets.
- [ ] No unexplained fields or buttons; tooltips clarify complex actions.
- [ ] No JavaScript errors in normal usage; localStorage persistence works as expected.


 README AUTO‑UPDATE REQUIREMENT (MANDATORY)

### 2.1 Purpose
Every time the agent finishes updating the project, it MUST:
- Update the project’s `README.md`
- With a standardized, machine‑readable “Implementation Status” section
- Summarizing exactly what is complete, what is missing, what was changed, and what QA notes apply.

This ensures:
- Transparency
- Traceability
- Easy continuation of work across iterations

### 2.2 README Format (Agent Must Use Exactly This Structure)

The agent must create/overwrite a `README.md` section with:

```
## Implementation Status – Auto-Generated by Agent

### 1. Summary of This Update
- …

### 2. Fully Working Modules
- Dashboard: …
- Customers (Stammdaten): …
- Artikelstamm: …
- E-Komponenten: …
- Suppliers: …
- Carriers: …
- Preislisten: …
- Inventory (Materialliste): …
- Stock Movements: …
- Orders (Masterliste Auftrag): …
- Lieferscheine (LS): …
- Rechnungen (RE): …
- Produktionsaufträge: …
- Reports & Masterlisten: …
- Tasks / Planner: …
- Settings (Company Data, UI, Sprache, Themes): …

### 3. Partially Implemented Modules
- …

### 4. Not Yet Implemented
- …

### 5. Known Issues
- …

### 6. QA Notes
#### i18n Tests
- …

#### Theme Tests
- …

#### Forms, Validation, Tooltips
- …

#### Documents & Printing
- …

### 7. Acceptance Checklist (From Spec)
- [ ] Navigation structure correct  
- [ ] All modules reachable  
- [ ] i18n applied to all UI text  
- [ ] All themes usable and readable  
- [ ] Orders auto-price correctly  
- [ ] Inventory excludes services  
- [ ] LS/RE print layout matches A4 spec  
- [ ] Masterlisten exports correct  
- [ ] No console errors  
- [ ] All modals validated  
```

### 2.3 Rules
- Agent MUST NOT delete other README content.
- Agent MUST place this block at the **bottom of README.md**.
- All checkboxes must reflect the **current real implementation state**.
- All lists must be **specific**, not generic (“fixed bug” → “Fixed incorrect pricing logic in order line editor”).

---

## 3. GLOBAL NAVIGATION  
(… identical to v2 spec …)


This specification should be stored at the project root (e.g., `MICROOPS_SPEC.md`) and treated as the **contract** for any further changes.
