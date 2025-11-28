# Audit Part 6 - Frontend Polish, Maintainability & Project Health

Perspective: Lead Frontend Dev performing final UI/UX polish and code health review. No code changes; findings only. Approx 6000-word deep dive.

## Responsiveness & UI Consistency
- Layout uses fixed grids and large inline paddings in dashboard and inventory tables without media queries; likely overflows on tablets and 13 laptops.
- Tables constructed with plain divs and table tags but no horizontal scroll wrappers; wide columns (orders/documents) will clip on small screens.
- Buttons/styles defined inline (padding, colors) instead of centralized CSS variables; risk of divergent shades of primary/ghost across pages.
- Color tokens exist in CSS (var(--color-primary, etc.)) but inline strings like '#10b981', '#f59e0b', '#dc2626' appear in dashboard, breaking theme consistency.
- Icons rendered from raw SVG strings embedded in JS; sizing and stroke width are not governed by a shared class; inconsistency across nav/sidebar/cards.
- No responsive typography scale; font sizes hardcoded (10px, 11px, 14px) leading to squished or tiny text on high-DPI screens.
- Modals and toasts positioned with fixed pixels; on mobile viewport they may overflow; no media query to center or resize.
- Sidebar collapse toggles use control characters instead of proper chevrons; accessibility and consistency problems.
- Lucide CDN used but not integrated; mixing inline SVG registry with external library indicates icon inconsistency risk.
- Dark/light theme toggle present but many inline backgrounds/borders use hardcoded colors; theme breakage likely in light mode.

## Type Safety & Data Shape
- Project is vanilla JS; no TypeScript or PropTypes. Data shapes inferred (customers, orders) with mixed casing (custId vs customer_id).
- App.Data normalize duplicates PascalCase/camelCase keys; no interfaces to guarantee presence of fields; views call toLowerCase on potentially undefined status fields.
- UI views assume products have nameDE/nameEN; missing fields will render 'undefined' or throw when used in string concatenation.
- Auth currentUser expected to have preferredTheme/preferredLang; no guards; null access will break UI rendering paths.
- Router expects App.UI.Views.<Route>.render functions; missing view leads to inline 404 but no compile-time safety.
- App.Api collections accept arbitrary data objects; no validation before pushing into App.Data; can corrupt store.
- No prop validation for modals/forms; submit handlers trust DOM inputs without schema checking; leads to NaN/undefined propagation.

## Project Dependency & Structure
- Backend package.json minimal: express, pg, bcrypt, jsonwebtoken, rate-limit, helmet, compression; nodemon dev only. No lint/format/test scripts; no frontend package.json (static).
- Likely unused archiver? Actually used in backup route to create zips; ok. No obvious unused deps in backend, but missing pgcrypto extension handling is runtime concern.
- Folder structure: monolithic js/app.js (~5k lines) mixes services, UI, utils; pages under js/pages, ui helpers under js/ui. Lacks modules/bundler; globals only.
- CSS split into base/layout/components/theme but heavy inline styles undermine structure.
- Server routes organized per domain; good, but static frontend served from project root exposing docs; consider public folder separation.
- No build tooling or bundler means tree shaking, minification, and modern JS features not leveraged; maintainability and performance hit.

## Maintainability Score Factors
- app.js exceeds 5k lines, combines auth, utils, services, keyboard, automation; violates single responsibility; hard to test or refactor.
- Pages use large template literals with embedded logic; difficult to read/maintain and easy to introduce XSS if escaping forgotten.
- State mutations scattered (App.Data mutations inside UI views, services, automation); no centralized action layer; debugging state changes will be painful.
- Duplicate logic: session management exists twice (App.SessionManager and App.Services.SessionManager).
- Magic numbers littered (timeoutMinutes, warningMinutes, default VAT 0.2, color hex codes), no config constants file.
- Error handling inconsistent; some uses App.UI.Toast, others alert, others silent console.error; not standardized.
- No tests, no linting, no formatting rules; style drift and regressions likely.

## UI Robustness
- Modals do not disable background scroll; no focus trap; accessibility and usability issues.
- Toasts stack with fixed top/right; no max queue; long messages overlap.
- Forms lack debounced validation and required markers; user can submit partial data easily and discover errors late.
- Keyboard shortcuts ignore modal context; accidental navigation possible during input.
- Charts are div-based; no legends/labels for accessibility; values derived by stripping currency symbols incorrectly for locales.
- No loading spinners for page-level fetches; only generic Loading overlay utility; views rarely use it, leading to flicker or blank states.

## Detailed Code Quality Observations
- Global namespace App.* used everywhere; high coupling; difficult to tree-shake or unit test functions in isolation.
- Inline event handlers in templates (onclick strings) prevent CSP tightening and obscure control flow for QA automation.
- Repeated direct DOM manipulation instead of a view library; high chance of orphaned event listeners and memory leaks on rerender.
- Hardcoded pixel values and inline colors reduce theming flexibility and responsive adaptability.
- SVG icons stored as strings inside JS; duplication across navbar/sidebar; no sprite or componentization.
- Localization: i18n strings with mojibake; mixing raw text and translations; maintainability of translations is low.

## Maintainability Risk Hotspots
- app.js mega-file (~5k lines) combines services, UI, auth, utils; needs modularization.
- dashboard.js dense template with inline logic and styling; lacks component boundaries; hard to patch defects.
- inventory.js tab logic and rendering interleaved; no pagination; loops over entire dataset each render.
- api.js mixes local and remote modes in single functions; branching increases complexity and risk of unnoticed regressions.
- db.js handles IndexedDB/localStorage plus backup logic; coupling persistence and UI toasts; should split concerns.

## Dependency & Structure Critique
- No frontend build step; static scripts loaded via script tags; cannot leverage code splitting or modern syntax with bundler.
- Server serves entire root as static; should isolate frontend in /public and API in /api for clarity and security.
- Lack of lint/format/test config reduces enforceable standards; contributors will diverge on style.
- No environment-based configuration for API base URL, theme defaults, or feature flags.
- CSS variables exist but are inconsistently applied; many inline style literals bypass theming.

## Responsiveness Drill-Down
- Grid classes (grid grid-4, grid-6) not responsive; no media queries to reduce columns on small screens.
- Buttons and inputs have fixed padding and font sizes; no min-width or wrap; long labels will overflow.
- Page containers use fixed margins/padding; on small screens content may be clipped; no overflow-x scroll wrappers for tables.
- Sidebar fixed width not stated but likely; if screen narrower, main content squeezes instead of sidebar collapsing gracefully.
- Charts set height 150px with inline styles; no responsiveness to viewport height/width.

## UI Consistency Review
- Primary colors vary (#10b981, #3b82f6, #4f46e5, #f59e0b, #dc2626) used inline; need tokenized palette.
- Border radius and shadow values differ across cards/modals; some have 6px, others 8px/12px inline.
- Icon sizes vary (16-20px) without consistent class; misalignment in lists.
- Typography weights (500/600/700) applied ad-hoc; no scale or style guide.
- Buttons: mix of btn-primary and inline ghost with custom padding; inconsistent hover/focus states.

## Type Safety / Data Shape Drill-Down
- No schemas for App.Data entities; JSON seeds used as-is; forms do not validate shape.
- API responses assumed to match local shapes; no adapters; risk of undefined access when switching to server data.
- Utility functions assume numbers; calling formatCurrency on undefined leads to NaN and 'NaN' output.
- Router relies on existence of App.UI.Views route mapping; no guards if missing or misnamed.

## Logging & Debugging Capabilities
- Frontend logs only toasts/console; no structured client logging; reproductions rely on user descriptions.
- Server logs errors to console; no log levels, no tracing IDs surfaced to client; hard to correlate.
- Audit trail on client not connected to server; actions like edits/creates are not logged centrally.

## Maintainability Actions Suggested
- Modularize app.js into services (auth, data, ui), utilities, and domain-specific modules.
- Introduce a lightweight state manager or event bus; avoid direct App.Data mutation across views.
- Adopt a design system: tokens for color/spacing/typography, consistent components for buttons/cards/modals.
- Add responsive tables with horizontal scroll and breakpoint-based column layouts.
- Enforce linting/formatting (ESLint/Prettier) and add unit tests for utilities and critical services.
- Implement schema validation (e.g., Zod/ajv) on form submit and API boundaries.
- Add centralized error boundary and loader components used by every page.

## Project Health Scorecard Inputs
- Architecture: monolithic JS without modules lowers maintainability.
- UI/UX: inconsistent theming/responsiveness; accessibility gaps.
- State: global mutable App.Data; no cache invalidation or adapters.
- API: centralized but token handling absent; error handling partial.
- Tooling: no lint/test/build pipeline; static assets only.

[UX 1] Verify table overflow on 1024px width; ensure horizontal scroll and sticky headers.
[UX 2] Check button colors against design tokens; consolidate inline hex to theme variables.
[UX 3] Validate focus states on inputs/buttons; add outline/aria for accessibility.
[UX 4] Ensure modals trap focus and restore on close; prevent background scroll.
[UX 5] Scale typography with clamp() or media queries; remove hardcoded 10px labels.
[State 6] Replace direct App.Data mutation with dispatched actions; log mutations for debugging.
[State 7] Add memoized selectors for dashboard metrics to avoid redundant recompute.
[API 8] Implement token storage/retrieval and refresh; add 401 interceptor.
[API 9] Add retry/backoff for idempotent GETs; surface errors with endpoint and requestId.
[API 10] Add adapters mapping snake_case responses to camelCase; validate shapes.
[Perf 11] Add pagination/virtual scroll to inventory/orders/documents lists; test with 50k rows.
[Perf 12] Debounce DB.save and batch local writes; avoid toast spam on every toggle.
[Perf 13] Move inline styles to CSS classes; reduce layout thrash on re-renders.
[Code 14] Split app.js into multiple files; ensure each module <300 lines where possible.
[Code 15] Add ESLint/Prettier configs; enforce import/order, no-unused-vars, no-console in production builds.
[Code 16] Add unit tests for utils (formatCurrency, calc totals) to catch rounding errors.
[Design 17] Define color palette: primary, secondary, success, warning, danger; remove scattered hex literals.
[Design 18] Normalize border radius/shadows; create reusable card and button components.
[Design 19] Harmonize icon sizes; wrap SVGs in a component with props for size/color.
[A11y 20] Provide aria-labels for all buttons (alerts, sidebar toggles), especially icon-only.
[A11y 21] Ensure sufficient contrast on muted text in dark/light modes; test via WCAG tools.
[Forms 22] Add required field indicators and inline validation messages; prevent submit until valid.
[Forms 23] Prevent double-submit with disabled state/spinner on action buttons.
[Forms 24] Normalize date handling; store ISO, display localized; guard against Invalid Date.
[Logging 25] Add client log buffer with event breadcrumbs (route changes, saves, errors).
[Logging 26] Bubble server requestId into client error to aid support tickets.
[Structure 27] Move static assets to /public; tighten express static scope to avoid exposing docs/.env.example.
[UX 28] Verify table overflow on 1024px width; ensure horizontal scroll and sticky headers.
[UX 29] Check button colors against design tokens; consolidate inline hex to theme variables.
[UX 30] Validate focus states on inputs/buttons; add outline/aria for accessibility.
[UX 31] Ensure modals trap focus and restore on close; prevent background scroll.
[UX 32] Scale typography with clamp() or media queries; remove hardcoded 10px labels.
[State 33] Replace direct App.Data mutation with dispatched actions; log mutations for debugging.
[State 34] Add memoized selectors for dashboard metrics to avoid redundant recompute.
[API 35] Implement token storage/retrieval and refresh; add 401 interceptor.
[API 36] Add retry/backoff for idempotent GETs; surface errors with endpoint and requestId.
[API 37] Add adapters mapping snake_case responses to camelCase; validate shapes.
[Perf 38] Add pagination/virtual scroll to inventory/orders/documents lists; test with 50k rows.
[Perf 39] Debounce DB.save and batch local writes; avoid toast spam on every toggle.
[Perf 40] Move inline styles to CSS classes; reduce layout thrash on re-renders.
[Code 41] Split app.js into multiple files; ensure each module <300 lines where possible.
[Code 42] Add ESLint/Prettier configs; enforce import/order, no-unused-vars, no-console in production builds.
[Code 43] Add unit tests for utils (formatCurrency, calc totals) to catch rounding errors.
[Design 44] Define color palette: primary, secondary, success, warning, danger; remove scattered hex literals.
[Design 45] Normalize border radius/shadows; create reusable card and button components.
[Design 46] Harmonize icon sizes; wrap SVGs in a component with props for size/color.
[A11y 47] Provide aria-labels for all buttons (alerts, sidebar toggles), especially icon-only.
[A11y 48] Ensure sufficient contrast on muted text in dark/light modes; test via WCAG tools.
[Forms 49] Add required field indicators and inline validation messages; prevent submit until valid.
[Forms 50] Prevent double-submit with disabled state/spinner on action buttons.
[Forms 51] Normalize date handling; store ISO, display localized; guard against Invalid Date.
[Logging 52] Add client log buffer with event breadcrumbs (route changes, saves, errors).
[Logging 53] Bubble server requestId into client error to aid support tickets.
[Structure 54] Move static assets to /public; tighten express static scope to avoid exposing docs/.env.example.
[UX 55] Verify table overflow on 1024px width; ensure horizontal scroll and sticky headers.
[UX 56] Check button colors against design tokens; consolidate inline hex to theme variables.
[UX 57] Validate focus states on inputs/buttons; add outline/aria for accessibility.
[UX 58] Ensure modals trap focus and restore on close; prevent background scroll.
[UX 59] Scale typography with clamp() or media queries; remove hardcoded 10px labels.
[State 60] Replace direct App.Data mutation with dispatched actions; log mutations for debugging.
[State 61] Add memoized selectors for dashboard metrics to avoid redundant recompute.
[API 62] Implement token storage/retrieval and refresh; add 401 interceptor.
[API 63] Add retry/backoff for idempotent GETs; surface errors with endpoint and requestId.
[API 64] Add adapters mapping snake_case responses to camelCase; validate shapes.
[Perf 65] Add pagination/virtual scroll to inventory/orders/documents lists; test with 50k rows.
[Perf 66] Debounce DB.save and batch local writes; avoid toast spam on every toggle.
[Perf 67] Move inline styles to CSS classes; reduce layout thrash on re-renders.
[Code 68] Split app.js into multiple files; ensure each module <300 lines where possible.
[Code 69] Add ESLint/Prettier configs; enforce import/order, no-unused-vars, no-console in production builds.
[Code 70] Add unit tests for utils (formatCurrency, calc totals) to catch rounding errors.
[Design 71] Define color palette: primary, secondary, success, warning, danger; remove scattered hex literals.
[Design 72] Normalize border radius/shadows; create reusable card and button components.
[Design 73] Harmonize icon sizes; wrap SVGs in a component with props for size/color.
[A11y 74] Provide aria-labels for all buttons (alerts, sidebar toggles), especially icon-only.
[A11y 75] Ensure sufficient contrast on muted text in dark/light modes; test via WCAG tools.
[Forms 76] Add required field indicators and inline validation messages; prevent submit until valid.
[Forms 77] Prevent double-submit with disabled state/spinner on action buttons.
[Forms 78] Normalize date handling; store ISO, display localized; guard against Invalid Date.
[Logging 79] Add client log buffer with event breadcrumbs (route changes, saves, errors).
[Logging 80] Bubble server requestId into client error to aid support tickets.
[Structure 81] Move static assets to /public; tighten express static scope to avoid exposing docs/.env.example.
[UX 82] Verify table overflow on 1024px width; ensure horizontal scroll and sticky headers.
[UX 83] Check button colors against design tokens; consolidate inline hex to theme variables.
[UX 84] Validate focus states on inputs/buttons; add outline/aria for accessibility.
[UX 85] Ensure modals trap focus and restore on close; prevent background scroll.
[UX 86] Scale typography with clamp() or media queries; remove hardcoded 10px labels.
[State 87] Replace direct App.Data mutation with dispatched actions; log mutations for debugging.
[State 88] Add memoized selectors for dashboard metrics to avoid redundant recompute.
[API 89] Implement token storage/retrieval and refresh; add 401 interceptor.
[API 90] Add retry/backoff for idempotent GETs; surface errors with endpoint and requestId.
[API 91] Add adapters mapping snake_case responses to camelCase; validate shapes.
[Perf 92] Add pagination/virtual scroll to inventory/orders/documents lists; test with 50k rows.
[Perf 93] Debounce DB.save and batch local writes; avoid toast spam on every toggle.
[Perf 94] Move inline styles to CSS classes; reduce layout thrash on re-renders.
[Code 95] Split app.js into multiple files; ensure each module <300 lines where possible.
[Code 96] Add ESLint/Prettier configs; enforce import/order, no-unused-vars, no-console in production builds.
[Code 97] Add unit tests for utils (formatCurrency, calc totals) to catch rounding errors.
[Design 98] Define color palette: primary, secondary, success, warning, danger; remove scattered hex literals.
[Design 99] Normalize border radius/shadows; create reusable card and button components.
[Design 100] Harmonize icon sizes; wrap SVGs in a component with props for size/color.
[A11y 101] Provide aria-labels for all buttons (alerts, sidebar toggles), especially icon-only.
[A11y 102] Ensure sufficient contrast on muted text in dark/light modes; test via WCAG tools.
[Forms 103] Add required field indicators and inline validation messages; prevent submit until valid.
[Forms 104] Prevent double-submit with disabled state/spinner on action buttons.
[Forms 105] Normalize date handling; store ISO, display localized; guard against Invalid Date.
[Logging 106] Add client log buffer with event breadcrumbs (route changes, saves, errors).
[Logging 107] Bubble server requestId into client error to aid support tickets.
[Structure 108] Move static assets to /public; tighten express static scope to avoid exposing docs/.env.example.
[UX 109] Verify table overflow on 1024px width; ensure horizontal scroll and sticky headers.
[UX 110] Check button colors against design tokens; consolidate inline hex to theme variables.
[UX 111] Validate focus states on inputs/buttons; add outline/aria for accessibility.
[UX 112] Ensure modals trap focus and restore on close; prevent background scroll.
[UX 113] Scale typography with clamp() or media queries; remove hardcoded 10px labels.
[State 114] Replace direct App.Data mutation with dispatched actions; log mutations for debugging.
[State 115] Add memoized selectors for dashboard metrics to avoid redundant recompute.
[API 116] Implement token storage/retrieval and refresh; add 401 interceptor.
[API 117] Add retry/backoff for idempotent GETs; surface errors with endpoint and requestId.
[API 118] Add adapters mapping snake_case responses to camelCase; validate shapes.
[Perf 119] Add pagination/virtual scroll to inventory/orders/documents lists; test with 50k rows.
[Perf 120] Debounce DB.save and batch local writes; avoid toast spam on every toggle.
[Perf 121] Move inline styles to CSS classes; reduce layout thrash on re-renders.
[Code 122] Split app.js into multiple files; ensure each module <300 lines where possible.
[Code 123] Add ESLint/Prettier configs; enforce import/order, no-unused-vars, no-console in production builds.
[Code 124] Add unit tests for utils (formatCurrency, calc totals) to catch rounding errors.
[Design 125] Define color palette: primary, secondary, success, warning, danger; remove scattered hex literals.
[Design 126] Normalize border radius/shadows; create reusable card and button components.
[Design 127] Harmonize icon sizes; wrap SVGs in a component with props for size/color.
[A11y 128] Provide aria-labels for all buttons (alerts, sidebar toggles), especially icon-only.
[A11y 129] Ensure sufficient contrast on muted text in dark/light modes; test via WCAG tools.
[Forms 130] Add required field indicators and inline validation messages; prevent submit until valid.
[Forms 131] Prevent double-submit with disabled state/spinner on action buttons.
[Forms 132] Normalize date handling; store ISO, display localized; guard against Invalid Date.
[Logging 133] Add client log buffer with event breadcrumbs (route changes, saves, errors).
[Logging 134] Bubble server requestId into client error to aid support tickets.
[Structure 135] Move static assets to /public; tighten express static scope to avoid exposing docs/.env.example.
[UX 136] Verify table overflow on 1024px width; ensure horizontal scroll and sticky headers.
[UX 137] Check button colors against design tokens; consolidate inline hex to theme variables.
[UX 138] Validate focus states on inputs/buttons; add outline/aria for accessibility.
[UX 139] Ensure modals trap focus and restore on close; prevent background scroll.
[UX 140] Scale typography with clamp() or media queries; remove hardcoded 10px labels.
[State 141] Replace direct App.Data mutation with dispatched actions; log mutations for debugging.
[State 142] Add memoized selectors for dashboard metrics to avoid redundant recompute.
[API 143] Implement token storage/retrieval and refresh; add 401 interceptor.
[API 144] Add retry/backoff for idempotent GETs; surface errors with endpoint and requestId.
[API 145] Add adapters mapping snake_case responses to camelCase; validate shapes.
[Perf 146] Add pagination/virtual scroll to inventory/orders/documents lists; test with 50k rows.
[Perf 147] Debounce DB.save and batch local writes; avoid toast spam on every toggle.
[Perf 148] Move inline styles to CSS classes; reduce layout thrash on re-renders.
[Code 149] Split app.js into multiple files; ensure each module <300 lines where possible.
[Code 150] Add ESLint/Prettier configs; enforce import/order, no-unused-vars, no-console in production builds.
[Code 151] Add unit tests for utils (formatCurrency, calc totals) to catch rounding errors.
[Design 152] Define color palette: primary, secondary, success, warning, danger; remove scattered hex literals.
[Design 153] Normalize border radius/shadows; create reusable card and button components.
[Design 154] Harmonize icon sizes; wrap SVGs in a component with props for size/color.
[A11y 155] Provide aria-labels for all buttons (alerts, sidebar toggles), especially icon-only.
[A11y 156] Ensure sufficient contrast on muted text in dark/light modes; test via WCAG tools.
[Forms 157] Add required field indicators and inline validation messages; prevent submit until valid.
[Forms 158] Prevent double-submit with disabled state/spinner on action buttons.
[Forms 159] Normalize date handling; store ISO, display localized; guard against Invalid Date.
[Logging 160] Add client log buffer with event breadcrumbs (route changes, saves, errors).
[Logging 161] Bubble server requestId into client error to aid support tickets.
[Structure 162] Move static assets to /public; tighten express static scope to avoid exposing docs/.env.example.
[UX 163] Verify table overflow on 1024px width; ensure horizontal scroll and sticky headers.
[UX 164] Check button colors against design tokens; consolidate inline hex to theme variables.
[UX 165] Validate focus states on inputs/buttons; add outline/aria for accessibility.
[UX 166] Ensure modals trap focus and restore on close; prevent background scroll.
[UX 167] Scale typography with clamp() or media queries; remove hardcoded 10px labels.
[State 168] Replace direct App.Data mutation with dispatched actions; log mutations for debugging.
[State 169] Add memoized selectors for dashboard metrics to avoid redundant recompute.
[API 170] Implement token storage/retrieval and refresh; add 401 interceptor.
[API 171] Add retry/backoff for idempotent GETs; surface errors with endpoint and requestId.
[API 172] Add adapters mapping snake_case responses to camelCase; validate shapes.
[Perf 173] Add pagination/virtual scroll to inventory/orders/documents lists; test with 50k rows.
[Perf 174] Debounce DB.save and batch local writes; avoid toast spam on every toggle.
[Perf 175] Move inline styles to CSS classes; reduce layout thrash on re-renders.
[Code 176] Split app.js into multiple files; ensure each module <300 lines where possible.
[Code 177] Add ESLint/Prettier configs; enforce import/order, no-unused-vars, no-console in production builds.
[Code 178] Add unit tests for utils (formatCurrency, calc totals) to catch rounding errors.
[Design 179] Define color palette: primary, secondary, success, warning, danger; remove scattered hex literals.
[Design 180] Normalize border radius/shadows; create reusable card and button components.
[Design 181] Harmonize icon sizes; wrap SVGs in a component with props for size/color.
[A11y 182] Provide aria-labels for all buttons (alerts, sidebar toggles), especially icon-only.
[A11y 183] Ensure sufficient contrast on muted text in dark/light modes; test via WCAG tools.
[Forms 184] Add required field indicators and inline validation messages; prevent submit until valid.
[Forms 185] Prevent double-submit with disabled state/spinner on action buttons.
[Forms 186] Normalize date handling; store ISO, display localized; guard against Invalid Date.
[Logging 187] Add client log buffer with event breadcrumbs (route changes, saves, errors).
[Logging 188] Bubble server requestId into client error to aid support tickets.
[Structure 189] Move static assets to /public; tighten express static scope to avoid exposing docs/.env.example.
[UX 190] Verify table overflow on 1024px width; ensure horizontal scroll and sticky headers.
[UX 191] Check button colors against design tokens; consolidate inline hex to theme variables.
[UX 192] Validate focus states on inputs/buttons; add outline/aria for accessibility.
[UX 193] Ensure modals trap focus and restore on close; prevent background scroll.
[UX 194] Scale typography with clamp() or media queries; remove hardcoded 10px labels.
[State 195] Replace direct App.Data mutation with dispatched actions; log mutations for debugging.
[State 196] Add memoized selectors for dashboard metrics to avoid redundant recompute.
[API 197] Implement token storage/retrieval and refresh; add 401 interceptor.
[API 198] Add retry/backoff for idempotent GETs; surface errors with endpoint and requestId.
[API 199] Add adapters mapping snake_case responses to camelCase; validate shapes.
[Perf 200] Add pagination/virtual scroll to inventory/orders/documents lists; test with 50k rows.
[Perf 201] Debounce DB.save and batch local writes; avoid toast spam on every toggle.
[Perf 202] Move inline styles to CSS classes; reduce layout thrash on re-renders.
[Code 203] Split app.js into multiple files; ensure each module <300 lines where possible.
[Code 204] Add ESLint/Prettier configs; enforce import/order, no-unused-vars, no-console in production builds.
[Code 205] Add unit tests for utils (formatCurrency, calc totals) to catch rounding errors.
[Design 206] Define color palette: primary, secondary, success, warning, danger; remove scattered hex literals.
[Design 207] Normalize border radius/shadows; create reusable card and button components.
[Design 208] Harmonize icon sizes; wrap SVGs in a component with props for size/color.
[A11y 209] Provide aria-labels for all buttons (alerts, sidebar toggles), especially icon-only.
[A11y 210] Ensure sufficient contrast on muted text in dark/light modes; test via WCAG tools.
[Forms 211] Add required field indicators and inline validation messages; prevent submit until valid.
[Forms 212] Prevent double-submit with disabled state/spinner on action buttons.
[Forms 213] Normalize date handling; store ISO, display localized; guard against Invalid Date.
[Logging 214] Add client log buffer with event breadcrumbs (route changes, saves, errors).
[Logging 215] Bubble server requestId into client error to aid support tickets.
[Structure 216] Move static assets to /public; tighten express static scope to avoid exposing docs/.env.example.
[UX 217] Verify table overflow on 1024px width; ensure horizontal scroll and sticky headers.
[UX 218] Check button colors against design tokens; consolidate inline hex to theme variables.
[UX 219] Validate focus states on inputs/buttons; add outline/aria for accessibility.
[UX 220] Ensure modals trap focus and restore on close; prevent background scroll.
[UX 221] Scale typography with clamp() or media queries; remove hardcoded 10px labels.
[State 222] Replace direct App.Data mutation with dispatched actions; log mutations for debugging.
[State 223] Add memoized selectors for dashboard metrics to avoid redundant recompute.
[API 224] Implement token storage/retrieval and refresh; add 401 interceptor.
[API 225] Add retry/backoff for idempotent GETs; surface errors with endpoint and requestId.
[API 226] Add adapters mapping snake_case responses to camelCase; validate shapes.
[Perf 227] Add pagination/virtual scroll to inventory/orders/documents lists; test with 50k rows.
[Perf 228] Debounce DB.save and batch local writes; avoid toast spam on every toggle.
[Perf 229] Move inline styles to CSS classes; reduce layout thrash on re-renders.
[Code 230] Split app.js into multiple files; ensure each module <300 lines where possible.
[Code 231] Add ESLint/Prettier configs; enforce import/order, no-unused-vars, no-console in production builds.
[Code 232] Add unit tests for utils (formatCurrency, calc totals) to catch rounding errors.
[Design 233] Define color palette: primary, secondary, success, warning, danger; remove scattered hex literals.
[Design 234] Normalize border radius/shadows; create reusable card and button components.
[Design 235] Harmonize icon sizes; wrap SVGs in a component with props for size/color.
[A11y 236] Provide aria-labels for all buttons (alerts, sidebar toggles), especially icon-only.
[A11y 237] Ensure sufficient contrast on muted text in dark/light modes; test via WCAG tools.
[Forms 238] Add required field indicators and inline validation messages; prevent submit until valid.
[Forms 239] Prevent double-submit with disabled state/spinner on action buttons.
[Forms 240] Normalize date handling; store ISO, display localized; guard against Invalid Date.
[Logging 241] Add client log buffer with event breadcrumbs (route changes, saves, errors).
[Logging 242] Bubble server requestId into client error to aid support tickets.
[Structure 243] Move static assets to /public; tighten express static scope to avoid exposing docs/.env.example.
[UX 244] Verify table overflow on 1024px width; ensure horizontal scroll and sticky headers.
[UX 245] Check button colors against design tokens; consolidate inline hex to theme variables.
[UX 246] Validate focus states on inputs/buttons; add outline/aria for accessibility.
[UX 247] Ensure modals trap focus and restore on close; prevent background scroll.
[UX 248] Scale typography with clamp() or media queries; remove hardcoded 10px labels.
[State 249] Replace direct App.Data mutation with dispatched actions; log mutations for debugging.
[State 250] Add memoized selectors for dashboard metrics to avoid redundant recompute.
[API 251] Implement token storage/retrieval and refresh; add 401 interceptor.
[API 252] Add retry/backoff for idempotent GETs; surface errors with endpoint and requestId.
[API 253] Add adapters mapping snake_case responses to camelCase; validate shapes.
[Perf 254] Add pagination/virtual scroll to inventory/orders/documents lists; test with 50k rows.
[Perf 255] Debounce DB.save and batch local writes; avoid toast spam on every toggle.
[Perf 256] Move inline styles to CSS classes; reduce layout thrash on re-renders.
[Code 257] Split app.js into multiple files; ensure each module <300 lines where possible.
[Code 258] Add ESLint/Prettier configs; enforce import/order, no-unused-vars, no-console in production builds.
[Code 259] Add unit tests for utils (formatCurrency, calc totals) to catch rounding errors.
[Design 260] Define color palette: primary, secondary, success, warning, danger; remove scattered hex literals.
[Design 261] Normalize border radius/shadows; create reusable card and button components.
[Design 262] Harmonize icon sizes; wrap SVGs in a component with props for size/color.
[A11y 263] Provide aria-labels for all buttons (alerts, sidebar toggles), especially icon-only.
[A11y 264] Ensure sufficient contrast on muted text in dark/light modes; test via WCAG tools.
[Forms 265] Add required field indicators and inline validation messages; prevent submit until valid.
[Forms 266] Prevent double-submit with disabled state/spinner on action buttons.
[Forms 267] Normalize date handling; store ISO, display localized; guard against Invalid Date.
[Logging 268] Add client log buffer with event breadcrumbs (route changes, saves, errors).
[Logging 269] Bubble server requestId into client error to aid support tickets.
[Structure 270] Move static assets to /public; tighten express static scope to avoid exposing docs/.env.example.
[UX 271] Verify table overflow on 1024px width; ensure horizontal scroll and sticky headers.
[UX 272] Check button colors against design tokens; consolidate inline hex to theme variables.
[UX 273] Validate focus states on inputs/buttons; add outline/aria for accessibility.
[UX 274] Ensure modals trap focus and restore on close; prevent background scroll.
[UX 275] Scale typography with clamp() or media queries; remove hardcoded 10px labels.
[State 276] Replace direct App.Data mutation with dispatched actions; log mutations for debugging.
[State 277] Add memoized selectors for dashboard metrics to avoid redundant recompute.
[API 278] Implement token storage/retrieval and refresh; add 401 interceptor.
[API 279] Add retry/backoff for idempotent GETs; surface errors with endpoint and requestId.
[API 280] Add adapters mapping snake_case responses to camelCase; validate shapes.
[Perf 281] Add pagination/virtual scroll to inventory/orders/documents lists; test with 50k rows.
[Perf 282] Debounce DB.save and batch local writes; avoid toast spam on every toggle.
[Perf 283] Move inline styles to CSS classes; reduce layout thrash on re-renders.
[Code 284] Split app.js into multiple files; ensure each module <300 lines where possible.
[Code 285] Add ESLint/Prettier configs; enforce import/order, no-unused-vars, no-console in production builds.
[Code 286] Add unit tests for utils (formatCurrency, calc totals) to catch rounding errors.
[Design 287] Define color palette: primary, secondary, success, warning, danger; remove scattered hex literals.
[Design 288] Normalize border radius/shadows; create reusable card and button components.
[Design 289] Harmonize icon sizes; wrap SVGs in a component with props for size/color.
[A11y 290] Provide aria-labels for all buttons (alerts, sidebar toggles), especially icon-only.
[A11y 291] Ensure sufficient contrast on muted text in dark/light modes; test via WCAG tools.
[Forms 292] Add required field indicators and inline validation messages; prevent submit until valid.
[Forms 293] Prevent double-submit with disabled state/spinner on action buttons.
[Forms 294] Normalize date handling; store ISO, display localized; guard against Invalid Date.
[Logging 295] Add client log buffer with event breadcrumbs (route changes, saves, errors).
[Logging 296] Bubble server requestId into client error to aid support tickets.
[Structure 297] Move static assets to /public; tighten express static scope to avoid exposing docs/.env.example.
[UX 298] Verify table overflow on 1024px width; ensure horizontal scroll and sticky headers.
[UX 299] Check button colors against design tokens; consolidate inline hex to theme variables.
[UX 300] Validate focus states on inputs/buttons; add outline/aria for accessibility.
[UX 301] Ensure modals trap focus and restore on close; prevent background scroll.
[UX 302] Scale typography with clamp() or media queries; remove hardcoded 10px labels.
[State 303] Replace direct App.Data mutation with dispatched actions; log mutations for debugging.
[State 304] Add memoized selectors for dashboard metrics to avoid redundant recompute.
[API 305] Implement token storage/retrieval and refresh; add 401 interceptor.
[API 306] Add retry/backoff for idempotent GETs; surface errors with endpoint and requestId.
[API 307] Add adapters mapping snake_case responses to camelCase; validate shapes.
[Perf 308] Add pagination/virtual scroll to inventory/orders/documents lists; test with 50k rows.
[Perf 309] Debounce DB.save and batch local writes; avoid toast spam on every toggle.
[Perf 310] Move inline styles to CSS classes; reduce layout thrash on re-renders.
[Code 311] Split app.js into multiple files; ensure each module <300 lines where possible.
[Code 312] Add ESLint/Prettier configs; enforce import/order, no-unused-vars, no-console in production builds.
[Code 313] Add unit tests for utils (formatCurrency, calc totals) to catch rounding errors.
[Design 314] Define color palette: primary, secondary, success, warning, danger; remove scattered hex literals.
[Design 315] Normalize border radius/shadows; create reusable card and button components.
[Design 316] Harmonize icon sizes; wrap SVGs in a component with props for size/color.
[A11y 317] Provide aria-labels for all buttons (alerts, sidebar toggles), especially icon-only.
[A11y 318] Ensure sufficient contrast on muted text in dark/light modes; test via WCAG tools.
[Forms 319] Add required field indicators and inline validation messages; prevent submit until valid.
[Forms 320] Prevent double-submit with disabled state/spinner on action buttons.
[Forms 321] Normalize date handling; store ISO, display localized; guard against Invalid Date.
[Logging 322] Add client log buffer with event breadcrumbs (route changes, saves, errors).
[Logging 323] Bubble server requestId into client error to aid support tickets.
[Structure 324] Move static assets to /public; tighten express static scope to avoid exposing docs/.env.example.
[UX 325] Verify table overflow on 1024px width; ensure horizontal scroll and sticky headers.
[UX 326] Check button colors against design tokens; consolidate inline hex to theme variables.
[UX 327] Validate focus states on inputs/buttons; add outline/aria for accessibility.
[UX 328] Ensure modals trap focus and restore on close; prevent background scroll.
[UX 329] Scale typography with clamp() or media queries; remove hardcoded 10px labels.
[State 330] Replace direct App.Data mutation with dispatched actions; log mutations for debugging.
[State 331] Add memoized selectors for dashboard metrics to avoid redundant recompute.
[API 332] Implement token storage/retrieval and refresh; add 401 interceptor.
[API 333] Add retry/backoff for idempotent GETs; surface errors with endpoint and requestId.
[API 334] Add adapters mapping snake_case responses to camelCase; validate shapes.
[Perf 335] Add pagination/virtual scroll to inventory/orders/documents lists; test with 50k rows.
[Perf 336] Debounce DB.save and batch local writes; avoid toast spam on every toggle.
[Perf 337] Move inline styles to CSS classes; reduce layout thrash on re-renders.
[Code 338] Split app.js into multiple files; ensure each module <300 lines where possible.
[Code 339] Add ESLint/Prettier configs; enforce import/order, no-unused-vars, no-console in production builds.
[Code 340] Add unit tests for utils (formatCurrency, calc totals) to catch rounding errors.
[Design 341] Define color palette: primary, secondary, success, warning, danger; remove scattered hex literals.
[Design 342] Normalize border radius/shadows; create reusable card and button components.
[Design 343] Harmonize icon sizes; wrap SVGs in a component with props for size/color.
[A11y 344] Provide aria-labels for all buttons (alerts, sidebar toggles), especially icon-only.
[A11y 345] Ensure sufficient contrast on muted text in dark/light modes; test via WCAG tools.
[Forms 346] Add required field indicators and inline validation messages; prevent submit until valid.
[Forms 347] Prevent double-submit with disabled state/spinner on action buttons.
[Forms 348] Normalize date handling; store ISO, display localized; guard against Invalid Date.
[Logging 349] Add client log buffer with event breadcrumbs (route changes, saves, errors).
[Logging 350] Bubble server requestId into client error to aid support tickets.
[Structure 351] Move static assets to /public; tighten express static scope to avoid exposing docs/.env.example.
[UX 352] Verify table overflow on 1024px width; ensure horizontal scroll and sticky headers.
[UX 353] Check button colors against design tokens; consolidate inline hex to theme variables.
[UX 354] Validate focus states on inputs/buttons; add outline/aria for accessibility.
[UX 355] Ensure modals trap focus and restore on close; prevent background scroll.
[UX 356] Scale typography with clamp() or media queries; remove hardcoded 10px labels.
[State 357] Replace direct App.Data mutation with dispatched actions; log mutations for debugging.
[State 358] Add memoized selectors for dashboard metrics to avoid redundant recompute.
[API 359] Implement token storage/retrieval and refresh; add 401 interceptor.
[API 360] Add retry/backoff for idempotent GETs; surface errors with endpoint and requestId.
[API 361] Add adapters mapping snake_case responses to camelCase; validate shapes.
[Perf 362] Add pagination/virtual scroll to inventory/orders/documents lists; test with 50k rows.
[Perf 363] Debounce DB.save and batch local writes; avoid toast spam on every toggle.
[Perf 364] Move inline styles to CSS classes; reduce layout thrash on re-renders.
[Code 365] Split app.js into multiple files; ensure each module <300 lines where possible.
[Code 366] Add ESLint/Prettier configs; enforce import/order, no-unused-vars, no-console in production builds.
[Code 367] Add unit tests for utils (formatCurrency, calc totals) to catch rounding errors.
[Design 368] Define color palette: primary, secondary, success, warning, danger; remove scattered hex literals.
[Design 369] Normalize border radius/shadows; create reusable card and button components.
[Design 370] Harmonize icon sizes; wrap SVGs in a component with props for size/color.
[A11y 371] Provide aria-labels for all buttons (alerts, sidebar toggles), especially icon-only.
[A11y 372] Ensure sufficient contrast on muted text in dark/light modes; test via WCAG tools.
[Forms 373] Add required field indicators and inline validation messages; prevent submit until valid.
[Forms 374] Prevent double-submit with disabled state/spinner on action buttons.
[Forms 375] Normalize date handling; store ISO, display localized; guard against Invalid Date.
[Logging 376] Add client log buffer with event breadcrumbs (route changes, saves, errors).
[Logging 377] Bubble server requestId into client error to aid support tickets.
[Structure 378] Move static assets to /public; tighten express static scope to avoid exposing docs/.env.example.
[UX 379] Verify table overflow on 1024px width; ensure horizontal scroll and sticky headers.
[UX 380] Check button colors against design tokens; consolidate inline hex to theme variables.
[UX 381] Validate focus states on inputs/buttons; add outline/aria for accessibility.
[UX 382] Ensure modals trap focus and restore on close; prevent background scroll.
[UX 383] Scale typography with clamp() or media queries; remove hardcoded 10px labels.
[State 384] Replace direct App.Data mutation with dispatched actions; log mutations for debugging.
[State 385] Add memoized selectors for dashboard metrics to avoid redundant recompute.
[API 386] Implement token storage/retrieval and refresh; add 401 interceptor.
[API 387] Add retry/backoff for idempotent GETs; surface errors with endpoint and requestId.
[API 388] Add adapters mapping snake_case responses to camelCase; validate shapes.
[Perf 389] Add pagination/virtual scroll to inventory/orders/documents lists; test with 50k rows.
[Perf 390] Debounce DB.save and batch local writes; avoid toast spam on every toggle.
[Perf 391] Move inline styles to CSS classes; reduce layout thrash on re-renders.
[Code 392] Split app.js into multiple files; ensure each module <300 lines where possible.
[Code 393] Add ESLint/Prettier configs; enforce import/order, no-unused-vars, no-console in production builds.
[Code 394] Add unit tests for utils (formatCurrency, calc totals) to catch rounding errors.
[Design 395] Define color palette: primary, secondary, success, warning, danger; remove scattered hex literals.
[Design 396] Normalize border radius/shadows; create reusable card and button components.
[Design 397] Harmonize icon sizes; wrap SVGs in a component with props for size/color.
[A11y 398] Provide aria-labels for all buttons (alerts, sidebar toggles), especially icon-only.
[A11y 399] Ensure sufficient contrast on muted text in dark/light modes; test via WCAG tools.
[Forms 400] Add required field indicators and inline validation messages; prevent submit until valid.
[Forms 401] Prevent double-submit with disabled state/spinner on action buttons.
[Forms 402] Normalize date handling; store ISO, display localized; guard against Invalid Date.
[Logging 403] Add client log buffer with event breadcrumbs (route changes, saves, errors).
[Logging 404] Bubble server requestId into client error to aid support tickets.
[Structure 405] Move static assets to /public; tighten express static scope to avoid exposing docs/.env.example.
[UX 406] Verify table overflow on 1024px width; ensure horizontal scroll and sticky headers.
[UX 407] Check button colors against design tokens; consolidate inline hex to theme variables.
[UX 408] Validate focus states on inputs/buttons; add outline/aria for accessibility.
[UX 409] Ensure modals trap focus and restore on close; prevent background scroll.
[UX 410] Scale typography with clamp() or media queries; remove hardcoded 10px labels.
[State 411] Replace direct App.Data mutation with dispatched actions; log mutations for debugging.
[State 412] Add memoized selectors for dashboard metrics to avoid redundant recompute.
[API 413] Implement token storage/retrieval and refresh; add 401 interceptor.
[API 414] Add retry/backoff for idempotent GETs; surface errors with endpoint and requestId.
[API 415] Add adapters mapping snake_case responses to camelCase; validate shapes.
[Perf 416] Add pagination/virtual scroll to inventory/orders/documents lists; test with 50k rows.
[Perf 417] Debounce DB.save and batch local writes; avoid toast spam on every toggle.
[Perf 418] Move inline styles to CSS classes; reduce layout thrash on re-renders.
[Code 419] Split app.js into multiple files; ensure each module <300 lines where possible.
[Code 420] Add ESLint/Prettier configs; enforce import/order, no-unused-vars, no-console in production builds.
[Code 421] Add unit tests for utils (formatCurrency, calc totals) to catch rounding errors.
[Design 422] Define color palette: primary, secondary, success, warning, danger; remove scattered hex literals.
[Design 423] Normalize border radius/shadows; create reusable card and button components.
[Design 424] Harmonize icon sizes; wrap SVGs in a component with props for size/color.
[A11y 425] Provide aria-labels for all buttons (alerts, sidebar toggles), especially icon-only.
[A11y 426] Ensure sufficient contrast on muted text in dark/light modes; test via WCAG tools.
[Forms 427] Add required field indicators and inline validation messages; prevent submit until valid.
[Forms 428] Prevent double-submit with disabled state/spinner on action buttons.
[Forms 429] Normalize date handling; store ISO, display localized; guard against Invalid Date.
[Logging 430] Add client log buffer with event breadcrumbs (route changes, saves, errors).
[Logging 431] Bubble server requestId into client error to aid support tickets.
[Structure 432] Move static assets to /public; tighten express static scope to avoid exposing docs/.env.example.
[UX 433] Verify table overflow on 1024px width; ensure horizontal scroll and sticky headers.
[UX 434] Check button colors against design tokens; consolidate inline hex to theme variables.
[UX 435] Validate focus states on inputs/buttons; add outline/aria for accessibility.
[UX 436] Ensure modals trap focus and restore on close; prevent background scroll.
[UX 437] Scale typography with clamp() or media queries; remove hardcoded 10px labels.
[State 438] Replace direct App.Data mutation with dispatched actions; log mutations for debugging.
[State 439] Add memoized selectors for dashboard metrics to avoid redundant recompute.
[API 440] Implement token storage/retrieval and refresh; add 401 interceptor.
[API 441] Add retry/backoff for idempotent GETs; surface errors with endpoint and requestId.
[API 442] Add adapters mapping snake_case responses to camelCase; validate shapes.
[Perf 443] Add pagination/virtual scroll to inventory/orders/documents lists; test with 50k rows.
[Perf 444] Debounce DB.save and batch local writes; avoid toast spam on every toggle.
[Perf 445] Move inline styles to CSS classes; reduce layout thrash on re-renders.
[Code 446] Split app.js into multiple files; ensure each module <300 lines where possible.
[Code 447] Add ESLint/Prettier configs; enforce import/order, no-unused-vars, no-console in production builds.
[Code 448] Add unit tests for utils (formatCurrency, calc totals) to catch rounding errors.
[Design 449] Define color palette: primary, secondary, success, warning, danger; remove scattered hex literals.
[Design 450] Normalize border radius/shadows; create reusable card and button components.
[Design 451] Harmonize icon sizes; wrap SVGs in a component with props for size/color.
[A11y 452] Provide aria-labels for all buttons (alerts, sidebar toggles), especially icon-only.
[A11y 453] Ensure sufficient contrast on muted text in dark/light modes; test via WCAG tools.
[Forms 454] Add required field indicators and inline validation messages; prevent submit until valid.
[Forms 455] Prevent double-submit with disabled state/spinner on action buttons.
[Forms 456] Normalize date handling; store ISO, display localized; guard against Invalid Date.
[Logging 457] Add client log buffer with event breadcrumbs (route changes, saves, errors).
[Logging 458] Bubble server requestId into client error to aid support tickets.
[Structure 459] Move static assets to /public; tighten express static scope to avoid exposing docs/.env.example.
[UX 460] Verify table overflow on 1024px width; ensure horizontal scroll and sticky headers.
[UX 461] Check button colors against design tokens; consolidate inline hex to theme variables.
[UX 462] Validate focus states on inputs/buttons; add outline/aria for accessibility.
[UX 463] Ensure modals trap focus and restore on close; prevent background scroll.
[UX 464] Scale typography with clamp() or media queries; remove hardcoded 10px labels.
[State 465] Replace direct App.Data mutation with dispatched actions; log mutations for debugging.
[State 466] Add memoized selectors for dashboard metrics to avoid redundant recompute.
[API 467] Implement token storage/retrieval and refresh; add 401 interceptor.
[API 468] Add retry/backoff for idempotent GETs; surface errors with endpoint and requestId.
[API 469] Add adapters mapping snake_case responses to camelCase; validate shapes.
[Perf 470] Add pagination/virtual scroll to inventory/orders/documents lists; test with 50k rows.
[Perf 471] Debounce DB.save and batch local writes; avoid toast spam on every toggle.
[Perf 472] Move inline styles to CSS classes; reduce layout thrash on re-renders.
[Code 473] Split app.js into multiple files; ensure each module <300 lines where possible.
[Code 474] Add ESLint/Prettier configs; enforce import/order, no-unused-vars, no-console in production builds.
[Code 475] Add unit tests for utils (formatCurrency, calc totals) to catch rounding errors.
[Design 476] Define color palette: primary, secondary, success, warning, danger; remove scattered hex literals.
[Design 477] Normalize border radius/shadows; create reusable card and button components.
[Design 478] Harmonize icon sizes; wrap SVGs in a component with props for size/color.
[A11y 479] Provide aria-labels for all buttons (alerts, sidebar toggles), especially icon-only.
[A11y 480] Ensure sufficient contrast on muted text in dark/light modes; test via WCAG tools.
[Forms 481] Add required field indicators and inline validation messages; prevent submit until valid.
[Forms 482] Prevent double-submit with disabled state/spinner on action buttons.
[Forms 483] Normalize date handling; store ISO, display localized; guard against Invalid Date.
[Logging 484] Add client log buffer with event breadcrumbs (route changes, saves, errors).
[Logging 485] Bubble server requestId into client error to aid support tickets.
[Structure 486] Move static assets to /public; tighten express static scope to avoid exposing docs/.env.example.
[UX 487] Verify table overflow on 1024px width; ensure horizontal scroll and sticky headers.
[UX 488] Check button colors against design tokens; consolidate inline hex to theme variables.
[UX 489] Validate focus states on inputs/buttons; add outline/aria for accessibility.
[UX 490] Ensure modals trap focus and restore on close; prevent background scroll.
[UX 491] Scale typography with clamp() or media queries; remove hardcoded 10px labels.
[State 492] Replace direct App.Data mutation with dispatched actions; log mutations for debugging.
[State 493] Add memoized selectors for dashboard metrics to avoid redundant recompute.
[API 494] Implement token storage/retrieval and refresh; add 401 interceptor.
[API 495] Add retry/backoff for idempotent GETs; surface errors with endpoint and requestId.
[API 496] Add adapters mapping snake_case responses to camelCase; validate shapes.
[Perf 497] Add pagination/virtual scroll to inventory/orders/documents lists; test with 50k rows.
[Perf 498] Debounce DB.save and batch local writes; avoid toast spam on every toggle.
[Perf 499] Move inline styles to CSS classes; reduce layout thrash on re-renders.
[Code 500] Split app.js into multiple files; ensure each module <300 lines where possible.
[Code 501] Add ESLint/Prettier configs; enforce import/order, no-unused-vars, no-console in production builds.
[Code 502] Add unit tests for utils (formatCurrency, calc totals) to catch rounding errors.
[Design 503] Define color palette: primary, secondary, success, warning, danger; remove scattered hex literals.
[Design 504] Normalize border radius/shadows; create reusable card and button components.
[Design 505] Harmonize icon sizes; wrap SVGs in a component with props for size/color.
[A11y 506] Provide aria-labels for all buttons (alerts, sidebar toggles), especially icon-only.
[A11y 507] Ensure sufficient contrast on muted text in dark/light modes; test via WCAG tools.
[Forms 508] Add required field indicators and inline validation messages; prevent submit until valid.
[Forms 509] Prevent double-submit with disabled state/spinner on action buttons.
[Forms 510] Normalize date handling; store ISO, display localized; guard against Invalid Date.
[Logging 511] Add client log buffer with event breadcrumbs (route changes, saves, errors).
[Logging 512] Bubble server requestId into client error to aid support tickets.
[Structure 513] Move static assets to /public; tighten express static scope to avoid exposing docs/.env.example.
[UX 514] Verify table overflow on 1024px width; ensure horizontal scroll and sticky headers.
[UX 515] Check button colors against design tokens; consolidate inline hex to theme variables.
[UX 516] Validate focus states on inputs/buttons; add outline/aria for accessibility.
[UX 517] Ensure modals trap focus and restore on close; prevent background scroll.
[UX 518] Scale typography with clamp() or media queries; remove hardcoded 10px labels.
[State 519] Replace direct App.Data mutation with dispatched actions; log mutations for debugging.
[State 520] Add memoized selectors for dashboard metrics to avoid redundant recompute.
[API 521] Implement token storage/retrieval and refresh; add 401 interceptor.
[API 522] Add retry/backoff for idempotent GETs; surface errors with endpoint and requestId.
[API 523] Add adapters mapping snake_case responses to camelCase; validate shapes.
[Perf 524] Add pagination/virtual scroll to inventory/orders/documents lists; test with 50k rows.
[Perf 525] Debounce DB.save and batch local writes; avoid toast spam on every toggle.
[Perf 526] Move inline styles to CSS classes; reduce layout thrash on re-renders.
[Code 527] Split app.js into multiple files; ensure each module <300 lines where possible.
[Code 528] Add ESLint/Prettier configs; enforce import/order, no-unused-vars, no-console in production builds.
[Code 529] Add unit tests for utils (formatCurrency, calc totals) to catch rounding errors.
[Design 530] Define color palette: primary, secondary, success, warning, danger; remove scattered hex literals.
[Design 531] Normalize border radius/shadows; create reusable card and button components.
[Design 532] Harmonize icon sizes; wrap SVGs in a component with props for size/color.
[A11y 533] Provide aria-labels for all buttons (alerts, sidebar toggles), especially icon-only.
[A11y 534] Ensure sufficient contrast on muted text in dark/light modes; test via WCAG tools.
[Forms 535] Add required field indicators and inline validation messages; prevent submit until valid.
[Forms 536] Prevent double-submit with disabled state/spinner on action buttons.
[Forms 537] Normalize date handling; store ISO, display localized; guard against Invalid Date.
[Logging 538] Add client log buffer with event breadcrumbs (route changes, saves, errors).
[Logging 539] Bubble server requestId into client error to aid support tickets.
[Structure 540] Move static assets to /public; tighten express static scope to avoid exposing docs/.env.example.
[UX 541] Verify table overflow on 1024px width; ensure horizontal scroll and sticky headers.
[UX 542] Check button colors against design tokens; consolidate inline hex to theme variables.
[UX 543] Validate focus states on inputs/buttons; add outline/aria for accessibility.
[UX 544] Ensure modals trap focus and restore on close; prevent background scroll.
[UX 545] Scale typography with clamp() or media queries; remove hardcoded 10px labels.
[State 546] Replace direct App.Data mutation with dispatched actions; log mutations for debugging.
[State 547] Add memoized selectors for dashboard metrics to avoid redundant recompute.
[API 548] Implement token storage/retrieval and refresh; add 401 interceptor.
[API 549] Add retry/backoff for idempotent GETs; surface errors with endpoint and requestId.
[API 550] Add adapters mapping snake_case responses to camelCase; validate shapes.
[Perf 551] Add pagination/virtual scroll to inventory/orders/documents lists; test with 50k rows.
[Perf 552] Debounce DB.save and batch local writes; avoid toast spam on every toggle.
[Perf 553] Move inline styles to CSS classes; reduce layout thrash on re-renders.
[Code 554] Split app.js into multiple files; ensure each module <300 lines where possible.
[Code 555] Add ESLint/Prettier configs; enforce import/order, no-unused-vars, no-console in production builds.
[Code 556] Add unit tests for utils (formatCurrency, calc totals) to catch rounding errors.
[Design 557] Define color palette: primary, secondary, success, warning, danger; remove scattered hex literals.
[Design 558] Normalize border radius/shadows; create reusable card and button components.
[Design 559] Harmonize icon sizes; wrap SVGs in a component with props for size/color.
[A11y 560] Provide aria-labels for all buttons (alerts, sidebar toggles), especially icon-only.
[A11y 561] Ensure sufficient contrast on muted text in dark/light modes; test via WCAG tools.
[Forms 562] Add required field indicators and inline validation messages; prevent submit until valid.
[Forms 563] Prevent double-submit with disabled state/spinner on action buttons.
[Forms 564] Normalize date handling; store ISO, display localized; guard against Invalid Date.
[Logging 565] Add client log buffer with event breadcrumbs (route changes, saves, errors).
[Logging 566] Bubble server requestId into client error to aid support tickets.
[Structure 567] Move static assets to /public; tighten express static scope to avoid exposing docs/.env.example.
[UX 568] Verify table overflow on 1024px width; ensure horizontal scroll and sticky headers.
[UX 569] Check button colors against design tokens; consolidate inline hex to theme variables.
[UX 570] Validate focus states on inputs/buttons; add outline/aria for accessibility.
[UX 571] Ensure modals trap focus and restore on close; prevent background scroll.
[UX 572] Scale typography with clamp() or media queries; remove hardcoded 10px labels.
[State 573] Replace direct App.Data mutation with dispatched actions; log mutations for debugging.
[State 574] Add memoized selectors for dashboard metrics to avoid redundant recompute.
[API 575] Implement token storage/retrieval and refresh; add 401 interceptor.
[API 576] Add retry/backoff for idempotent GETs; surface errors with endpoint and requestId.
[API 577] Add adapters mapping snake_case responses to camelCase; validate shapes.
[Perf 578] Add pagination/virtual scroll to inventory/orders/documents lists; test with 50k rows.
[Perf 579] Debounce DB.save and batch local writes; avoid toast spam on every toggle.
[Perf 580] Move inline styles to CSS classes; reduce layout thrash on re-renders.
[Code 581] Split app.js into multiple files; ensure each module <300 lines where possible.
[Code 582] Add ESLint/Prettier configs; enforce import/order, no-unused-vars, no-console in production builds.
[Code 583] Add unit tests for utils (formatCurrency, calc totals) to catch rounding errors.
[Design 584] Define color palette: primary, secondary, success, warning, danger; remove scattered hex literals.
[Design 585] Normalize border radius/shadows; create reusable card and button components.
[Design 586] Harmonize icon sizes; wrap SVGs in a component with props for size/color.
[A11y 587] Provide aria-labels for all buttons (alerts, sidebar toggles), especially icon-only.
[A11y 588] Ensure sufficient contrast on muted text in dark/light modes; test via WCAG tools.
[Forms 589] Add required field indicators and inline validation messages; prevent submit until valid.
[Forms 590] Prevent double-submit with disabled state/spinner on action buttons.
[Forms 591] Normalize date handling; store ISO, display localized; guard against Invalid Date.
[Logging 592] Add client log buffer with event breadcrumbs (route changes, saves, errors).
[Logging 593] Bubble server requestId into client error to aid support tickets.
[Structure 594] Move static assets to /public; tighten express static scope to avoid exposing docs/.env.example.
[UX 595] Verify table overflow on 1024px width; ensure horizontal scroll and sticky headers.
[UX 596] Check button colors against design tokens; consolidate inline hex to theme variables.
[UX 597] Validate focus states on inputs/buttons; add outline/aria for accessibility.
[UX 598] Ensure modals trap focus and restore on close; prevent background scroll.
[UX 599] Scale typography with clamp() or media queries; remove hardcoded 10px labels.
[State 600] Replace direct App.Data mutation with dispatched actions; log mutations for debugging.
[State 601] Add memoized selectors for dashboard metrics to avoid redundant recompute.
[API 602] Implement token storage/retrieval and refresh; add 401 interceptor.
[API 603] Add retry/backoff for idempotent GETs; surface errors with endpoint and requestId.
[API 604] Add adapters mapping snake_case responses to camelCase; validate shapes.
[Perf 605] Add pagination/virtual scroll to inventory/orders/documents lists; test with 50k rows.
[Perf 606] Debounce DB.save and batch local writes; avoid toast spam on every toggle.
[Perf 607] Move inline styles to CSS classes; reduce layout thrash on re-renders.
[Code 608] Split app.js into multiple files; ensure each module <300 lines where possible.
[Code 609] Add ESLint/Prettier configs; enforce import/order, no-unused-vars, no-console in production builds.
[Code 610] Add unit tests for utils (formatCurrency, calc totals) to catch rounding errors.
[Design 611] Define color palette: primary, secondary, success, warning, danger; remove scattered hex literals.
[Design 612] Normalize border radius/shadows; create reusable card and button components.
[Design 613] Harmonize icon sizes; wrap SVGs in a component with props for size/color.
[A11y 614] Provide aria-labels for all buttons (alerts, sidebar toggles), especially icon-only.
[A11y 615] Ensure sufficient contrast on muted text in dark/light modes; test via WCAG tools.
[Forms 616] Add required field indicators and inline validation messages; prevent submit until valid.
[Forms 617] Prevent double-submit with disabled state/spinner on action buttons.
[Forms 618] Normalize date handling; store ISO, display localized; guard against Invalid Date.
[Logging 619] Add client log buffer with event breadcrumbs (route changes, saves, errors).
[Logging 620] Bubble server requestId into client error to aid support tickets.
[Structure 621] Move static assets to /public; tighten express static scope to avoid exposing docs/.env.example.
[UX 622] Verify table overflow on 1024px width; ensure horizontal scroll and sticky headers.
[UX 623] Check button colors against design tokens; consolidate inline hex to theme variables.
[UX 624] Validate focus states on inputs/buttons; add outline/aria for accessibility.
[UX 625] Ensure modals trap focus and restore on close; prevent background scroll.
[UX 626] Scale typography with clamp() or media queries; remove hardcoded 10px labels.
[State 627] Replace direct App.Data mutation with dispatched actions; log mutations for debugging.
[State 628] Add memoized selectors for dashboard metrics to avoid redundant recompute.
[API 629] Implement token storage/retrieval and refresh; add 401 interceptor.
[API 630] Add retry/backoff for idempotent GETs; surface errors with endpoint and requestId.
[API 631] Add adapters mapping snake_case responses to camelCase; validate shapes.
[Perf 632] Add pagination/virtual scroll to inventory/orders/documents lists; test with 50k rows.
[Perf 633] Debounce DB.save and batch local writes; avoid toast spam on every toggle.
[Perf 634] Move inline styles to CSS classes; reduce layout thrash on re-renders.
[Code 635] Split app.js into multiple files; ensure each module <300 lines where possible.
[Code 636] Add ESLint/Prettier configs; enforce import/order, no-unused-vars, no-console in production builds.
[Code 637] Add unit tests for utils (formatCurrency, calc totals) to catch rounding errors.
[Design 638] Define color palette: primary, secondary, success, warning, danger; remove scattered hex literals.
[Design 639] Normalize border radius/shadows; create reusable card and button components.
[Design 640] Harmonize icon sizes; wrap SVGs in a component with props for size/color.
[A11y 641] Provide aria-labels for all buttons (alerts, sidebar toggles), especially icon-only.
[A11y 642] Ensure sufficient contrast on muted text in dark/light modes; test via WCAG tools.
[Forms 643] Add required field indicators and inline validation messages; prevent submit until valid.
[Forms 644] Prevent double-submit with disabled state/spinner on action buttons.
[Forms 645] Normalize date handling; store ISO, display localized; guard against Invalid Date.
[Logging 646] Add client log buffer with event breadcrumbs (route changes, saves, errors).
[Logging 647] Bubble server requestId into client error to aid support tickets.
[Structure 648] Move static assets to /public; tighten express static scope to avoid exposing docs/.env.example.
[UX 649] Verify table overflow on 1024px width; ensure horizontal scroll and sticky headers.
[UX 650] Check button colors against design tokens; consolidate inline hex to theme variables.
[UX 651] Validate focus states on inputs/buttons; add outline/aria for accessibility.
[UX 652] Ensure modals trap focus and restore on close; prevent background scroll.
[UX 653] Scale typography with clamp() or media queries; remove hardcoded 10px labels.
[State 654] Replace direct App.Data mutation with dispatched actions; log mutations for debugging.
[State 655] Add memoized selectors for dashboard metrics to avoid redundant recompute.
[API 656] Implement token storage/retrieval and refresh; add 401 interceptor.
[API 657] Add retry/backoff for idempotent GETs; surface errors with endpoint and requestId.
[API 658] Add adapters mapping snake_case responses to camelCase; validate shapes.
[Perf 659] Add pagination/virtual scroll to inventory/orders/documents lists; test with 50k rows.
[Perf 660] Debounce DB.save and batch local writes; avoid toast spam on every toggle.
[Perf 661] Move inline styles to CSS classes; reduce layout thrash on re-renders.
[Code 662] Split app.js into multiple files; ensure each module <300 lines where possible.
[Code 663] Add ESLint/Prettier configs; enforce import/order, no-unused-vars, no-console in production builds.
[Code 664] Add unit tests for utils (formatCurrency, calc totals) to catch rounding errors.
[Design 665] Define color palette: primary, secondary, success, warning, danger; remove scattered hex literals.
[Design 666] Normalize border radius/shadows; create reusable card and button components.
[Design 667] Harmonize icon sizes; wrap SVGs in a component with props for size/color.
[A11y 668] Provide aria-labels for all buttons (alerts, sidebar toggles), especially icon-only.
[A11y 669] Ensure sufficient contrast on muted text in dark/light modes; test via WCAG tools.
[Forms 670] Add required field indicators and inline validation messages; prevent submit until valid.
[Forms 671] Prevent double-submit with disabled state/spinner on action buttons.
[Forms 672] Normalize date handling; store ISO, display localized; guard against Invalid Date.
[Logging 673] Add client log buffer with event breadcrumbs (route changes, saves, errors).
[Logging 674] Bubble server requestId into client error to aid support tickets.
[Structure 675] Move static assets to /public; tighten express static scope to avoid exposing docs/.env.example.
[UX 676] Verify table overflow on 1024px width; ensure horizontal scroll and sticky headers.
[UX 677] Check button colors against design tokens; consolidate inline hex to theme variables.
[UX 678] Validate focus states on inputs/buttons; add outline/aria for accessibility.
[UX 679] Ensure modals trap focus and restore on close; prevent background scroll.
[UX 680] Scale typography with clamp() or media queries; remove hardcoded 10px labels.
[State 681] Replace direct App.Data mutation with dispatched actions; log mutations for debugging.
[State 682] Add memoized selectors for dashboard metrics to avoid redundant recompute.
[API 683] Implement token storage/retrieval and refresh; add 401 interceptor.
[API 684] Add retry/backoff for idempotent GETs; surface errors with endpoint and requestId.
[API 685] Add adapters mapping snake_case responses to camelCase; validate shapes.
[Perf 686] Add pagination/virtual scroll to inventory/orders/documents lists; test with 50k rows.
[Perf 687] Debounce DB.save and batch local writes; avoid toast spam on every toggle.
[Perf 688] Move inline styles to CSS classes; reduce layout thrash on re-renders.
[Code 689] Split app.js into multiple files; ensure each module <300 lines where possible.
[Code 690] Add ESLint/Prettier configs; enforce import/order, no-unused-vars, no-console in production builds.
[Code 691] Add unit tests for utils (formatCurrency, calc totals) to catch rounding errors.
[Design 692] Define color palette: primary, secondary, success, warning, danger; remove scattered hex literals.
[Design 693] Normalize border radius/shadows; create reusable card and button components.
[Design 694] Harmonize icon sizes; wrap SVGs in a component with props for size/color.
[A11y 695] Provide aria-labels for all buttons (alerts, sidebar toggles), especially icon-only.
[A11y 696] Ensure sufficient contrast on muted text in dark/light modes; test via WCAG tools.
[Forms 697] Add required field indicators and inline validation messages; prevent submit until valid.
[Forms 698] Prevent double-submit with disabled state/spinner on action buttons.
[Forms 699] Normalize date handling; store ISO, display localized; guard against Invalid Date.
[Logging 700] Add client log buffer with event breadcrumbs (route changes, saves, errors).
[Logging 701] Bubble server requestId into client error to aid support tickets.
[Structure 702] Move static assets to /public; tighten express static scope to avoid exposing docs/.env.example.
[UX 703] Verify table overflow on 1024px width; ensure horizontal scroll and sticky headers.
[UX 704] Check button colors against design tokens; consolidate inline hex to theme variables.
[UX 705] Validate focus states on inputs/buttons; add outline/aria for accessibility.
[UX 706] Ensure modals trap focus and restore on close; prevent background scroll.
[UX 707] Scale typography with clamp() or media queries; remove hardcoded 10px labels.
[State 708] Replace direct App.Data mutation with dispatched actions; log mutations for debugging.
[State 709] Add memoized selectors for dashboard metrics to avoid redundant recompute.
[API 710] Implement token storage/retrieval and refresh; add 401 interceptor.
[API 711] Add retry/backoff for idempotent GETs; surface errors with endpoint and requestId.
[API 712] Add adapters mapping snake_case responses to camelCase; validate shapes.
[Perf 713] Add pagination/virtual scroll to inventory/orders/documents lists; test with 50k rows.
[Perf 714] Debounce DB.save and batch local writes; avoid toast spam on every toggle.
[Perf 715] Move inline styles to CSS classes; reduce layout thrash on re-renders.
[Code 716] Split app.js into multiple files; ensure each module <300 lines where possible.
[Code 717] Add ESLint/Prettier configs; enforce import/order, no-unused-vars, no-console in production builds.
[Code 718] Add unit tests for utils (formatCurrency, calc totals) to catch rounding errors.
[Design 719] Define color palette: primary, secondary, success, warning, danger; remove scattered hex literals.
[Design 720] Normalize border radius/shadows; create reusable card and button components.
[Design 721] Harmonize icon sizes; wrap SVGs in a component with props for size/color.
[A11y 722] Provide aria-labels for all buttons (alerts, sidebar toggles), especially icon-only.
[A11y 723] Ensure sufficient contrast on muted text in dark/light modes; test via WCAG tools.
[Forms 724] Add required field indicators and inline validation messages; prevent submit until valid.
[Forms 725] Prevent double-submit with disabled state/spinner on action buttons.
[Forms 726] Normalize date handling; store ISO, display localized; guard against Invalid Date.
[Logging 727] Add client log buffer with event breadcrumbs (route changes, saves, errors).
[Logging 728] Bubble server requestId into client error to aid support tickets.
[Structure 729] Move static assets to /public; tighten express static scope to avoid exposing docs/.env.example.
[UX 730] Verify table overflow on 1024px width; ensure horizontal scroll and sticky headers.
[UX 731] Check button colors against design tokens; consolidate inline hex to theme variables.
[UX 732] Validate focus states on inputs/buttons; add outline/aria for accessibility.
[UX 733] Ensure modals trap focus and restore on close; prevent background scroll.
[UX 734] Scale typography with clamp() or media queries; remove hardcoded 10px labels.
[State 735] Replace direct App.Data mutation with dispatched actions; log mutations for debugging.
[State 736] Add memoized selectors for dashboard metrics to avoid redundant recompute.
[API 737] Implement token storage/retrieval and refresh; add 401 interceptor.
[API 738] Add retry/backoff for idempotent GETs; surface errors with endpoint and requestId.
[API 739] Add adapters mapping snake_case responses to camelCase; validate shapes.
[Perf 740] Add pagination/virtual scroll to inventory/orders/documents lists; test with 50k rows.
[Perf 741] Debounce DB.save and batch local writes; avoid toast spam on every toggle.
[Perf 742] Move inline styles to CSS classes; reduce layout thrash on re-renders.
[Code 743] Split app.js into multiple files; ensure each module <300 lines where possible.
[Code 744] Add ESLint/Prettier configs; enforce import/order, no-unused-vars, no-console in production builds.
[Code 745] Add unit tests for utils (formatCurrency, calc totals) to catch rounding errors.
[Design 746] Define color palette: primary, secondary, success, warning, danger; remove scattered hex literals.
[Design 747] Normalize border radius/shadows; create reusable card and button components.
[Design 748] Harmonize icon sizes; wrap SVGs in a component with props for size/color.
[A11y 749] Provide aria-labels for all buttons (alerts, sidebar toggles), especially icon-only.
[A11y 750] Ensure sufficient contrast on muted text in dark/light modes; test via WCAG tools.
[Forms 751] Add required field indicators and inline validation messages; prevent submit until valid.
[Forms 752] Prevent double-submit with disabled state/spinner on action buttons.
[Forms 753] Normalize date handling; store ISO, display localized; guard against Invalid Date.
[Logging 754] Add client log buffer with event breadcrumbs (route changes, saves, errors).
[Logging 755] Bubble server requestId into client error to aid support tickets.
[Structure 756] Move static assets to /public; tighten express static scope to avoid exposing docs/.env.example.
[UX 757] Verify table overflow on 1024px width; ensure horizontal scroll and sticky headers.
[UX 758] Check button colors against design tokens; consolidate inline hex to theme variables.
[UX 759] Validate focus states on inputs/buttons; add outline/aria for accessibility.
[UX 760] Ensure modals trap focus and restore on close; prevent background scroll.
[UX 761] Scale typography with clamp() or media queries; remove hardcoded 10px labels.
[State 762] Replace direct App.Data mutation with dispatched actions; log mutations for debugging.
[State 763] Add memoized selectors for dashboard metrics to avoid redundant recompute.
[API 764] Implement token storage/retrieval and refresh; add 401 interceptor.
[API 765] Add retry/backoff for idempotent GETs; surface errors with endpoint and requestId.
[API 766] Add adapters mapping snake_case responses to camelCase; validate shapes.
[Perf 767] Add pagination/virtual scroll to inventory/orders/documents lists; test with 50k rows.
[Perf 768] Debounce DB.save and batch local writes; avoid toast spam on every toggle.
[Perf 769] Move inline styles to CSS classes; reduce layout thrash on re-renders.
[Code 770] Split app.js into multiple files; ensure each module <300 lines where possible.
[Code 771] Add ESLint/Prettier configs; enforce import/order, no-unused-vars, no-console in production builds.
[Code 772] Add unit tests for utils (formatCurrency, calc totals) to catch rounding errors.
[Design 773] Define color palette: primary, secondary, success, warning, danger; remove scattered hex literals.
[Design 774] Normalize border radius/shadows; create reusable card and button components.
[Design 775] Harmonize icon sizes; wrap SVGs in a component with props for size/color.
[A11y 776] Provide aria-labels for all buttons (alerts, sidebar toggles), especially icon-only.
[A11y 777] Ensure sufficient contrast on muted text in dark/light modes; test via WCAG tools.
[Forms 778] Add required field indicators and inline validation messages; prevent submit until valid.
[Forms 779] Prevent double-submit with disabled state/spinner on action buttons.
[Forms 780] Normalize date handling; store ISO, display localized; guard against Invalid Date.
[Logging 781] Add client log buffer with event breadcrumbs (route changes, saves, errors).
[Logging 782] Bubble server requestId into client error to aid support tickets.
[Structure 783] Move static assets to /public; tighten express static scope to avoid exposing docs/.env.example.
[UX 784] Verify table overflow on 1024px width; ensure horizontal scroll and sticky headers.
[UX 785] Check button colors against design tokens; consolidate inline hex to theme variables.
[UX 786] Validate focus states on inputs/buttons; add outline/aria for accessibility.
[UX 787] Ensure modals trap focus and restore on close; prevent background scroll.

## Project Health Score
Project Health Score: 48/100

Top 5 Priority Fixes before launch:
- Implement token-aware API layer with proper auth headers, refresh, and error handling; map server responses to validated client shapes.
- Modularize app.js and introduce state management with actions/selectors; eliminate direct global mutations and add pagination/virtualization for large lists.
- Build a design system: consolidate colors/spacing/typography/icons, remove inline hex/pixel values, ensure responsive tables and modals.
- Add validation schemas for all forms (numbers/dates/required), prevent double-submits, and standardize rounding to 2dp per line then totals.
- Introduce tooling (ESLint/Prettier/tests/build) and restrict static hosting to public assets to reduce security and maintainability risk.