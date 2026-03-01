# OpenFinance Roadmap

_Last updated: 2026-03-01_
_See MONARCH_FEATURES.md for detailed feature spec and data fields_
_See SPRINT.md for prioritized sprint plan (Sprints 1-3)_

> **Key insight (Feb 2026):** Backend is further along than roadmap suggests.
> Budget query + mutations, recurring items query + detect mutation, and reports query
> (4 report types) all exist. The gap is primarily **rich UI** and some backend enrichment.
> Monarch rebranded to monarch.com and charges $99.99/yr. Their core value props are:
> budgeting, recurring detection, reports/charts, collaboration, and reliable connections.

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

## Phase 4: Plaid Integration ✅
- ✅ Plaid gem installed, config modules
- ✅ Link token creation + exchange services + mutations
- ✅ Transaction sync service
- ✅ Fix Institution model
- ✅ Make job scheduling graceful when Sidekiq unavailable (all jobs use safe_perform_later)
- ✅ Webhook endpoint for real-time transaction updates (PR #60)
- ✅ Connection management UI — reconnect, disconnect, status, error banners (PR #60)
- ⬚ Plaid category → OpenFinance category mapping
- ✅ Update mode for broken connections — ITEM_LOGIN_REQUIRED (PR #60)

## Phase 5: Budget System ✅
_Full budget system with backend + frontend_
- ✅ Budget page UI (monthly view with category groups, progress bars)
- ✅ Month navigation (prev/next arrows)
- ✅ Budget vs actual per category (progress bars: green/yellow/red)
- ✅ Category group subtotals (Housing total, Food total, etc.)
- ✅ Income tracking in budget (planned vs actual)
- ✅ "Left to budget" calculation
- ✅ Copy budget from previous month / fill from averages
- ✅ Budget rollover (backend: rollover_cents column + GraphQL field)
- ⬚ Budget rollover UI (display rollover amounts in frontend)
- ⬚ Flex budget mode (total spending target vs per-category)
- ✅ Over-budget alerts (inline red indicators)
- ✅ Dashboard budget summary widget

## Phase 6: Rules Engine ✅
- ✅ CategorizationRule model → exposed via GraphQL
- ✅ Rule CRUD mutations + UI page (match field, type, value, category, rename)
- ✅ Apply rules button (bulk retroactive application)
- ✅ Toggle rules active/inactive
- ⬚ Create rule from transaction detail ("always categorize X as Y")
- ⬚ Merchant name mapping (raw description → clean name)
- ⬚ Suggested rules based on manual categorization patterns

## Phase 7: Recurring Transactions ✅
- ✅ RecurringItem model → exposed via GraphQL (CRUD + detect mutations)
- ✅ Auto-detection from transaction history (detectRecurringTransactions mutation)
- ✅ Recurring transactions page (748 LOC — list view with status badges)
- ✅ Upcoming bills timeline view (PR #51)
- ✅ Mark as paid/unpaid per month (markRecurringItemPaid mutation)
- ✅ Total monthly recurring calculation
- ✅ Dashboard "upcoming bills" widget
- ⬚ Bill reminder notifications (email/push)

## Phase 8: Reports & Analytics — MEDIUM PRIORITY → Sprint 3
_Backend partially exists: reports query returns monthly_summary, spending_by_category, monthly_spending_by_category, top_merchants_
- ✅ Reports page with report type selector (7 tabs: Overview, Spending, Income vs Expenses, Cash Flow, Merchants, Category Trends, Net Worth)
- ✅ Spending by Category (donut chart + table, date range filter with preset/custom)
- ✅ Spending Over Time (monthly stacked bar chart by top 6 categories)
- ✅ Income vs Expenses (dual bar chart + cumulative savings + monthly comparison table)
- ✅ Cash Flow (area chart, monthly bar, cumulative line + summary table)
- ✅ Net Worth Over Time (area chart with assets/liabilities + net worth line)
- ✅ Category Trends (line chart per category + month-over-month table)
- ✅ Merchant Spending (ranked list with progress bars, transaction counts, percentages)
- ⬚ Report filters (accounts, categories, tags) — date range done
- ⬚ Sankey diagram (income flow to categories)

## Phase 9: Net Worth Page ✅
- ✅ Dedicated Net Worth page (PR #55)
- ✅ Net worth line chart with time range filters
- ✅ Assets vs Liabilities stacked chart
- ✅ Account contribution breakdown
- ✅ Net worth history query + balance snapshots (PR #57)
- ✅ Manual balance update for manual accounts (PR #55)

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
- ✅ Investments page (294 LOC — holdings table, portfolio chart, allocation)
- ✅ Design QA fixes (PR #49)
- ⬚ Benchmark comparison (S&P 500)
- ⬚ Dividend tracking

## Phase 12: Transaction Enhancements ✅
_PR #56_
- ✅ Split transactions (divide into multiple categories)
- ✅ Transfer detection (auto-link matching transactions)
- ✅ Mark as transfer manually
- ✅ Transaction exclusions (from budget, from reports)
- ✅ Inline editing in transaction table
- ⬚ Receipt/attachment upload
- ✅ CSV import (ImportPage — 237 LOC)
- ✅ CSV/data export
- ✅ Bulk actions (mark reviewed, tag, exclude, delete)

## Phase 13: Collaboration — LOWER PRIORITY
- ⬚ Invite partner to household (email invitation flow)
- ⬚ Invite financial advisor (read-only role)
- ⬚ Shared budget/category/goal views
- ⬚ Assign transactions for review to specific person
- ⬚ Activity feed (who categorized what)
- ⬚ Per-user notification preferences

## Phase 14: Settings & Notifications — Partially Done
- ✅ Settings page (867 LOC — profile, password, preferences, dark mode, etc.)
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

## Phase 16: Polish & UX — Partially Done
- ✅ Dark mode (implemented across all pages)
- ⬚ Customizable dashboard widget layout
- ⬚ Account detail page (balance history, filtered transactions)
- ✅ Global search — Cmd+K command palette (transactions, pages, actions) (PR #69)
- ✅ Keyboard shortcuts — Cmd+K, arrow keys, Enter, Escape (PR #69)
- ⬚ Onboarding flow (guided setup)
- ✅ Empty states with guidance (EmptyState component used throughout)

## Phase 17: Authorization & Account Sharing — HIGH PRIORITY
- ⬚ Add Pundit gem for policy-based authorization
- ⬚ Create policies for all models (Account, Transaction, Category, Budget, Goal, etc.)
- ⬚ Replace manual `current_user.household` scoping with Pundit policies
- ⬚ Add Pundit `authorize` calls to every mutation and query resolver
- ⬚ Account-level sharing: share specific accounts (not just whole household)
- ⬚ SharedAccount model (account_id, user_id, permission_level: view/edit)
- ⬚ Invitation flow: invite by email, choose accounts to share, set permissions
- ⬚ Shared accounts appear in invitee's dashboard with badge
- ⬚ Granular permissions: view-only vs full edit per shared account
- ⬚ Audit trail: who changed what on shared accounts
- ⬚ RSpec policy specs for every policy

## Phase 18: Public Marketing Site — Partially Done
- ✅ Landing page (LandingPage.tsx, live at redcanyonlabs.com)
- ⬚ Hero section with app screenshots, feature highlights, pricing comparison vs Monarch ($99/yr)
- ⬚ Feature sections: budgeting, recurring detection, reports, collaboration, dark mode
- ⬚ Real screenshots generated via Playwright script (login → navigate → screenshot each page)
- ⬚ `scripts/update_screenshots.sh` — runs Playwright to capture fresh screenshots of every page
- ⬚ Screenshots stored in `web/public/marketing/` for the landing page
- ⬚ Responsive design (mobile + desktop)
- ⬚ CTA: "Get Started" → register page
- ⬚ SEO meta tags, Open Graph images
- ⬚ Script runs as part of CI or on-demand to keep screenshots current

## Phase 19: Storybook & Component Library
- ⬚ Install Storybook for React
- ⬚ Create stories for all shared components (Button, Modal, Card, Badge, ProgressBar, etc.)
- ⬚ Audit all pages for duplicate UI patterns — extract into reusable components
- ⬚ Shared components: DataTable, StatCard, ChartCard, EmptyState, FormField, FilterBar, DateRangePicker
- ⬚ Design tokens: consistent spacing, colors, typography via Tailwind config
- ⬚ Component documentation with props/variants/examples
- ⬚ Storybook deploy script (static build)

## Phase 19b: Deep Component Consolidation — HIGH PRIORITY
- ⬚ Single Button component (variants: primary, secondary, danger, ghost, link, sizes: sm/md/lg) — replace ALL ad-hoc buttons
- ⬚ Single Modal component (title, body, footer slots, sizes, close on escape/overlay) — replace ALL inline modals
- ⬚ Single Sidebar/AppLayout component — one source of truth for navigation
- ⬚ Single Table/DataTable component — sortable, filterable, paginated — replace all inline tables
- ⬚ Single Card component (header, body, footer slots) — replace all inline card divs
- ⬚ Single Select/Dropdown component — replace all inline selects
- ⬚ Single Input component (text, number, currency, date, search) — replace all inline inputs
- ⬚ Single Badge component (status, category, tag variants)
- ⬚ Single EmptyState component — used on every page when no data
- ⬚ Single LoadingSpinner/Skeleton component
- ⬚ All shared components in Storybook with full variant coverage
- ⬚ Audit EVERY page to use shared components — zero ad-hoc UI elements
- ⬚ Consistent spacing, sizing, and color tokens via Tailwind config

## Phase 20: Provider Adapter Pattern (Plaid/MX/Finicity)
- ⬚ Create `FinancialProvider` adapter interface (abstract base)
- ⬚ Methods: create_link_token, exchange_token, sync_transactions, get_accounts, get_balances
- ⬚ Refactor Plaid services into `Providers::Plaid` adapter implementing the interface
- ⬚ Create `Providers::Mx` adapter (stubbed, same interface)
- ⬚ Create `Providers::Finicity` adapter (stubbed, same interface)
- ⬚ Provider config per AccountConnection (provider_type column)
- ⬚ Factory pattern: `ProviderFactory.for(connection)` returns correct adapter
- ⬚ All sync/link code goes through adapter — never calls Plaid directly
- ⬚ Easy to add new providers: implement interface, register in factory
- ⬚ RSpec shared examples for provider interface compliance

## Phase 21: Custom File Uploads & Manual Balance Management
- ⬚ File upload for statements (PDF, CSV, OFX/QFX)
- ⬚ Parse uploaded files into transactions (CSV parser exists, extend for OFX/PDF)
- ⬚ Manual balance adjustment: set current balance on any account with date
- ⬚ Balance history from manual adjustments (BalanceAdjustment model)
- ⬚ Upload attachments to transactions (receipts, invoices)
- ⬚ ActiveStorage for file management
- ⬚ File preview in transaction detail
- ⬚ Bulk import from uploaded files with preview/mapping step

## Phase 22: Notifications System (Modular)
- ⬚ NotificationType registry: budget_exceeded, bill_due, large_transaction, weekly_digest, goal_milestone, account_sync_error
- ⬚ NotificationPreference model (user_id, notification_type, channel, enabled)
- ⬚ Channels: in_app, email, push (extensible)
- ⬚ NotificationService: checks preferences before sending
- ⬚ In-app notification bell with unread count + dropdown
- ⬚ Notification center page (all notifications, mark read, filter by type)
- ⬚ Settings UI: toggle each notification type per channel (matrix grid)
- ⬚ Modular: new notification types register themselves, auto-appear in preferences
- ⬚ Sidekiq jobs for async delivery
- ⬚ Email templates (ActionMailer) for each type

## Phase 23: Referral Program
- ⬚ Referral model (referrer_id, code, custom_link, clicks, conversions)
- ⬚ Auto-generate unique referral code per user on signup
- ⬚ Referral landing page: /r/:code — tracks click, redirects to register
- ⬚ On registration with referral code: link referral, increment conversion
- ⬚ Reward: 3 months free for referrer (and optionally referee)
- ⬚ Subscription/billing model (even if free tier for now — prep for monetization)
- ⬚ Referral dashboard: see your link, clicks, conversions, rewards earned
- ⬚ Settings > Referral tab with shareable link + copy button
- ⬚ Click tracking (ReferralClick model: ip, user_agent, timestamp)
- ⬚ Admin analytics: top referrers, conversion rate, growth attribution

## Phase 24: Embeddable Widgets & Public API
- ⬚ Public API: REST endpoints for net_worth, daily_spend, monthly_summary, account_balances
- ⬚ API key management (ApiKey model, generate/revoke in settings)
- ⬚ Rate limiting per API key
- ⬚ Embeddable widgets: iframe-ready pages for net_worth_chart, spending_summary, account_balance
- ⬚ Widget customization: theme (light/dark), size, date range, which accounts
- ⬚ Embed code generator in Settings > Widgets (copy HTML snippet)
- ⬚ CORS config for widget domains (user specifies allowed origins)
- ⬚ Public share links: /share/:token — read-only view of specific dashboard/widget
- ⬚ oEmbed support for auto-embedding in blogs/Notion
- ⬚ Webhook support: push events to external URLs (new transaction, budget exceeded, etc.)

## Phase 25: Full QA — Playwright E2E + Manual Browser Audit
- ⬚ Comprehensive Playwright test suite covering EVERY page and feature:
  - Auth: login, register, logout, password change, session persistence
  - Dashboard: all widgets load, click-through to detail pages
  - Accounts: list, add manual, edit, delete, balance history, share
  - Transactions: list, filter, sort, search, add, edit, delete, split, transfer detect/link, bulk actions, inline edit
  - Budget: create, edit, delete items, month navigation, copy/fill, progress bars, category groups
  - Recurring: list, detect, mark paid, CRUD
  - Reports: all chart types, date range filters, account filters, export
  - Goals: create, edit, delete, progress tracking, link accounts
  - Investments: holdings list, portfolio chart, allocation
  - Rules: create, edit, delete, apply, create-from-transaction, suggested rules
  - Categories: CRUD, reorder, icons
  - Import: CSV upload, column mapping, preview, confirm
  - Settings: profile update, password change, preferences, dark mode toggle, notifications, API keys, widgets, members/invites
  - Referral: link generation, copy, dashboard
  - Net Worth: chart, time ranges, account breakdown
  - Collaboration: invite, accept, shared accounts, permissions
  - Marketing: landing page renders, CTAs work, responsive
  - Embeds: widget renders, public API returns data
  - Dark mode: every page renders correctly in both themes
- ⬚ Manual browser QA via OpenClaw browser MCP:
  - Click every button on every page
  - Submit every form with valid AND invalid data
  - Test every filter, sort, and pagination
  - Test every modal open/close/submit
  - Test responsive: mobile, tablet, desktop viewports
  - Test error states: network errors, empty states, loading states
  - Test edge cases: very long text, special characters, zero amounts, negative amounts
  - Verify all toasts/notifications appear correctly
  - Check all links navigate correctly
  - Verify dark mode on every component
- ⬚ Accessibility audit: keyboard navigation, screen reader, ARIA labels, color contrast
- ⬚ Fix all bugs found during QA
- ⬚ QA report: document all findings in AUDIT.md

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
