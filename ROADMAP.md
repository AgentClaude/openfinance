# OpenFinance Roadmap

_Last updated: 2026-02-10_
_See MONARCH_FEATURES.md for detailed feature spec and data fields_

## Legend
- ✅ Done
- 🔧 In Progress
- ⬚ Todo
- 🐛 Bug

---

## Phase 1: Core App (MVP) ✅
- ✅ Rails 8 API + React frontend scaffolded
- ✅ Docker Compose (db, redis, api, web)
- ✅ GraphQL schema + codegen (shared types)
- ✅ JWT auth (login, register)
- ✅ Dashboard with net worth, spending chart, recent transactions
- ✅ Accounts page (list by type, net worth, add manual account)
- ✅ Transactions page (list, add, mobile card layout)
- ✅ Categories page (list, management)
- ✅ Transaction detail slide-over (category, tags, notes, needs review)
- ✅ Seeded demo data (3 accounts, 14 categories, 20+ transactions)

## Phase 2: Bugs & Stability
- ✅ Transaction filtering fixed
- 🔧 Plaid token exchange (Institution model fixed — needs end-to-end retest)
- ✅ Sidekiq container keeps restarting (gem issue) — stable now
- ✅ Leftover E2E test accounts/data polluting DB — E2E uses demo account, no leftover data
- ✅ Web container port mapping (compose says 3002:3000, docker ps shows 3000:3000) — fixed
- ✅ Auth token lost on page reload (duplicate Apollo client using wrong localStorage key; AuthProvider clearing token on network errors)
- ✅ GraphQL requests now proxied through nginx instead of direct CORS calls

## Phase 3: Testing
- ✅ Playwright E2E tests (22 passing)
- ✅ GraphQL codegen for typed frontend
- ✅ RSpec setup
- ✅ Model specs (User, Account, Transaction, Category, AccountConnection, Institution) — 89 specs passing
- ✅ Service specs — Plaid services with WebMock
- ✅ Request specs for GraphQL mutations — 11 specs (login, createManualAccount, createTransaction, updateTransaction, createCategory, deleteCategory)
- ✅ Request specs for GraphQL queries — 10 specs (me, accounts, transactions, categories, dashboardSummary)

## Phase 4: Plaid Integration
- ✅ Plaid gem installed, config modules
- ✅ Link token creation + exchange services + mutations
- ✅ Transaction sync service
- ✅ Fix Institution model
- ✅ Make job scheduling graceful when Sidekiq unavailable (all jobs use safe_perform_later)
- ⬚ Webhook endpoint for real-time transaction updates (TRANSACTIONS.SYNC_UPDATES_AVAILABLE, ITEM.ERROR)
- ⬚ Connection management UI (reconnect, disconnect, status, error banners)
- ⬚ Plaid category → OpenFinance category mapping
- ⬚ Update mode for broken connections (ITEM_LOGIN_REQUIRED)

## Phase 5: Budget System — HIGH PRIORITY
- ⬚ Budget page UI (monthly view with category groups, progress bars)
- ⬚ Month navigation (prev/next arrows, month picker)
- ⬚ Budget vs actual per category (progress bars: green/yellow/red)
- ⬚ Category group subtotals (Housing total, Food total, etc.)
- ⬚ Income tracking in budget (planned vs actual)
- ⬚ "Left to budget" calculation
- ⬚ Copy budget from previous month / fill from averages
- ⬚ Budget rollover (unspent carries forward)
- ⬚ Flex budget mode (total spending target vs per-category)
- ⬚ Over-budget alerts/notifications
- ⬚ Dashboard budget summary widget

## Phase 6: Rules Engine — HIGH PRIORITY
- ⬚ CategorizationRule model (exists) → expose via GraphQL
- ⬚ Rule CRUD mutations + UI page
- ⬚ Create rule from transaction detail ("always categorize X as Y")
- ⬚ Merchant name mapping (raw description → clean name)
- ⬚ Auto-apply rules on new transaction sync
- ⬚ Bulk retroactive rule application
- ⬚ Suggested rules based on manual categorization patterns

## Phase 7: Recurring Transactions — HIGH PRIORITY
- ⬚ RecurringItem model (exists) → expose via GraphQL
- ⬚ Auto-detection from transaction history (pattern matching)
- ⬚ Recurring transactions page (list view)
- ⬚ Upcoming bills view / calendar
- ⬚ Mark as paid/unpaid per month
- ⬚ Total monthly recurring calculation
- ⬚ Dashboard "upcoming bills" widget
- ⬚ Bill reminder notifications

## Phase 8: Reports & Analytics — MEDIUM PRIORITY
- ⬚ Reports page with report type selector
- ⬚ Spending by Category (donut chart + table, date range filter)
- ⬚ Spending Over Time (monthly bar chart, stacked by category)
- ⬚ Income vs Expenses (dual bar chart)
- ⬚ Cash Flow (monthly waterfall)
- ⬚ Net Worth Over Time (line chart from AccountBalanceHistory)
- ⬚ Category Trends (line chart per category over months)
- ⬚ Merchant Spending (top merchants)
- ⬚ Report filters (date range, accounts, categories, tags)
- ⬚ Sankey diagram (income flow to categories)

## Phase 9: Net Worth Page — MEDIUM PRIORITY
- ⬚ Dedicated Net Worth page
- ⬚ Net worth line chart (all-time, 1Y, 6M, 3M, 1M)
- ⬚ Assets vs Liabilities stacked chart
- ⬚ Account contribution breakdown
- ⬚ Daily/weekly balance snapshots (cron job)
- ⬚ Manual balance update for manual accounts

## Phase 10: Goals — MEDIUM PRIORITY
- ⬚ Goal model (exists) → expose via GraphQL + CRUD mutations
- ⬚ Goals page with progress bars
- ⬚ Link accounts to goals
- ⬚ Savings goals (target amount, target date)
- ⬚ Debt payoff goals (decreasing balance tracking)
- ⬚ Monthly contribution tracking
- ⬚ Dashboard goals summary widget
- ⬚ Goal milestones & notifications

## Phase 11: Investment Tracking — MEDIUM PRIORITY
- ⬚ Holdings model (exists) → expose via GraphQL
- ⬚ Security model (exists) → price data sync
- ⬚ Investments page with holdings table
- ⬚ Portfolio performance chart
- ⬚ Asset allocation pie chart
- ⬚ Per-holding detail (cost basis, return)
- ⬚ Benchmark comparison (S&P 500)
- ⬚ Dividend tracking

## Phase 12: Transaction Enhancements — MEDIUM PRIORITY
- ⬚ Split transactions (divide into multiple categories)
- ⬚ Transfer detection (auto-link matching transactions)
- ⬚ Mark as transfer manually
- ⬚ Transaction exclusions (from budget, from reports)
- ⬚ Inline editing in transaction table
- ⬚ Receipt/attachment upload
- ⬚ CSV import (Mint format, generic bank CSV)
- ⬚ CSV/data export
- ⬚ Bulk actions (mark reviewed, tag, exclude, delete)

## Phase 13: Collaboration — LOWER PRIORITY
- ⬚ Invite partner to household (email invitation flow)
- ⬚ Invite financial advisor (read-only role)
- ⬚ Shared budget/category/goal views
- ⬚ Assign transactions for review to specific person
- ⬚ Activity feed (who categorized what)
- ⬚ Per-user notification preferences

## Phase 14: Settings & Notifications — LOWER PRIORITY
- ⬚ Settings page (profile, password change)
- ⬚ Household settings (name, currency, members)
- ⬚ Preferences (date format, first day of week, number format)
- ⬚ Notification preferences UI
- ⬚ Email notifications (weekly digest, budget alerts, bill reminders)
- ⬚ Account management (reconnect, remove, hide from net worth)
- ⬚ Tag management in settings
- ⬚ Data export (full account data)

## Phase 15: Schema Enhancements
- ⬚ Add to Transaction type: notes, isRecurring, isTransfer, transferPairId, isSplit, isExcludedFromBudget, isExcludedFromReports, originalDescription, attachments, reviewedAt
- ⬚ Add to Account type: isHidden, includeInNetWorth, interestRate, creditLimit, availableBalance, lastSyncedAt, syncStatus, color, displayOrder
- ⬚ Add Goal type to schema
- ⬚ Add RecurringItem type to schema  
- ⬚ Add Holding/Security types to schema
- ⬚ Add CategorizationRule type to schema
- ⬚ Add NetWorthSnapshot type to schema
- ⬚ Expand default category seed data to match Monarch's full set

## Phase 16: Polish & UX
- ⬚ Dark mode
- ⬚ Customizable dashboard widget layout
- ⬚ Account detail page (balance history, filtered transactions)
- ⬚ Global search (transactions, accounts, merchants)
- ⬚ Keyboard shortcuts
- ⬚ Onboarding flow (guided setup)
- ⬚ Empty states with guidance

## Phase 17: Deploy
- ⬚ Production Docker config
- ⬚ Tailscale Serve or cloud hosting
- ⬚ SSL/TLS
- ⬚ Backup strategy for Postgres
- ⬚ Plaid production credentials

---

## Notes
- Demo login: demo@openfinance.dev / password123
- API: http://localhost:3001 | Web: http://localhost:3002
- Plaid sandbox credentials configured in .env
- Service object pattern for all business logic
- GraphQL codegen: `cd web && npm run codegen`
- E2E tests: `cd web && npx playwright test`
