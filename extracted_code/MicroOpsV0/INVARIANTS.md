# MicroOps ERP – Core Business Invariants (Phase 3.1)

This file is the single source of truth for the non-negotiable business invariants that protect financial correctness, inventory integrity, and auditability. Each invariant lists its business meaning, what is enforced in code today, and where we plan to harden it next.

## INV-01 – No Negative Stock from Normal Operations
**Business:** Normal workflows (shipments, production consumption, issues) must never drive physical stock below zero. This protects regulatory products and prevents silent shrinkage.

**Technical enforcement today**
- `server/services/inventoryService.postShipment` wraps each shipment in a DB transaction, locks the related document/order, and locks the product row (`SELECT ... FOR UPDATE`) before checking available stock.
- `inventoryRepository.getCurrentStockByProduct(product_id, client)` aggregates `inventory_movements` to calculate availability inside the same transaction and rejects with `NEGATIVE_STOCK` if quantity would go below zero.
- Manual adjustments/migrations are possible but must be controlled and logged; they are outside normal shipment flows.

**Future improvements**
- Phase 3.2 will add stricter concurrent shipment serialization and clearer audit events for rejected movements.
- Phase 3.3/3.4 will add offline-safe queues with server-side validation before committing movements.

## INV-02 – One Legal Document Number -> One Persisted Document
**Business:** Legal document numbers (invoices, credit notes, delivery notes) are globally unique and never reused, satisfying Austrian tax/GoBD requirements and preventing hidden deletion.

**Technical enforcement today**
- `server/services/sequenceService.reserveNextNumber()` uses `SELECT ... FOR UPDATE` on `number_sequences` to reserve numbers atomically.
- Database constraints: the `documents.doc_number` column is unique, and migration `004_document_number_unique.sql` adds a partial unique index on `(type, doc_number)` where `doc_number IS NOT NULL` so drafts can remain unnumbered.
- Legal numbers are stored in `documents.doc_number`; they are allocated only when posting (`postDocument`).

**Future improvements**
- Strengthen idempotency around posting endpoints and add sequence health checks in migrations/monitoring.
- Add automated alerts if gaps are detected due to failed/rolled-back postings.

## INV-03 – Posted/Paid Invoices & Credit Notes Are Immutable
**Business:** Once an invoice or credit note is posted (and especially when paid), its economic contents (lines, totals, VAT, currency, customer) cannot change. Corrections happen via credit notes referencing the original.

**Technical enforcement today**
- `documentService.updateDraftDocument()` rejects any update when status is not `draft` (route returns 409).
- `documentService.postDocument()` recomputes totals from `document_items`, assigns the next legal number via `sequenceService`, and transitions status to `posted`.
- `markDocumentPaid()` and `cancelDocument()` enforce allowed transitions through `assertDocumentTransition`.
- `registerReprint()` only touches reprint metadata (`printed_count`, `last_printed_at/by`, `legal_template_version`) for posted/paid documents; financial fields remain untouched.

**Future improvements**
- Add row-version/concurrency tokens to detect conflicting edits (Phase 3.2).
- Introduce explicit correction flows (credit notes) surfaced in the UI with links back to the original documents.

## INV-04 – Inventory Truth = Inventory Movements Aggregation
**Business:** The authoritative stock level is derived from aggregating `inventory_movements`, not from ad-hoc `current_stock` counters.

**Technical enforcement today**
- `inventoryRepository.getCurrentStockByProduct()` sums `inventory_movements` (in vs out) to derive stock; `inventoryService.getStockSnapshot()` exposes the same view.
- Normal operations (shipments) only insert movements; they do not mutate product rows.
- Any legacy `current_stock` fields (e.g., in older migration utilities) are transitional/unused in the core runtime and must not be written by normal workflows.

**Future improvements**
- Add periodic reconciliation jobs comparing cached/materialized views to the movements ledger.
- Remove or clearly scope any remaining legacy stock columns once reporting/materialization is in place.

## INV-05 - Offline Clients Cannot Fake Stock Movements or Financial Posting
**Business:** Offline users may view cached data and prepare drafts, but they cannot finalize financial or stock movements without the server to keep auditability intact.

**Technical enforcement today**
- Posting shipments uses `inventoryService.postShipment()` on the backend; posting invoices/credit notes and marking paid go through `documentService` via `/api/documents` routes.
- Frontend offline guards:
  - Shared API helpers short-circuit mutating calls when offline and map network errors to clear toasts.
  - A global offline indicator/banner makes “read + draft only” mode explicit.
  - Posting/mark-paid/document generation buttons are disabled offline and blocked at runtime; legacy local-only flows stay behind `App.Config.localOnlyDemoMode` (default false) so GA deployments cannot mutate stock/financials locally.
  - Inventory receive/adjust UI is demo-only; GA mode blocks it and requires backend-backed operations.

**Future improvements**
- A later phase (post-GA) may add a controlled offline write queue with reconciliation against the backend and conflict handling.
- Broader telemetry around blocked offline attempts and sequence health checks for reconciliation windows.

---

Keep this file aligned with code. Any change to invariants or their enforcement must update this document and the relevant services/migrations.
Note: Master data (customers/products) now use `row_version` optimistic concurrency tokens; conflicting updates return HTTP 409 to avoid silent overwrites.
