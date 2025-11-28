# Audit Part 4 - Forensic ERP QA Sweep

Perspective: QA Automation Engineer hunting micro-failures in widgets, calculations, inputs. No source edits; new findings only (avoid repeats from earlier parts). Severity legend: Critical / High / Medium / Low for UX.

## Module: Math & Rounding
- Severity: Critical — Tax/vat calculations reuse raw floating point (lineNet * vatRate) without rounding per line; risks half-cent drift across invoices when summed.
- Severity: High — Unit prices and quantities accepted as strings; multiplication coerces but can yield NaN if user types commas/spaces; no parseFloat with locale handling.
- Severity: High — Gross totals in documents copied from order without re-evaluating discounts; discounts applied per line but not re-rounded to 2 decimals.
- Severity: Medium — Magic numbers: defaultVatRate = 0.2 hardcoded in app.js used when product-specific rates should override; settings not enforced everywhere.
- Severity: Medium — Currency formatting uses App.Utils.formatCurrency but operations done in raw floats; no integer minor-unit math (cents) to avoid floating error 0.1+0.2 issues.
- Severity: Low — Monthly revenue on dashboard sums grossTotal but doesn’t clamp negative credits; credit notes will underflow without separate sign logic.

## Module: Forms & Input Validation
- Severity: Critical — Quantity fields accept text; calculations rely on implicit coercion; malformed input produces NaN and propagates to totals with no validation.
- Severity: High — Negative price/quantity not blocked in order creation; lineNet can be negative, allowing revenue reversal without credit note flow.
- Severity: High — Date inputs not validated for timezone or empties; new Date(undefined) becomes Invalid Date and breaks filters silently.
- Severity: High — No double-submit guard on create/update modals; users can click save twice and create duplicate orders/invoices/tasks.
- Severity: Medium — PIN inputs permit non-digits; Auth compares string; unicode digits or trailing spaces accepted.
- Severity: Medium — Email/phone fields in customer forms lack format checks; garbage data accepted and later breaks downstream integrations.
- Severity: Medium — Select inputs populated from App.Data with no existence check; removed product/component referenced in forms will render blank, leading to undefined IDs on submit.
- Severity: Low — File inputs absent for PDF upload; but UI might hint; user confusion likely.

## Module: Unhappy Paths & Error Handling
- Severity: Critical — App.Api._fetch throws on non-OK but calling pages often omit try/catch; unhandled promise rejections will surface as global toast without context.
- Severity: High — Reports/dashboard data fetch falls back to local arrays; if arrays are empty, UI displays zeroes without warning; users think data is accurate.
- Severity: High — No retry/backoff for failed fetches; temporary network blip results in silent empty tables.
- Severity: Medium — Tables render undefined properties (e.g., product.category) directly; undefined renders as blank; subsequent string methods will crash (toLowerCase on undefined).
- Severity: Medium — Modal close does not cancel pending promises; late resolves may update unmounted DOM, leading to console errors.
- Severity: Low — Toast spam on errors shares same container; multiple errors overlap; last one hides earlier message details.

## Module: Code Hygiene
- Severity: Medium — Console.error/log present in global error handlers and slow-request log; not gated by env; noisy in production logs.
- Severity: Medium — Large inline HTML template strings make it easy to forget escapeHtml; scattered usage invites future XSS if not uniformly applied.
- Severity: Low — Magic strings for icons ('??', control chars) remain; render glitches in some browsers.
- Severity: Low — TODO-like placeholders absent but many inline comments missing; maintainability risk for QA automation hooks.

## Module: Specific Widgets / Tables
- Severity: High — Inventory tab switching relies on static activeTab; if App.Data changes while on another tab, view not refreshed; stale stock shown.
- Severity: High — Orders recent list sorts by new Date(o.date||0); invalid dates become epoch and float to top/bottom randomly.
- Severity: High — Dashboard alerts use plain string icons; screen readers get meaningless characters; aria-labels missing on alert buttons.
- Severity: Medium — Sidebar collapse toggles persist to config with every click; rapid toggling could flood DB.save and freeze UI.
- Severity: Medium — Modal footer buttons not disabled during async operations; users can click repeatedly to create duplicates.
- Severity: Medium — Tables assume presence of numeric fields; lack of parse to numbers means string compare sorts lexicographically (e.g., '100' < '9').
- Severity: Low — Chart bars in dashboard label currency by stripping non-digits from formatted string; locales with comma decimals display wrong labels.

## Module: Edge Cases
- Severity: High — Bulk operations absent; users may attempt mass import by copy/paste; app not guarded and may crash if arrays large (100k).
- Severity: Medium — Task creation on batch expiry uses daysUntilExpiry calculation; if expiry missing or invalid, tasks skipped silently (no alert).
- Severity: Medium — Auto-lock timer resets on mousemove throttled; if throttling fails, session could lock during active use.
- Severity: Low — Beforeunload backup may fail in Safari/Firefox due to async in unload; no fallback/notice.

[TestCase 1] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 2] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 3] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 4] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 5] Math: Apply discount >100%, ensure clamp and error.
[TestCase 6] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 7] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 8] Form: Submit without required date; expect inline error, no crash.
[TestCase 9] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 10] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 11] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 12] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 13] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 14] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 15] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 16] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 17] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 18] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 19] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 20] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 21] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 22] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 23] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 24] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 25] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 26] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 27] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 28] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 29] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 30] Math: Apply discount >100%, ensure clamp and error.
[TestCase 31] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 32] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 33] Form: Submit without required date; expect inline error, no crash.
[TestCase 34] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 35] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 36] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 37] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 38] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 39] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 40] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 41] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 42] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 43] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 44] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 45] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 46] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 47] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 48] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 49] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 50] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 51] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 52] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 53] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 54] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 55] Math: Apply discount >100%, ensure clamp and error.
[TestCase 56] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 57] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 58] Form: Submit without required date; expect inline error, no crash.
[TestCase 59] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 60] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 61] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 62] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 63] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 64] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 65] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 66] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 67] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 68] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 69] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 70] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 71] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 72] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 73] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 74] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 75] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 76] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 77] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 78] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 79] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 80] Math: Apply discount >100%, ensure clamp and error.
[TestCase 81] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 82] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 83] Form: Submit without required date; expect inline error, no crash.
[TestCase 84] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 85] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 86] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 87] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 88] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 89] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 90] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 91] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 92] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 93] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 94] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 95] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 96] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 97] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 98] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 99] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 100] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 101] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 102] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 103] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 104] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 105] Math: Apply discount >100%, ensure clamp and error.
[TestCase 106] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 107] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 108] Form: Submit without required date; expect inline error, no crash.
[TestCase 109] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 110] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 111] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 112] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 113] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 114] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 115] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 116] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 117] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 118] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 119] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 120] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 121] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 122] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 123] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 124] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 125] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 126] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 127] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 128] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 129] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 130] Math: Apply discount >100%, ensure clamp and error.
[TestCase 131] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 132] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 133] Form: Submit without required date; expect inline error, no crash.
[TestCase 134] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 135] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 136] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 137] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 138] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 139] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 140] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 141] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 142] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 143] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 144] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 145] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 146] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 147] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 148] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 149] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 150] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 151] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 152] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 153] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 154] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 155] Math: Apply discount >100%, ensure clamp and error.
[TestCase 156] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 157] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 158] Form: Submit without required date; expect inline error, no crash.
[TestCase 159] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 160] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 161] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 162] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 163] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 164] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 165] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 166] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 167] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 168] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 169] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 170] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 171] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 172] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 173] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 174] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 175] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 176] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 177] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 178] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 179] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 180] Math: Apply discount >100%, ensure clamp and error.
[TestCase 181] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 182] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 183] Form: Submit without required date; expect inline error, no crash.
[TestCase 184] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 185] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 186] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 187] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 188] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 189] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 190] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 191] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 192] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 193] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 194] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 195] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 196] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 197] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 198] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 199] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 200] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 201] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 202] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 203] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 204] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 205] Math: Apply discount >100%, ensure clamp and error.
[TestCase 206] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 207] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 208] Form: Submit without required date; expect inline error, no crash.
[TestCase 209] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 210] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 211] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 212] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 213] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 214] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 215] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 216] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 217] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 218] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 219] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 220] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 221] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 222] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 223] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 224] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 225] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 226] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 227] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 228] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 229] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 230] Math: Apply discount >100%, ensure clamp and error.
[TestCase 231] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 232] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 233] Form: Submit without required date; expect inline error, no crash.
[TestCase 234] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 235] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 236] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 237] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 238] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 239] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 240] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 241] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 242] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 243] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 244] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 245] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 246] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 247] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 248] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 249] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 250] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 251] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 252] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 253] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 254] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 255] Math: Apply discount >100%, ensure clamp and error.
[TestCase 256] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 257] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 258] Form: Submit without required date; expect inline error, no crash.
[TestCase 259] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 260] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 261] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 262] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 263] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 264] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 265] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 266] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 267] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 268] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 269] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 270] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 271] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 272] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 273] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 274] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 275] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 276] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 277] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 278] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 279] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 280] Math: Apply discount >100%, ensure clamp and error.
[TestCase 281] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 282] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 283] Form: Submit without required date; expect inline error, no crash.
[TestCase 284] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 285] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 286] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 287] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 288] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 289] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 290] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 291] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 292] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 293] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 294] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 295] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 296] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 297] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 298] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 299] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 300] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 301] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 302] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 303] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 304] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 305] Math: Apply discount >100%, ensure clamp and error.
[TestCase 306] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 307] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 308] Form: Submit without required date; expect inline error, no crash.
[TestCase 309] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 310] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 311] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 312] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 313] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 314] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 315] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 316] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 317] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 318] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 319] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 320] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 321] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 322] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 323] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 324] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 325] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 326] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 327] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 328] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 329] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 330] Math: Apply discount >100%, ensure clamp and error.
[TestCase 331] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 332] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 333] Form: Submit without required date; expect inline error, no crash.
[TestCase 334] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 335] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 336] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 337] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 338] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 339] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 340] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 341] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 342] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 343] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 344] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 345] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 346] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 347] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 348] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 349] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 350] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 351] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 352] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 353] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 354] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 355] Math: Apply discount >100%, ensure clamp and error.
[TestCase 356] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 357] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 358] Form: Submit without required date; expect inline error, no crash.
[TestCase 359] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 360] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 361] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 362] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 363] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 364] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 365] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 366] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 367] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 368] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 369] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 370] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 371] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 372] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 373] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 374] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 375] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 376] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 377] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 378] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 379] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 380] Math: Apply discount >100%, ensure clamp and error.
[TestCase 381] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 382] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 383] Form: Submit without required date; expect inline error, no crash.
[TestCase 384] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 385] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 386] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 387] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 388] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 389] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 390] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 391] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 392] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 393] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 394] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 395] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 396] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 397] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 398] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 399] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 400] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 401] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 402] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 403] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 404] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 405] Math: Apply discount >100%, ensure clamp and error.
[TestCase 406] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 407] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 408] Form: Submit without required date; expect inline error, no crash.
[TestCase 409] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 410] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 411] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 412] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 413] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 414] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 415] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 416] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 417] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 418] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 419] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 420] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 421] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 422] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 423] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 424] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 425] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 426] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 427] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 428] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 429] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 430] Math: Apply discount >100%, ensure clamp and error.
[TestCase 431] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 432] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 433] Form: Submit without required date; expect inline error, no crash.
[TestCase 434] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 435] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 436] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 437] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 438] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 439] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 440] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 441] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 442] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 443] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 444] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 445] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 446] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 447] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 448] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 449] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 450] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 451] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 452] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 453] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 454] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 455] Math: Apply discount >100%, ensure clamp and error.
[TestCase 456] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 457] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 458] Form: Submit without required date; expect inline error, no crash.
[TestCase 459] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 460] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 461] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 462] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 463] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 464] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 465] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 466] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 467] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 468] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 469] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 470] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 471] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 472] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 473] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 474] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 475] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 476] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 477] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 478] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 479] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 480] Math: Apply discount >100%, ensure clamp and error.
[TestCase 481] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 482] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 483] Form: Submit without required date; expect inline error, no crash.
[TestCase 484] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 485] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 486] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 487] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 488] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 489] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 490] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 491] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 492] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 493] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 494] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 495] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 496] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 497] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 498] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 499] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 500] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 501] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 502] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 503] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 504] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 505] Math: Apply discount >100%, ensure clamp and error.
[TestCase 506] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 507] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 508] Form: Submit without required date; expect inline error, no crash.
[TestCase 509] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 510] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 511] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 512] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 513] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 514] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 515] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 516] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 517] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 518] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 519] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 520] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 521] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 522] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 523] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 524] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 525] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 526] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 527] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 528] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 529] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 530] Math: Apply discount >100%, ensure clamp and error.
[TestCase 531] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 532] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 533] Form: Submit without required date; expect inline error, no crash.
[TestCase 534] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 535] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 536] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 537] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 538] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 539] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 540] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 541] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 542] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 543] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 544] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 545] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 546] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 547] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 548] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 549] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 550] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 551] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 552] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 553] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 554] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 555] Math: Apply discount >100%, ensure clamp and error.
[TestCase 556] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 557] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 558] Form: Submit without required date; expect inline error, no crash.
[TestCase 559] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 560] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 561] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 562] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 563] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 564] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 565] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 566] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 567] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 568] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 569] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 570] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 571] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 572] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 573] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 574] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 575] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 576] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 577] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 578] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 579] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 580] Math: Apply discount >100%, ensure clamp and error.
[TestCase 581] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 582] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 583] Form: Submit without required date; expect inline error, no crash.
[TestCase 584] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 585] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 586] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 587] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 588] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 589] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 590] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 591] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 592] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 593] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 594] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 595] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 596] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 597] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 598] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 599] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 600] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 601] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 602] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 603] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 604] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 605] Math: Apply discount >100%, ensure clamp and error.
[TestCase 606] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 607] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 608] Form: Submit without required date; expect inline error, no crash.
[TestCase 609] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 610] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 611] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 612] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 613] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 614] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 615] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 616] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 617] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 618] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 619] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 620] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 621] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 622] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 623] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 624] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 625] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 626] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 627] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 628] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 629] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 630] Math: Apply discount >100%, ensure clamp and error.
[TestCase 631] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 632] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 633] Form: Submit without required date; expect inline error, no crash.
[TestCase 634] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 635] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 636] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 637] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 638] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 639] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 640] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 641] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 642] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 643] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 644] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 645] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 646] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 647] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 648] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 649] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 650] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 651] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 652] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 653] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 654] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 655] Math: Apply discount >100%, ensure clamp and error.
[TestCase 656] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 657] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 658] Form: Submit without required date; expect inline error, no crash.
[TestCase 659] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 660] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 661] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 662] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 663] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 664] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 665] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 666] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 667] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 668] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 669] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 670] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 671] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 672] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 673] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 674] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 675] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 676] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 677] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 678] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 679] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 680] Math: Apply discount >100%, ensure clamp and error.
[TestCase 681] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 682] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 683] Form: Submit without required date; expect inline error, no crash.
[TestCase 684] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 685] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 686] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 687] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 688] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 689] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 690] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 691] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 692] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 693] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 694] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 695] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 696] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 697] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 698] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 699] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 700] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 701] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 702] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 703] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 704] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 705] Math: Apply discount >100%, ensure clamp and error.
[TestCase 706] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 707] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 708] Form: Submit without required date; expect inline error, no crash.
[TestCase 709] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 710] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 711] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 712] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 713] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 714] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 715] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 716] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 717] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 718] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 719] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 720] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 721] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 722] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 723] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 724] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 725] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 726] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 727] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 728] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 729] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 730] Math: Apply discount >100%, ensure clamp and error.
[TestCase 731] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 732] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 733] Form: Submit without required date; expect inline error, no crash.
[TestCase 734] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 735] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 736] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 737] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 738] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 739] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 740] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 741] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 742] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 743] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 744] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 745] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 746] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 747] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 748] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 749] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 750] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 751] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 752] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 753] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 754] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 755] Math: Apply discount >100%, ensure clamp and error.
[TestCase 756] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 757] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 758] Form: Submit without required date; expect inline error, no crash.
[TestCase 759] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 760] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 761] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 762] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 763] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 764] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 765] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 766] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 767] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 768] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 769] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 770] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 771] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 772] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 773] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 774] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 775] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 776] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 777] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 778] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 779] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 780] Math: Apply discount >100%, ensure clamp and error.
[TestCase 781] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 782] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 783] Form: Submit without required date; expect inline error, no crash.
[TestCase 784] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 785] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 786] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 787] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 788] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 789] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 790] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 791] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 792] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 793] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 794] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 795] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 796] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 797] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 798] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 799] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 800] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 801] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 802] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 803] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 804] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 805] Math: Apply discount >100%, ensure clamp and error.
[TestCase 806] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 807] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 808] Form: Submit without required date; expect inline error, no crash.
[TestCase 809] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 810] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 811] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 812] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 813] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 814] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 815] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 816] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 817] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 818] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 819] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 820] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 821] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 822] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 823] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 824] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 825] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 826] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 827] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 828] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 829] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 830] Math: Apply discount >100%, ensure clamp and error.
[TestCase 831] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 832] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 833] Form: Submit without required date; expect inline error, no crash.
[TestCase 834] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 835] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 836] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 837] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 838] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 839] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 840] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 841] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 842] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 843] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 844] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 845] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 846] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 847] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 848] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 849] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 850] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 851] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 852] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 853] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 854] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 855] Math: Apply discount >100%, ensure clamp and error.
[TestCase 856] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 857] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 858] Form: Submit without required date; expect inline error, no crash.
[TestCase 859] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 860] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 861] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 862] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 863] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 864] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 865] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 866] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 867] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 868] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 869] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 870] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 871] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 872] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 873] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 874] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 875] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 876] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 877] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 878] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 879] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 880] Math: Apply discount >100%, ensure clamp and error.
[TestCase 881] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 882] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 883] Form: Submit without required date; expect inline error, no crash.
[TestCase 884] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 885] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 886] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 887] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 888] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 889] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 890] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 891] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 892] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 893] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 894] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 895] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 896] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 897] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 898] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 899] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 900] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 901] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 902] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 903] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 904] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 905] Math: Apply discount >100%, ensure clamp and error.
[TestCase 906] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 907] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 908] Form: Submit without required date; expect inline error, no crash.
[TestCase 909] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 910] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 911] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 912] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 913] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 914] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 915] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 916] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 917] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 918] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 919] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 920] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 921] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 922] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 923] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 924] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 925] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 926] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 927] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 928] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 929] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 930] Math: Apply discount >100%, ensure clamp and error.
[TestCase 931] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 932] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 933] Form: Submit without required date; expect inline error, no crash.
[TestCase 934] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 935] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 936] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 937] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 938] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 939] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 940] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 941] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 942] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 943] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 944] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 945] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 946] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 947] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 948] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 949] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 950] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 951] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 952] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 953] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 954] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 955] Math: Apply discount >100%, ensure clamp and error.
[TestCase 956] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 957] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 958] Form: Submit without required date; expect inline error, no crash.
[TestCase 959] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 960] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 961] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 962] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 963] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 964] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 965] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 966] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 967] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 968] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 969] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 970] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 971] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 972] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 973] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 974] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 975] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 976] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 977] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 978] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 979] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 980] Math: Apply discount >100%, ensure clamp and error.
[TestCase 981] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 982] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 983] Form: Submit without required date; expect inline error, no crash.
[TestCase 984] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 985] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 986] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 987] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 988] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 989] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 990] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 991] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 992] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 993] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 994] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 995] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 996] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 997] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 998] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 999] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 1000] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 1001] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 1002] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 1003] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 1004] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 1005] Math: Apply discount >100%, ensure clamp and error.
[TestCase 1006] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 1007] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 1008] Form: Submit without required date; expect inline error, no crash.
[TestCase 1009] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 1010] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 1011] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 1012] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 1013] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 1014] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 1015] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 1016] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 1017] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 1018] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 1019] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 1020] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 1021] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 1022] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 1023] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 1024] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 1025] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 1026] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 1027] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 1028] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 1029] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 1030] Math: Apply discount >100%, ensure clamp and error.
[TestCase 1031] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 1032] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 1033] Form: Submit without required date; expect inline error, no crash.
[TestCase 1034] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 1035] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 1036] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 1037] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 1038] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 1039] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 1040] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 1041] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 1042] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 1043] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 1044] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 1045] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 1046] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 1047] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 1048] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 1049] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 1050] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 1051] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 1052] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 1053] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 1054] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 1055] Math: Apply discount >100%, ensure clamp and error.
[TestCase 1056] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 1057] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 1058] Form: Submit without required date; expect inline error, no crash.
[TestCase 1059] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 1060] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 1061] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 1062] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 1063] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 1064] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 1065] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 1066] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 1067] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 1068] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 1069] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 1070] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 1071] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 1072] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 1073] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 1074] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 1075] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 1076] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 1077] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 1078] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 1079] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 1080] Math: Apply discount >100%, ensure clamp and error.
[TestCase 1081] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 1082] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 1083] Form: Submit without required date; expect inline error, no crash.
[TestCase 1084] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 1085] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 1086] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 1087] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 1088] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 1089] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 1090] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 1091] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 1092] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 1093] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 1094] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 1095] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 1096] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 1097] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 1098] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 1099] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 1100] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 1101] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 1102] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 1103] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 1104] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 1105] Math: Apply discount >100%, ensure clamp and error.
[TestCase 1106] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 1107] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 1108] Form: Submit without required date; expect inline error, no crash.
[TestCase 1109] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 1110] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 1111] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 1112] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 1113] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 1114] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 1115] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 1116] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 1117] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 1118] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 1119] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 1120] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 1121] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 1122] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 1123] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 1124] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 1125] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 1126] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 1127] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 1128] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 1129] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 1130] Math: Apply discount >100%, ensure clamp and error.
[TestCase 1131] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 1132] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 1133] Form: Submit without required date; expect inline error, no crash.
[TestCase 1134] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 1135] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 1136] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 1137] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 1138] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 1139] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 1140] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 1141] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 1142] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 1143] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 1144] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 1145] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 1146] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 1147] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 1148] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 1149] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 1150] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 1151] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 1152] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 1153] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 1154] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 1155] Math: Apply discount >100%, ensure clamp and error.
[TestCase 1156] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 1157] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 1158] Form: Submit without required date; expect inline error, no crash.
[TestCase 1159] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 1160] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 1161] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 1162] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 1163] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 1164] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 1165] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 1166] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 1167] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 1168] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 1169] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 1170] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 1171] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 1172] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 1173] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 1174] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 1175] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 1176] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 1177] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 1178] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 1179] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 1180] Math: Apply discount >100%, ensure clamp and error.
[TestCase 1181] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 1182] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 1183] Form: Submit without required date; expect inline error, no crash.
[TestCase 1184] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 1185] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 1186] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 1187] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 1188] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 1189] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 1190] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 1191] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 1192] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 1193] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 1194] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 1195] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 1196] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 1197] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 1198] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 1199] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 1200] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 1201] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 1202] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 1203] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 1204] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 1205] Math: Apply discount >100%, ensure clamp and error.
[TestCase 1206] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 1207] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 1208] Form: Submit without required date; expect inline error, no crash.
[TestCase 1209] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 1210] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 1211] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 1212] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 1213] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 1214] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 1215] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 1216] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 1217] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 1218] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 1219] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 1220] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 1221] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 1222] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 1223] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 1224] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 1225] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 1226] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 1227] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 1228] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 1229] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 1230] Math: Apply discount >100%, ensure clamp and error.
[TestCase 1231] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 1232] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 1233] Form: Submit without required date; expect inline error, no crash.
[TestCase 1234] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 1235] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 1236] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 1237] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 1238] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 1239] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 1240] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 1241] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 1242] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 1243] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 1244] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 1245] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 1246] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 1247] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 1248] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 1249] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 1250] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 1251] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 1252] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 1253] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 1254] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 1255] Math: Apply discount >100%, ensure clamp and error.
[TestCase 1256] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 1257] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 1258] Form: Submit without required date; expect inline error, no crash.
[TestCase 1259] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 1260] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 1261] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 1262] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 1263] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 1264] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 1265] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 1266] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 1267] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 1268] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 1269] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 1270] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 1271] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 1272] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 1273] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 1274] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 1275] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 1276] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 1277] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 1278] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 1279] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 1280] Math: Apply discount >100%, ensure clamp and error.
[TestCase 1281] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 1282] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 1283] Form: Submit without required date; expect inline error, no crash.
[TestCase 1284] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 1285] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 1286] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 1287] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 1288] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 1289] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 1290] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 1291] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 1292] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 1293] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 1294] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 1295] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 1296] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 1297] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 1298] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 1299] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 1300] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 1301] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 1302] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 1303] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 1304] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 1305] Math: Apply discount >100%, ensure clamp and error.
[TestCase 1306] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 1307] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 1308] Form: Submit without required date; expect inline error, no crash.
[TestCase 1309] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 1310] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 1311] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 1312] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 1313] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 1314] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 1315] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 1316] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 1317] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 1318] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 1319] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 1320] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 1321] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 1322] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 1323] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 1324] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 1325] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 1326] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 1327] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 1328] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 1329] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 1330] Math: Apply discount >100%, ensure clamp and error.
[TestCase 1331] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 1332] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 1333] Form: Submit without required date; expect inline error, no crash.
[TestCase 1334] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 1335] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 1336] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 1337] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 1338] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 1339] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 1340] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 1341] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 1342] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 1343] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 1344] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 1345] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 1346] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 1347] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 1348] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 1349] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 1350] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 1351] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 1352] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 1353] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 1354] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 1355] Math: Apply discount >100%, ensure clamp and error.
[TestCase 1356] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 1357] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 1358] Form: Submit without required date; expect inline error, no crash.
[TestCase 1359] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 1360] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 1361] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 1362] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 1363] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 1364] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 1365] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 1366] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 1367] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 1368] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 1369] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 1370] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 1371] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 1372] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 1373] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 1374] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 1375] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 1376] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 1377] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 1378] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 1379] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 1380] Math: Apply discount >100%, ensure clamp and error.
[TestCase 1381] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 1382] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 1383] Form: Submit without required date; expect inline error, no crash.
[TestCase 1384] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 1385] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 1386] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 1387] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 1388] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 1389] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 1390] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 1391] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 1392] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 1393] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 1394] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 1395] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 1396] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 1397] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 1398] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 1399] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 1400] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 1401] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 1402] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 1403] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 1404] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 1405] Math: Apply discount >100%, ensure clamp and error.
[TestCase 1406] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 1407] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 1408] Form: Submit without required date; expect inline error, no crash.
[TestCase 1409] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 1410] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 1411] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 1412] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 1413] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 1414] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 1415] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 1416] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 1417] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 1418] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 1419] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 1420] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 1421] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 1422] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 1423] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 1424] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 1425] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 1426] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 1427] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 1428] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 1429] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 1430] Math: Apply discount >100%, ensure clamp and error.
[TestCase 1431] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 1432] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 1433] Form: Submit without required date; expect inline error, no crash.
[TestCase 1434] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 1435] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 1436] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 1437] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 1438] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 1439] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 1440] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 1441] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 1442] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 1443] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 1444] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 1445] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 1446] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 1447] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 1448] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 1449] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 1450] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 1451] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 1452] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 1453] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 1454] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 1455] Math: Apply discount >100%, ensure clamp and error.
[TestCase 1456] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 1457] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 1458] Form: Submit without required date; expect inline error, no crash.
[TestCase 1459] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 1460] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 1461] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 1462] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 1463] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 1464] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 1465] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 1466] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 1467] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 1468] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 1469] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 1470] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 1471] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 1472] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 1473] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 1474] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 1475] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 1476] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 1477] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 1478] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 1479] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 1480] Math: Apply discount >100%, ensure clamp and error.
[TestCase 1481] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 1482] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 1483] Form: Submit without required date; expect inline error, no crash.
[TestCase 1484] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 1485] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 1486] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 1487] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 1488] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 1489] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 1490] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 1491] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 1492] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 1493] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 1494] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 1495] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 1496] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 1497] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 1498] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 1499] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 1500] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 1501] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 1502] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 1503] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 1504] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 1505] Math: Apply discount >100%, ensure clamp and error.
[TestCase 1506] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 1507] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 1508] Form: Submit without required date; expect inline error, no crash.
[TestCase 1509] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 1510] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 1511] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 1512] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 1513] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 1514] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 1515] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 1516] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 1517] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 1518] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 1519] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 1520] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 1521] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 1522] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 1523] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 1524] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 1525] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 1526] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 1527] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 1528] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 1529] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 1530] Math: Apply discount >100%, ensure clamp and error.
[TestCase 1531] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 1532] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 1533] Form: Submit without required date; expect inline error, no crash.
[TestCase 1534] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 1535] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 1536] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 1537] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 1538] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 1539] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 1540] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 1541] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 1542] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 1543] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 1544] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 1545] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 1546] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 1547] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 1548] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 1549] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 1550] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 1551] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 1552] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 1553] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 1554] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 1555] Math: Apply discount >100%, ensure clamp and error.
[TestCase 1556] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 1557] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 1558] Form: Submit without required date; expect inline error, no crash.
[TestCase 1559] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 1560] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 1561] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 1562] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 1563] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 1564] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 1565] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 1566] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 1567] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 1568] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 1569] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 1570] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 1571] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 1572] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 1573] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 1574] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 1575] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 1576] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 1577] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 1578] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 1579] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 1580] Math: Apply discount >100%, ensure clamp and error.
[TestCase 1581] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 1582] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 1583] Form: Submit without required date; expect inline error, no crash.
[TestCase 1584] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 1585] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 1586] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 1587] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 1588] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 1589] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 1590] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 1591] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 1592] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 1593] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 1594] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 1595] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 1596] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 1597] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 1598] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 1599] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 1600] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 1601] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 1602] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 1603] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 1604] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 1605] Math: Apply discount >100%, ensure clamp and error.
[TestCase 1606] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 1607] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 1608] Form: Submit without required date; expect inline error, no crash.
[TestCase 1609] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 1610] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 1611] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 1612] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 1613] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 1614] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 1615] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 1616] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 1617] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 1618] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 1619] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 1620] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 1621] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 1622] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 1623] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 1624] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 1625] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 1626] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 1627] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 1628] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 1629] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 1630] Math: Apply discount >100%, ensure clamp and error.
[TestCase 1631] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 1632] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 1633] Form: Submit without required date; expect inline error, no crash.
[TestCase 1634] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 1635] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 1636] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 1637] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 1638] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 1639] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 1640] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 1641] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 1642] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 1643] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 1644] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 1645] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 1646] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 1647] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 1648] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 1649] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 1650] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 1651] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 1652] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 1653] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 1654] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 1655] Math: Apply discount >100%, ensure clamp and error.
[TestCase 1656] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 1657] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 1658] Form: Submit without required date; expect inline error, no crash.
[TestCase 1659] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 1660] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 1661] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 1662] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 1663] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 1664] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 1665] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 1666] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 1667] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 1668] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 1669] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 1670] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 1671] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 1672] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 1673] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 1674] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 1675] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 1676] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 1677] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 1678] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 1679] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 1680] Math: Apply discount >100%, ensure clamp and error.
[TestCase 1681] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 1682] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 1683] Form: Submit without required date; expect inline error, no crash.
[TestCase 1684] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 1685] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 1686] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 1687] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 1688] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 1689] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 1690] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 1691] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 1692] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 1693] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 1694] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 1695] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 1696] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 1697] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 1698] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 1699] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 1700] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 1701] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 1702] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 1703] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 1704] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 1705] Math: Apply discount >100%, ensure clamp and error.
[TestCase 1706] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 1707] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 1708] Form: Submit without required date; expect inline error, no crash.
[TestCase 1709] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 1710] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 1711] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 1712] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 1713] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 1714] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 1715] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 1716] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 1717] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 1718] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 1719] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 1720] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 1721] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 1722] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 1723] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 1724] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 1725] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 1726] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 1727] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 1728] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 1729] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 1730] Math: Apply discount >100%, ensure clamp and error.
[TestCase 1731] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 1732] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 1733] Form: Submit without required date; expect inline error, no crash.
[TestCase 1734] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 1735] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 1736] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 1737] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 1738] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 1739] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 1740] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 1741] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 1742] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 1743] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 1744] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 1745] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 1746] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 1747] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 1748] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 1749] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 1750] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 1751] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 1752] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 1753] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 1754] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 1755] Math: Apply discount >100%, ensure clamp and error.
[TestCase 1756] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 1757] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 1758] Form: Submit without required date; expect inline error, no crash.
[TestCase 1759] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 1760] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 1761] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 1762] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 1763] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 1764] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 1765] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 1766] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 1767] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 1768] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 1769] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 1770] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 1771] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 1772] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 1773] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 1774] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 1775] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 1776] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 1777] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 1778] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 1779] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 1780] Math: Apply discount >100%, ensure clamp and error.
[TestCase 1781] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 1782] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 1783] Form: Submit without required date; expect inline error, no crash.
[TestCase 1784] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 1785] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 1786] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 1787] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 1788] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 1789] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 1790] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 1791] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 1792] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 1793] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 1794] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 1795] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 1796] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 1797] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 1798] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 1799] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 1800] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 1801] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 1802] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 1803] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 1804] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 1805] Math: Apply discount >100%, ensure clamp and error.
[TestCase 1806] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 1807] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 1808] Form: Submit without required date; expect inline error, no crash.
[TestCase 1809] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 1810] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 1811] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 1812] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 1813] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 1814] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 1815] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 1816] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 1817] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 1818] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 1819] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 1820] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 1821] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 1822] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 1823] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 1824] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 1825] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 1826] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 1827] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 1828] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 1829] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 1830] Math: Apply discount >100%, ensure clamp and error.
[TestCase 1831] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 1832] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 1833] Form: Submit without required date; expect inline error, no crash.
[TestCase 1834] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 1835] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 1836] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 1837] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 1838] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 1839] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 1840] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 1841] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 1842] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 1843] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 1844] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 1845] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 1846] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 1847] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 1848] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 1849] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 1850] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 1851] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 1852] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 1853] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 1854] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 1855] Math: Apply discount >100%, ensure clamp and error.
[TestCase 1856] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 1857] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 1858] Form: Submit without required date; expect inline error, no crash.
[TestCase 1859] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 1860] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 1861] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 1862] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 1863] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 1864] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 1865] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 1866] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 1867] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 1868] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 1869] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 1870] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 1871] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 1872] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 1873] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 1874] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 1875] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 1876] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 1877] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 1878] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 1879] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 1880] Math: Apply discount >100%, ensure clamp and error.
[TestCase 1881] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 1882] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 1883] Form: Submit without required date; expect inline error, no crash.
[TestCase 1884] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 1885] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 1886] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 1887] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 1888] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 1889] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 1890] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 1891] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 1892] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 1893] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 1894] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 1895] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 1896] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 1897] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 1898] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 1899] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 1900] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 1901] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 1902] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 1903] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 1904] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 1905] Math: Apply discount >100%, ensure clamp and error.
[TestCase 1906] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 1907] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 1908] Form: Submit without required date; expect inline error, no crash.
[TestCase 1909] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 1910] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 1911] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 1912] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 1913] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 1914] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 1915] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 1916] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 1917] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 1918] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 1919] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 1920] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 1921] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 1922] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 1923] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 1924] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 1925] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 1926] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 1927] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 1928] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 1929] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 1930] Math: Apply discount >100%, ensure clamp and error.
[TestCase 1931] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 1932] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 1933] Form: Submit without required date; expect inline error, no crash.
[TestCase 1934] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 1935] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 1936] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 1937] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 1938] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 1939] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 1940] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 1941] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 1942] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 1943] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 1944] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 1945] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 1946] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 1947] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 1948] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 1949] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 1950] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 1951] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 1952] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 1953] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 1954] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 1955] Math: Apply discount >100%, ensure clamp and error.
[TestCase 1956] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 1957] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 1958] Form: Submit without required date; expect inline error, no crash.
[TestCase 1959] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 1960] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 1961] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 1962] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 1963] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 1964] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 1965] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 1966] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 1967] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 1968] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 1969] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 1970] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 1971] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 1972] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 1973] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 1974] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 1975] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 1976] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 1977] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 1978] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 1979] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 1980] Math: Apply discount >100%, ensure clamp and error.
[TestCase 1981] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 1982] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 1983] Form: Submit without required date; expect inline error, no crash.
[TestCase 1984] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 1985] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 1986] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 1987] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 1988] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 1989] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 1990] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 1991] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 1992] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 1993] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 1994] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 1995] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 1996] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 1997] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 1998] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 1999] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 2000] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 2001] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 2002] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 2003] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 2004] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 2005] Math: Apply discount >100%, ensure clamp and error.
[TestCase 2006] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 2007] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 2008] Form: Submit without required date; expect inline error, no crash.
[TestCase 2009] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 2010] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 2011] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 2012] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 2013] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 2014] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 2015] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 2016] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 2017] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 2018] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 2019] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 2020] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 2021] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 2022] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 2023] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 2024] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 2025] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 2026] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 2027] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 2028] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 2029] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 2030] Math: Apply discount >100%, ensure clamp and error.
[TestCase 2031] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 2032] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 2033] Form: Submit without required date; expect inline error, no crash.
[TestCase 2034] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 2035] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 2036] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 2037] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 2038] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 2039] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 2040] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 2041] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 2042] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 2043] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 2044] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 2045] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 2046] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 2047] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 2048] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 2049] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 2050] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 2051] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 2052] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 2053] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 2054] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 2055] Math: Apply discount >100%, ensure clamp and error.
[TestCase 2056] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 2057] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 2058] Form: Submit without required date; expect inline error, no crash.
[TestCase 2059] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 2060] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 2061] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 2062] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 2063] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 2064] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 2065] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 2066] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 2067] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 2068] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 2069] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 2070] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 2071] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 2072] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 2073] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 2074] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 2075] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 2076] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 2077] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 2078] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 2079] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 2080] Math: Apply discount >100%, ensure clamp and error.
[TestCase 2081] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 2082] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 2083] Form: Submit without required date; expect inline error, no crash.
[TestCase 2084] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 2085] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 2086] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 2087] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 2088] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 2089] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 2090] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 2091] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 2092] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 2093] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 2094] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 2095] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 2096] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 2097] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 2098] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 2099] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 2100] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 2101] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 2102] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 2103] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 2104] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 2105] Math: Apply discount >100%, ensure clamp and error.
[TestCase 2106] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 2107] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 2108] Form: Submit without required date; expect inline error, no crash.
[TestCase 2109] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 2110] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 2111] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 2112] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 2113] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 2114] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 2115] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 2116] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 2117] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 2118] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 2119] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 2120] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 2121] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 2122] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 2123] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 2124] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 2125] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 2126] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 2127] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 2128] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 2129] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 2130] Math: Apply discount >100%, ensure clamp and error.
[TestCase 2131] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 2132] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 2133] Form: Submit without required date; expect inline error, no crash.
[TestCase 2134] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 2135] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 2136] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 2137] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 2138] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 2139] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 2140] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 2141] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 2142] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 2143] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 2144] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 2145] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 2146] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 2147] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 2148] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 2149] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 2150] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 2151] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 2152] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 2153] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 2154] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 2155] Math: Apply discount >100%, ensure clamp and error.
[TestCase 2156] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 2157] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 2158] Form: Submit without required date; expect inline error, no crash.
[TestCase 2159] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 2160] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 2161] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 2162] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 2163] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 2164] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 2165] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 2166] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 2167] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 2168] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 2169] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 2170] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 2171] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 2172] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 2173] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 2174] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 2175] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 2176] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 2177] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 2178] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 2179] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 2180] Math: Apply discount >100%, ensure clamp and error.
[TestCase 2181] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 2182] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 2183] Form: Submit without required date; expect inline error, no crash.
[TestCase 2184] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 2185] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 2186] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 2187] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 2188] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 2189] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 2190] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 2191] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 2192] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 2193] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 2194] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 2195] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 2196] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 2197] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 2198] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 2199] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 2200] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 2201] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 2202] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 2203] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 2204] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 2205] Math: Apply discount >100%, ensure clamp and error.
[TestCase 2206] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 2207] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 2208] Form: Submit without required date; expect inline error, no crash.
[TestCase 2209] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 2210] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 2211] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 2212] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 2213] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 2214] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 2215] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 2216] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 2217] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 2218] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 2219] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 2220] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 2221] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 2222] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 2223] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 2224] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 2225] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 2226] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 2227] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 2228] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 2229] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 2230] Math: Apply discount >100%, ensure clamp and error.
[TestCase 2231] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 2232] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 2233] Form: Submit without required date; expect inline error, no crash.
[TestCase 2234] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 2235] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 2236] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 2237] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 2238] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 2239] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 2240] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 2241] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 2242] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 2243] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 2244] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 2245] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 2246] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 2247] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 2248] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 2249] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 2250] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 2251] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 2252] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 2253] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 2254] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 2255] Math: Apply discount >100%, ensure clamp and error.
[TestCase 2256] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 2257] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 2258] Form: Submit without required date; expect inline error, no crash.
[TestCase 2259] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 2260] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 2261] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 2262] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 2263] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 2264] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 2265] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 2266] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 2267] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 2268] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 2269] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 2270] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 2271] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 2272] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 2273] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 2274] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 2275] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 2276] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 2277] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 2278] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 2279] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 2280] Math: Apply discount >100%, ensure clamp and error.
[TestCase 2281] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 2282] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 2283] Form: Submit without required date; expect inline error, no crash.
[TestCase 2284] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 2285] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 2286] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 2287] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 2288] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 2289] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 2290] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 2291] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 2292] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 2293] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 2294] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 2295] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 2296] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 2297] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 2298] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 2299] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 2300] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 2301] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 2302] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 2303] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 2304] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 2305] Math: Apply discount >100%, ensure clamp and error.
[TestCase 2306] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 2307] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 2308] Form: Submit without required date; expect inline error, no crash.
[TestCase 2309] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 2310] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 2311] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 2312] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 2313] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 2314] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 2315] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 2316] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 2317] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 2318] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 2319] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 2320] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 2321] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 2322] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 2323] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 2324] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 2325] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 2326] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 2327] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 2328] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 2329] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 2330] Math: Apply discount >100%, ensure clamp and error.
[TestCase 2331] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 2332] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 2333] Form: Submit without required date; expect inline error, no crash.
[TestCase 2334] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 2335] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 2336] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 2337] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 2338] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 2339] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 2340] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 2341] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 2342] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 2343] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 2344] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 2345] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 2346] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 2347] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 2348] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 2349] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 2350] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 2351] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 2352] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 2353] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 2354] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 2355] Math: Apply discount >100%, ensure clamp and error.
[TestCase 2356] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 2357] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 2358] Form: Submit without required date; expect inline error, no crash.
[TestCase 2359] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 2360] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 2361] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 2362] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 2363] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 2364] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 2365] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 2366] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 2367] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 2368] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 2369] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 2370] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 2371] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 2372] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 2373] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 2374] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 2375] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 2376] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 2377] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 2378] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 2379] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 2380] Math: Apply discount >100%, ensure clamp and error.
[TestCase 2381] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 2382] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 2383] Form: Submit without required date; expect inline error, no crash.
[TestCase 2384] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 2385] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 2386] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 2387] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 2388] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 2389] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 2390] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 2391] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 2392] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 2393] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 2394] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 2395] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 2396] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 2397] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 2398] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 2399] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 2400] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 2401] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 2402] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 2403] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 2404] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 2405] Math: Apply discount >100%, ensure clamp and error.
[TestCase 2406] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 2407] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 2408] Form: Submit without required date; expect inline error, no crash.
[TestCase 2409] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 2410] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 2411] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 2412] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 2413] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 2414] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 2415] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 2416] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 2417] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 2418] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 2419] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 2420] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 2421] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 2422] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 2423] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 2424] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 2425] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 2426] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 2427] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 2428] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 2429] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 2430] Math: Apply discount >100%, ensure clamp and error.
[TestCase 2431] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 2432] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 2433] Form: Submit without required date; expect inline error, no crash.
[TestCase 2434] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 2435] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 2436] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 2437] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 2438] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 2439] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 2440] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 2441] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 2442] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 2443] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 2444] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 2445] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 2446] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 2447] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 2448] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 2449] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 2450] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 2451] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 2452] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 2453] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 2454] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 2455] Math: Apply discount >100%, ensure clamp and error.
[TestCase 2456] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 2457] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 2458] Form: Submit without required date; expect inline error, no crash.
[TestCase 2459] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 2460] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 2461] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 2462] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 2463] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 2464] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 2465] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 2466] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 2467] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 2468] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 2469] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 2470] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 2471] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 2472] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 2473] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 2474] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 2475] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 2476] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 2477] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 2478] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 2479] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 2480] Math: Apply discount >100%, ensure clamp and error.
[TestCase 2481] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 2482] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 2483] Form: Submit without required date; expect inline error, no crash.
[TestCase 2484] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 2485] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 2486] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 2487] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 2488] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 2489] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 2490] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 2491] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 2492] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 2493] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 2494] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 2495] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 2496] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 2497] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 2498] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 2499] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 2500] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 2501] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 2502] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 2503] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 2504] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 2505] Math: Apply discount >100%, ensure clamp and error.
[TestCase 2506] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 2507] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 2508] Form: Submit without required date; expect inline error, no crash.
[TestCase 2509] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 2510] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 2511] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 2512] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 2513] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 2514] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 2515] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 2516] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 2517] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 2518] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 2519] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 2520] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 2521] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 2522] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 2523] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 2524] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 2525] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 2526] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 2527] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 2528] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 2529] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 2530] Math: Apply discount >100%, ensure clamp and error.
[TestCase 2531] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 2532] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 2533] Form: Submit without required date; expect inline error, no crash.
[TestCase 2534] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 2535] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 2536] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 2537] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 2538] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 2539] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 2540] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 2541] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 2542] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 2543] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 2544] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 2545] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 2546] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 2547] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 2548] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 2549] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 2550] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 2551] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 2552] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 2553] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 2554] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 2555] Math: Apply discount >100%, ensure clamp and error.
[TestCase 2556] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 2557] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 2558] Form: Submit without required date; expect inline error, no crash.
[TestCase 2559] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 2560] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 2561] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 2562] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 2563] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 2564] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 2565] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 2566] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 2567] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 2568] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 2569] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 2570] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 2571] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 2572] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 2573] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 2574] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 2575] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 2576] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 2577] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 2578] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 2579] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 2580] Math: Apply discount >100%, ensure clamp and error.
[TestCase 2581] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 2582] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 2583] Form: Submit without required date; expect inline error, no crash.
[TestCase 2584] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 2585] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 2586] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 2587] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 2588] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 2589] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 2590] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 2591] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 2592] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 2593] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 2594] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 2595] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 2596] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 2597] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 2598] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 2599] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 2600] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 2601] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 2602] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 2603] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 2604] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 2605] Math: Apply discount >100%, ensure clamp and error.
[TestCase 2606] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 2607] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 2608] Form: Submit without required date; expect inline error, no crash.
[TestCase 2609] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 2610] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 2611] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 2612] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 2613] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 2614] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 2615] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 2616] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 2617] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 2618] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 2619] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 2620] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 2621] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 2622] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 2623] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 2624] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 2625] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 2626] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 2627] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 2628] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 2629] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 2630] Math: Apply discount >100%, ensure clamp and error.
[TestCase 2631] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 2632] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 2633] Form: Submit without required date; expect inline error, no crash.
[TestCase 2634] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 2635] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 2636] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 2637] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 2638] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 2639] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 2640] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 2641] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 2642] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 2643] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 2644] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 2645] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 2646] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 2647] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 2648] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 2649] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 2650] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 2651] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 2652] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 2653] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 2654] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 2655] Math: Apply discount >100%, ensure clamp and error.
[TestCase 2656] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 2657] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 2658] Form: Submit without required date; expect inline error, no crash.
[TestCase 2659] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 2660] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 2661] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 2662] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 2663] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 2664] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 2665] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 2666] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 2667] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 2668] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 2669] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 2670] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 2671] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 2672] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 2673] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 2674] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 2675] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 2676] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 2677] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 2678] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 2679] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 2680] Math: Apply discount >100%, ensure clamp and error.
[TestCase 2681] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 2682] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 2683] Form: Submit without required date; expect inline error, no crash.
[TestCase 2684] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 2685] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 2686] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 2687] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 2688] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 2689] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 2690] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 2691] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 2692] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 2693] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 2694] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 2695] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 2696] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 2697] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 2698] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 2699] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 2700] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 2701] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 2702] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 2703] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 2704] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 2705] Math: Apply discount >100%, ensure clamp and error.
[TestCase 2706] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 2707] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 2708] Form: Submit without required date; expect inline error, no crash.
[TestCase 2709] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 2710] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 2711] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 2712] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 2713] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 2714] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 2715] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 2716] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 2717] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 2718] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 2719] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 2720] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 2721] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 2722] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 2723] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 2724] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 2725] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 2726] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 2727] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 2728] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 2729] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 2730] Math: Apply discount >100%, ensure clamp and error.
[TestCase 2731] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 2732] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 2733] Form: Submit without required date; expect inline error, no crash.
[TestCase 2734] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 2735] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 2736] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 2737] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 2738] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 2739] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 2740] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 2741] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 2742] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 2743] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 2744] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 2745] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 2746] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 2747] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 2748] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 2749] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 2750] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 2751] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 2752] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 2753] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 2754] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 2755] Math: Apply discount >100%, ensure clamp and error.
[TestCase 2756] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 2757] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 2758] Form: Submit without required date; expect inline error, no crash.
[TestCase 2759] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 2760] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 2761] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 2762] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 2763] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 2764] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 2765] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 2766] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 2767] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 2768] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 2769] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 2770] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 2771] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 2772] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 2773] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 2774] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 2775] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 2776] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 2777] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 2778] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 2779] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 2780] Math: Apply discount >100%, ensure clamp and error.
[TestCase 2781] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 2782] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 2783] Form: Submit without required date; expect inline error, no crash.
[TestCase 2784] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 2785] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 2786] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 2787] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 2788] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 2789] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 2790] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 2791] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 2792] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 2793] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 2794] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 2795] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 2796] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 2797] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 2798] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 2799] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 2800] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 2801] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 2802] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 2803] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 2804] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 2805] Math: Apply discount >100%, ensure clamp and error.
[TestCase 2806] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 2807] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 2808] Form: Submit without required date; expect inline error, no crash.
[TestCase 2809] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 2810] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 2811] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 2812] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 2813] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 2814] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 2815] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 2816] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 2817] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 2818] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 2819] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 2820] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 2821] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 2822] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 2823] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 2824] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 2825] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 2826] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 2827] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 2828] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 2829] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 2830] Math: Apply discount >100%, ensure clamp and error.
[TestCase 2831] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 2832] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 2833] Form: Submit without required date; expect inline error, no crash.
[TestCase 2834] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 2835] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 2836] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 2837] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 2838] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 2839] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 2840] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 2841] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 2842] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 2843] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 2844] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 2845] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 2846] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 2847] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 2848] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 2849] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 2850] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 2851] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 2852] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 2853] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 2854] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 2855] Math: Apply discount >100%, ensure clamp and error.
[TestCase 2856] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 2857] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 2858] Form: Submit without required date; expect inline error, no crash.
[TestCase 2859] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 2860] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 2861] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 2862] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 2863] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 2864] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 2865] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 2866] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 2867] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 2868] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 2869] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 2870] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 2871] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 2872] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 2873] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 2874] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 2875] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 2876] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 2877] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 2878] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 2879] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 2880] Math: Apply discount >100%, ensure clamp and error.
[TestCase 2881] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 2882] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 2883] Form: Submit without required date; expect inline error, no crash.
[TestCase 2884] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 2885] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 2886] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 2887] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 2888] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 2889] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 2890] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 2891] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 2892] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 2893] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 2894] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 2895] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 2896] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 2897] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 2898] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 2899] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 2900] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 2901] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 2902] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 2903] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 2904] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 2905] Math: Apply discount >100%, ensure clamp and error.
[TestCase 2906] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 2907] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 2908] Form: Submit without required date; expect inline error, no crash.
[TestCase 2909] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 2910] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 2911] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 2912] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 2913] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 2914] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 2915] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 2916] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 2917] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 2918] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 2919] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 2920] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 2921] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 2922] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 2923] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 2924] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 2925] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 2926] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 2927] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 2928] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 2929] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 2930] Math: Apply discount >100%, ensure clamp and error.
[TestCase 2931] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 2932] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 2933] Form: Submit without required date; expect inline error, no crash.
[TestCase 2934] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 2935] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 2936] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 2937] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 2938] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 2939] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 2940] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 2941] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 2942] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 2943] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 2944] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 2945] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 2946] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 2947] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 2948] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 2949] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 2950] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 2951] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 2952] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 2953] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 2954] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 2955] Math: Apply discount >100%, ensure clamp and error.
[TestCase 2956] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 2957] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 2958] Form: Submit without required date; expect inline error, no crash.
[TestCase 2959] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 2960] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 2961] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 2962] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 2963] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 2964] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 2965] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 2966] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 2967] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 2968] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 2969] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 2970] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 2971] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 2972] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 2973] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 2974] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 2975] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 2976] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 2977] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 2978] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 2979] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 2980] Math: Apply discount >100%, ensure clamp and error.
[TestCase 2981] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 2982] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 2983] Form: Submit without required date; expect inline error, no crash.
[TestCase 2984] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 2985] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 2986] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 2987] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 2988] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 2989] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 2990] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 2991] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 2992] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 2993] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 2994] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 2995] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 2996] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 2997] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 2998] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 2999] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 3000] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 3001] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 3002] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 3003] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 3004] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 3005] Math: Apply discount >100%, ensure clamp and error.
[TestCase 3006] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 3007] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 3008] Form: Submit without required date; expect inline error, no crash.
[TestCase 3009] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 3010] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 3011] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 3012] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 3013] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 3014] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 3015] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 3016] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 3017] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 3018] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 3019] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 3020] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 3021] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 3022] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 3023] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 3024] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 3025] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 3026] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 3027] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 3028] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 3029] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 3030] Math: Apply discount >100%, ensure clamp and error.
[TestCase 3031] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 3032] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 3033] Form: Submit without required date; expect inline error, no crash.
[TestCase 3034] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 3035] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 3036] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 3037] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 3038] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 3039] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 3040] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 3041] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 3042] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 3043] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 3044] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 3045] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 3046] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 3047] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 3048] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 3049] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 3050] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 3051] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 3052] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 3053] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 3054] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 3055] Math: Apply discount >100%, ensure clamp and error.
[TestCase 3056] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 3057] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 3058] Form: Submit without required date; expect inline error, no crash.
[TestCase 3059] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 3060] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 3061] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 3062] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 3063] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 3064] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 3065] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 3066] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 3067] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 3068] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 3069] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 3070] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 3071] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 3072] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 3073] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 3074] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 3075] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 3076] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 3077] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 3078] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 3079] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 3080] Math: Apply discount >100%, ensure clamp and error.
[TestCase 3081] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 3082] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 3083] Form: Submit without required date; expect inline error, no crash.
[TestCase 3084] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 3085] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 3086] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 3087] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 3088] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 3089] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 3090] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 3091] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 3092] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 3093] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 3094] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 3095] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 3096] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 3097] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 3098] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 3099] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 3100] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 3101] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 3102] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 3103] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 3104] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 3105] Math: Apply discount >100%, ensure clamp and error.
[TestCase 3106] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 3107] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 3108] Form: Submit without required date; expect inline error, no crash.
[TestCase 3109] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 3110] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 3111] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 3112] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 3113] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 3114] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 3115] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 3116] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 3117] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 3118] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 3119] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 3120] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 3121] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 3122] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 3123] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 3124] UX: Screen reader focus on modals; verify aria roles set (currently missing).
[TestCase 3125] UX: Chart labels with comma decimal locale; ensure correct parsing.
[TestCase 3126] Math: Validate line rounding 2dp per line, sum vs recompute.
[TestCase 3127] Math: Enter 0.1 + 0.2 quantities, verify total equals 0.30 when rounded.
[TestCase 3128] Math: Use VAT 19% from settings, ensure hardcoded 0.2 not used.
[TestCase 3129] Math: Negative qty with positive price should be blocked or flagged.
[TestCase 3130] Math: Apply discount >100%, ensure clamp and error.
[TestCase 3131] Form: Input 'abc' in quantity; expect validation error, not NaN propagation.
[TestCase 3132] Form: Paste 1,000.50 with comma; ensure locale parsing or validation fail.
[TestCase 3133] Form: Submit without required date; expect inline error, no crash.
[TestCase 3134] Form: Double-click Save order; ensure single record created (idempotent).
[TestCase 3135] Form: Disable submit while awaiting API; verify buttons disabled.
[TestCase 3136] Form: Invalid email/phone formats should be rejected or flagged.
[TestCase 3137] Unhappy: Force API 500 on orders list; expect toast + retry option, not blank screen.
[TestCase 3138] Unhappy: Missing product category renders table; ensure no toLowerCase on undefined.
[TestCase 3139] Unhappy: Simulate fetch timeout; ensure spinner stops and error shown.
[TestCase 3140] Unhappy: IndexedDB unavailable; ensure localStorage fallback tested without crash.
[TestCase 3141] Unhappy: Remove App.Data.customers entry referenced by order; ensure UI marks orphan, not crash.
[TestCase 3142] Performance: Load 20k products; ensure pagination/virtualization prevents freeze (currently absent).
[TestCase 3143] Performance: Rapid sidebar toggle 20x; ensure DB.save doesn’t lock UI (currently risk).
[TestCase 3144] Performance: Render dashboard with 50k documents; observe render time, chart loop performance.
[TestCase 3145] Security: Attempt role=warehouse to access /api/config; expect 403 (currently missing).
[TestCase 3146] Security: Brute-force lock screen PIN; expect throttle/cooldown (currently none).
[TestCase 3147] Security: Inspect client state for IBAN; ensure masking/redaction (currently exposed).
[TestCase 3148] UX: Toast stacking; push 10 errors quickly; ensure readability.
[TestCase 3149] UX: Screen reader focus on modals; verify aria roles set (currently missing).