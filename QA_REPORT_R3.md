# OpenFinance QA Report — Round 3
**Date:** 2026-02-14 01:43 MST  
**URL:** http://100.98.139.2:3002  
**Tester:** Claude (automated)

---

## Previous Fix Verification

| # | Fix | Status | Notes |
|---|-----|--------|-------|
| 1 | Spending by Category shows real names | ❌ **NOT FIXED** | All 14 slices show "Uncategorized XX%" despite transactions having real categories |
| 2 | Net Worth matches Accounts page | ❌ **NOT FIXED** | Dashboard: $161,353.93 (positive). Accounts: -$143,119.93. Correct value: -$161,353.93. **Both are wrong.** Dashboard drops the negative sign; Accounts has wrong calculation |
| 3 | Budget Left to Budget uses income | ❌ **PARTIALLY FIXED** | Shows "$-5019.00" — appears to be `0 - totalBudgeted` instead of `income - totalBudgeted` (should be $4114.97 - $5019.00 = -$904.03) |
| 4 | Budget progress bars show real % | ❌ **NOT FIXED** | All individual category progress bars show "0%" despite having spent amounts (e.g., Gas $166.84 of $150 shows 0%) |
| 5 | Add Transaction opens form/modal | ❌ **NOT FIXED** | Button exists but clicking does nothing — no modal/form appears |
| 6 | Transaction column sorting | ⚠️ **UNCLEAR** | Date and Amount headers have sort indicators and cursor:pointer, but clicking Date didn't visibly change order (was already newest-first; may need second click to reverse) |
| 7 | Account names clickable → filtered transactions | ❌ **NOT FIXED** | Clicking "Chase Total Checking" heading on Accounts page does nothing — stays on Accounts |
| 8 | Investment weights sum to ~100% | ⚠️ **PARTIAL** | Pie chart allocation sums to 100% ✅ BUT table Weight column sums to ~200% (showing per-account weights in combined "All Accounts" view: 61.9+23.2+14.8+33.3+29.0+19.6+18.1 = 199.9%) |
| 9 | Edit dialog closes after save | ❓ **UNTESTABLE** | Clicking transaction row doesn't open edit dialog at all |
| 10 | No duplicate login error | ❌ **NOT FIXED** | Console shows: `Login error: Error: Login failed` — the error still fires |
| 11 | Currency formatting | ✅ **FIXED** | Dashboard Cash Flow shows "-$197.75" correctly, not "$-197.75" |

**Score: 1/11 verified fixed, 2 partial, 8 still broken**

---

## New Issues Found

### BUG-R3-01: Apollo GraphQL Cache Errors (HIGH)
**Location:** Console (every page load)  
**Description:** Massive Apollo cache miss errors for Transaction fields: `plaidTransactionId`, `isSplit`, `isTransfer`, `excluded`, `parentTransactionId`, `transferPairId`, `hasReceipt`, `receiptUrl`, `tags`, `subcategory`. Also Account `mask` and Category `icon`, `groupName`.  
**Impact:** These missing fields likely cause the Spending by Category chart to show "Uncategorized" — the `icon` and `groupName` fields aren't being returned by the GraphQL API, so the frontend falls back to defaults.  
**Root Cause:** GraphQL query is not requesting all fields that Apollo's cache policy expects. Need to either update the query to include these fields or update the cache type policy.

### BUG-R3-02: Categories Page — All Show "0 transactions this month" (MEDIUM)
**Location:** /categories  
**Description:** Every category shows "0 transactions this month" despite the Budget page showing spending in Gas ($166.84), Utilities ($322.86), Groceries ($239.51), etc.  
**Expected:** Transaction counts should reflect actual February 2026 data.

### BUG-R3-03: Net Worth Calculation Wrong on BOTH Pages (HIGH)
**Location:** Dashboard + /accounts  
**Details:**
- Banking: $42,271.33 (asset)
- Investment: $104,906.66 (asset)  
- Credit: $2,847.92 (liability)
- Loans: $287,450.00 (liability)
- Other (Toyota Auto Loan): $18,234.00 (liability)
- **Correct Net Worth:** $147,177.99 - $308,531.92 = **-$161,353.93**
- Dashboard shows: $161,353.93 (wrong sign — treats everything as assets)
- Accounts shows: -$143,119.93 (wrong number — unclear calculation)

### BUG-R3-04: Budget Progress Bars All 0% (HIGH)
**Location:** /budget  
**Description:** Despite showing correct spent amounts (e.g., Gas $166.84/$150.00), all progress bar percentages show "0%". The header section correctly shows overall 76% and identifies over-budget categories (Gas 111%, Personal Care 108%, Utilities 108%), but individual category bars are broken.

### BUG-R3-05: Budget "Left to Budget" Formula Wrong (MEDIUM)
**Location:** /budget  
**Description:** Shows "$-5019.00". Formula appears to be `0 - totalBudgeted` instead of `income - totalBudgeted`. Income is $4,114.97, budgeted is $5,019.00, so result should be -$904.03.

### BUG-R3-06: Transaction Edit — Row Click Does Nothing (HIGH)
**Location:** /transactions  
**Description:** Transaction rows have `cursor=pointer` but clicking them doesn't open an edit dialog or navigate anywhere.

### BUG-R3-07: Investment Table Weights Wrong in "All Accounts" View (LOW)
**Location:** /investments  
**Description:** When "All Accounts" is selected, the Weight column shows per-account weights (not portfolio-wide), so they sum to ~200% across 2 accounts. The pie chart is correct.

### BUG-R3-08: Portfolio Value Doesn't Match Accounts (LOW)
**Location:** /investments vs /accounts  
**Description:** Investments shows Portfolio Value $143,092.77 but Accounts page shows Investment total $104,906.66 (Vanguard $89,234.56 + Robinhood $15,672.10). These should reconcile.

### BUG-R3-09: Recurring Items All Show "0 occurrences" (LOW)
**Location:** /recurring  
**Description:** Every recurring item shows "0 occurrences" despite some being marked as paid in the system.

### BUG-R3-10: Rules All Show "0 matches" (LOW)
**Location:** /rules  
**Description:** All 21 rules show "0 matches" despite transactions existing that should match (e.g., "shell" rule should match Shell Gas Station, "chipotle" should match Chipotle Mexican Grill).

---

## Pages Tested & Status

| Page | Status | Notes |
|------|--------|-------|
| Dashboard | ⚠️ | Spending chart broken, net worth wrong, currency fixed |
| Transactions | ⚠️ | Displays correctly, filters work, but Add/Edit broken, sorting unclear |
| Accounts | ⚠️ | Displays correctly, net worth wrong, click-through broken |
| Budget | ⚠️ | Categories/amounts correct, progress bars broken, Left to Budget wrong |
| Goals | ✅ | 4 goals displayed with correct progress, edit/delete buttons present |
| Recurring | ⚠️ | Items display, 0 occurrence counts |
| Categories | ❌ | All show 0 transactions |
| Investments | ⚠️ | Pie chart good, table weights wrong in combined view |
| Reports | ✅ | Charts render, real category names, sensible numbers |
| Rules | ⚠️ | Rules display, 0 match counts |
| Settings | ✅ | Profile, password, preferences tabs present and functional |
| Import | ✅ | Page loads (not deeply tested) |

---

## Console Errors Summary
- **12+ Apollo GraphQL cache miss errors** — missing fields on Transaction, Account, Category types
- **1 Login error** — `Login error: Error: Login failed` still present in console

---

## Priority Recommendations

1. **Fix GraphQL queries** — Add missing fields (`plaidTransactionId`, `isSplit`, `isTransfer`, `excluded`, `parentTransactionId`, `transferPairId`, `hasReceipt`, `receiptUrl`, `tags`, `subcategory`, `mask`, `icon`, `groupName`) to Transaction/Account/Category queries. This likely fixes the Spending by Category chart and Categories page counts.
2. **Fix Net Worth calculation** — Both Dashboard and Accounts pages have different wrong values. Need to properly subtract liabilities.
3. **Fix Budget progress bars** — Individual category bars show 0% despite correct spent amounts.
4. **Fix Add Transaction button** — Wire up click handler to open form/modal.
5. **Fix Transaction row click** — Wire up click handler to open edit dialog.
6. **Fix Budget Left to Budget** — Use actual income in formula.
7. **Fix Account click-through** — Navigate to /transactions?account=X on click.
