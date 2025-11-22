# MicroOps GA Rules - Complete Development Standards

## Working mode for development / agent

Your job is to move the MicroOps ERP from "working prototype" to General Availability (GA), one module at a time.

You always work in very focused mode:
- Pick one module (or at most two strongly related modules).
- Keep full logs of what you touch and why, exactly as before.
- Apply the same architecture rules, blueprint, and coding conventions across everything.
- Bring that module up to GA level before jumping to the next one.

### Modules in scope:
1. Dashboard
2. Kunden
3. Artikelstamm
4. E-Komponenten
5. Lieferanten
6. Spediteure
7. Preislisten
8. Lagerliste
9. Lagerbewegungen
10. Chargen / LOT
11. Aufträge
12. Bestellungen
13. Produktion
14. Dokumente
15. Berichte
16. Aufgaben
17. Einstellungen

The order is your choice. What is non-negotiable: **when you leave a module, it is finished and polished to GA standard.**

While working on any module, you continuously cross-check and, if needed, update:
- BLUEPRINT_COMPLETE.md
- MICROOPS_SPEC.md
- microops_full.md
- HowToUse.md
- README.md
- CHANGELOG.md

**If the code changes reality, the documentation must follow.**

---

## What "General Availability (GA)" means in MicroOps

For MicroOps, General Availability is defined exactly as:

> "Production Release: This is the final, stable version of the product, released to the general public for use. It is considered highly stable and reliable, and all commercialization activities (marketing, documentation, etc.) are complete."

### In practical terms:
- The module is **stable**: no known crash paths, no white screens, no critical data loss.
- The module is **legally and fiscally safe** for an Austrian SME in your domain.
- The module is **usable by real users** (office/warehouse/production), not just developers.
- The module is **print/PDF ready**: invoices, Lieferscheine, documents look like they came from a serious ERP.
- The module is **resilient**: offline, local server quirks, operator mistakes, and edge cases are handled.
- The module is **auditable**: changes, decisions, and flows can be explained to auditors and QA.
- The module is **maintainable and upgradable** in the long term.

**If any hard rule below is clearly violated, that module is not GA.**

---

## Deployment form: HTML app plus Windows executable

MicroOps must run comfortably as:
- A local HTML/JS app (e.g. index.html + assets), opened in a supported browser on the local network or machine.
- A packaged Windows executable (.exe) that wraps the same code (for example via an embedded browser engine / WebView / Electron-like wrapper), so that users can start "MicroOps" like a normal desktop program.

This implies:
- No assumptions that only file:// or only http://localhost will be used – both deployment modes must work.
- Paths, storage, and printing work the same whether opened as index.html in a browser or via the .exe container.
- The build/packaging pipeline is documented so that rebuilding the .exe from the code + assets is repeatable.

---

## Code stability and cleanliness (per file)

Every file lives in a clear place in the architecture: UI, domain, data access, infrastructure. It does not secretly cross boundaries or reach into low-level details it should not know.

### Configuration and constants
- No inline configuration sprinkled as random constants in components.
- No magic numbers or magic strings ("3 means shipped", "X1" means "special case") – everything has a named constant or enum.

### Documentation
Functions and methods are documented:
- Short description of purpose.
- Parameters and what they mean.
- Return types or structures.
- Expected error conditions.

### Code quality
- There is no dead code, no commented-out old logic hanging around "just in case".
- Asynchronous work is handled consciously:
  - Promises are always awaited or handled.
  - No "fire and forget" chains that can fail silently.
- Duplication is minimized:
  - If you see the same pattern copy-pasted across modules, you refactor into a shared utility or helper.
  - Files feel clean, focused, and readable by someone new to the project.

---

## Data and domain correctness (per file)

Every file that touches domain data respects:
- The domain spec for Kunden, Artikel, LOTs, Bewegungen, Aufträge, Rechnungen, Bestellungen, Produktion, etc.
- The field mapping chain: DTO → UI → DTO is consistent and documented.

### Enumerations
- Status values like "offen", "bestätigt", "storniert", "gebucht" are not invented ad hoc.
- Domain states match what is defined in MICROOPS_SPEC.md.

### Impossible states
The UI never allows impossible states, for example:
- Auftrag without Kunde.
- Lagerbewegung without Lagerort.
- LOT-pflichtiges Produkt without a LOT on relevant operations.

### Immutability
- Immutable fields (invoice number, posted date, finalized production batch ID) cannot be edited in normal flows.
- When real-world corrections are needed, they go through explicit correction mechanisms (e.g. credit note, reversal movement), preserving history.

### Constraints
- If a field is mandatory according to the spec, the UI enforces it clearly.
- If a relationship is mandatory (order → customer, document → lot), the UI does not allow saving without it.

---

## UI and UX quality (per file / per screen)

Each screen follows the global layout and design patterns of MicroOps:
- Common grid, spacing, typography, and header structure.
- Icons from one consistent library and used with consistent meaning.

### Interactive states
- Hover, focus, disabled, active are visually clear.
- Controls do not just "look the same" whether they are clickable or not.

### Async operations
- Loading lists, saving records, generating PDFs show appropriate loading states in context, not just a generic spinner far away.

### Tables and forms
- Table column order reflects business importance, not random database column order.
- Forms include auto-formatting for dates, currency, numeric values.
- Where relevant, there is draft/undo behavior so users can fix mistakes without hard data loss.

Users moving between modules feel they are in one coherent product, not a patchwork.

---

## Business logic and validation (per file / per flow)

Every file that contains business logic enforces:
- Domain constraints (what values and combinations are allowed).
- Workflow constraints (what states can follow which).
- Permission constraints (who is allowed to do what).

### Blocking invalid operations
It blocks:
- Illegal transitions (e.g. invoicing unconfirmed orders).
- Missing mandatory data (e.g. Auftrag without Zahlungsziel where required).
- Violations of inventory rules (e.g. booking stock out of nowhere, using blocked lots).

### Error messages
When a validation fails, the user sees a clear, specific message:
- What is wrong.
- Why it is wrong.
- How to fix it.

**No generic "Error" toasts; messages match the rule that was violated.**

---

## Calculations and formulas

Every calculation that affects money, quantities, or stock is:
- Centralized where possible (calculation helpers), not duplicated wildly.
- Documented with short code comments explaining the formula.

### Unit conversions
- Correct and explicit: g ↔ kg, ml ↔ L, Stk ↔ carton, etc.

### Price calculations
- Line prices update as quantities or unit prices change.
- Document totals recalculate when relevant fields change (with debounce for typing).
- Rounding rules are consistent and documented, especially for VAT and totals.

Any rounding differences that matter to finance or tax are surfaced (e.g. "Rundungsdifferenz"), not hidden.

---

## Navigation and workflow

Every screen and module fits into a clear workflow:
- After create / edit / confirm / delete, the user sees a clear next step.
- There is always a way back (back button, breadcrumb, obvious navigation).

### Modals
- You can always cancel or close without breaking the application.
- Dangerous actions inside modals are clearly marked.

### Deep links
- Deep links to important screens are stable and work reliably, so documentation and emails can link to "this exact Auftrag" or "this Bericht with specific filters".

### Business processes
The overall path reflects the business process:
- For documents: header → positions → totals → attachments → finalization.
- For orders: Anfrage → Auftrag → Lieferschein → Rechnung.
- For production: Planung → Produktion → LOT-Zuweisung → Lagerzugang.

---

## Internationalization and localization

All user-facing text is routed through the translation layer:
- Labels, headings, tooltips, menu items, error messages, status texts – everything.

No hardcoded strings in components except where technically unavoidable, and then they are minimized.

### Formatting
- Dates in German format (e.g. DD.MM.YYYY) where appropriate.
- Decimal separators, thousand separators, and currency formats match the expected local conventions.

Printed/PDF documents also follow these conventions. **Missing translations are treated as bugs and not acceptable in GA.**

---

## Security basics and XSS safety

- Inputs from users, URLs, and external sources are treated as untrusted.
- Rendering escapes data correctly; dangerous HTML injection points are isolated and carefully controlled.
- There are no UI elements that render raw user input as HTML or script without sanitization.
- The default stance is: escape everything, only allow rich formatting where needed, with strong control.

---

## Legal, accounting, tax, and compliance

MicroOps must be safe in a real Austrian SME accounting and regulatory context.

### VAT / USt handling
- Correct VAT rates (0 %, 10 %, 13 %, 20 %) are supported and correctly applied.
- Reverse charge logic is handled explicitly.
- UID (VAT ID) can be validated where practical.
- Intra-community deliveries are handled as per rules (VAT treatment, wording).

### Invoice immutability
- After posting, invoice core data cannot be edited.
- Invoice numbers are strictly ascending and without gaps for each series, in line with Austrian tax expectations.
- Corrections happen via credit notes / Stornorechnungen and clearly documented, not by rewriting original invoices.

### Mandatory invoice contents
- Firm name, address, UID.
- Customer name, and UID where required.
- Zahlungsziel.
- Reference to Lieferschein or Auftrag where applicable.
- Line details: quantity, unit price, net, VAT, gross.
- Continuous invoice number.
- Leistungsdatum / delivery date.

### GoBD/GDPdU readiness and document retention
- Documents and data required for tax and audit are retained for at least the legally required period (e.g. 7 years in Austria).
- They are stored in a stable electronic format (PDF/A or equivalent) suitable for audit and long-term storage.

**If a change or feature would violate these legal constraints, it cannot be considered GA.**

---

## Offline-first and local-only operation

MicroOps assumes:
- Local network or standalone machine.
- Possible connectivity hiccups.
- No mandatory dependency on internet cloud services for core flows.

### System behavior
- Works without any external API calls unless explicitly configured and documented (e.g. optional UID check).
- Caches key data locally: Kunden, Artikel, Preislisten, LOTs, Lagerorte, basic Stammdaten.

### Offline handling
When the server or storage is temporarily unavailable:
- Operations are queued locally where feasible.
- Retries are handled once the backend is reachable again.
- Users see clear status indicators for pending vs. committed operations.

If multiple users work offline on the same data, the system defines how conflicts are resolved: last-write-wins with notifications, or interactive merge dialogs for important records.

---

## Performance and scalability

Even as a local SME system, MicroOps must feel snappy.

### Key expectations
- Typical screens load within about a second on the target hardware.
- Large tables (Lagerbewegungen, long Berichte) use pagination or virtualization once they go beyond a few hundred rows.
- No synchronous, long-running work on the main thread that blocks the entire UI.

### Data access optimization
- Customers, articles, and other core master data can be preloaded or cached.
- Indices or equivalent structures are used for heavy queries: LOT lookups, article search, customer search, reporting filters.

### Scale expectations
The system should remain usable and responsive when:
- Lagerbewegungen reach tens of thousands of rows.
- Customers and articles reach the low thousands.
- Reports are generated for large time ranges.

---

## Printing, PDF, and A4 layout

Documents generated by MicroOps (invoices, Lieferscheine, order confirmations, etc.) must look professional and consistent.

### Layout basics
- A4-compliant document templates.
- Margins aligned with DIN 5008 or a documented house standard.
- Clear typographic hierarchy: firm data, customer address, subject, positions, conditions, footer with UID/bank details.

### Behavior
- No weird shifting between browsers; print results from Chrome, Edge, and Firefox are effectively identical for the same document.
- Print CSS removes application chrome (menus, buttons) and focuses solely on the document content.
- Page breaks are controlled: long tables break cleanly with repeated headers where needed.

### Support for
- Letterhead mode (e.g., blank top margin if preprinted paper used).
- Double-sided printing without destroying layout (front/back alignment is coherent).

PDF generation is stable and deterministic: the same data produces the same PDF structure each time.

---

## Security beyond XSS

Beyond XSS, MicroOps also addresses common local web threats and bad patterns:
- Protection against CSRF where cross-origin issues can arise.
- Protection against clickjacking (no blind embedding in hostile iframes).
- Secure session handling, even in local deployments: proper expiration, logout, and token usage.
- Strong authentication rules: PIN or password login is rate-limited and locked appropriately on repeated failures.

### Data at rest
- Backup archives and database files are protected with integrity checks (checksums, signatures).
- Paths and file operations are safe against directory traversal or injection of unexpected file names.

### Attachments and imports
- PDFs, CSVs, and JSON seeds are validated or sandboxed where appropriate.
- Malformed or unexpectedly manipulated files cannot easily crash or compromise the system.

---

## Error recovery and fail-safe design

The system avoids catastrophic failure modes:
- No "white screens of death".
- Fatal errors at least produce recoverable error screens with options to return safely to a known state.

### User work protection
- Drafts and auto-save are used where users enter larger forms or critical data.
- Temporary network issues or backend hiccups do not automatically result in data loss; operations can be retried.

### Graceful fallbacks
- Missing dependencies (printer, translation key, image) trigger graceful fallbacks and clear messages instead of crashes.
- Retry strategies exist per action: how many times to retry, what to tell the user, when to give up.

---

## Local observability and telemetry

Even offline, the ERP is introspectable.

### Local logging
The system logs locally:
- CRUD operations on important entities.
- Validation failures and business rule violations.
- Permission violations.
- Stock changes and important workflow transitions.

### Status/health view
A status/health view (e.g., in Einstellungen) shows:
- Whether storage is OK.
- Whether the local server/database is reachable.
- Whether queued operations are syncing correctly.

There is a debug mode for development or support that can add extra logging and diagnostics, but it is not meant for normal day-to-day production use.

---

## Backup and restore

Survivability is built in.

### Support
The ERP supports:
- Manual backup/export of all critical data.
- Scheduled automatic backups.

### Backup quality
Backups:
- Are verifiable via checksums (SHA or similar) to detect corruption.
- Can be restored into a compatible version of the system.
- Are kept in line with a documented retention strategy (how many, how often, how long).

### Version upgrades
On version upgrades:
- Schema migrations know how to handle data coming from older backups.
- Backward compatibility is checked; mismatched client/server versions are detected and handled gracefully.

---

## Extensibility and modularity

The system is built not only for today but for future features.

### Design principles
- Plugin-friendly architecture where new modules or integrations can hook into well-defined places.
- Loose coupling between modules; no module should know everything about others' internals.
- Overridable templates for documents and UI pieces where customization is needed.
- Support for adding custom fields or attributes for customers, articles, and documents without breaking core logic.

Branding and theming can be adjusted without rewriting business logic.

---

## Document and line integrity

All business documents (Aufträge, Lieferscheine, Rechnungen, Bestellungen, etc.) are internally consistent.

### Expectations
- The sum of line items matches document totals exactly (with visible rounding differences if needed).
- Line numbers remain stable and meaningful, even when items are added or removed in the middle.
- Review and preview modes show line number, description, quantity, unit, discount, VAT, line total exactly as they will appear in the final PDF.

No "magic" line items appear or disappear behind the scenes.

---

## Multi-user concurrency

Even on a local server, multiple users can touch the same data.

### System behavior
- Provides record locking or soft locking where appropriate.
- Warns when a user opens something currently being edited by another.
- Prevents critical collisions in sensitive areas (e.g., double-booking the same stock in Lagerbewegungen).

### Conflict handling
In case of conflicting changes:
- The system surfaces that fact (e.g., "This record was changed by another user") and offers a resolution path instead of blindly overwriting.

Simultaneous edits and conflicts are logged for later analysis.

---

## Production and supply chain safety

Production, LOTs, and supply chain flows are built to protect patient safety, product quality, and legal traceability.

### Requirements
- Mandatory LOT assignment for finished goods and critical intermediates.
- Blocked (gesperrt) or expired LOTs cannot be used in production or shipping flows.
- Production orders cannot be closed until required parameters (e.g., process data, QA checks) are filled in and validated.
- BOM explosions are validated against real inventory and units; production over-consumption is recorded separately as scrap or loss.

The data model and UI support recall scenarios: starting from an input LOT or supplier, you can find all impacted production batches, finished goods, and customers.

---

## Reporting accuracy and financial consistency

Reports are audit-grade, not "nice charts".

### Requirements
- Match raw data 1:1 – every figure can be traced back to movements, documents, or master data.
- Have all filters and scopes clearly visible: date ranges, customers, article groups, statuses, warehouses.

### No silent filtering
- No hidden exclusions like "only active customers" or "ignore zero rows" unless clearly shown and configurable.

### Reconciliation
- Reports' totals match the totals in the relevant operational modules (e.g. invoicing, orders) according to clear rules.

### Time handling
- Reports declare whether they use booking date, performance date, or another dimension.
- Timezone handling is stable and does not shift dates under DST or similar.

Exports (CSV, Excel, PDF) produce the same dataset as on screen; column order and formats are stable and documented.

---

## UX safety nets for non-technical users

Real users are production workers, warehouse staff, and office clerks.

### Protection
The system protects them by:
- Requiring explicit confirmation for destructive actions (delete, post, close, cancel), clearly naming the object affected.
- Preventing accidental double posting via debounced buttons and idempotent backend logic.
- Providing undo or correction paths where legally possible (e.g., reversals, correction bookings) instead of silent overwrites.

### Error messages
Error messages are:
- Written in clear, simple German.
- Free of developer jargon.
- Focused on what the user can do next to resolve the situation.

### Input safety
- Input fields auto-format dates, prices, and quantities so that minor mistakes do not turn into invalid or dangerous values.
- Click targets are large enough to be used comfortably on real hardware.

---

## Visual consistency and design tokens

MicroOps has a consistent visual language driven by design tokens.

### Tokens cover
- Colors, font families and sizes.
- Spacing, border radii, shadows.

### Components
- Components (buttons, tables, modals, cards) use these tokens instead of hardcoded inline styles.
- Icons come from one standardized library and visually align.

### Stylesheets
- Are organized by module or component, not arbitrary random files.
- Avoid inline styles except in exceptional cases where strongly justified.

The result: every module looks and feels like part of the same system, including optional dark mode or high-contrast themes in the future.

---

## Data migration, versioning, and schema evolution

Data and schema are versioned.

### Database/storage
- Contains version stamps that indicate the schema version.
- Allows the application to check compatibility at startup.

### Migrations
- Are written and tracked whenever the schema changes.
- Are idempotent or safe to rerun.
- Include, as much as possible, a rollback plan via backups.

### Initial data migration
- Offers import paths for customers, articles, current stock, and open balances.
- Validates input and records rejected entries with reasons.

Backwards compatibility is a design goal: new versions can read old data, and new fields behave sensibly when absent.

---

## Environmental stability

MicroOps behaves predictably on the target environment:
- Windows 10 and Windows 11 workstations.
- Modern browsers (Chrome, Edge, Firefox).
- Additionally as a packaged .exe using an embedded browser/container.

Rendering and printing do not drastically change between these environments. The system does not rely on fonts or OS features that are missing on typical SME machines; any special resources are bundled or configured.

---

## User training and in-app guidance

Complex flows are self-documenting.

### In-app help
Screens include:
- Short inline hints near critical areas.
- Visual step indicators: e.g. "1. Kopf → 2. Positionen → 3. Totals → 4. Dokumente".

Key modules link to sections in microops_full.md or other help files, so users can get deeper explanations when needed.

A new employee should be able to learn the core flows through the combination of intuitive UI and in-app hints, with written docs as backup.

---

## End-to-end data integrity and traceability

The data model enforces referential integrity. There are no orphan records for critical entities:
- Movements always belong to an article and a warehouse.
- Documents always belong to a customer and, where relevant, to an order or production batch.
- LOTs link to their origins (production or purchase).

### Navigation
You can navigate:
- From invoice → to order → to Lieferschein → to production → to LOT → to supplier and raw material.
- From a problematic LOT → to all production orders, finished goods, and customers affected.

This is not merely a theoretical capability; it works in the real UI.

---

## System-level consistency checks

The system supports periodic integrity checks:
- Stock totals vs. sum of movements.
- Orders without customers.
- LOTs without production or purchase.
- Documents with missing or inconsistent totals.

These checks yield actionable lists that an admin can work through, correcting or investigating anomalies.

---

## Stress testing and scale simulation

Before you call MicroOps GA, it is exercised under realistic load:
- Tens of thousands of stock movements.
- Thousands of customers and articles.
- Heavy printing of long documents.
- Heavy usage of CSV/PDF exports.

Bottlenecks discovered here are addressed so that real-world operation over years does not bring the system to its knees.

---

## Cryptographic integrity and tamper detection

For high-assurance environments, critical records can carry:
- Hashes.
- Signatures.
- Checksums or fingerprints.

When records change in allowed ways, updated hashes are computed and chained from previous values, making unauthorized tampering detectable.

This gives:
- Proof that invoices and orders have not been silently altered.
- Proof that stock movements and LOT histories are intact.

This aligns with GMP Annex 11, FDA 21 CFR Part 11, and ISO 13485 principles for data integrity.

---

## Formal workflow enforcement

Core workflows (order → delivery → invoice; purchase → goods receipt; production → lot → stock) are defined as state machines with:
- Explicit states.
- Explicit allowed transitions.

### At runtime
The system:
- Validates each transition.
- Blocks illegal transitions.
- Logs transitions with timestamps, user, and reason where applicable.

### Examples
- No invoice for an unconfirmed order.
- No closing production without booked components.
- No booking a movement involving an expired LOT.

---

## Predictive diagnostics and self-health monitoring

The system continuously observes its own health and usage patterns:
- Disk space, DB/storage integrity, index validity, memory usage.
- Local server and file system accessibility.
- Printer availability.

### Pattern detection
It also spots patterns:
- Inconsistent stocks.
- LOTs nearing expiry.
- Invoices stuck in draft too long.
- Backup size exploding unusually fast.

These warnings appear early so that issues can be solved before they cause downtime or audit trouble.

---

## Auto-repair and fallback

When something goes wrong, MicroOps tries to:
- Detect the condition automatically.
- Attempt a safe repair.
- Fall back to a safer mode.

### Examples
- Corrupted local DB cache → restore from last known good snapshot or rebuild from master.
- Missing translation → fall back to default language.
- Failed PDF → retry with alternative renderer.
- Network down → queue operations for later sync.

The goal: no workflow interruption, even under stress, and no silent data corruption.

---

## Governance, risk, compliance (GRC)

Each module is viewed through a risk lens:
- Financial risk.
- Regulatory and quality risk.
- Operational risk.

### Controls
Controls map to those risks:
- Who can approve which actions.
- Which checks are required in high-risk flows.
- What must be logged to satisfy QMS, audit, and compliance.

### Segregation of duties
Segregation of duties is supported:
- Normally, one person should not create, confirm, invoice, and book payment for the same transaction chain unless they have a deliberately special role.

This reduces fraud risk and supports both internal and external audits.

---

## Long-term maintainability

MicroOps is designed to be alive for 10–30 years without rotting.

### This implies
- Clear modularization and boundaries.
- Proper documentation of modules, data flows, and business rules.
- Replacement of parts (libraries, modules) without rewriting the whole system.

### Upgrade path includes
- Schema and data migrations.
- Feature toggles and gradual rollouts.
- A deprecation strategy for old components.

Dependencies are chosen with longevity in mind; you avoid basing critical pieces on libraries that are already dying or unmaintained.

---

## Extreme edge-case handling and operator error modeling

MicroOps explicitly handles odd but real scenarios:
- Zero or negative quantities (returns, corrections).
- Zero price items and 100 % discounts.
- Mixed VAT rates on the same document.
- Partial shipments and partial invoices.
- Cancelled invoices and credit notes.
- LOTs without expiry (where accepted) and with odd expiry dates.
- Production with scrap or rework.
- Month-end and year-end closings, DST jumps, leap day (29 February).
- Unicode and Umlaut issues in article codes, filenames, customer names.
- Very large quantities and long strings.

### Operator behavior modeling
Real operator behavior is modeled:
- Misclicks.
- Double-clicks.
- Wrong scans.
- Closing the laptop mid-operation.

The app is debounced, robust, and protective, with undo paths and clear confirmations.

---

## Poka-yoke and human-centered error prevention

The UI is designed to prevent mistakes before they happen:
- Dropdowns and structured inputs instead of free-text where possible.
- Pre-filled sensible defaults for common values.
- Auto-correct and auto-format for dates, numbers, codes.

### Prevention over rejection
- Invalid actions are disabled rather than allowed and then rejected.
- Missing mandatory steps are highlighted.
- Errors are brought into view (auto-scroll to error), with immediate visual feedback (checkmarks, warnings).

Saving bad records is made genuinely hard; the system nudges users into doing the right thing.

---

## End-to-end traceability graph

From any point, you can see the full "where from / where to" chain:
- From invoice back to Auftrag, back to Produktion, back to LOT, back to raw materials and Lieferanten.
- From a LOT forward to all production batches and customers who received it.

This traceability is essential for medical and food-related sectors and must be available under time pressure in real incidents.

---

## User behavior logging and responsibility

MicroOps records:
- Who changed what.
- When.
- From which machine or user context.
- Old value and new value.
- Reason, if required by process.
- Result (success, failure, partial).

These logs form a forensic trail for internal QA, audits, and incident analysis and must not be casually editable.

---

## Continuous self-verification

MicroOps regularly checks itself:
- GA rules are still satisfied after changes.
- Core workflows still pass end-to-end tests.
- Data integrity checks still succeed.
- Mandatory fields are still enforced.
- Key pages still load within performance expectations.
- Permissions and roles still map correctly to documented responsibilities.
- Tooltips, translations, validations, and PDF templates are present and load correctly.

This is a built-in self-test mindset: the system does not assume that once GA, always GA; it verifies on an ongoing basis.

---

## Summary Checklist for GA Sign-off

Before declaring any module GA, verify:

- [ ] No crash paths or white screens
- [ ] All user-facing text is translated (DE/EN/RO)
- [ ] XSS protection via escapeHtml on all user input
- [ ] All domain constraints enforced (mandatory fields, valid states)
- [ ] Business logic validations with clear error messages
- [ ] Print/PDF output is professional and A4-compliant
- [ ] Calculations are correct and documented
- [ ] Navigation flows are clear with undo/back options
- [ ] Performance acceptable (<1s load times)
- [ ] Offline resilience (queuing, retry, graceful fallback)
- [ ] Audit logging for critical operations
- [ ] Documentation updated (CHANGELOG, SPEC, BLUEPRINT)
- [ ] Austrian tax/legal compliance (VAT, invoice numbers)
- [ ] Accessibility basics (aria-labels, for attributes)
- [ ] CSS variables for theming consistency
