# OpenFinance QA Report — Round 4

**Date:** 2026-02-14 02:15 MST  
**Build:** Post PRs #45, #46, #47  
**URL:** http://100.98.139.2:3002  
**Tester:** Claude (automated browser QA)

---

## Checklist Results

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | Dashboard Spending by Category — real names | ✅ FIXED | Shows Rent & Mortgage, Transfer, Auto Payment, Utilities, Groceries, Gas, Insurance, Shopping — no "Uncategorized" |
| 2 | Dashboard Net Worth — correct | ✅ FIXED | -$161,353.93 = Assets ($147,177.99) - Liabilities ($308,531.92). Math checks out. |
| 3 | Budget Left to Budget — uses actual income | ✅ FIXED | Income $4,114.97, Budgeted $5,019.00, Left to Budget -$904.03 (= Income - Budgeted) |
| 4 | Budget progress bars — real percentages | ✅ FIXED | Gas 111%, Personal Care 108%, Utilities 108%, Insurance 100%, Groceries 40%, Restaurants 31%, Coffee 26%, etc. |
| 5 | Add Transaction button — works | ❌ STILL BROKEN | Button exists and is clickable but nothing happens — no dialog, no form, no modal appears. Tested multiple times. |
| 6 | Transaction column sorting — works | ✅ FIXED | Clicking Date header toggles between descending (Feb 15 first) and ascending (Feb 8 first) |
| 7 | Transaction row click — opens edit panel | ✅ FIXED | Side panel opens with Transaction Details, category dropdown, tags, notes, review toggle, Save/Cancel buttons |
| 8 | Account names clickable — navigate to transactions | ✅ FIXED | Account names have cursor:pointer + onclick. Clicking "Chase Total Checking" navigates to `/transactions?accountId=...` |
| 9 | Investment weights — sum to ~100% | ✅ FIXED | Holdings: 54.5% + 20.4% + 13.1% + 4.0% + 3.5% + 2.4% + 2.2% = 100.1%. Pie chart correctly aggregates dupes (VOO 56.9%, MSFT 16.5%). |
| 10 | Edit dialog closes after save | ⚠️ PARTIAL | Side panel stays open after clicking "Save Changes". This may be intentional (inline panel vs modal), but if the spec says it should close, it doesn't. |
| 11 | No duplicate login error | ✅ FIXED | App loaded directly to dashboard, already authenticated. No error toasts or duplicate login messages visible. |
| 12 | Currency formatting correct | ✅ FIXED | Consistent USD formatting throughout: $4,521.33, -$161,353.93, $3,500.00, -$67.94, etc. |
| 13 | Categories show transaction counts | ✅ FIXED | All 20 categories show "N transaction(s) this month" — e.g., Salary 1, Utilities 4, Subscriptions 5, Groceries 2 |
| 14 | Reports Income vs Expenses chart renders | ✅ FIXED | Chart renders with 7 months of data (Aug 25 – Feb 26), shows Income/Expenses bars with axis labels. Summary stats: 45.4% savings rate. |
| 15 | Apollo cache — no missing field warnings | ⚠️ PARTIAL | No missing field warnings. However, 3 recurring Apollo deprecation warnings per navigation: (1) `connectToDevTools` → use `devtools.enabled`, (2) `useQuery` `onCompleted` deprecated, (3) `useQuery` `onError` deprecated. Not cache errors, but noisy. |

---

## Summary

- **✅ FIXED:** 12/15
- **⚠️ PARTIAL:** 2/15
- **❌ STILL BROKEN:** 1/15

## Critical Issue

**Add Transaction button (#5):** The button renders and is clickable but produces no visible UI. No dialog, form, or modal appears. This is a core workflow — users cannot manually add transactions.

## Minor Issues

- **Edit panel after save (#10):** Side panel remains open after saving. If this is by design for quick multi-edit workflows, it's fine. If users expect it to close, add auto-dismiss or a success toast.
- **Apollo deprecation warnings (#15):** 3 warnings fire on every page navigation. Not user-facing but clutters dev console. Low priority — update to Apollo 3.14+ patterns when convenient.

## Additional Observations

- **Data quality is excellent** — realistic demo data with proper merchant names, varied categories, pending transactions, multi-account support
- **No console errors** — zero JS errors across all pages tested (Dashboard, Transactions, Accounts, Budget, Categories, Investments, Reports)
- **All pages load cleanly** — no blank states, no spinners stuck, no missing data
- **Transfer detection feature** — nice touch with the "Possible Transfers" / "Detect Transfers" button on transactions page
- **Budget UX** — over-budget categories (Gas, Utilities, Personal Care) highlighted with alert banner. Good UX.
- **Investment portfolio** — holdings table includes gain/loss % and weight. Pie chart correctly aggregates same-ticker holdings across accounts.
