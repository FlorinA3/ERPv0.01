# MicroOps ERP – Final Coverage & Completion Audit

## 1. Map & Gap Analysis

Existing parts already cover (at depth): Auth & RBAC basics; JWT/session handling; Invoice math & VAT rounding; Document numbering & legal text; Inventory movements, BOM links, production flows; Workflow/state machines and edge cases; UX/print polish basics; Test ideas for CRUD, pricing, fulfillment; Data integrity & referential checks; Offline App.Data vs backend reconciliation basics; Security posture high-level; API surface overview.

### Gap Table
| Domain | Covered by existing Parts? | What is still missing or unclear? |
| --- | --- | --- |
| Deployment & Packaging (Windows/on-prem) | Partial | No end-to-end packaging, installer/updater, environment separation, rollback/DB migration choreography, Windows share permissions/AV interaction. |
| Monitoring, Logging & Observability | Partial | No structured logging spec, correlation IDs, health/status endpoints, retention/rotation, minimal metrics set, browser crash capture. |
| Backup, Restore & Disaster Recovery (operational runbook) | Partial | Operator-facing runbook, roles/responsibilities, retention targets, restore drills, ransomware/file-share loss scenarios. |
| Data Migration & Import/Export | No | Templates, validation, duplicate/VAT mismatch handling, audit of migration tools, exit/export paths. |
| Multi-User Concurrency & Offline Behaviour | Partial | Conflict policies, locking strategy, race prevention on inventory/production, offline reconciliation rules and invariants. |
| Documentation, Training & Support Processes | No | GA docs set, admin handbook, troubleshooting scripts, onboarding materials. |
| Legal, Compliance, GDPR & Privacy | Partial | GDPR hygiene (access, retention, right to export/delete), audit trail sufficiency for master data, sensitive data access per role. |
| Integrations & Extensibility | Partial | Versioning policy, schema-compat risks, outbound email/PDF pipelines, accounting export guarantees, extension safety. |
| Printing, Layouts & Physical Outputs | Partial | A4 layout consistency, multipage behaviour, legal text versioning, margin/fonts QA, production/QS print usability. |

## 2. New Audit Dimensions

### 2.1 Deployment, Packaging & Environments

Checklist (actionable, Windows/on-prem specific):
- [ ] Build artifacts are reproducible (hashable) for dev/test/prod; includes SPA bundle + Node backend + DB migration scripts to prevent drift (risk: hidden code variations causing mismatched behaviour).
- [ ] Packaging produces a single installer/updater (e.g., MSI/ZIP with signed binaries) verified on clean Windows Server with default Defender/AV policies (risk: blocked executables leading to failed deploy).
- [ ] Config is externalized (env files or JSON) with no secrets in repo; clear precedence rules (risk: leaking DB credentials, wrong endpoints).
- [ ] Separate dev/test/prod configuration files stored per environment with explicit DB names/hosts and JWT secrets unique per environment (risk: cross-environment contamination).
- [ ] Deployment to shared network drive documents required NTFS permissions (read/execute for users, write for admins) and locks to prevent partial updates while users run the app (risk: race causing broken app load).
- [ ] Frontend served either from backend static host or from share with cache-busting filenames; confirm no stale JS after update (risk: mismatched API/JS versions).
- [ ] Backend service runs as Windows service with restart policy; service account has least-privileged DB and filesystem rights (risk: privilege escalation).
- [ ] Database migrations are versioned, ordered, idempotent; pre-deploy backup step is mandatory and scripted (risk: unrecoverable schema drift).
- [ ] Rollback plan exists: prior bundle + DB snapshot kept; rollback steps tested on staging (risk: long outage on failed release).
- [ ] Update path handles online users: maintenance banner in SPA, drain connections, then deploy; documented (risk: user writes during migration causing data loss).
- [ ] Path length and whitespace in install directories tested (Windows quirks) (risk: failing scripts).
- [ ] Antivirus/Defender exclusion list defined for data/log directories but not for entire share (risk: performance hit vs security exposure).
- [ ] Time sync (NTP) verified on server for JWT expiry/audit timestamps (risk: auth failures, incorrect audit sequence).
- [ ] Install script verifies Node version, Postgres version, and required OS components (VC++ runtimes) (risk: runtime crash).
- [ ] SPA cache clear guidance for clients (Ctrl+F5 or versioned URLs) included in runbook (risk: users stuck on old JS).
- [ ] Storage paths (logs, temp exports, PDF renders) are configurable and writable; disk space thresholds monitored (risk: crashes when disk full).
- [ ] Print drivers and PDF generation dependencies pre-installed and documented (risk: failed invoice/LS printing).
- [ ] Backup agent compatibility with file locks validated (risk: incomplete backups).
- [ ] Release artifacts are signed or checksum-verified before install (risk: tampering).

### 2.2 Monitoring, Logging & Observability

Checklist:
- [ ] Backend logs are structured (JSON) with level, timestamp (UTC), request ID, user/tenant, entity type/id, and error codes (risk: cannot trace incidents).
- [ ] Frontend logs capture UI errors, network failures, and IndexedDB/localStorage errors; persisted to backend on next online event (risk: silent client errors).
- [ ] Correlation IDs propagated UI → API → DB statements; ID visible in UI dev console for support (risk: cannot reconstruct flows).
- [ ] Health endpoint (e.g., `/healthz`) checks DB connectivity, disk space threshold, config sanity; returns machine-readable JSON (risk: blind outages).
- [ ] Readiness/liveness split for service managers to avoid restart loops (risk: repeated restarts hide DB issues).
- [ ] Log rotation configured with size/time caps; retention aligned with GDPR and ops needs (risk: disk exhaustion or over-retention).
- [ ] Error classes defined (validation, auth, business rule, DB, network) with specific codes; UI shows human-readable guidance and code (risk: poor supportability).
- [ ] API timeouts and retries configured with backoff; failed retries logged with context (risk: hidden transient failures).
- [ ] Alerting minimal set: backup success/failure, DB connection failures, HTTP 5xx rate spike, disk <15%, service not running (risk: delayed incident response).
- [ ] Metrics (lightweight): request count/latency by endpoint, DB size, active sessions, failed logins, cache hit/miss for App.Data loads (risk: performance regressions unnoticed).
- [ ] Browser performance logging for key flows (load SPA, list search, save doc) with budget thresholds (risk: creeping slowness).
- [ ] Unhandled promise rejection handlers in frontend and backend that log and tag build version (risk: silent data loss).
- [ ] Audit log review routine defined (weekly) to spot anomalies (risk: unnoticed misuse).
- [ ] Printing pipeline logs template ID, version, and PDF generation outcome (risk: invalid legal printouts undetected).
- [ ] Log PII minimization rules documented; sensitive fields masked (risk: GDPR breach).
- [ ] Clock skew detection in logs; warning if delta > 2s between server and DB (risk: ordering issues in audits).
- [ ] Endpoint tracing allows following a business event by document number; documented query/grep recipes (risk: slow incident triage).
- [ ] Monitoring works offline-tolerant: queued client errors flushed on reconnect (risk: missing offline crash data).
- [ ] Security logging includes role changes, login failures, token refresh failures (risk: missed intrusion signals).

### 2.3 Backup, Restore & Disaster Recovery – Operational View

Checklist:
- [ ] Named owner for backups with rota; schedule (daily full, hourly WAL/pg_dump incremental or equivalent) is documented (risk: missed backups).
- [ ] Backup location: off-box, off-share, immutable or write-once where possible; retention policy (e.g., 35 days) documented (risk: ransomware wipes onsite copy).
- [ ] Restore drill performed quarterly to separate staging host; success criteria include app login, recent invoice visibility, print test, and inventory counts match (risk: untested restores).
- [ ] Backup verifies consistency (pg_dump exit code, WAL archive completeness) and logs to monitoring; alert on failure (risk: silent failures).
- [ ] Runbook for partial failure: backend down but share up; share down but backend up; DB up but app static files missing; includes steps and roles (risk: extended downtime).
- [ ] Ransomware scenario: instructions to take server offline, verify offline backup, rebuild from clean media, and communicate data-loss window (risk: compromised data).
- [ ] Disk failure scenario: documented RTO/RPO targets; spare hardware or VM template ready (risk: prolonged outage).
- [ ] Backup contains config/secrets? If yes, stored encrypted; if no, parallel secure store (risk: leaked secrets).
- [ ] Backup job tested against large DB (size growth) to ensure time window fits operations (risk: backups running into work hours).
- [ ] WAL/archive log pruning aligns with retention; no unbounded growth (risk: disk fill).
- [ ] Restore procedure includes DB migration alignment with app version (risk: schema mismatch).
- [ ] Checklist for operator: verify backup freshness before risky operations (migrations, updates) (risk: unrecoverable mistakes).
- [ ] Printer templates, legal text, and static assets included or separately versioned to avoid mismatch after restore (risk: inconsistent documents).
- [ ] Post-restore validation script compares key counts (customers, open invoices, stock per SKU) against expected snapshot (risk: silent data corruption).
- [ ] Access to backup storage restricted and audited; least privilege enforced (risk: data exfiltration).
- [ ] Documented communications plan for downtime (who informs users, customers) (risk: unmanaged expectations).
- [ ] UPS/power-loss handling: Postgres configured for crash safety; check fsync and journaling (risk: data corruption).
- [ ] Operator quick card stored offline (printed) for disaster steps (risk: inaccessible docs during outage).
- [ ] Backup/restore steps tested on Windows with service account permissions (risk: script failures under service context).

### 2.4 Data Migration & Import/Export

Checklist:
- [ ] Standard templates (CSV/Excel) for Kunden, Artikel, Preise, Lagerbestand, offene Aufträge, offene Posten defined with required/optional fields and examples (risk: malformed imports).
- [ ] Import tool validates duplicates (by name, VAT ID, SKU) and flags conflicts before commit (risk: duplicate master data leading to billing errors).
- [ ] VAT rate mapping table per date and per article/service; mismatches rejected or highlighted (risk: wrong tax in invoices).
- [ ] Bank data (IBAN/BIC) format validation with country rules; rejects bad entries (risk: payment failures).
- [ ] Unit of measure normalization with canonical list; unmapped UOMs blocked (risk: inventory miscounts).
- [ ] BOM import checks for cycles and missing components; refuses partial graphs (risk: incorrect production planning).
- [ ] Inventory opening balance import ensures total by location sums correctly; prevents negative stock unless explicitly allowed (risk: stock divergence).
- [ ] Open invoices/receivables import captures original invoice numbers/dates for audit; preserves payment status (risk: legal inconsistency).
- [ ] User/role import disallows default passwords; enforces password reset on first login (risk: compromised accounts).
- [ ] Dry-run mode for imports with diff report (rows inserted/updated/skipped) (risk: unseen bulk errors).
- [ ] Rollback/transaction per batch; partial failures do not commit (risk: inconsistent state).
- [ ] Export routines for Steuerberater (DATEV-like CSV) with column mapping documented; checksum and timestamp on exports (risk: incorrect accounting data sent).
- [ ] Full data export (customer requests or system exit) available in open formats; includes audit trail linkage (risk: vendor lock-in, GDPR non-compliance).
- [ ] Migration playbook: sequence (master data → stock → open docs) with verification after each stage (risk: interdependent failures).
- [ ] Encoding/locale handling (UTF-8, decimal separators) verified to avoid Austrian decimal comma issues (risk: numeric misinterpretation).
- [ ] Attachments/files migration plan (product images, PDFs) with path remap (risk: missing docs).
- [ ] Historical pricing validity periods preserved; current price per article validated after import (risk: wrong billing).
- [ ] Error report accessible to operator with actionable messages (row number, field, reason) (risk: slow remediation).
- [ ] Signed-off acceptance criteria for migrated dataset (counts, totals, sample audits) before go-live (risk: hidden corruption).
- [ ] Timezone normalization for imported timestamps; stored in UTC with local display (risk: misordered events).

### 2.5 Multi-User Concurrency & Offline Behaviour

Checklist:
- [ ] Define locking strategy per entity: optimistic versioning for master data, pessimistic/row lock for inventory-affecting docs (risk: double-shipments).
- [ ] Conflict resolution rules documented: on version mismatch, block save and show diff; no silent last-write-wins for financial docs (risk: data corruption).
- [ ] Inventory movements (issue/receipt/transfer) enforce atomic DB transactions and unique movement IDs; no movement without committed ledger line (risk: stock drift).
- [ ] Reservation vs actual deduction rules explicit; race-tested with two pickers on same SKU (risk: shipping shortage).
- [ ] Production completion and backflush protected by serializable or at least repeatable-read transactions; retries logged (risk: incorrect WIP).
- [ ] Concurrent invoice edits prevented once posted; allow controlled credit note path instead (risk: audit trail gaps).
- [ ] Offline mode rules: which actions allowed offline (drafts) vs blocked (stock changes); enforced in UI and API (risk: divergent stock).
- [ ] Sync engine detects conflicts on reconnect; user guided to resolve with comparison (risk: silent overwrites).
- [ ] SPA caches stamped with backend build version; offline cache invalidated on major version to avoid incompatible operations (risk: incompatible schema).
- [ ] JWT/session expiry handling during offline use; queued writes require re-auth before commit (risk: unauthorized writes).
- [ ] Background sync respects per-entity ordering (e.g., customer before invoice) (risk: failed foreign keys).
- [ ] Concurrent payment posting on same invoice blocked or serialized (risk: double-payment entry).
- [ ] Print actions tied to committed state; no printing from uncommitted offline drafts (risk: shipping wrong goods).
- [ ] UI indicators for stale data age; warn after threshold (risk: decisions on old data).
- [ ] IndexedDB schema versioning with migration and rollback on failure (risk: client DB corruption).
- [ ] Tests include multi-user scenarios on shared drive load of SPA to detect caching collisions (risk: mixed versions).
- [ ] Role changes propagate immediately; active sessions re-evaluate permissions on critical actions (risk: privilege misuse).
- [ ] Sequence generators (invoice numbers) server-side only; offline cannot allocate numbers (risk: duplicates).
- [ ] Audit trail records user/device for each conflicting attempt (risk: unverifiable disputes).
- [ ] Non-negotiable invariants: no negative stock unless explicitly allowed and logged; one posted invoice number per document; every stock movement balanced by ledger; offline writes blocked for stock/financial postings; conflicts never auto-resolve on financial docs; migrations cannot bypass version checks.

### 2.6 Documentation, Training & Support Processes

Checklist:
- [ ] Quickstart guide for end-users with screenshots of core flows: login, search, create order, post invoice, print LS/RE (risk: onboarding delays).
- [ ] Admin handbook covering company setup (VAT, numbering, bank accounts, roles, legal texts) with step-by-step instructions (risk: misconfiguration).
- [ ] Environment setup doc for admins: install, service creation, DB config, backup hooks, update steps (risk: failed installs).
- [ ] Troubleshooting playbook: common errors (printer offline, DB down, backup failed, login blocked) with resolution steps and log locations (risk: prolonged downtime).
- [ ] Release notes template with breaking changes, migration steps, rollback notes (risk: surprises on update).
- [ ] Support contact/escalation tree defined, even if internal (risk: stalled issues).
- [ ] Checklist for new site deployment including verification steps (print test, invoice number increments, VAT check) (risk: partial deployments).
- [ ] Data dictionary/glossary for fields and codes (risk: misinterpretation).
- [ ] Security/RBAC matrix documented for roles vs actions (risk: unauthorized access).
- [ ] Backup/restore operator manual with screenshots of commands and expected outputs (risk: incorrect restore).
- [ ] Offline use instructions: what is allowed, how to resync, how to detect staleness (risk: user-caused divergence).
- [ ] Incident template (what happened, when, who, data impact, actions) (risk: poor postmortems).
- [ ] Training plan: short sessions for sales/warehouse/production; cheat sheets per role (risk: misuse).
- [ ] Known limitations list to set expectations (e.g., no multi-currency) (risk: incorrect usage).
- [ ] Template for legal text updates and approval workflow (risk: unreviewed legal changes).
- [ ] Documentation stored in version control and exported to PDF for offline access (risk: unavailable docs during outage).
- [ ] Index of log locations and commands (tail, grep) for Windows (risk: slow triage).
- [ ] Accessibility/usability hints for small teams (keyboard shortcuts, barcode scanner usage) (risk: slow operations).
- [ ] QA checklist for each release tying features to tests (risk: untested ship).

### 2.7 Legal, Compliance, GDPR & Privacy

Checklist:
- [ ] Data classification performed (customer data, pricing, IBAN, medical-related notes) with access by role defined (risk: overexposure).
- [ ] Audit trail covers create/update/delete for master data, prices, documents, stock movements with user, timestamp, old/new values (risk: cannot prove history).
- [ ] Right to access/export: endpoint or tool to export all data for a customer on request, including documents (risk: GDPR non-compliance).
- [ ] Right to delete/erase: policy defined; where legal retention applies (invoices), implement block instead of delete with masking of personal contact fields (risk: illegal deletion or non-compliance).
- [ ] Log retention policy aligns with GDPR (e.g., purge auth logs after N days unless needed for audits) (risk: over-retention).
- [ ] PII in logs masked (IBAN, email) except last digits (risk: leakage).
- [ ] Role-based access ensures only finance/admin see banking and price overrides; warehouse cannot see purchase prices (risk: internal data leak).
- [ ] Consent/legitimate interest statement for stored personal data documented (risk: unclear legal basis).
- [ ] Data transfer: confirm no external telemetry; if any, documented and toggleable (risk: unintended data egress).
- [ ] Time-stamped, versioned legal texts (AGB, Widerruf) stored and linked to documents generated at that time (risk: legal disputes).
- [ ] Sequence integrity for invoices/credit notes enforced and immutable once posted (risk: tax audit failure).
- [ ] User provisioning/deprovisioning process ensures access removed promptly; audit log of role changes (risk: orphaned access).
- [ ] Workstation policies: screen lock, no shared accounts; documented (risk: unauthorized access).
- [ ] DPIA-lite: identify risks (data breach, incorrect invoices) and mitigations; kept on file (risk: unaddressed privacy risks).
- [ ] Data subject location (EU) handled with EU hosting on-prem; no cross-border transfers (risk: regulatory violation).
- [ ] Signed-off retention schedule for documents (invoices 7+ years Austria) enforced by archive job or policy (risk: illegal deletion).
- [ ] Printer outputs containing PII controlled; disposal/shredding policy for misprints (risk: physical data leak).
- [ ] Admin access to DB audited; direct writes discouraged; if executed, logged with ticket reference (risk: untraceable changes).
- [ ] Encryption at rest for backups and in transit (TLS to DB if supported) documented (risk: data theft).

### 2.8 Integrations & Extensibility

Checklist:
- [ ] Outbound email path supports authenticated SMTP with TLS; credentials stored securely; test sends with PDF attachments (risk: failed delivery of invoices/LS).
- [ ] Email templates versioned; legal footer correct per document type; per-language support if needed (risk: wrong or missing legal text).
- [ ] Accounting export format specified (DATEV-like CSV); round-trip test with Steuerberater sample tool (risk: unusable exports).
- [ ] API versioning policy defined (v1/v2); breaking changes gated behind new version (risk: client breakage).
- [ ] API contracts documented (OpenAPI) and checked in; includes auth, error codes, rate limits (risk: misuse).
- [ ] Avoid tight coupling to DB schema: no direct DB access for integrations; only through API or views designed for stability (risk: upgrades break integrators).
- [ ] Webhook/event mechanism or polling strategy documented for downstream systems; includes retry/backoff and signing (risk: lost events).
- [ ] Import/export throttling to avoid locking production DB during large transfers (risk: slowdown/outage).
- [ ] Extension points clear: allowed custom fields/templates vs forbidden core mutations; guarded by validation (risk: data integrity loss).
- [ ] PDF generator is deterministic and versioned; template IDs embedded in documents (risk: mismatched formats).
- [ ] File naming conventions for exports (company, date, type, hash) to avoid collisions (risk: overwrites).
- [ ] Integration secrets rotated and stored outside code; least privilege on SMTP/FTP accounts (risk: credential leak).
- [ ] Sandbox/staging endpoint documented for integrators with sample data (risk: testing on production).
- [ ] SLA for integration calls (timeouts, retries) and idempotency keys for POST operations (risk: duplicate postings).
- [ ] Attachment size limits enforced; graceful errors (risk: failed email with large PDFs).
- [ ] No auto-sending to customers without explicit toggle and log per send (risk: accidental dispatch).
- [ ] Version pinning of client bundles to backend release to prevent desync (risk: protocol mismatch).
- [ ] Scripts to regenerate exports on demand with integrity checks (risk: inconsistent reports).
- [ ] Clear change log for API consumers on release (risk: breaking clients).

### 2.9 Printing, Layouts & Physical Outputs

Checklist:
- [ ] A4 templates for Lieferscheine/Rechnungen tested on default printers; margins within printable area; no clipping at 100% scale (risk: unusable documents).
- [ ] Fonts embedded or available on server; fallbacks defined; ensure consistent metrics (risk: misaligned totals).
- [ ] Multi-page behaviour validated: repeating headers, page numbers, totals carry-over, signature blocks not split (risk: legal/operational confusion).
- [ ] Legal texts (AGB, Widerruf) versioned and linked to print date; change control documented (risk: dispute on terms).
- [ ] VAT breakdown clearly shown per rate; sums match digital data; rounding consistent (risk: tax audit issues).
- [ ] Units, batch/lot, expiry date visible where relevant (medical/production) (risk: traceability failure).
- [ ] Barcodes/QR (if used) tested for scanner readability in warehouse (risk: scanning failures).
- [ ] Color/BW legibility ensured; no reliance on color for meaning (risk: misread prints).
- [ ] Template selection logic deterministic (doc type, language, customer) and logged (risk: wrong template sent).
- [ ] PDF generator uses deterministic pagination; tested on Windows print spooler quirks (risk: page breaks differ).
- [ ] Printed totals and document IDs match persisted values; print from committed state only (risk: mismatched paperwork).
- [ ] Support for reprint with “Copy” marker and audit log entry (risk: uncontrolled duplicates).
- [ ] Signature/stamp areas sized for common pads; spacing checked (risk: unusable signature area).
- [ ] Packing slips vs invoices differentiated clearly (labels) (risk: wrong document shipped).
- [ ] Date/time format localized (DD.MM.YYYY) consistently (risk: misinterpretation).
- [ ] Fallback when printer unavailable: queued prints with status and retry; user guidance (risk: missed shipments).
- [ ] Template repository version-controlled; rollback possible (risk: broken layout rollout).
- [ ] QA checklist per release to print sample docs across templates (risk: undetected regressions).
- [ ] Page footer includes contact/imprint data as required (risk: legal non-compliance).
- [ ] Dynamic long descriptions wrap without overlapping totals (risk: unreadable lines).

## 3. Master GA Checklist (0–100 View)

Use this as a condensed, binary-verifiable list. Sources reference prior parts and new sections (N = new section).

### 1. Architecture & Data Authority
- [ ] Single source of truth is backend DB for posted docs/stock; offline limited to drafts; enforced in code (Source: Part 3 + N2.5).
- [ ] All stock movements and financial docs created via API with transactions; no direct DB writes (Source: Part 3 + N2.5).
- [ ] Versioned migrations applied sequentially with backups taken pre/post (Source: Part 3 + N2.1).
- [ ] App.Data/IndexedDB schema versioned and rejects incompatible cache on new release (Source: Part 5 + N2.5).
- [ ] Time sync enforced on server/clients for audit ordering (Source: N2.1).

### 2. Security & RBAC
- [ ] JWT/refresh handling validated; tokens signed with env-specific secrets (Source: Part 1 + N2.1).
- [ ] Role matrix implemented: warehouse lacks finance views; price override only for allowed roles (Source: Part 4 + N2.7).
- [ ] Admin actions (role changes, numbering changes) audited with user and timestamp (Source: Part 4 + N2.7).
- [ ] Password/credential storage and SMTP/DB secrets kept out of repo; rotated (Source: Part 1 + N2.1 + N2.8).
- [ ] Session invalidation on role change or disablement (Source: Part 4 + N2.5).

### 3. Legal Invoicing & Finance Logic
- [ ] Invoice/credit note numbering sequential, unique, immutable after post (Source: Part 2 + N2.7).
- [ ] VAT calculation matches Austrian rules with correct rounding per line and totals (Source: Part 2).
- [ ] Legal texts versioned and bound to document at generation time (Source: Part 6 + N2.9).
- [ ] Reprints marked as copy and logged (Source: N2.9).
- [ ] Financial edits after posting blocked; corrections via credit note or adjustment doc (Source: Part 5 + N2.5).

### 4. Inventory, Production & Traceability
- [ ] Stock cannot go negative unless explicitly configured and logged (Source: Part 3 + N2.5).
- [ ] Every stock move has movement ID, linked doc, user, timestamp; auditable (Source: Part 3 + N2.7).
- [ ] BOM completeness and cycle checks enforced; production completion balanced with consumption (Source: Part 3 + N2.4 + N2.5).
- [ ] Lot/batch/expiry recorded where applicable; printed on documents (Source: Part 3 + N2.9).
- [ ] Concurrent picks/shipments on same SKU serialized or rejected with conflict message (Source: N2.5).

### 5. Backup, Restore & Disaster Recovery
- [ ] Daily full + incremental/WAL backups stored off-box with retention; success monitored (Source: N2.3).
- [ ] Quarterly restore drill to staging with functional validation (Source: N2.3).
- [ ] Pre-deploy backup mandatory and documented (Source: N2.1 + N2.3).
- [ ] Config/secrets backup handled securely (encrypted or separate) (Source: N2.3).
- [ ] Documented runbook for ransomware/share loss with RPO/RTO targets (Source: N2.3).

### 6. Monitoring & Operations
- [ ] Structured logs with correlation IDs across UI/API/DB; log rotation configured (Source: N2.2).
- [ ] Health/readiness endpoints implemented and monitored (Source: N2.2).
- [ ] Minimal alerts in place: backup failures, DB down, 5xx spike, disk low, service stopped (Source: N2.2 + N2.3).
- [ ] Frontend error capture and offline queue to backend on reconnect (Source: N2.2 + N2.5).
- [ ] Metrics for request latency, DB size, error counts tracked (Source: N2.2).

### 7. Performance & UX
- [ ] SPA load and key flows meet defined budgets; regressions tracked (Source: Part 6 + N2.2).
- [ ] Cache-busting/versioning prevents stale JS after deploy (Source: N2.1).
- [ ] Offline indicators and stale-data warnings visible (Source: Part 5 + N2.5).
- [ ] Print preview/templates validated each release (Source: N2.9).
- [ ] Large lists use pagination/search without timeouts (Source: Part 6).

### 8. Testing & Automation
- [ ] Automated tests cover invoice math, numbering, stock moves, role permissions (Source: Parts 2–5).
- [ ] Concurrency tests simulate dual edits on stock/invoice (Source: N2.5).
- [ ] Migration/import dry-run tests with sample datasets (Source: N2.4).
- [ ] Backup/restore scripted test pipeline (Source: N2.3).
- [ ] Printing snapshot/regression tests for templates (Source: N2.9).

### 9. Deployment, Environments & Updates
- [ ] Reproducible builds with checksums and signed artifacts (Source: N2.1).
- [ ] Environment-separated configs and secrets per env (Source: N2.1).
- [ ] Deployment runbook includes maintenance mode, migration order, rollback (Source: N2.1).
- [ ] Windows service install/update tested under intended service account (Source: N2.1).
- [ ] SPA cache invalidation guidance provided to users (Source: N2.1).

### 10. Documentation, Training & Support
- [ ] User quickstart and role cheat sheets available (Source: N2.6).
- [ ] Admin handbook for VAT/numbering/roles/legal text setup (Source: N2.6).
- [ ] Troubleshooting and incident templates stored offline-accessible (Source: N2.6).
- [ ] Release notes with breaking changes and required steps (Source: N2.6).
- [ ] Support/escalation contacts defined (Source: N2.6).

### 11. Compliance, Privacy & Audit Trails
- [ ] Audit trail covers master data, documents, stock; immutable and exportable (Source: Part 3 + N2.7).
- [ ] GDPR requests supported: export customer data; delete/mask where legal (Source: N2.7).
- [ ] Log retention and PII masking rules enforced (Source: N2.7 + N2.2).
- [ ] Access to sensitive data restricted by role; tested (Source: N2.7).
- [ ] Legal text/version bound to documents and retained (Source: N2.9 + N2.7).

### 12. Integrations & Printing
- [ ] SMTP outbound with tested templates and attachment handling (Source: N2.8).
- [ ] Accounting export validated with sample Steuerberater import (Source: N2.8).
- [ ] API versioning and contract documentation published (Source: N2.8).
- [ ] Print templates pass A4, multipage, legal text, and barcode readability checks (Source: N2.9).
- [ ] Reprint handling with “Copy” marking and audit log (Source: N2.9).
