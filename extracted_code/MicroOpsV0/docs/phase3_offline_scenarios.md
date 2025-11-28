# Phase 3.4 – Offline / Flaky Network Scenarios (Regression Checklist)

## 1) Sales laptop without VPN (offline or blocked)
- Browse cached customers/orders/documents (should work from cache or show offline info).
- Create or edit a new order/document draft (form edits allowed, posting blocked with offline error).
- Attempt to post an invoice/credit note or mark it paid (must be blocked; no state change; no numbers allocated).
- Expected:
  - No posting endpoints called while offline.
  - No document numbers allocated offline.
  - Invariants INV-01..INV-03 remain intact.

## 2) Warehouse tablet losing Wi‑Fi mid-shipment
- Start shipment posting while online, then simulate network error/timeout on POST.
- UI must surface clear error, re-enable controls, and avoid double-posting.
- Expected:
  - No partial/inconsistent inventory movements.
  - If backend rejects with NEGATIVE_STOCK or other invariant errors, message is shown and no blind retry happens.

## 3) Multi-tab + offline interaction
- Open two tabs; take one offline and attempt dangerous actions (post invoice, mark paid, post shipment).
- Offline tab must be blocked; online tab continues normally.
- Expected:
  - No rogue local mutations.
  - All invariants stay consistent; tab-sync can mark stale data when online tab changes state.

## 4) Summary checklist
- [ ] No posting while offline
- [ ] Offline indicator visible
- [ ] Network errors do not leave UI stuck
- [ ] Legacy local-only flows disabled in GA mode
