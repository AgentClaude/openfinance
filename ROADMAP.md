# OpenFinance Roadmap

_Last updated: 2026-03-05_
_See MONARCH_FEATURES.md for detailed feature spec and data fields_
_See SPRINT.md for prioritized sprint plan (Sprints 1-3)_

> **Status (Mar 2026):** Core app is feature-complete through Phase 17. All Sprint 1-3 items
> done. Phases 1-14 are ✅ or nearly so. 390 RSpec specs, TypeScript clean.
> Remaining work: component consolidation, marketing polish, QA, and deployment.

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

## Phase 2: Bugs & Stability ✅
- ✅ Transaction filtering fixed
- ✅ Plaid token exchange (Institution model fixed)
- ✅ Sidekiq container keeps restarting (gem issue) — stable now
- ✅ Leftover E2E test accounts/data polluting DB — E2E uses demo account, no leftover data
- ✅ Web container port mapping — fixed
- ✅ Auth token lost on page reload — fixed
- ✅ GraphQL requests now proxied through nginx instead of direct CORS calls

## Phase 3: Testing ✅
- ✅ Playwright E2E tests (22 passing)
- ✅ GraphQL codegen for typed frontend
- ✅ RSpec setup — 390 specs passing
- ✅ Model specs (User, Account, Transaction, Category, AccountConnection, Institution)
- ✅ Service specs — Plaid services with WebMock
- ✅ Request specs for GraphQL mutations
- ✅ Request specs for GraphQL queries
- ✅ Job specs (BillReminder, BudgetAlert, LargeTransactionMonitor, WeeklyDigest, DailyBalanceSnapshot)

## Phase 4: Plaid Integration ✅
- ✅ Plaid gem installed, config modules
- ✅ Link token creation + exchange services + mutations
- ✅ Transaction sync service
- ✅ Fix Institution model
- ✅ Make job scheduling graceful when Sidekiq unavailable (all jobs use safe_perform_later)
- ✅ Webhook endpoint for real-time transaction updates (PR #60)
- ✅ Connection management UI — reconnect, disconnect, status, error banners (PR #60)
- ✅ Update mode for broken connections — ITEM_LOGIN_REQUIRED (PR #60)
- ⬚ Plaid category → OpenFinance category mapping

## Phase 5: Budget System ✅
- ✅ Budget page UI (monthly view with category groups, progress bars)
- ✅ Month navigation (prev/next arrows)
- ✅ Budget vs actual per category (progress bars: green/yellow/red)
- ✅ Category group subtotals (Housing total, Food total, etc.)
- ✅ Income tracking in budget (planned vs actual)
- ✅ "Left to budget" calculation
- ✅ Copy budget from previous month / fill from averages
- ✅ Budget rollover (backend + frontend)
- ✅ Over-budget alerts (inline red indicators)
- ✅ Dashboard budget summary widget
- ⬚ Flex budget mode (total spending target vs per-category)

## Phase 6: Rules Engine ✅
- ✅ CategorizationRule model → exposed via GraphQL
- ✅ Rule CRUD mutations + UI page (match field, type, value, category, rename)
- ✅ Apply rules button (bulk retroactive application)
- ✅ Toggle rules active/inactive
- ✅ Create rule from transaction detail
- ✅ Merchant name mapping (MerchantMappingsPage, CRUD mutations, suggest & apply — PR #115)
- ✅ Suggested rules based on manual categorization patterns (PR #115)

## Phase 7: Recurring Transactions ✅
- ✅ RecurringItem model → exposed via GraphQL (CRUD + detect mutations)
- ✅ Auto-detection from transaction history (detectRecurringTransactions mutation)
- ✅ Recurring transactions page (748 LOC — list view with status badges)
- ✅ Upcoming bills timeline view (PR #51)
- ✅ Mark as paid/unpaid per month
- ✅ Total monthly recurring calculation
- ✅ Dashboard "upcoming bills" widget
- ✅ Bill reminder notifications (BillReminderJob, sidekiq-cron)

## Phase 8: Reports & Analytics ✅
- ✅ Reports page with 7 report types (Overview, Spending, Income vs Expenses, Cash Flow, Merchants, Category Trends, Net Worth)
- ✅ Spending by Category (donut chart + table)
- ✅ Spending Over Time (monthly stacked bar chart)
- ✅ Income vs Expenses (dual bar chart + cumulative savings)
- ✅ Cash Flow (area chart, monthly bar, cumulative line)
- ✅ Net Worth Over Time (area chart with assets/liabilities)
- ✅ Category Trends (line chart per category)
- ✅ Merchant Spending (ranked list with progress bars)
- ✅ Report filters (accounts, categories, tags, date range)
- ✅ Sankey diagram (income flow to categories — PR #116)

## Phase 9: Net Worth Page ✅
- ✅ Dedicated Net Worth page (PR #55)
- ✅ Net worth line chart with time range filters
- ✅ Assets vs Liabilities stacked chart
- ✅ Account contribution breakdown
- ✅ Net worth history query + balance snapshots (PR #57)
- ✅ Manual balance update for manual accounts
- ✅ Daily balance snapshot job (sidekiq-cron, 2 AM UTC)
- ✅ Backfill balance history service + mutation + UI button

## Phase 10: Goals ✅
- ✅ Goal model → exposed via GraphQL + CRUD mutations
- ✅ Goals page with progress bars
- ✅ Link accounts to goals
- ✅ Savings goals (target amount, target date)
- ✅ Debt payoff goals
- ✅ Goal edit with icon/color
- ✅ Dashboard goals summary widget (PR #54)
- ⬚ Goal milestones & notifications

## Phase 11: Investment Tracking ✅
- ✅ Holdings model → exposed via GraphQL
- ✅ Security model → price data
- ✅ Investments page (503 LOC — holdings table, portfolio chart, allocation)
- ✅ Design QA fixes (PR #49)
- ⬚ Benchmark comparison (S&P 500)
- ⬚ Dividend tracking

## Phase 12: Transaction Enhancements ✅
- ✅ Split transactions (divide into multiple categories)
- ✅ Transfer detection (auto-link matching transactions)
- ✅ Mark as transfer manually
- ✅ Transaction exclusions (from budget, from reports)
- ✅ Inline editing in transaction table
- ✅ Receipt/attachment upload (ActiveStorage, ReceiptUploadButton)
- ✅ CSV import (ImportPage — 237 LOC)
- ✅ CSV/data export
- ✅ Bulk actions (mark reviewed, tag, exclude, delete)

## Phase 13: Collaboration ✅
- ✅ Invite partner to household (InvitationMailer, email invite flow)
- ✅ Accept invitation page (AcceptInvitationPage with login/register redirect)
- ✅ Cancel invitation mutation + UI
- ✅ Member management in Settings (invite, remove, update role)
- ✅ Activity feed — track household actions (ActivityPage, DashboardActivityWidget — PR #120)
- ✅ Shared budget/category/goal views (household-scoped by default)
- ⬚ Invite financial advisor (read-only role)
- ⬚ Assign transactions for review to specific person
- ⬚ Per-user notification preferences (model exists, UI partially done)

## Phase 14: Settings & Notifications ✅
- ✅ Settings page (952 LOC — 9 tabs: profile, preferences, household, members, notifications, tags, referrals, security, data)
- ✅ Household settings (name, currency, timezone)
- ✅ Preferences (date format, number format, dark mode, first day of week)
- ✅ Notification preferences UI (matrix grid: 5 types × 3 channels)
- ✅ Email notifications (weekly digest, budget alerts, bill reminders, large transactions)
- ✅ Notification delivery system (NotificationService, NotificationDeliveryJob)
- ✅ In-app notifications page (NotificationsPage — 224 LOC, mark read, filter)
- ✅ Tag management in settings (create, edit, delete with usage counts — PR #119)
- ✅ Data export
- ✅ Account management in Settings (delete account)

## Phase 15: Schema Enhancements — Mostly Done
- ✅ Transaction type: notes, isRecurring, isTransfer, transferPairId, isSplit, isExcludedFromBudget, isExcludedFromReports, originalDescription, attachments
- ✅ Account type: isHidden, includeInNetWorth
- ✅ Goal type in schema
- ✅ RecurringItem type in schema
- ✅ Holding/Security types in schema
- ✅ CategorizationRule type in schema
- ✅ NetWorthSnapshot type in schema
- ⬚ Expand default category seed data to match Monarch's full set

## Phase 16: Polish & UX — Mostly Done
- ✅ Dark mode (implemented across all pages)
- ✅ Customizable dashboard widget layout (PR #111 — toggle visibility, reorder, persist to localStorage)
- ✅ Account detail page (302 LOC — balance history, filtered transactions, manual balance update)
- ✅ Global search — Cmd+K command palette (PR #69)
- ✅ Keyboard shortcuts (PR #69)
- ✅ Onboarding flow (OnboardingWizard — 300 LOC, 3-step wizard with account creation)
- ✅ Empty states with guidance (EmptyState component used throughout)
- ✅ Load More pagination on Transactions page

## Phase 17: Authorization ✅
- ✅ Pundit gem installed with policies for all models (12 policies)
- ✅ ApplicationPolicy base with household scoping
- ✅ authorize() calls in all mutations
- ✅ Household-scoped queries
- ⬚ SharedAccount model exists but UI not built (account-level sharing vs whole household)
- ⬚ Granular permissions (view-only vs full edit per shared account)

## Phase 18: Public Marketing Site — Partially Done
- ✅ Landing page (LandingPage.tsx, enhanced with real screenshots and comparison table — PR #118)
- ⬚ SEO meta tags, Open Graph images
- ⬚ Responsive audit for marketing pages
- ⬚ `scripts/update_screenshots.sh` — automated Playwright screenshot capture

## Phase 19: Storybook & Component Library
- ⬚ Install Storybook for React
- ⬚ Create stories for all shared components
- ⬚ Component documentation with props/variants/examples

## Phase 19b: Deep Component Consolidation — IN PROGRESS
- ✅ Remove duplicate components (Button, LoadingSpinner) — canonical versions in ui/
- ✅ Migrate InvestmentsPage, NetWorthPage, ReportsPage inline tables → DataTable
- ✅ Migrate InvestmentsPage inline cards → StatCard + ChartCard
- ✅ Shared ui/ library exists (Button, Input, Select, Card, Badge, ProgressBar, LoadingSpinner, EmptyState, PageHeader, AmountDisplay, CategoryIcon, Toast)
- ⬚ Audit remaining pages for duplicate UI patterns (ImportPage, SettingsPage tables)
- ⬚ Consistent spacing, sizing, and color tokens via Tailwind config

## Phase 20: Provider Adapter Pattern (Plaid/MX/Finicity)
- ⬚ Create `FinancialProvider` adapter interface
- ⬚ Refactor Plaid services into adapter
- ⬚ Stub MX and Finicity adapters

## Phase 21: Custom File Uploads & Manual Balance Management — Partially Done
- ✅ Receipt upload for transactions (ActiveStorage)
- ✅ CSV import with preview/mapping (ImportPage)
- ✅ Manual balance adjustment (BalanceAdjustment model, AdjustBalanceModal)
- ✅ Account statements attachment (has_many_attached :statements)
- ⬚ OFX/QFX/PDF statement parsing

## Phase 22: Notifications System — Done
- ✅ Notification types: budget_exceeded, bill_due, large_transaction, weekly_digest, goal_milestone, sync_error, low_balance, security_alert
- ✅ NotificationPreference model (user, type, channel, enabled)
- ✅ Channels: in_app, email (push stubbed)
- ✅ In-app notification bell + NotificationsPage
- ✅ Settings UI with notification type × channel matrix
- ✅ Sidekiq jobs for async delivery
- ✅ Email templates (ActionMailer) for budget alerts, bill reminders, weekly digest, large transactions

## Phase 23: Referral Program — Backend Done
- ✅ Referral model (referrer_id, code, clicks, conversions)
- ✅ Referral tracking in Settings page (referrals tab)
- ⬚ Referral landing page (/r/:code click tracking)
- ⬚ Subscription/billing model

## Phase 24: Embeddable Widgets & Public API
- ⬚ Public API: REST endpoints for net_worth, daily_spend, monthly_summary
- ⬚ API key management (ApiKey model exists, UI references exist but backend queries/mutations incomplete)
- ⬚ Embeddable widgets (iframe-ready pages)
- ⬚ Webhook support

## Phase 25: Full QA — Playwright E2E + Manual Browser Audit
- ⬚ Comprehensive Playwright test suite covering EVERY page
- ⬚ Manual browser QA
- ⬚ Accessibility audit
- ⬚ QA report in AUDIT.md

## Phase 26: Deploy
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
- RSpec: `docker compose exec api bundle exec rspec` (390 specs)
