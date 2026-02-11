# OpenFinance Roadmap

_Last updated: 2026-02-10_

## Legend
- ✅ Done
- 🔧 In Progress
- ⬚ Todo
- 🐛 Bug

---

## Phase 1: Core App (MVP)
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
- ✅ Transaction filtering fixed (frontend now strips empty strings/null before sending to Apollo)
- 🔧 Plaid token exchange (Institution model fixed, exchange service hardened — needs end-to-end retest)
- 🐛 Sidekiq container keeps restarting (gem issue)
- 🐛 Leftover E2E test accounts/data polluting DB
- 🔧 Web container port mapping (compose says 3002:3000, docker ps shows 3000:3000)

## Phase 3: Testing
- ✅ Playwright E2E tests (22 passing — login, dashboard, accounts, transactions, categories)
- ✅ GraphQL codegen for typed frontend
- ✅ RSpec setup (rspec-rails, factory_bot, shoulda-matchers)
- ⬚ Model specs (User, Account, Transaction, Category, AccountConnection, Institution)
- ✅ Service specs — Plaid services with WebMock (create_link_token, exchange_public_token, sync_transactions)
- ⬚ Request specs for GraphQL mutations (login, register, CRUD transactions, Plaid flow)
- ⬚ Request specs for GraphQL queries (transactions with filters, accounts, dashboard)

## Phase 4: Plaid Integration
- ✅ Plaid gem installed, PlaidConfig/PlaidErrorHandler modules
- ✅ Link token creation service + mutation
- ✅ Public token exchange service + mutation
- ✅ Transaction sync service
- ✅ Fix Institution model (color → primary_color)
- 🐛 Make job scheduling graceful when Sidekiq unavailable
- ⬚ Webhook endpoint for real-time transaction updates
- ⬚ Connection management UI (reconnect, disconnect, status)
- ⬚ Automatic transaction categorization from Plaid categories

## Phase 5: Budget & Goals
- ⬚ Budget page UI (monthly budget by category)
- ⬚ Budget CRUD mutations
- ⬚ Budget vs actual spending comparison
- ⬚ Financial goals (savings targets, debt payoff)
- ⬚ Goal progress tracking

## Phase 6: Polish & Features
- ⬚ Settings page (profile, household, preferences)
- ⬚ Transaction editing inline in table (not just slide-over)
- ⬚ Transaction rules (auto-categorize by merchant)
- ⬚ Recurring transaction detection
- ⬚ Net worth history chart
- ⬚ Monthly/weekly spending trends
- ⬚ Export (CSV, PDF reports)
- ⬚ Dark mode

## Phase 7: Deploy
- ⬚ Production Docker config
- ⬚ Tailscale Serve or cloud hosting
- ⬚ SSL/TLS
- ⬚ Backup strategy for Postgres

---

## Notes
- Demo login: demo@openfinance.dev / password123
- API: http://localhost:3001 | Web: http://localhost:3002
- Plaid sandbox credentials configured in .env
- Service object pattern for all business logic
- GraphQL codegen: `cd web && npm run codegen`
- E2E tests: `cd web && npx playwright test`
