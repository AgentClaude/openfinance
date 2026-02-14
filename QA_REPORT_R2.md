# OpenFinance QA Report — Round 2

**Date:** 2026-02-14  
**Tester:** Claude (automated)  
**URL:** http://100.98.139.2:3002  
**Credentials:** demo@openfinance.dev / password123  
**Focus:** Interactive functionality, not just visual checks

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 4 |
| Major | 8 |
| Minor | 7 |
| Cosmetic | 4 |

---

## CRITICAL Issues

### 1. Dashboard: Spending by Category shows ALL categories as "Uncategorized"
- **Page:** `/dashboard`
- **Action:** View Spending by Category pie chart
- **Expected:** Chart legend shows actual category names (Groceries, Utilities, etc.)
- **Actual:** All 14 legend entries show "Uncategorized 51%", "Uncategorized 12%", etc. — no category names displayed
- **Impact:** Primary dashboard visualization is meaningless

### 2. Budget: "Left to Budget" calculation is wrong
- **Page:** `/budget`
- **Action:** View budget summary
- **Expected:** Left to Budget = Income ($4,114.97) - Total Budgeted ($5,019.00) = -$904.03
- **Actual:** Shows "$-5019.00" (appears to be 0 - budgeted, ignoring income entirely)
- **Impact:** Key budget metric is completely wrong

### 3. Budget: All progress bar percentages show 0%
- **Page:** `/budget`
- **Action:** View category progress bars
- **Expected:** Percentage bars reflect spent/budgeted (e.g., Groceries $239.51/$600 = 40%)
- **Actual:** Every category shows "0%" even though spent amounts are displayed correctly
- **Impact:** Budget tracking is non-functional visually

### 4. Accounts vs Dashboard: Net Worth values are inconsistent
- **Page:** `/accounts` vs `/dashboard`
- **Action:** Compare net worth
- **Expected:** Same value on both pages
- **Actual:** Dashboard shows "$161,353.93", Accounts page shows "-$143,119.93"
- **Impact:** Core financial metric contradicts itself across pages

---

## MAJOR Issues

### 5. Transactions: "Add Transaction" button doesn't open a form
- **Page:** `/transactions`
- **Action:** Click "+ Add Transaction" button
- **Expected:** Modal or form to add a new manual transaction
- **Actual:** Nothing happens, no modal/form appears
- **Impact:** Cannot manually add transactions

### 6. Transactions: Column header sorting doesn't work
- **Page:** `/transactions`
- **Action:** Click "Amount" column header
- **Expected:** Table sorts by amount
- **Actual:** No sorting occurs, order unchanged
- **Impact:** Cannot reorder transactions by any column

### 7. Budget: Month navigation arrows don't work
- **Page:** `/budget`
- **Action:** Click left/right arrow buttons next to "February 2026"
- **Expected:** Navigate to previous/next month
- **Actual:** Month stays on February 2026
- **Impact:** Cannot view or manage budgets for other months

### 8. Reports: Income vs Expenses chart is empty
- **Page:** `/reports` (Overview tab)
- **Action:** View Income vs Expenses chart
- **Expected:** Bar chart showing income and expense bars per month
- **Actual:** Chart has axes and labels (Aug 25–Feb 26) but NO bars/data rendered
- **Impact:** Key report visualization is broken

### 9. Categories: All categories show "0 transactions this month"
- **Page:** `/categories`
- **Action:** View category list
- **Expected:** Transaction counts reflecting actual February 2026 data (e.g., Groceries should show several)
- **Actual:** Every category shows "0 transactions this month"
- **Impact:** Category page provides no useful information

### 10. Accounts: Toyota Auto Loan categorized under "Other" instead of "Loans"
- **Page:** `/accounts`
- **Action:** View account groupings
- **Expected:** Toyota Auto Loan ($18,234.00) appears under "Loans" section
- **Actual:** Appears under "Other" section
- **Impact:** Misclassified account affects net worth calculations

### 11. Accounts: Clicking account name doesn't open detail view
- **Page:** `/accounts`
- **Action:** Click "Chase Total Checking" heading
- **Expected:** Account detail view or transactions filtered by account
- **Actual:** Nothing happens
- **Impact:** No way to drill into account details from Accounts page

### 12. Investments: Weight column totals exceed 100%
- **Page:** `/investments`
- **Action:** View Holdings table Weight column
- **Expected:** Weights sum to ~100% of portfolio
- **Actual:** Weights sum to ~199.9% (61.9+23.2+14.8+33.3+29.0+19.6+18.1)
- **Impact:** Portfolio allocation percentages are misleading

---

## MINOR Issues

### 13. Transaction edit: Dialog doesn't close after save
- **Page:** `/transactions` → click transaction → edit → Save Changes
- **Action:** Edit notes, click "Save Changes"
- **Expected:** Dialog closes or shows success feedback, then closes
- **Actual:** Dialog stays open; save does persist, but no UX feedback
- **Impact:** Confusing — user doesn't know if save worked

### 14. Recurring: All items show "0 occurrences"
- **Page:** `/recurring`
- **Action:** View recurring items
- **Expected:** Occurrence count reflecting historical matches
- **Actual:** All show "0 occurrences"
- **Impact:** No history tracking visible

### 15. Rules: All rules show "0 matches"
- **Page:** `/rules`
- **Action:** View rules list
- **Expected:** Match counts reflect how many transactions each rule has matched
- **Actual:** All show "0 matches"
- **Impact:** Can't tell if rules are working

### 16. Login: Error message appears twice
- **Page:** `/login`
- **Action:** Enter wrong password, click Sign in
- **Expected:** Single error message
- **Actual:** "Login failed" paragraph appears twice
- **Impact:** Minor visual duplication

### 17. Dashboard: Pie chart doesn't show tooltips on hover/click
- **Page:** `/dashboard`
- **Action:** Click on pie chart segments
- **Expected:** Tooltip or drill-down showing category details
- **Actual:** No interaction feedback
- **Impact:** Chart is display-only, no interactivity

### 18. Investments: Asset Allocation legend has no category labels
- **Page:** `/investments`
- **Action:** View Asset Allocation donut chart
- **Expected:** Legend shows what each color represents (Stocks, Bonds, etc.)
- **Actual:** Legend shows only percentages (56.9%, 20.4%, 16.5%, 4.0%, 2.2%) with no labels
- **Impact:** Chart is unreadable without context

### 19. Password field not masked on login
- **Page:** `/login`
- **Action:** Type password
- **Expected:** Password characters masked (dots/asterisks)
- **Actual:** Password displayed as plain text (input type=text instead of type=password)
- **Impact:** Security concern in shared environments

---

## COSMETIC Issues

### 20. Settings: Last tab label truncated
- **Page:** `/settings`
- **Action:** View settings tab bar
- **Expected:** All tab labels fully visible
- **Actual:** Last tab(s) truncated — "🔒 S..." visible (Security cut off)
- **Impact:** Tabs exist and work, but labels not fully readable at default width

### 21. Budget: Negative remaining shown as "$-16.84" instead of formatted
- **Page:** `/budget` → Transportation section
- **Action:** View Gas category
- **Expected:** Negative shown as "(-$16.84)" or styled in red
- **Actual:** Shows "$-16.84 remaining"
- **Impact:** Minor formatting inconsistency

### 22. Dashboard: Cash Flow shown with quotes
- **Page:** `/dashboard`
- **Action:** View Cash Flow summary card
- **Expected:** -$197.75
- **Actual:** Rendered as "-$197.75" (with quotes in the DOM)
- **Impact:** Possible rendering artifact

### 23. Budget: "Left to Budget" shows "$-5019.00" with dollar sign before minus
- **Page:** `/budget`
- **Action:** View budget summary (in addition to wrong calculation in #2)
- **Expected:** Consistent negative number formatting
- **Actual:** "$-5019.00" — minus sign after dollar sign
- **Impact:** Minor formatting issue (separate from the calculation bug)

---

## Working Features ✅

| Feature | Status |
|---------|--------|
| Login/Logout | ✅ Works correctly |
| Wrong password error | ✅ Shows error (but duplicated) |
| Transaction search by text | ✅ Filters correctly |
| Transaction filter by account | ✅ Works correctly |
| Transaction filter by category | ✅ Available (not tested in detail) |
| Transaction edit (category, notes) | ✅ Saves and persists |
| Transaction detail modal | ✅ Opens on row click |
| Goals: Create new goal | ✅ Works, count updates |
| Goals: Edit goal | ✅ Modal opens with data |
| Goals: Progress calculations | ✅ Accurate percentages and projections |
| Recurring: Pause/Resume | ✅ Works, item moves to inactive |
| Recurring: Action buttons | ✅ Mark paid, Pause, Edit, Delete all present |
| Rules: Rule display | ✅ All rules render with conditions |
| Settings: All 9 tabs accessible | ✅ Profile, Preferences, Household, Members, Notifications, Tags, Referrals, Security, Data |
| Settings: Profile form | ✅ Name/email editable with Save button |
| Settings: Change Password form | ✅ Current/New/Confirm fields present |
| Import: CSV upload interface | ✅ Account selector + file upload area |
| Investments: Portfolio view | ✅ Charts render, holdings table with gain/loss |
| Reports: Spending by Category | ✅ Real category names with $ amounts and % |
| Reports: Date range selector | ✅ Preset options available |
| Navigation: All sidebar links | ✅ All 12 pages accessible |
| User menu: Dropdown | ✅ Profile, Settings, Sign out options |

---

## Recommendations (Priority Order)

1. **Fix dashboard spending chart** — category names not resolving (likely API returns category IDs but chart shows "Uncategorized")
2. **Fix budget calculations** — Left to Budget formula and progress bar percentages
3. **Reconcile net worth** — Dashboard and Accounts page show different values
4. **Fix Add Transaction** — Button handler appears to be missing or broken
5. **Fix Income vs Expenses chart** — Data exists (summary cards show correct totals) but chart bars don't render
6. **Fix category transaction counts** — Query likely not matching current month
7. **Implement column sorting** — Headers are clickable but no sort logic
8. **Fix budget month navigation** — Arrow buttons don't change month
9. **Fix investment weight calculations** — Weights should sum to 100%
10. **Auto-close transaction edit dialog after save** — Add success feedback
