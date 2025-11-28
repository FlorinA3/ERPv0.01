# Phase 2.6 Domain Scenarios (Mandatory Regression Flows)

These scenarios mirror Phase 2.6 goals and must be executed (manually or automated) before moving to Phase 3.

## A) Standard order → ship → invoice → payment
- **Steps**
  1. Create Customer (UI or POST `/api/customers`).
  2. Create Product(s) with VAT and stock.
  3. Create Order with 1–2 line items (UI or `/api/orders`).
  4. Transition order statuses: `draft` → `confirmed` → `ready_to_ship`.
  5. Ship items via `/api/inventory/shipments` (document_id from a delivery note) or UI shipment flow.
  6. Create & post invoice: create draft document (`type=invoice`, lines), then `POST /api/documents/:id/post`.
  7. Mark invoice paid: `POST /api/documents/:id/pay`.
- **Expected checks**
  - Order statuses progress legally; illegal transitions are blocked.
  - Shipment inserts `inventory_movements` with direction `out`; stock decreases, no negatives.
  - Invoice doc_number allocated from `invoice` sequence on posting; totals/VAT match shipped lines.
  - Payment sets status `paid`; posted documents remain immutable.
  - Audit/log fields updated (printed_count untouched until reprint).

## B) Return / credit note flow
- **Steps**
  1. Start from a **posted & paid** invoice.
  2. Create a credit note document referencing the invoice (related_document_id).
  3. Post the credit note: `POST /api/documents/:id/post` (sequence = `credit_note`).
  4. (If modeled) receive returned items via inventory movement (direction `in`).
- **Expected checks**
  - Credit note has its own sequence number, linked to original invoice.
  - Posted invoice remains immutable; corrections happen via credit note.
  - Inventory increases if return flow records stock back in.
  - VAT/totals on credit note are correct per line VAT rates.

## C) Partial shipment and final invoice
- **Steps**
  1. Create order with multiple lines/quantities.
  2. Ship part of quantities via `/api/inventory/shipments` (first shipment doc).
  3. Create invoice for shipped quantities and post it.
  4. Ship remaining quantities (second shipment).
  5. Create final invoice for remaining items and post it.
- **Expected checks**
  - Inventory never goes negative; each shipment deducts only shipped qty.
  - Order statuses move: `confirmed` → `ready_to_ship` → `shipped` (after final ship) → `invoiced/closed`.
  - Each invoice total matches the shipped quantities covered by that invoice.
  - No duplication or missing invoicing of shipped quantities; sequences unique per invoice.

---
These scenarios belong to **Phase 2.6** and are mandatory regression flows prior to Phase 3. They should be automated (Playwright/API) later, but can be executed manually using the steps above.
