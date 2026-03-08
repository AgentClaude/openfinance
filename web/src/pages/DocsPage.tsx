import { useState, useCallback } from 'react';
import { useThemeContext } from '@/components/ThemeProvider';

// ─── Types ───────────────────────────────────────────────────────────────────

interface NavItem {
  id: string;
  label: string;
  children?: { id: string; label: string }[];
}

// ─── Navigation ──────────────────────────────────────────────────────────────

const NAV: NavItem[] = [
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'authentication', label: 'Authentication' },
  {
    id: 'rest-api',
    label: 'REST API',
    children: [
      { id: 'rest-accounts', label: 'Accounts' },
      { id: 'rest-transactions', label: 'Transactions' },
      { id: 'rest-budgets', label: 'Budgets' },
      { id: 'rest-net-worth', label: 'Net Worth' },
      { id: 'rest-monthly-summary', label: 'Monthly Summary' },
      { id: 'rest-daily-spend', label: 'Daily Spend' },
      { id: 'rest-account-balances', label: 'Account Balances' },
    ],
  },
  {
    id: 'graphql-api',
    label: 'GraphQL API',
    children: [
      { id: 'graphql-queries', label: 'Queries' },
      { id: 'graphql-mutations', label: 'Mutations' },
    ],
  },
  { id: 'embeds', label: 'Embeddable Widgets' },
  { id: 'rate-limits', label: 'Rate Limits' },
  { id: 'errors', label: 'Error Codes' },
];

// ─── Code Block ──────────────────────────────────────────────────────────────

function CodeBlock({ code, language = 'bash' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  return (
    <div className="relative group my-3">
      <div className="absolute right-2 top-2 z-10">
        <button
          onClick={copy}
          className="px-2 py-1 text-xs rounded bg-gray-700 text-gray-300 hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm leading-relaxed">
        <code data-lang={language}>{code}</code>
      </pre>
    </div>
  );
}

// ─── Endpoint Card ───────────────────────────────────────────────────────────

function Endpoint({
  method,
  path,
  description,
  params,
  curlExample,
  responseExample,
}: {
  method: string;
  path: string;
  description: string;
  params?: { name: string; type: string; required: boolean; description: string }[];
  curlExample?: string;
  responseExample?: string;
}) {
  const methodColor: Record<string, string> = {
    GET: 'bg-brand-600',
    POST: 'bg-info-500',
    PUT: 'bg-amber-500',
    PATCH: 'bg-amber-500',
    DELETE: 'bg-red-500',
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 mb-4 bg-white dark:bg-gray-800">
      <div className="flex items-center gap-2 mb-2">
        <span className={`${methodColor[method] || 'bg-gray-500'} text-white text-xs font-bold px-2.5 py-1 rounded`}>
          {method}
        </span>
        <code className="text-sm font-semibold dark:text-gray-200">{path}</code>
      </div>
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{description}</p>
      {params && params.length > 0 && (
        <div className="mb-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Parameters</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                  <th className="pb-2 pr-4">Name</th>
                  <th className="pb-2 pr-4">Type</th>
                  <th className="pb-2 pr-4">Required</th>
                  <th className="pb-2">Description</th>
                </tr>
              </thead>
              <tbody>
                {params.map((p) => (
                  <tr key={p.name} className="border-t border-gray-100 dark:border-gray-700">
                    <td className="py-2 pr-4"><code className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{p.name}</code></td>
                    <td className="py-2 pr-4 text-xs text-gray-500">{p.type}</td>
                    <td className="py-2 pr-4 text-xs">{p.required ? <span className="text-red-500">Yes</span> : <span className="text-gray-400">No</span>}</td>
                    <td className="py-2 text-xs text-gray-600 dark:text-gray-400">{p.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {curlExample && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Example Request</h4>
          <CodeBlock code={curlExample} language="bash" />
        </div>
      )}
      {responseExample && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Example Response</h4>
          <CodeBlock code={responseExample} language="json" />
        </div>
      )}
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar({ activeSection, onNavigate, mobileOpen, onClose }: {
  activeSection: string;
  onNavigate: (id: string) => void;
  mobileOpen: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700
        overflow-y-auto z-50 transition-transform lg:translate-x-0 lg:static lg:z-auto
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-5 border-b border-gray-200 dark:border-gray-700">
          <a href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">$</div>
            <span className="font-bold text-lg dark:text-white">OpenFinance</span>
          </a>
          <p className="text-xs text-gray-500 mt-1">API Documentation</p>
        </div>
        <nav className="p-4">
          {NAV.map((item) => (
            <div key={item.id} className="mb-1">
              <button
                onClick={() => { onNavigate(item.id); onClose(); }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  activeSection === item.id
                    ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {item.label}
              </button>
              {item.children && (
                <div className="ml-3 mt-0.5">
                  {item.children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => { onNavigate(child.id); onClose(); }}
                      className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition-colors ${
                        activeSection === child.id
                          ? 'text-brand-700 dark:text-brand-400 font-medium'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      {child.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}

// ─── Section Components ──────────────────────────────────────────────────────

function SectionHeading({ id, title, subtitle }: { id: string; title: string; subtitle?: string }) {
  return (
    <div id={id} className="scroll-mt-8 mb-6 pt-8 first:pt-0">
      <h2 className="text-2xl font-bold dark:text-white">{title}</h2>
      {subtitle && <p className="text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
      <div className="h-px bg-gray-200 dark:bg-gray-700 mt-4" />
    </div>
  );
}

function SubHeading({ id, title }: { id: string; title: string }) {
  return <h3 id={id} className="scroll-mt-8 text-lg font-semibold dark:text-white mt-8 mb-4">{title}</h3>;
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function DocsPage() {
  const { isDark, toggleTheme } = useThemeContext();
  const [activeSection, setActiveSection] = useState('getting-started');
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigate = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const BASE = window.location.origin;

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-gray-950' : 'bg-gray-50'}`}>
      <div className="flex">
        <Sidebar activeSection={activeSection} onNavigate={navigate} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

        <main className="flex-1 min-w-0">
          {/* Top bar */}
          <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-950/80 backdrop-blur border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center justify-between">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 -ml-2 text-gray-500">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="text-sm text-gray-500 dark:text-gray-400 hidden lg:block">
              Base URL: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs">{BASE}/api/v1</code>
            </div>
            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
              {isDark ? '☀️' : '🌙'}
            </button>
          </div>

          <div className="max-w-4xl mx-auto px-6 py-8">

            {/* ── Getting Started ── */}
            <SectionHeading id="getting-started" title="Getting Started" subtitle="Everything you need to integrate with the OpenFinance API" />
            <div className="prose dark:prose-invert max-w-none text-sm text-gray-700 dark:text-gray-300 space-y-4">
              <p>
                The OpenFinance API provides programmatic access to your financial data. There are two ways to interact with the API:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>REST API v1</strong> — Simple, read-only endpoints for accounts, transactions, budgets, and more</li>
                <li><strong>GraphQL API</strong> — Full-featured API with queries and mutations for all operations</li>
              </ul>
              <div className="bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-800 rounded-lg p-4">
                <p className="font-medium text-info-800 dark:text-info-300">Base URL</p>
                <code className="text-sm">{BASE}/api/v1</code> <span className="text-gray-500">(REST)</span><br />
                <code className="text-sm">{BASE}/graphql</code> <span className="text-gray-500">(GraphQL)</span>
              </div>
              <p>All responses are JSON with this general structure:</p>
              <CodeBlock language="json" code={`{
  "data": { ... },
  "meta": {
    "timestamp": "2026-01-15T12:00:00Z"
  }
}`} />
            </div>

            {/* ── Authentication ── */}
            <SectionHeading id="authentication" title="Authentication" subtitle="API key and share token authentication" />
            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-4">
              <p>All REST API and GraphQL endpoints require authentication via an API key sent in the <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">X-API-Key</code> header.</p>
              <h4 className="font-semibold dark:text-white">Generating an API Key</h4>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Log in to your OpenFinance account</li>
                <li>Go to <strong>Settings → API Keys</strong></li>
                <li>Click <strong>Generate New Key</strong></li>
                <li>Copy and store the key securely — it won't be shown again</li>
              </ol>
              <h4 className="font-semibold dark:text-white">Using the API Key</h4>
              <CodeBlock code={`curl -H "X-API-Key: your_api_key_here" \\
  ${BASE}/api/v1/accounts`} />
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <p className="font-medium text-amber-800 dark:text-amber-300">⚠️ Share Tokens</p>
                <p className="mt-1">Embeddable widget endpoints use <strong>share tokens</strong> instead of API keys. Share tokens provide read-only access to specific data and are safe to use in client-side code. Generate them in <strong>Settings → Sharing</strong>.</p>
              </div>
            </div>

            {/* ── REST API ── */}
            <SectionHeading id="rest-api" title="REST API Reference" subtitle="Read-only endpoints for your financial data" />

            <SubHeading id="rest-accounts" title="Accounts" />
            <Endpoint
              method="GET"
              path="/api/v1/accounts"
              description="List all visible accounts with current balances."
              curlExample={`curl -H "X-API-Key: your_key" ${BASE}/api/v1/accounts`}
              responseExample={`{
  "accounts": [
    {
      "id": 1,
      "name": "Checking",
      "account_type": "checking",
      "institution": "Chase",
      "current_balance": 5432.10,
      "currency": "USD",
      "updated_at": "2026-01-15T08:30:00Z"
    }
  ]
}`}
            />

            <SubHeading id="rest-transactions" title="Transactions" />
            <Endpoint
              method="GET"
              path="/api/v1/transactions"
              description="List transactions with optional filters. Returns up to 200 per request."
              params={[
                { name: 'start_date', type: 'string', required: false, description: 'Filter from date (YYYY-MM-DD)' },
                { name: 'end_date', type: 'string', required: false, description: 'Filter to date (YYYY-MM-DD)' },
                { name: 'category', type: 'string', required: false, description: 'Filter by category name' },
                { name: 'account_id', type: 'integer', required: false, description: 'Filter by account ID' },
                { name: 'limit', type: 'integer', required: false, description: 'Max results (default 50, max 200)' },
                { name: 'offset', type: 'integer', required: false, description: 'Pagination offset' },
              ]}
              curlExample={`curl -H "X-API-Key: your_key" \\
  "${BASE}/api/v1/transactions?start_date=2026-01-01&limit=10"`}
              responseExample={`{
  "transactions": [
    {
      "id": 42,
      "date": "2026-01-15",
      "name": "Grocery Store",
      "amount": -85.43,
      "category": "Groceries",
      "account_id": 1,
      "account_name": "Checking",
      "merchant_name": "Whole Foods"
    }
  ],
  "meta": { "total": 234, "limit": 10, "offset": 0 }
}`}
            />

            <SubHeading id="rest-budgets" title="Budgets" />
            <Endpoint
              method="GET"
              path="/api/v1/budgets/:month"
              description="Budget summary for a given month, with per-category spending vs. budgeted amounts."
              params={[
                { name: ':month', type: 'string', required: true, description: 'Month in YYYY-MM format (path parameter)' },
              ]}
              curlExample={`curl -H "X-API-Key: your_key" ${BASE}/api/v1/budgets/2026-01`}
              responseExample={`{
  "month": "2026-01",
  "total_budgeted": 4500.00,
  "total_spent": 3200.50,
  "categories": [
    {
      "name": "Groceries",
      "budgeted": 600.00,
      "spent": 485.30,
      "remaining": 114.70
    }
  ]
}`}
            />

            <SubHeading id="rest-net-worth" title="Net Worth" />
            <Endpoint
              method="GET"
              path="/api/v1/net_worth"
              description="Current net worth summary with asset/liability breakdown by account."
              curlExample={`curl -H "X-API-Key: your_key" ${BASE}/api/v1/net_worth`}
              responseExample={`{
  "net_worth": 125000.50,
  "assets": 180000.00,
  "liabilities": 54999.50,
  "accounts": [
    {
      "id": 1,
      "name": "Checking",
      "type": "asset",
      "balance": 5432.10
    }
  ]
}`}
            />

            <SubHeading id="rest-monthly-summary" title="Monthly Summary" />
            <Endpoint
              method="GET"
              path="/api/v1/monthly_summary/:month"
              description="Income, expenses, and savings rate for a given month."
              params={[
                { name: ':month', type: 'string', required: true, description: 'Month in YYYY-MM format (path parameter)' },
              ]}
              curlExample={`curl -H "X-API-Key: your_key" ${BASE}/api/v1/monthly_summary/2026-01`}
              responseExample={`{
  "month": "2026-01",
  "income": 8500.00,
  "expenses": 5200.50,
  "savings": 3299.50,
  "savings_rate": 38.8
}`}
            />

            <SubHeading id="rest-daily-spend" title="Daily Spend" />
            <Endpoint
              method="GET"
              path="/api/v1/daily_spend/:date"
              description="Spending breakdown for a specific date."
              params={[
                { name: ':date', type: 'string', required: true, description: 'Date in YYYY-MM-DD format (path parameter)' },
              ]}
              curlExample={`curl -H "X-API-Key: your_key" ${BASE}/api/v1/daily_spend/2026-01-15`}
              responseExample={`{
  "date": "2026-01-15",
  "total_spent": 127.85,
  "transactions": [
    {
      "name": "Coffee Shop",
      "amount": -4.50,
      "category": "Dining"
    }
  ]
}`}
            />

            <SubHeading id="rest-account-balances" title="Account Balances" />
            <Endpoint
              method="GET"
              path="/api/v1/account_balances"
              description="Get current balances for all visible accounts."
              curlExample={`curl -H "X-API-Key: your_key" ${BASE}/api/v1/account_balances`}
              responseExample={`{
  "balances": [
    {
      "account_id": 1,
      "name": "Checking",
      "balance": 5432.10,
      "account_type": "checking"
    }
  ]
}`}
            />

            {/* ── GraphQL API ── */}
            <SectionHeading id="graphql-api" title="GraphQL API" subtitle="Full-featured API for all operations" />
            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-4 mb-6">
              <p>The GraphQL API is available at <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">POST /graphql</code> and supports both queries (read) and mutations (write).</p>
              <CodeBlock code={`curl -X POST ${BASE}/graphql \\
  -H "X-API-Key: your_key" \\
  -H "Content-Type: application/json" \\
  -d '{"query": "{ me { email } }"}'`} />
            </div>

            <SubHeading id="graphql-queries" title="Queries" />
            <div className="space-y-3">
              {([
                { name: 'me', returns: 'User', args: '', desc: 'Current authenticated user profile' },
                { name: 'myReferralCode', returns: 'String', args: '', desc: 'Your referral code' },
                { name: 'referrals', returns: '[Referral]', args: '', desc: 'List of referrals you\'ve made' },
                { name: 'householdMembers', returns: '[HouseholdMember]', args: '', desc: 'Members of your household' },
                { name: 'householdInvitations', returns: '[Invitation]', args: '', desc: 'Pending household invitations' },
                { name: 'accounts', returns: '[Account]', args: '', desc: 'All visible accounts' },
                { name: 'transactions', returns: 'TransactionPage', args: 'search, categoryId, accountId, minAmount, maxAmount, dateFrom, dateTo, needsReview, page, limit', desc: 'Paginated transactions with filters' },
                { name: 'categories', returns: '[Category]', args: '', desc: 'All top-level categories' },
                { name: 'tags', returns: '[Tag]', args: '', desc: 'All tags' },
                { name: 'dashboardSummary', returns: 'DashboardSummary', args: '', desc: 'Full dashboard data: net worth, income, expenses, spending by category' },
                { name: 'holdings', returns: '[Holding]', args: 'accountId?', desc: 'Investment holdings, optionally filtered by account' },
                { name: 'portfolioSummary', returns: 'PortfolioSummary', args: 'accountId?', desc: 'Portfolio totals, gain/loss, allocations' },
                { name: 'notifications', returns: '[Notification]', args: 'unreadOnly?, limit?', desc: 'User notifications' },
                { name: 'unreadNotificationCount', returns: 'Int', args: '', desc: 'Count of unread notifications' },
                { name: 'notificationPreferences', returns: '[NotificationPreference]', args: '', desc: 'Notification preference settings' },
                { name: 'balanceAdjustments', returns: '[BalanceAdjustment]', args: 'accountId!', desc: 'Balance adjustments for an account' },
                { name: 'categorizationRules', returns: '[CategorizationRule]', args: '', desc: 'Auto-categorization rules' },
                { name: 'recurringItems', returns: '[RecurringItem]', args: 'activeOnly?', desc: 'Recurring bills and subscriptions' },
                { name: 'budget', returns: '[BudgetItem]', args: 'month!', desc: 'Budget items for a month' },
                { name: 'budgetSummary', returns: 'BudgetSummary', args: 'month!', desc: 'Budget summary with category groups' },
                { name: 'reports', returns: 'Reports', args: 'months?, dateFrom?, dateTo?', desc: 'Spending reports, trends, top merchants' },
                { name: 'goals', returns: '[Goal]', args: 'activeOnly?', desc: 'Financial goals' },
              ] as const).map((q) => (
                <div key={q.name} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <code className="text-sm font-semibold text-brand-700 dark:text-emerald-400">{q.name}</code>
                      {q.args && <span className="text-xs text-gray-400 ml-2">({q.args})</span>}
                    </div>
                    <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded shrink-0">{q.returns}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{q.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-semibold dark:text-white mb-2">Example Query</h4>
              <CodeBlock language="graphql" code={`query {
  dashboardSummary {
    netWorth
    monthlyIncome
    monthlyExpenses
    cashFlow
    spendingByCategory {
      categoryName
      amount
      percentage
    }
  }
  accounts {
    id
    name
    accountType
    currentBalance
  }
}`} />
            </div>

            <SubHeading id="graphql-mutations" title="Mutations" />
            <div className="space-y-3">
              {([
                { name: 'login', desc: 'Authenticate and receive a session token', args: 'email!, password!' },
                { name: 'register', desc: 'Create a new user account', args: 'email!, password!, name!' },
                { name: 'createManualAccount', desc: 'Create a manually tracked account', args: 'name!, accountType!, balance?' },
                { name: 'createTransaction', desc: 'Create a new transaction', args: 'accountId!, name!, amount!, date!, categoryId?' },
                { name: 'updateTransaction', desc: 'Update an existing transaction', args: 'id!, name?, amount?, categoryId?, date?, reviewed?' },
                { name: 'bulkCategorize', desc: 'Categorize multiple transactions at once', args: 'transactionIds!, categoryId!' },
                { name: 'createCategory', desc: 'Create a new category', args: 'name!, color?, icon?, parentId?' },
                { name: 'updateCategory', desc: 'Update a category', args: 'id!, name?, color?, icon?' },
                { name: 'deleteCategory', desc: 'Delete a category', args: 'id!' },
                { name: 'createTag', desc: 'Create a new tag', args: 'name!, color?' },
                { name: 'updateTag', desc: 'Update a tag', args: 'id!, name?, color?' },
                { name: 'deleteTag', desc: 'Delete a tag', args: 'id!' },
                { name: 'updateBudgetItem', desc: 'Set budget amount for a category/month', args: 'categoryId!, month!, amount!' },
                { name: 'deleteBudgetItem', desc: 'Remove a budget item', args: 'id!' },
                { name: 'copyBudgetFromMonth', desc: 'Copy budget from a previous month', args: 'sourceMonth!, targetMonth!' },
                { name: 'fillBudgetFromAverages', desc: 'Auto-fill budget based on spending averages', args: 'month!, months?' },
                { name: 'createPlaidLinkToken', desc: 'Generate a Plaid Link token for account connection', args: '' },
                { name: 'exchangePlaidToken', desc: 'Exchange Plaid public token for access', args: 'publicToken!' },
                { name: 'createCategorizationRule', desc: 'Create an auto-categorization rule', args: 'pattern!, categoryId!, matchType?' },
                { name: 'updateCategorizationRule', desc: 'Update a categorization rule', args: 'id!, pattern?, categoryId?' },
                { name: 'deleteCategorizationRule', desc: 'Delete a categorization rule', args: 'id!' },
                { name: 'applyCategorizationRules', desc: 'Run all rules against uncategorized transactions', args: '' },
                { name: 'detectRecurringTransactions', desc: 'Auto-detect recurring bills from transaction history', args: '' },
                { name: 'createRecurringItem', desc: 'Manually create a recurring bill/subscription', args: 'name!, amount!, frequency!, categoryId?' },
                { name: 'updateRecurringItem', desc: 'Update a recurring item', args: 'id!, name?, amount?, frequency?' },
                { name: 'deleteRecurringItem', desc: 'Delete a recurring item', args: 'id!' },
                { name: 'markRecurringItemPaid', desc: 'Mark a recurring item as paid for current period', args: 'id!' },
                { name: 'createGoal', desc: 'Create a financial goal', args: 'name!, targetAmount!, targetDate?' },
                { name: 'updateGoal', desc: 'Update a goal', args: 'id!, name?, targetAmount?, currentAmount?' },
                { name: 'deleteGoal', desc: 'Delete a goal', args: 'id!' },
                { name: 'updateProfile', desc: 'Update user profile', args: 'name?, email?' },
                { name: 'changePassword', desc: 'Change password', args: 'currentPassword!, newPassword!' },
                { name: 'inviteToHousehold', desc: 'Invite someone to your household', args: 'email!, role?' },
                { name: 'acceptInvitation', desc: 'Accept a household invitation', args: 'token!' },
                { name: 'removeHouseholdMember', desc: 'Remove a member from household', args: 'memberId!' },
                { name: 'importCsv', desc: 'Import transactions from CSV', args: 'accountId!, file!' },
                { name: 'bulkTransactionAction', desc: 'Bulk action on transactions (review, delete, etc.)', args: 'transactionIds!, action!' },
                { name: 'splitTransaction', desc: 'Split a transaction into multiple parts', args: 'id!, splits!' },
                { name: 'detectTransfers', desc: 'Auto-detect transfer pairs between accounts', args: '' },
                { name: 'linkTransfer', desc: 'Manually link two transactions as a transfer', args: 'transactionId!, matchId!' },
                { name: 'updateHousehold', desc: 'Update household settings', args: 'name?, currency?' },
                { name: 'updateNotificationPreference', desc: 'Update a notification preference', args: 'id!, enabled!' },
                { name: 'markNotificationRead', desc: 'Mark a notification as read', args: 'id!' },
                { name: 'markAllNotificationsRead', desc: 'Mark all notifications as read', args: '' },
                { name: 'shareAccount', desc: 'Generate a share token for an account/widget', args: 'type!' },
                { name: 'adjustBalance', desc: 'Manually adjust an account balance', args: 'accountId!, amount!, reason?' },
                { name: 'uploadReceipt', desc: 'Upload a receipt image for a transaction', args: 'transactionId!, file!' },
                { name: 'uploadStatement', desc: 'Upload a bank statement for parsing', args: 'accountId!, file!' },
                { name: 'updateMemberRole', desc: 'Change a household member\'s role', args: 'memberId!, role!' },
                { name: 'redeemReferral', desc: 'Redeem a referral code', args: 'code!' },
                { name: 'exportData', desc: 'Export your financial data', args: 'format!, dateFrom?, dateTo?' },
                { name: 'deleteAccount', desc: 'Permanently delete your account and all data', args: 'confirmation!' },
              ] as const).map((m) => (
                <div key={m.name} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                  <div>
                    <code className="text-sm font-semibold text-info-600 dark:text-info-400">{m.name}</code>
                    {m.args && <span className="text-xs text-gray-400 ml-2">({m.args})</span>}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{m.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-semibold dark:text-white mb-2">Example Mutation</h4>
              <CodeBlock language="graphql" code={`mutation {
  createTransaction(input: {
    accountId: "1"
    name: "Coffee Shop"
    amount: -4.50
    date: "2026-01-15"
    categoryId: "3"
  }) {
    transaction {
      id
      name
      amount
      date
      category { name }
    }
    errors
  }
}`} />
            </div>

            {/* ── Embeds ── */}
            <SectionHeading id="embeds" title="Embeddable Widgets" subtitle="Share financial data with public embed URLs" />
            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-4">
              <p>OpenFinance provides embeddable widgets that can be added to any website. These use <strong>share tokens</strong> instead of API keys, providing read-only access to specific data.</p>

              <Endpoint
                method="GET"
                path="/api/v1/embed/net_worth?token=TOKEN"
                description="Public endpoint (no API key required). Returns net worth data for embedding."
                params={[
                  { name: 'token', type: 'string', required: true, description: 'Share token generated from Settings' },
                  { name: 'theme', type: 'string', required: false, description: '"light" or "dark" (default: light)' },
                ]}
                curlExample={`curl "${BASE}/api/v1/embed/net_worth?token=abc123"`}
                responseExample={`{
  "net_worth": 125000.50,
  "assets": 180000.00,
  "liabilities": 54999.50,
  "updated_at": "2026-01-15T08:30:00Z"
}`}
              />

              <Endpoint
                method="GET"
                path="/api/v1/embed/spending?token=TOKEN"
                description="Public endpoint (no API key required). Returns monthly spending data for embedding."
                params={[
                  { name: 'token', type: 'string', required: true, description: 'Share token generated from Settings' },
                  { name: 'theme', type: 'string', required: false, description: '"light" or "dark" (default: light)' },
                ]}
                curlExample={`curl "${BASE}/api/v1/embed/spending?token=abc123"`}
                responseExample={`{
  "month": "2026-01",
  "total_spent": 3200.50,
  "categories": [
    { "name": "Groceries", "amount": 485.30, "color": "#10b981" }
  ]
}`}
              />

              <h4 className="font-semibold dark:text-white">Embedding in HTML</h4>
              <CodeBlock language="html" code={`<!-- Net Worth Widget -->
<iframe
  src="${BASE}/api/v1/embed/net_worth?token=YOUR_TOKEN&theme=dark"
  width="400"
  height="200"
  frameborder="0"
></iframe>`} />
            </div>

            {/* ── Rate Limits ── */}
            <SectionHeading id="rate-limits" title="Rate Limits" subtitle="Usage limits and throttling" />
            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-4">
              <div className="bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-800 rounded-lg p-4">
                <p className="font-medium text-info-800 dark:text-info-300">60 requests per minute per API key</p>
              </div>
              <p>Rate limit information is included in every response via headers:</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="text-left px-4 py-2 text-xs uppercase tracking-wider text-gray-500">Header</th>
                      <th className="text-left px-4 py-2 text-xs uppercase tracking-wider text-gray-500">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-gray-200 dark:border-gray-700">
                      <td className="px-4 py-2"><code className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">X-RateLimit-Limit</code></td>
                      <td className="px-4 py-2 text-gray-600 dark:text-gray-400">Maximum requests per window (60)</td>
                    </tr>
                    <tr className="border-t border-gray-200 dark:border-gray-700">
                      <td className="px-4 py-2"><code className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">X-RateLimit-Remaining</code></td>
                      <td className="px-4 py-2 text-gray-600 dark:text-gray-400">Remaining requests in current window</td>
                    </tr>
                    <tr className="border-t border-gray-200 dark:border-gray-700">
                      <td className="px-4 py-2"><code className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">X-RateLimit-Reset</code></td>
                      <td className="px-4 py-2 text-gray-600 dark:text-gray-400">Unix timestamp when the window resets</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>When you exceed the rate limit, you'll receive a <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">429 Too Many Requests</code> response. Wait until the reset time before retrying.</p>
              <CodeBlock language="json" code={`{
  "error": "Rate limit exceeded",
  "retry_after": 45
}`} />
            </div>

            {/* ── Error Codes ── */}
            <SectionHeading id="errors" title="Error Codes" subtitle="Common error responses" />
            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="text-left px-4 py-2 text-xs uppercase tracking-wider text-gray-500">Status</th>
                      <th className="text-left px-4 py-2 text-xs uppercase tracking-wider text-gray-500">Meaning</th>
                      <th className="text-left px-4 py-2 text-xs uppercase tracking-wider text-gray-500">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { code: '200', meaning: 'OK', desc: 'Request succeeded' },
                      { code: '400', meaning: 'Bad Request', desc: 'Invalid parameters or malformed request' },
                      { code: '401', meaning: 'Unauthorized', desc: 'Missing or invalid API key' },
                      { code: '403', meaning: 'Forbidden', desc: 'Valid API key but insufficient permissions' },
                      { code: '404', meaning: 'Not Found', desc: 'Resource does not exist' },
                      { code: '422', meaning: 'Unprocessable Entity', desc: 'Validation errors in request body' },
                      { code: '429', meaning: 'Too Many Requests', desc: 'Rate limit exceeded' },
                      { code: '500', meaning: 'Internal Server Error', desc: 'Something went wrong on our end' },
                    ].map((e) => (
                      <tr key={e.code} className="border-t border-gray-200 dark:border-gray-700">
                        <td className="px-4 py-2"><code className="text-xs font-bold">{e.code}</code></td>
                        <td className="px-4 py-2 font-medium">{e.meaning}</td>
                        <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{e.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <h4 className="font-semibold dark:text-white mt-4">Error Response Format</h4>
              <CodeBlock language="json" code={`{
  "error": "Unauthorized",
  "message": "Invalid or missing API key. Include X-API-Key header.",
  "status": 401
}`} />
            </div>

            {/* Footer */}
            <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-xs text-gray-400">
              OpenFinance API Documentation • Built with ❤️
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
