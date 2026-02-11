# Monarch Money — Complete Feature Spec for OpenFinance

_Last updated: 2026-02-10_

This document details every known Monarch Money feature, data field, and UI pattern to guide the OpenFinance clone build. Status indicators show what we've built (✅), partially built (🔶), or missing (❌).

---

## 1. Navigation & App Structure

**Monarch's left sidebar navigation:**
- Dashboard (home)
- Transactions
- Recurring
- Budgets (with monthly selector)
- Goals
- Net Worth
- Investments
- Reports
- Accounts
- Settings (gear icon, bottom)

**Our current sidebar:** Dashboard, Transactions, Accounts, Categories, Budget
**Missing pages:** ❌ Recurring, ❌ Goals, ❌ Net Worth, ❌ Investments, ❌ Reports, ❌ Settings

**Other structural elements:**
- Top bar: search (global transaction search), notifications bell, profile avatar dropdown
- Mobile: bottom tab bar (Dashboard, Transactions, Budget, More)
- iPad: sidebar + detail pane layout
- Web/iOS/Android apps

---

## 2. Dashboard

### Monarch's Dashboard
- **Net Worth card** — total net worth with % change from last month, sparkline chart
- **Cash Flow card** — income vs expenses for current month, bar chart
- **Spending by category** — donut/pie chart, top categories listed
- **Recent transactions** — last ~5-10 transactions, quick review
- **Budget summary** — how much spent vs budgeted this month, progress bar
- **Upcoming bills** — next few recurring charges
- **Goals progress** — summary of active goals
- **Accounts overview** — grouped by type (checking, savings, credit, investment)
- **Needs Review badge** — count of uncategorized/unreviewed transactions
- Customizable widget layout (can reorder/hide widgets)

### Our Status
- ✅ Net worth card, cash flow, spending by category donut, recent transactions, account balances
- ❌ Budget summary widget, upcoming bills, goals progress, customizable layout

### Dashboard Data Fields
```
DashboardSummary {
  netWorth: Float
  netWorthChange: Float          # ✅
  netWorthChangePercent: Float   # ❌
  monthlyIncome: Float           # ✅
  monthlyExpenses: Float         # ✅
  cashFlow: Float                # ✅
  needsReviewCount: Int          # ✅
  spendingByCategory: [...]      # ✅
  recentTransactions: [...]      # ✅
  accountBalances: [...]         # ✅
  budgetSummary: {...}           # ❌
  upcomingBills: [...]           # ❌
  goalsSummary: [...]            # ❌
}
```

---

## 3. Accounts

### Monarch Account Types
- **Depository** — checking, savings, money market, CD, HSA
- **Credit** — credit card
- **Loan** — mortgage, student loan, auto loan, personal loan, HELOC
- **Investment** — brokerage, 401k, IRA, Roth IRA, 529, pension
- **Real Estate** — property (Zillow integration for auto-valuation)
- **Vehicle** — car value tracking (KBB/similar integration)
- **Cryptocurrency** — Coinbase integration
- **Other Asset** — manual (collectibles, cash, etc.)
- **Other Liability** — manual debt

### Account Data Fields
```
Account {
  id: ID
  name: String                   # ✅
  officialName: String           # ✅
  type: String                   # ✅ (depository|credit|loan|investment|real_estate|vehicle|crypto|other_asset|other_liability)
  subtype: String                # ✅ (checking|savings|credit_card|mortgage|brokerage|401k|ira|roth_ira...)
  balance: Float                 # ✅
  currency: String               # ✅
  mask: String                   # ✅ (last 4 digits)
  isActive: Boolean              # ✅
  isHidden: Boolean              # ❌ (hide from net worth/budgets without deleting)
  includeInNetWorth: Boolean     # ❌
  institution: Institution       # 🔶 (model exists but not exposed well)
  accountConnection: Connection  # 🔶
  balanceDate: Date              # ✅
  interestRate: Float            # ❌ (for loans)
  creditLimit: Float             # ❌ (for credit cards)
  availableBalance: Float        # ❌
  holdingsValue: Float           # ❌ (for investment accounts)
  lastSyncedAt: DateTime         # ❌
  syncStatus: String             # ❌ (synced|error|pending)
  color: String                  # ❌ (custom account color)
  notes: String                  # ❌
  displayOrder: Int              # ❌
}
```

### Account Connection (Plaid Link)
```
AccountConnection {
  id: ID
  institutionId: ID
  plaidItemId: String
  status: String              # (good|error|pending_reauth|disconnected)
  lastSyncedAt: DateTime
  syncCursor: String
  consentExpiresAt: DateTime
  errorCode: String           # (ITEM_LOGIN_REQUIRED, etc.)
  errorMessage: String
  accounts: [Account]
}
```

### Institution
```
Institution {
  id: ID
  name: String
  plaidInstitutionId: String
  logo: String                # base64 or URL
  primaryColor: String
  url: String
}
```

### Monarch Account Features
- ❌ **Hide accounts** from net worth or budgets
- ❌ **Reorder accounts** via drag-and-drop
- ❌ **Account details page** — balance history chart, transaction list filtered to account
- ❌ **Manual balance updates** for manual accounts
- ❌ **Zillow integration** for real estate values
- ❌ **Vehicle value sync**
- ❌ **Coinbase integration**
- ❌ **Apple Card CSV import**
- ✅ **Manual account creation**
- 🔶 **Plaid-linked accounts**
- ❌ **Statement balance tracking** (credit cards — closing balance vs current)

---

## 4. Transactions

### Transaction Data Fields (Monarch)
```
Transaction {
  id: ID                      # ✅
  date: Date                  # ✅
  amount: Float               # ✅ (negative = expense, positive = income in Monarch)
  description: String         # ✅ (original description from bank)
  merchantName: String        # ✅ (cleaned/mapped merchant name)
  category: Category          # ✅
  subcategory: Category       # ✅
  account: Account            # ✅
  tags: [Tag]                 # ✅
  notes: String               # 🔶 (in input but not in Transaction type output)
  needsReview: Boolean        # ✅
  pending: Boolean            # ✅
  isRecurring: Boolean        # ❌
  recurringId: ID             # ❌
  isTransfer: Boolean         # ❌ (marks transaction as transfer between own accounts)
  transferPairId: ID          # ❌ (links the two sides of a transfer)
  isSplit: Boolean            # ❌
  splitParentId: ID           # ❌
  splitChildren: [Transaction] # ❌
  isExcludedFromBudget: Boolean # ❌
  isExcludedFromReports: Boolean # ❌
  originalDescription: String # ❌ (raw bank description before merchant mapping)
  plaidTransactionId: String  # ✅
  plaidCategory: String       # ❌ (Plaid's original category)
  checkNumber: String         # ❌
  attachments: [Attachment]   # ❌ (receipt photos)
  reviewedAt: DateTime        # ❌
  reviewedBy: User            # ❌
  createdAt: DateTime         # ❌ (in model but not exposed)
  updatedAt: DateTime         # ❌
}
```

### Transaction Features in Monarch
- ✅ **List view** with infinite scroll/pagination
- ✅ **Search** by description/merchant
- ✅ **Filter** by date range, category, account, amount range, needs review
- ❌ **Filter by tag** 
- ❌ **Filter by recurring/non-recurring**
- ✅ **Detail panel** (slide-over)
- ❌ **Inline editing** in table (click to edit category, etc.)
- ❌ **Split transactions** — divide one transaction into multiple categories
- ❌ **Transfer detection** — auto-detect and link transfers between accounts
- ❌ **Mark as transfer** — manually link two transactions
- ✅ **Bulk categorize** — select multiple → assign category
- ❌ **Bulk actions** — mark reviewed, tag, exclude, delete
- ❌ **Receipt/attachment upload** — attach photos to transactions
- ❌ **Transaction exclusions** — exclude from budget or reports individually
- ❌ **Manual transaction creation** for non-linked accounts
- ❌ **CSV import** — import from bank CSV exports
- ❌ **Export** — CSV download of filtered transactions

### Monarch Transaction UI Patterns
- Table columns: Date | Description/Merchant | Category | Tags | Account | Amount | Review checkbox
- Amount color: green for income, red/neutral for expenses
- Pending transactions shown with a "pending" badge, lighter styling
- Category shown as colored pill/badge
- Tags shown as small colored badges
- Click row → slide-over detail panel (right side)
- "Mark all as reviewed" button
- Sticky header with filters
- Mobile: card-based layout (we have this ✅)

---

## 5. Categories

### Category Data Fields
```
Category {
  id: ID                    # ✅
  name: String              # ✅
  icon: String              # ✅ (emoji)
  color: String             # ✅
  parentId: ID              # ✅ (for subcategories)
  groupName: String         # ✅ (Income, Expenses, Transfer)
  isSystem: Boolean         # ✅
  isHidden: Boolean         # ❌ (hide without deleting)
  budgetType: String        # ❌ (fixed|flexible|non-monthly)
  displayOrder: Int         # ❌
  children: [Category]      # ✅
  monthlyAverage: Float     # ❌ (computed)
}
```

### Monarch Default Categories (Expenses)
**Housing:** Rent, Mortgage, Property Tax, HOA, Home Insurance, Home Maintenance, Home Improvement
**Transportation:** Gas, Car Payment, Car Insurance, Parking, Public Transit, Ride Share, Car Maintenance
**Food & Drink:** Groceries, Restaurants, Coffee Shops, Fast Food, Alcohol & Bars
**Shopping:** Clothing, Electronics, Home Goods, Gifts, Online Shopping
**Entertainment:** Streaming Services, Movies & Events, Hobbies, Books, Games
**Health:** Doctor, Dentist, Pharmacy, Gym, Vision, Health Insurance
**Personal:** Hair & Beauty, Laundry, Education, Subscriptions
**Bills & Utilities:** Electric, Gas (utility), Water, Internet, Phone, Trash
**Insurance:** Life Insurance, Disability
**Debt:** Student Loan Payment, Credit Card Payment, Personal Loan Payment
**Pets:** Vet, Pet Food, Pet Supplies
**Kids:** Childcare, Baby Supplies, Kids Activities, School
**Travel:** Flights, Hotels, Vacation
**Fees:** Bank Fee, ATM Fee, Late Fee, Interest Charged
**Giving:** Donations, Gifts Given
**Taxes:** Federal Tax, State Tax, Property Tax
**Uncategorized**

**Income categories:** Salary, Freelance, Interest, Dividends, Rental Income, Refund, Other Income

**Transfer:** Transfer (between own accounts — excluded from budget/reports)

### Our Status
- ✅ Basic categories with hierarchy
- ❌ Full Monarch-equivalent default set
- ❌ Category hiding
- ❌ Budget type per category

---

## 6. Budgets

### Monarch Budget System
Monarch offers **two budgeting approaches:**

1. **Plan budgeting** (default) — set amounts per category per month
2. **Flex budgeting** — set a total spending target, allocate to fixed vs flexible

### Budget Data Fields
```
Budget {
  id: ID
  month: String              # YYYY-MM
  householdId: ID
  type: String               # plan|flex
  totalIncome: Float         # (computed or set)
  totalBudgeted: Float       # (computed)
  totalSpent: Float          # (computed)
  rolloverEnabled: Boolean   # ❌
}

BudgetItem {
  id: ID                     # ✅
  budgetId: ID
  categoryId: ID             # ✅
  month: String              # ✅
  budgeted: Float            # ✅
  spent: Float               # ✅ (computed)
  rollover: Float            # ❌ (unspent from last month)
  available: Float           # ❌ (budgeted + rollover - spent)
  isFlexible: Boolean        # ❌
  isRecurring: Boolean       # ❌ (auto-copy to next month)
}
```

### Monarch Budget Features
- ❌ **Monthly budget view** — categories grouped, progress bars per category
- ❌ **Category group totals** — subtotals for Housing, Food, etc.
- ❌ **Copy budget to next month** — or auto-fill from averages
- ❌ **Rollover** — unspent budget carries to next month
- ❌ **Budget vs actual** — progress bar per category (green/yellow/red)
- ❌ **Over-budget alerts** — notification when category exceeds budget
- ❌ **Income tracking** in budget — planned income vs actual
- ❌ **"Left to budget"** — income minus all allocated amounts
- ❌ **Quick-fill** — fill all categories from last month, 3-month average, or 6-month average
- ❌ **Month navigation** — previous/next month arrows, calendar picker
- 🔶 **BudgetItem CRUD** (mutation exists, no proper UI)

### Monarch Budget UI Pattern
- Top bar: month selector with arrows, income/expense/remaining summary
- Categories grouped by group (Housing, Food, etc.)
- Each row: category icon + name | budgeted amount (editable) | spent | progress bar | remaining
- Over-budget rows highlighted red
- Click category → drill down to transactions for that category/month
- Bottom: "Left to budget" summary

---

## 7. Goals

### Goal Data Fields
```
Goal {
  id: ID
  name: String
  targetAmount: Float
  currentAmount: Float        # manually updated or linked to account balance
  targetDate: Date
  monthlyContribution: Float  # suggested or tracked
  linkedAccountIds: [ID]      # accounts whose balance counts toward goal
  icon: String
  color: String
  priority: Int
  isCompleted: Boolean
  completedAt: DateTime
  notes: String
  type: String               # savings|debt_payoff|custom
  startDate: Date
  startAmount: Float
}
```

### Goal Features
- ❌ **Create goals** — save for house, pay off debt, emergency fund, etc.
- ❌ **Link accounts** — goal progress based on account balance
- ❌ **Progress visualization** — progress bar, projected completion date
- ❌ **Monthly contribution tracking**
- ❌ **Goal milestones**
- ❌ **Debt payoff goals** — track decreasing balance
- ❌ **Goal priorities** — order goals by importance

---

## 8. Recurring Transactions

### Recurring Item Data Fields
```
RecurringItem {
  id: ID
  merchantName: String
  description: String
  amount: Float               # expected amount
  amountIsVariable: Boolean   # some bills vary
  frequency: String           # monthly|weekly|biweekly|quarterly|annual
  nextExpectedDate: Date
  lastOccurrence: Date
  category: Category
  account: Account
  isActive: Boolean
  isPaused: Boolean           # temporarily stop tracking
  isAutoPay: Boolean
  source: String              # detected|manual
  linkedTransactions: [Transaction]
  dayOfMonth: Int             # for monthly: expected day
  type: String                # expense|income|transfer
  notes: String
}
```

### Recurring Features
- ❌ **Auto-detection** — Monarch scans transactions for recurring patterns
- ❌ **Subscription tracker** — list all subscriptions with monthly/annual cost
- ❌ **Upcoming bills calendar** — calendar view of expected charges
- ❌ **Bill alerts** — notification before bill is due
- ❌ **Mark as paid/unpaid** — track if this month's occurrence happened
- ❌ **Total monthly recurring** — sum of all monthly obligations
- ❌ **Cancel tracking** — mark as cancelled, stop expecting
- ❌ **Manual recurring** — add expected bills not auto-detected

### Monarch Recurring UI Pattern
- List view: merchant | amount | frequency | next date | status
- Calendar view: month calendar with bills on expected dates
- Top summary: total monthly recurring expenses
- Color coding: green (paid), yellow (upcoming), red (overdue/missed)

---

## 9. Rules Engine (Auto-Categorization)

### Rule Data Fields
```
CategorizationRule {
  id: ID
  householdId: ID
  merchantName: String        # if merchant contains/equals this
  descriptionPattern: String  # regex or contains match on description
  matchType: String           # contains|exact|starts_with|regex
  assignCategoryId: ID
  assignTags: [ID]
  renameDescription: String   # clean up the merchant name
  markAsTransfer: Boolean
  markAsRecurring: Boolean
  excludeFromBudget: Boolean
  priority: Int               # rule ordering
  isActive: Boolean
  createdBy: String           # user|system
  matchCount: Int             # how many times rule has been applied
  lastMatchedAt: DateTime
}
```

### Rules Features
- ❌ **Create rules from transactions** — "always categorize [merchant] as [category]"
- ❌ **Bulk apply rules** — retroactively apply to existing transactions
- ❌ **Rule management page** — list, edit, delete, reorder rules
- ❌ **Merchant name mapping** — "AMZN*12345" → "Amazon"
- ❌ **Auto-apply on sync** — rules run automatically on new transactions
- ❌ **System rules** — Plaid category → OpenFinance category mapping
- ❌ **Suggested rules** — based on manual categorizations ("You categorized 5 Starbucks transactions as Coffee — create a rule?")

---

## 10. Net Worth

### Net Worth Features
- ❌ **Net worth history chart** — line chart over time (all-time, 1Y, 6M, 3M, 1M)
- ❌ **Assets vs Liabilities breakdown** — stacked area chart
- ❌ **Account contribution** — which accounts changed most
- ❌ **Net worth milestones** — "You hit $100K!"
- ❌ **Manual snapshots** — for manual accounts without auto-sync

### Data Fields
```
NetWorthSnapshot {
  id: ID
  date: Date
  totalAssets: Float
  totalLiabilities: Float
  netWorth: Float
  accountBreakdown: [{accountId, balance}]
}
```

We have `AccountBalanceHistory` model but it's not exposed or visualized.

---

## 11. Investments

### Investment Data Fields
```
Holding {
  id: ID
  accountId: ID
  securityId: ID
  quantity: Float
  costBasis: Float
  currentValue: Float
  todayChange: Float
  todayChangePercent: Float
  totalReturn: Float
  totalReturnPercent: Float
}

Security {
  id: ID
  tickerSymbol: String
  name: String
  type: String               # stock|etf|mutual_fund|bond|crypto|option|other
  currentPrice: Float
  lastUpdated: DateTime
  exchange: String
}
```

### Investment Features
- ❌ **Holdings list** — all securities across all investment accounts
- ❌ **Performance chart** — portfolio value over time
- ❌ **Allocation breakdown** — pie chart by asset class (stocks/bonds/cash/crypto)
- ❌ **Individual holding detail** — cost basis, return, current value
- ❌ **Benchmark comparison** — compare against S&P 500
- ❌ **Dividends tracking**
- ❌ **Sector/industry breakdown**

### Monarch Investment UI Pattern
- Top: total portfolio value, today's change, total return
- Holdings table: name | ticker | shares | price | value | day change | total return
- Side: allocation pie chart
- Performance chart with time range selector

---

## 12. Reports & Analytics

### Report Types in Monarch
1. **Spending by Category** — pie/donut chart + table, filterable by date range, accounts
2. **Spending Over Time** — bar chart (monthly) by category, stacked or grouped
3. **Income vs Expenses** — dual bar chart by month
4. **Cash Flow** — waterfall or bar chart showing income - expenses per month
5. **Net Worth Over Time** — line chart
6. **Category Trends** — line chart showing spending in a category over months
7. **Merchant Spending** — top merchants by amount
8. **Sankey diagram** — income flow to expense categories (newer feature)

### Report Filters
- Date range (preset: this month, last month, last 3/6/12 months, YTD, custom)
- Accounts (include/exclude specific accounts)
- Categories (include/exclude)
- Tags
- Exclude transfers

### Our Status
- ❌ All reports are missing (except the dashboard spending donut)

---

## 13. Collaboration (Household)

### Monarch Collaboration Features
- ❌ **Invite partner** — share full access at no extra cost
- ❌ **Invite financial advisor** — read-only or full access
- ❌ **Assign transactions for review** — "needs review" → assigned to specific person
- ❌ **Activity feed** — see partner's categorizations and notes
- ❌ **Per-user notification preferences**
- ❌ **Household settings** — shared categories, budgets, goals

### Household Data Fields
```
Household {
  id: ID                    # ✅
  name: String              # ✅
  currency: String          # ✅
  members: [HouseholdMembership]  # model exists, not exposed
}

HouseholdMembership {
  id: ID
  userId: ID
  householdId: ID
  role: String              # owner|member|advisor
  invitedAt: DateTime
  acceptedAt: DateTime
  permissions: String       # full|read_only
}
```

We have Household and HouseholdMembership models but no invitation flow or multi-user UI.

---

## 14. Settings & Preferences

### Monarch Settings Sections
- **Profile** — name, email, password change, profile photo
- **Household** — name, invite members, manage access
- **Preferences** — currency, date format, first day of week, number format
- **Notifications** — email digests, bill reminders, budget alerts, weekly summary
- **Accounts** — manage connections, reconnect, sync settings
- **Categories** — manage category list (we have a separate page)
- **Tags** — manage tags
- **Rules** — manage categorization rules
- **Data** — export all data (CSV), delete account
- **Subscription** — billing, plan management
- **Referrals** — referral link, credits

### Notification Types
```
NotificationPreference {
  weeklyDigest: Boolean        # email summary every Monday
  monthlyReport: Boolean       # email with month recap
  budgetAlerts: Boolean        # when category hits 80%, 100%
  billReminders: Boolean       # X days before expected bill
  largeTransactions: Boolean   # transactions over $X
  newTransactions: Boolean     # daily digest of new transactions
  syncErrors: Boolean          # when account connection breaks
  goalMilestones: Boolean      # when goal hits milestones
}
```

---

## 15. Plaid Integration Details

### Connection Flow
1. User clicks "Add Account" → frontend requests link token from API
2. API calls `Plaid::LinkTokenCreate` → returns link_token
3. Frontend opens Plaid Link modal with link_token
4. User authenticates with bank in Plaid Link
5. Plaid Link returns public_token to frontend
6. Frontend sends public_token to API via `exchangePlaidToken` mutation
7. API exchanges public_token → access_token via Plaid
8. API fetches accounts, stores access_token encrypted
9. API triggers initial transaction sync (Plaid Transactions Sync)
10. Subsequent syncs via webhook or polling

### Plaid Error States
- **ITEM_LOGIN_REQUIRED** — bank password changed, need re-authentication
- **INSTITUTION_DOWN** — bank's system unavailable
- **RATE_LIMIT_EXCEEDED** — too many API calls
- **TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION** — retry sync
- **NO_ACCOUNTS** — user didn't select any accounts

### Monarch's Error Handling UI
- Yellow/red banner on account showing "Connection needs attention"
- "Fix connection" button → opens Plaid Link in update mode
- Last successful sync timestamp shown
- Retry button for transient errors

### Webhook Events (Plaid → API)
- `TRANSACTIONS.SYNC_UPDATES_AVAILABLE` — new transactions ready
- `TRANSACTIONS.INITIAL_UPDATE` — first sync complete
- `ITEM.ERROR` — connection error
- `ITEM.PENDING_EXPIRATION` — consent about to expire

---

## 16. Data Export

- ❌ **CSV export** — all transactions, filtered transactions
- ❌ **Full data export** — accounts, transactions, categories, budgets, goals (JSON or CSV)
- ❌ **Mint import** — CSV import from Mint export format
- ❌ **YNAB import** — budget import from YNAB

---

## 17. Mobile-Specific Features

- ❌ **Push notifications** (iOS/Android)
- ❌ **Widget** — iOS home screen widget showing net worth, budget status
- ❌ **Quick add transaction** — shortcut/widget
- ❌ **Face ID / biometric login**
- ✅ **Responsive mobile layout** (web-based)

---

## Summary: What We Have vs What's Missing

### ✅ Built
- Auth (JWT login/register)
- Dashboard with key metrics
- Accounts (list, manual creation, Plaid link WIP)
- Transactions (list, filter, detail panel, bulk categorize)
- Categories (CRUD, hierarchy)
- Budget items (mutation, basic page)
- Tags (CRUD)
- GraphQL API + codegen
- Mobile-responsive UI

### 🔶 Partially Built
- Plaid integration (link token + exchange work, sync service exists, needs hardening)
- Budget page (exists but minimal UI)
- Notes on transactions (in input but not exposed in output type)

### ❌ Major Missing Features
1. Recurring transactions (detection + management)
2. Rules engine (auto-categorization)
3. Net worth history + chart
4. Investment tracking (holdings, performance)
5. Reports (spending trends, income vs expenses, cash flow, etc.)
6. Goals (savings targets, debt payoff)
7. Transfer detection & linking
8. Split transactions
9. Transaction exclusions (from budget/reports)
10. Collaboration (invite partner, shared access)
11. Settings page
12. Notifications system
13. CSV import/export
14. Receipt attachments
15. Plaid webhooks
16. Account detail pages
17. Budget rollover
18. Merchant name mapping
