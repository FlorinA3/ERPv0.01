# Phase 3 State Scenarios (Manual Regression)

## 1) Multi-tab edit conflict (customers)
- Open the same customer in two browser tabs.
- In Tab A, change a field and save (expect success).
- In Tab B, change the same record and save.
- Expected: backend returns 409, toast shows conflict message, store reloads latest data, and no duplicate/partial write occurs.

## 2) Data freshness on navigation
- Navigate to the Orders list and note the “Last updated” timestamp.
- Wait more than the TTL (5 minutes) or force refresh after navigating away.
- Return to Orders; expected: auto-refresh or use the Refresh button to reload and update the freshness indicator.

## 3) DB.save stress
- Rapidly toggle sidebar sections and navbar language/theme (e.g., 50x).
- Expected: UI stays responsive and saves are debounced (no flood of save toasts or freezes).

## 4) Multi-tab list refresh
- In Tab A create a new order (or product).
- In Tab B (orders/products list open), wait for tab-sync broadcast or click Refresh.
- Expected: the new record appears after sync/refresh and the last-updated indicator updates.
