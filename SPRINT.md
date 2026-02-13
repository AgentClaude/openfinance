# OpenFinance Sprint Plan

_Last updated: 2026-02-13_
_Derived from ROADMAP.md, MONARCH_FEATURES.md, and Monarch Money research_

---

## Current State Summary

**Done:** Phases 1-4 (core app, stability, testing, Plaid) + Phase 6 (rules engine)
**Backend exists but UI incomplete:** Budget (query + mutations), Recurring (query + detect mutation), Reports (query with 4 report types)
**Frontend shells exist:** BudgetPage (330 LOC), RecurringPage (215 LOC), ReportsPage (393 LOC)

**Key insight:** The backend is further along than the roadmap suggests. The `budget` query, `copyBudgetFromMonth`, `fillBudgetFromAverages`, `detectRecurringTransactions` mutations, and `reports` query all exist. The gap is primarily **UI/UX** and some backend enrichment.

---

## Sprint 1: Budget System (Phase 5) — 2 weeks
_The killer feature. This is what makes a finance app useful vs a glorified transaction viewer._

### Why First
Monarch's #1 differentiator is budgeting. Every review mentions it. Without budgets, OpenFinance is just a read-only transaction aggregator.

### Backend Tasks

| # | Task | Details |
|---|------|---------|
| 1.1 | **Add `spent` computed field to BudgetItemType** | Query actual spending for that category+month from transactions. This is the core budget-vs-actual calculation. |
| 1.2 | **Add `rollover` field to BudgetItem model** | Migration: `add_column :budget_items, :rollover_cents, :integer, default: 0`. Carry unspent from previous month. |
| 1.3 | **Budget summary query** | New field on QueryType: `budgetSummary(month: String!)` → returns `{ totalBudgeted, totalSpent, totalIncome, incomeActual, leftToBudget, categoryGroups: [{ name, budgeted, spent, items }] }` |
| 1.4 | **Ensure Budget auto-created** | When user first hits budget page, auto-create a Budget record for the household if none exists. |
| 1.5 | **Upsert mutation** | Change `updateBudgetItem` to upsert — create if not exists for that category+month, update if exists. Single mutation simplifies UI. |
| 1.6 | **Income budget items** | Allow BudgetItems for income categories (planned income). Filter by category.group_name == 'Income'. |

#### GraphQL Schema Additions
```graphql
type BudgetSummary {
  month: String!
  totalBudgeted: Float!
  totalSpent: Float!
  totalIncome: Float!
  incomeActual: Float!
  leftToBudget: Float!
  categoryGroups: [BudgetCategoryGroup!]!
}

type BudgetCategoryGroup {
  name: String!            # "Housing", "Food & Drink", etc.
  budgeted: Float!
  spent: Float!
  items: [BudgetItemWithSpent!]!
}

type BudgetItemWithSpent {
  id: ID!
  category: Category!
  budgeted: Float!
  spent: Float!            # computed from transactions
  rollover: Float!
  available: Float!        # budgeted + rollover - spent
  percentUsed: Float!      # spent / budgeted * 100
}

# Mutations (existing ones enhanced)
mutation upsertBudgetItem(categoryId: ID!, month: String!, amount: Float!): BudgetItem
mutation copyBudgetFromMonth(sourceMonth: String!, targetMonth: String!): [BudgetItem]  # exists
mutation fillBudgetFromAverages(month: String!, months: Int): [BudgetItem]              # exists
```

### Frontend Tasks

| # | Task | Details |
|---|------|---------|
| 1.7 | **Month navigation bar** | Top bar: `← February 2026 →` with month/year picker. Shared component for Budget + Reports. |
| 1.8 | **Budget summary header** | Cards: Total Budgeted | Total Spent | Left to Budget | Income (planned vs actual) |
| 1.9 | **Category group sections** | Collapsible sections: Housing, Food & Drink, Transportation, etc. Each shows group subtotal. |
| 1.10 | **Budget row component** | Per-category row: icon + name | editable budgeted amount | spent | progress bar | remaining. Progress bar: green (<80%), yellow (80-100%), red (>100%). |
| 1.11 | **Inline budget editing** | Click budgeted amount → inline input → blur/enter saves via upsertBudgetItem. |
| 1.12 | **Quick-fill actions** | Toolbar buttons: "Copy from last month" | "Fill from 3-month average" | "Fill from 6-month average". Use existing mutations. |
| 1.13 | **Category drill-down** | Click category name → navigate to Transactions page filtered by that category + month. |
| 1.14 | **Dashboard budget widget** | Add budget summary card to DashboardPage: "Budget: $X spent of $Y" with mini progress bar. |
| 1.15 | **Empty state** | First visit: "Set up your first budget" with quick-fill from averages CTA. |

### UI Components to Build
- `<MonthNavigator />` — reusable month prev/next/picker
- `<BudgetHeader />` — summary cards
- `<BudgetCategoryGroup />` — collapsible group with subtotal
- `<BudgetRow />` — single category row with progress bar + inline edit
- `<ProgressBar />` — reusable, color-coded by percentage
- `<DashboardBudgetWidget />` — compact budget summary for dashboard

### Tests
- RSpec: BudgetSummary query returns correct computed spent amounts
- RSpec: Upsert mutation creates and updates correctly
- RSpec: Rollover calculation
- Playwright: Navigate months, edit budget amount, verify progress bar updates

### Definition of Done
- [ ] User can view budget by month with category groups
- [ ] User can set/edit budgeted amounts inline
- [ ] Progress bars show green/yellow/red based on spending
- [ ] Copy from previous month works
- [ ] Fill from averages works
- [ ] Dashboard shows budget summary widget
- [ ] Left-to-budget calculation is correct

---

## Sprint 2: Recurring Transactions (Phase 7) — 1.5 weeks
_Bills and subscriptions — users need to know what's coming._

### Why Second
Monarch auto-detects recurring transactions and shows upcoming bills. This is table-stakes for a personal finance app and feeds into the budget system (knowing fixed vs variable expenses).

### Backend Tasks

| # | Task | Details |
|---|------|---------|
| 2.1 | **Enhance DetectRecurringTransactions** | Improve pattern matching: group by merchant_name, find transactions with consistent intervals (±5 days). Calculate frequency, average amount, next expected date. |
| 2.2 | **RecurringItem CRUD mutations** | `createRecurringItem`, `updateRecurringItem`, `deleteRecurringItem`. Manual creation for bills not auto-detected. |
| 2.3 | **Mark as paid mutation** | `markRecurringItemPaid(id: ID!, month: String!, transactionId: ID)` — link a transaction to the recurring item for that month. |
| 2.4 | **Upcoming bills query** | `upcomingBills(days: Int = 30): [RecurringItem]` — sorted by next_occurrence, filtered to active items due within N days. |
| 2.5 | **Monthly recurring total** | Computed field on RecurringItem query: sum of `estimatedMonthlyAmount` for all active items. |
| 2.6 | **RecurringItem ↔ Transaction link** | Add `recurring_item_id` to transactions table. When a recurring transaction matches, link them. |

#### GraphQL Schema Additions
```graphql
type RecurringItemSummary {
  totalMonthlyExpenses: Float!
  totalMonthlyIncome: Float!
  items: [RecurringItem!]!
  upcomingCount: Int!
  overdueCount: Int!
}

mutation createRecurringItem(input: RecurringItemInput!): RecurringItem
mutation updateRecurringItem(id: ID!, input: RecurringItemInput!): RecurringItem
mutation deleteRecurringItem(id: ID!): Boolean
mutation markRecurringItemPaid(id: ID!, month: String!, transactionId: ID): RecurringItem
```

### Frontend Tasks

| # | Task | Details |
|---|------|---------|
| 2.7 | **Recurring page — list view** | Table: merchant/name | amount | frequency | next date | status badge (paid/upcoming/overdue). Sort by next_occurrence. |
| 2.8 | **Summary header** | Cards: Monthly Recurring Expenses | Monthly Recurring Income | Upcoming This Week | Overdue |
| 2.9 | **Status badges** | Green "Paid", Yellow "Upcoming", Red "Overdue", Gray "Paused" |
| 2.10 | **Add recurring item modal** | Form: name, amount, frequency, next date, category, account. For manually adding bills. |
| 2.11 | **Auto-detect button** | "Scan for recurring" button → calls detectRecurringTransactions → shows detected items for confirmation. |
| 2.12 | **Calendar view (stretch)** | Monthly calendar with bills on their expected dates. Color-coded by status. |
| 2.13 | **Dashboard upcoming bills widget** | Show next 3-5 upcoming bills on dashboard. |
| 2.14 | **Mark as paid** | Click row → mark paid for current month, optionally link to a matched transaction. |

### UI Components
- `<RecurringList />` — sortable table with status badges
- `<RecurringSummary />` — header cards
- `<RecurringItemForm />` — create/edit modal
- `<StatusBadge />` — reusable paid/upcoming/overdue badge
- `<DashboardBillsWidget />` — upcoming bills for dashboard
- `<BillCalendar />` (stretch) — month calendar view

### Tests
- RSpec: Detection algorithm finds monthly patterns correctly
- RSpec: CRUD mutations for RecurringItem
- RSpec: Mark as paid links transaction
- Playwright: View recurring items, add manual item, detect recurring

### Definition of Done
- [ ] Auto-detection finds recurring transactions from history
- [ ] User can view all recurring items with status
- [ ] User can manually add/edit/delete recurring items
- [ ] Mark as paid works
- [ ] Dashboard shows upcoming bills
- [ ] Monthly total calculation is correct

---

## Sprint 3: Reports & Analytics (Phase 8) — 2 weeks
_Turn data into insights. The reports backend already exists — this is primarily UI._

### Why Third
The `reports` query already returns monthly_summary, spending_by_category, monthly_spending_by_category, and top_merchants. The backend is ~80% done. This sprint is mostly building rich chart UIs.

### Backend Tasks

| # | Task | Details |
|---|------|---------|
| 3.1 | **Net worth over time query** | `netWorthHistory(months: Int): [{ date, assets, liabilities, netWorth }]`. Query AccountBalanceHistory or compute from snapshots. |
| 3.2 | **Category trends query** | `categoryTrends(categoryIds: [ID!], months: Int): [{ month, categoryId, categoryName, amount }]`. Monthly spending for specific categories over time. |
| 3.3 | **Report filters: account + tag** | Add `accountIds: [ID]` and `tagIds: [ID]` filters to the existing `reports` query. |
| 3.4 | **Cash flow report** | Enhance monthly_summary with running net cash flow. Already partially there. |
| 3.5 | **Balance snapshot cron** | Sidekiq job: daily, snapshot all account balances into AccountBalanceHistory. Needed for net worth chart. |

#### GraphQL Schema Additions
```graphql
# Add to QueryType
field :netWorthHistory, [NetWorthSnapshot], null: false do
  argument :months, Integer, required: false, default_value: 12
end

field :categoryTrends, [CategoryTrendPoint], null: false do
  argument :category_ids, [ID], required: true
  argument :months, Integer, required: false, default_value: 6
end

type NetWorthSnapshot {
  date: String!
  assets: Float!
  liabilities: Float!
  netWorth: Float!
}

type CategoryTrendPoint {
  month: String!
  categoryId: ID!
  categoryName: String!
  amount: Float!
}

# Enhance existing reports query with filters
field :reports ... do
  argument :account_ids, [ID], required: false
  argument :tag_ids, [ID], required: false
  argument :exclude_transfers, Boolean, required: false, default_value: true
end
```

### Frontend Tasks

| # | Task | Details |
|---|------|---------|
| 3.6 | **Reports page layout** | Report type selector (tabs or sidebar): Spending by Category, Spending Over Time, Income vs Expenses, Cash Flow, Net Worth, Category Trends, Top Merchants. |
| 3.7 | **Date range filter bar** | Presets: This Month, Last Month, Last 3M, Last 6M, Last 12M, YTD, Custom. Shared across all reports. |
| 3.8 | **Spending by Category** | Donut chart (recharts) + table with amounts and percentages. Click category → drill to transactions. |
| 3.9 | **Spending Over Time** | Stacked bar chart by month, colored by category. Toggle stacked/grouped. Uses monthly_spending_by_category. |
| 3.10 | **Income vs Expenses** | Dual bar chart (green income, red expenses) by month. Net cash flow line overlay. |
| 3.11 | **Cash Flow** | Monthly bars showing income - expenses. Cumulative line. |
| 3.12 | **Net Worth Over Time** | Line chart with assets (green area), liabilities (red area), net worth (bold line). Time range selector. |
| 3.13 | **Category Trends** | Multi-line chart. User picks 1-5 categories, see spending per month. |
| 3.14 | **Top Merchants** | Horizontal bar chart + table. Top 10-20 merchants by spending. |
| 3.15 | **Account/tag filters** | Multi-select dropdowns to filter reports by specific accounts or tags. |
| 3.16 | **Sankey diagram (stretch)** | Income sources → expense categories flow diagram. Use a library like `react-sankey` or d3-sankey. |

### UI Components
- `<ReportSelector />` — tab/sidebar navigation between report types
- `<DateRangeFilter />` — preset buttons + custom date picker (reuse with budget)
- `<DonutChart />` — recharts PieChart wrapper
- `<StackedBarChart />` — recharts BarChart wrapper
- `<DualBarChart />` — income vs expenses
- `<LineChart />` — for net worth, category trends
- `<HorizontalBarChart />` — for top merchants
- `<ReportFilterBar />` — account + tag multi-select
- `<ReportTable />` — data table companion to each chart

### Chart Library
Already using **recharts** (check package.json). All charts built with recharts components: `PieChart`, `BarChart`, `LineChart`, `AreaChart`, `ResponsiveContainer`.

### Tests
- RSpec: Net worth history returns correct snapshots
- RSpec: Category trends query
- RSpec: Report filters by account/tag
- Playwright: Switch between report types, change date range, verify charts render

### Definition of Done
- [ ] 7 report types accessible from Reports page
- [ ] Date range filtering works across all reports
- [ ] Charts render with real data
- [ ] Net worth history chart works (requires balance snapshots)
- [ ] Category drill-down from charts to transactions
- [ ] Account/tag filters work

---

## Sprint Priorities After These Three

| Priority | Phase | Effort | Notes |
|----------|-------|--------|-------|
| 4 | Net Worth Page (Phase 9) | 1 week | Depends on Sprint 3 balance snapshots. Mostly UI. |
| 5 | Transaction Enhancements (Phase 12) | 2 weeks | Split transactions, transfer detection, CSV import/export. High user value. |
| 6 | Goals (Phase 10) | 1.5 weeks | Model exists. CRUD + UI + dashboard widget. |
| 7 | Plaid hardening (Phase 4 remainder) | 1 week | Webhooks, connection management UI, error handling. |
| 8 | Settings Page (Phase 14) | 1 week | Profile, preferences, notification prefs. |
| 9 | Investment Tracking (Phase 11) | 2 weeks | Holdings/Security models exist. Need price sync + rich UI. |
| 10 | Collaboration (Phase 13) | 2 weeks | Invitation flow, shared access. Lower priority for single-user. |

---

## Key Monarch Differentiators We Should Match

1. **Budget + actual in one view** — Sprint 1 ✓
2. **Auto-detected recurring/subscriptions** — Sprint 2 ✓
3. **Rich reports with charts** — Sprint 3 ✓
4. **Collaboration at no extra cost** — Phase 13 (later)
5. **Reliable bank connections** — Phase 4 hardening
6. **Clean, modern UI** — ongoing polish

## Technical Notes

- **GraphQL codegen** must be re-run after any schema changes: `cd web && npm run codegen`
- **Recharts** is the chart library — avoid adding a second one
- **Tailwind CSS** for all styling — use existing design tokens
- **Budget model** already exists with `is_active` flag — auto-create on first budget page visit
- **RecurringItem model** is complete — just needs CRUD mutations and richer UI
- **AccountBalanceHistory model** exists but isn't populated — Sprint 3 adds the daily snapshot job
