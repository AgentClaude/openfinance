import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  Area, AreaChart,
  LineChart, Line,
  ComposedChart,
  Sankey as RechartsSankey, Rectangle, Layer,
} from 'recharts';
import { useQuery } from '@apollo/client';
import { useReports } from '@/hooks/useReports';
import { GET_NET_WORTH_HISTORY, GET_CATEGORY_TRENDS, GET_CATEGORIES, GET_ACCOUNTS, GET_TAGS } from '@/graphql/queries';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { StatCard, ChartCard } from '@/components/shared';

const COLORS = [
  '#0D9488', '#F59E0B', '#7C3AED', '#E11D48', '#0EA5E9',
  '#10B981', '#F97316', '#6366F1', '#84CC16', '#EC4899',
  '#06B6D4', '#8B5CF6',
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

const formatMonth = (month: string) => {
  const [y, m] = month.split('-');
  const date = new Date(parseInt(y), parseInt(m) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
};

type ReportTab = 'overview' | 'spending' | 'income-expenses' | 'cashflow' | 'merchants' | 'net-worth' | 'category-trends' | 'money-flow';

type DateRangeMode = 'preset' | 'custom';

const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const [months, setMonths] = useState(6);
  const [dateRangeMode, setDateRangeMode] = useState<DateRangeMode>('preset');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [excludeTransfers, setExcludeTransfers] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const { data: accountsData } = useQuery(GET_ACCOUNTS);
  const { data: categoriesData } = useQuery(GET_CATEGORIES);
  const { data: tagsData } = useQuery(GET_TAGS);

  const accounts = accountsData?.accounts || [];
  const categories = categoriesData?.categories || [];
  const tags = tagsData?.tags || [];

  const queryVars = {
    ...(dateRangeMode === 'custom' && customFrom && customTo
      ? { dateFrom: customFrom, dateTo: customTo }
      : { months }),
    ...(selectedAccountIds.length > 0 && { accountIds: selectedAccountIds }),
    ...(selectedCategoryIds.length > 0 && { categoryIds: selectedCategoryIds }),
    ...(selectedTagIds.length > 0 && { tagIds: selectedTagIds }),
    ...(excludeTransfers && { excludeTransfers: true }),
  };

  const { reports, loading } = useReports(queryVars);

  const activeFilterCount = (selectedAccountIds.length > 0 ? 1 : 0) + (selectedCategoryIds.length > 0 ? 1 : 0) + (selectedTagIds.length > 0 ? 1 : 0) + (excludeTransfers ? 1 : 0);

  const clearFilters = () => {
    setSelectedAccountIds([]);
    setSelectedCategoryIds([]);
    setSelectedTagIds([]);
    setExcludeTransfers(false);
  };

  const tabs: { id: ReportTab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'spending', label: 'Spending by Category', icon: '🍩' },
    { id: 'income-expenses', label: 'Income vs Expenses', icon: '⚖️' },
    { id: 'cashflow', label: 'Cash Flow', icon: '💰' },
    { id: 'merchants', label: 'Top Merchants', icon: '🏪' },
    { id: 'net-worth', label: 'Net Worth', icon: '📈' },
    { id: 'category-trends', label: 'Category Trends', icon: '📉' },
    { id: 'money-flow', label: 'Money Flow', icon: '🌊' },
  ];

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Understand your spending patterns and financial trends"
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDateRangeMode('preset')}
                className={`px-3 py-1.5 text-xs font-medium rounded-l-md border ${
                  dateRangeMode === 'preset'
                    ? 'bg-brand-50 border-brand-300 text-brand-800'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                }`}
              >
                Preset
              </button>
              <button
                onClick={() => setDateRangeMode('custom')}
                className={`px-3 py-1.5 text-xs font-medium rounded-r-md border-t border-r border-b ${
                  dateRangeMode === 'custom'
                    ? 'bg-brand-50 border-brand-300 text-brand-800'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                }`}
              >
                Custom
              </button>
            </div>
            {dateRangeMode === 'preset' ? (
              <select
                value={months}
                onChange={(e) => setMonths(parseInt(e.target.value))}
                className="rounded-md border-gray-300 dark:border-gray-600 text-sm shadow-sm focus:border-brand-500 focus:ring-brand-500"
              >
                <option value={3}>Last 3 months</option>
                <option value={6}>Last 6 months</option>
                <option value={12}>Last 12 months</option>
                <option value={24}>Last 24 months</option>
              </select>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="rounded-md border-gray-300 dark:border-gray-600 text-sm shadow-sm focus:border-brand-500 focus:ring-brand-500"
                />
                <span className="text-gray-400 text-sm">to</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="rounded-md border-gray-300 dark:border-gray-600 text-sm shadow-sm focus:border-brand-500 focus:ring-brand-500"
                />
              </div>
            )}
          </div>
        }
      />

      {/* Filter Bar */}
      <div className="mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border transition-colors ${
              activeFilterCount > 0
                ? 'bg-brand-50 border-brand-300 text-brand-700 dark:bg-brand-900/30 dark:border-brand-700 dark:text-brand-300'
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700/50'
            }`}
          >
            <span>🔍</span>
            Filters
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-brand-500 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400">
              Clear all
            </button>
          )}
          <label className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 ml-auto">
            <input
              type="checkbox"
              checked={excludeTransfers}
              onChange={(e) => setExcludeTransfers(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600 text-brand-600 focus:ring-brand-500"
            />
            Exclude transfers
          </label>
        </div>
        {showFilters && (
          <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Accounts */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Accounts</label>
              <select
                multiple
                value={selectedAccountIds}
                onChange={(e) => setSelectedAccountIds(Array.from(e.target.selectedOptions, o => o.value))}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 text-sm shadow-sm focus:border-brand-500 focus:ring-brand-500"
                size={Math.min(accounts.length, 5)}
              >
                {accounts.map((a: any) => (
                  <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
                ))}
              </select>
              {selectedAccountIds.length > 0 && (
                <button onClick={() => setSelectedAccountIds([])} className="text-xs text-brand-600 dark:text-brand-400 mt-1 hover:underline">Clear</button>
              )}
            </div>
            {/* Categories */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Categories</label>
              <select
                multiple
                value={selectedCategoryIds}
                onChange={(e) => setSelectedCategoryIds(Array.from(e.target.selectedOptions, o => o.value))}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 text-sm shadow-sm focus:border-brand-500 focus:ring-brand-500"
                size={Math.min(categories.length, 5)}
              >
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
              {selectedCategoryIds.length > 0 && (
                <button onClick={() => setSelectedCategoryIds([])} className="text-xs text-brand-600 dark:text-brand-400 mt-1 hover:underline">Clear</button>
              )}
            </div>
            {/* Tags */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Tags</label>
              <select
                multiple
                value={selectedTagIds}
                onChange={(e) => setSelectedTagIds(Array.from(e.target.selectedOptions, o => o.value))}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 text-sm shadow-sm focus:border-brand-500 focus:ring-brand-500"
                size={Math.min(tags.length || 3, 5)}
              >
                {tags.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              {selectedTagIds.length > 0 && (
                <button onClick={() => setSelectedTagIds([])} className="text-xs text-brand-600 dark:text-brand-400 mt-1 hover:underline">Clear</button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-brand-500 text-brand-700'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:border-gray-600'
              }`}
            >
              <span className="mr-1.5">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {loading && <LoadingSpinner />}
      {!loading && reports && (
        <>
          {activeTab === 'overview' && <OverviewReport reports={reports} />}
          {activeTab === 'spending' && <SpendingReport reports={reports} />}
          {activeTab === 'income-expenses' && <IncomeExpensesReport reports={reports} />}
          {activeTab === 'cashflow' && <CashFlowReport reports={reports} />}
          {activeTab === 'merchants' && <MerchantReport reports={reports} />}
          {activeTab === 'net-worth' && <NetWorthReport months={months} />}
          {activeTab === 'category-trends' && <CategoryTrendsReport months={months} />}
          {activeTab === 'money-flow' && <MoneyFlowReport reports={reports} />}
        </>
      )}
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const OverviewReport: React.FC<{ reports: any }> = ({ reports }) => {
  const { monthlySummary, spendingByCategory } = reports;

  const totalIncome = monthlySummary.reduce((s: number, m: { income: number }) => s + m.income, 0);
  const totalExpenses = monthlySummary.reduce((s: number, m: { expenses: number }) => s + m.expenses, 0);
  const avgMonthlyExpenses = monthlySummary.length > 0 ? totalExpenses / monthlySummary.length : 0;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Income" value={formatCurrency(totalIncome)} valueClassName="text-green-600" />
        <StatCard label="Total Expenses" value={formatCurrency(totalExpenses)} valueClassName="text-red-600" />
        <StatCard label="Net Cash Flow" value={formatCurrency(totalIncome - totalExpenses)} valueClassName={totalIncome - totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'} />
        <StatCard label="Avg Monthly Expenses" value={formatCurrency(avgMonthlyExpenses)} />
        <StatCard label="Savings Rate" value={`${savingsRate.toFixed(1)}%`} valueClassName={savingsRate >= 0 ? 'text-green-600' : 'text-red-600'} />
      </div>

      {/* Income vs Expenses bar chart */}
      <ChartCard title="Income vs Expenses">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlySummary}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tickFormatter={formatMonth} />
            <YAxis tickFormatter={(v) => formatCurrency(v)} />
            <Tooltip formatter={(v: number) => formatCurrency(v)} labelFormatter={formatMonth} />
            <Legend />
            <Bar dataKey="income" name="Income" fill="#059669" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" name="Expenses" fill="#DC2626" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Spending by category donut */}
      <ChartCard title="Spending by Category">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <ResponsiveContainer width="100%" height={300} className="max-w-sm">
            <PieChart>
              <Pie
                data={spendingByCategory.slice(0, 10)}
                dataKey="amount"
                nameKey="categoryName"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={2}
              >
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {spendingByCategory.slice(0, 10).map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex-1 space-y-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {spendingByCategory.slice(0, 10).map((cat: any, i: number) => (
              <div key={cat.categoryId || i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {cat.categoryIcon} {cat.categoryName}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatCurrency(cat.amount)}</span>
                  <span className="text-xs text-gray-400 ml-2">{cat.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ChartCard>
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SpendingReport: React.FC<{ reports: any }> = ({ reports }) => {
  const { monthlySpendingByCategory, spendingByCategory } = reports;

  // Get top 6 categories for the stacked chart
  const topCats = spendingByCategory.slice(0, 6);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const topCatNames = topCats.map((c: any) => c.categoryName);

  // Transform data for stacked bar chart
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stackedData = monthlySpendingByCategory.map((m: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row: any = { month: m.month };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    m.categories.forEach((c: any) => {
      if (topCatNames.includes(c.categoryName)) {
        row[c.categoryName] = c.amount;
      } else {
        row['Other'] = (row['Other'] || 0) + c.amount;
      }
    });
    return row;
  });

  const allKeys = [...topCatNames];
  if (stackedData.some((d: Record<string, number>) => d['Other'])) allKeys.push('Other');

  return (
    <div className="space-y-6">
      {/* Donut chart */}
      <ChartCard title="Spending by Category">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          <div className="w-full max-w-xs">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={spendingByCategory.slice(0, 10)}
                  dataKey="amount"
                  nameKey="categoryName"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={130}
                  paddingAngle={2}
                  label={({ categoryName, percentage }: { categoryName: string; percentage: number }) =>
                    `${categoryName} ${percentage}%`
                  }
                  labelLine={false}
                >
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {spendingByCategory.slice(0, 10).map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 w-full">
            <div className="space-y-2">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {spendingByCategory.map((cat: any, i: number) => (
                <div key={cat.categoryId || i} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {cat.categoryIcon} {cat.categoryName}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatCurrency(cat.amount)}</span>
                    <span className="text-xs text-gray-400 w-10 text-right">{cat.percentage}%</span>
                    <span className="text-xs text-gray-400 w-14 text-right">{cat.transactionCount} txns</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ChartCard>

      {/* Stacked bar - spending over time */}
      <ChartCard title="Spending Over Time">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={stackedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tickFormatter={formatMonth} />
            <YAxis tickFormatter={(v) => formatCurrency(v)} />
            <Tooltip formatter={(v: number) => formatCurrency(v)} labelFormatter={formatMonth} />
            <Legend />
            {allKeys.map((key: string, i: number) => (
              <Bar key={key} dataKey={key} stackId="a" fill={COLORS[i % COLORS.length]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Category breakdown table */}
      <ChartCard title="Category Breakdown">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Category</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">%</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Transactions</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Distribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {spendingByCategory.map((cat: any, i: number) => (
                <tr key={cat.categoryId || i} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {cat.categoryIcon} {cat.categoryName}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-gray-100">
                    {formatCurrency(cat.amount)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-500 dark:text-gray-400">
                    {cat.percentage}%
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-500 dark:text-gray-400">
                    {cat.transactionCount}
                  </td>
                  <td className="px-4 py-3 w-40">
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
                      <div
                        className="h-2.5 rounded-full transition-all"
                        style={{
                          width: `${cat.percentage}%`,
                          backgroundColor: COLORS[i % COLORS.length],
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const IncomeExpensesReport: React.FC<{ reports: any }> = ({ reports }) => {
  const { monthlySummary } = reports;

  const totalIncome = monthlySummary.reduce((s: number, m: { income: number }) => s + m.income, 0);
  const totalExpenses = monthlySummary.reduce((s: number, m: { expenses: number }) => s + m.expenses, 0);
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome * 100) : 0;

  // Compute cumulative savings
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cumulativeData = useMemo(() => {
    let cumulative = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return monthlySummary.map((m: any) => {
      cumulative += m.cashFlow;
      return { ...m, cumulativeSavings: cumulative };
    });
  }, [monthlySummary]);

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Total Income" value={formatCurrency(totalIncome)} valueClassName="text-green-600" />
        <StatCard label="Total Expenses" value={formatCurrency(totalExpenses)} valueClassName="text-red-600" />
        <StatCard label="Net Savings" value={formatCurrency(netSavings)} valueClassName={netSavings >= 0 ? 'text-green-600' : 'text-red-600'} />
        <StatCard label="Savings Rate" value={`${savingsRate.toFixed(1)}%`} valueClassName={savingsRate >= 0 ? 'text-green-600' : 'text-red-600'} />
      </div>

      {/* Dual bar chart */}
      <ChartCard title="Monthly Income vs Expenses">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={monthlySummary} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tickFormatter={formatMonth} />
            <YAxis tickFormatter={(v) => formatCurrency(v)} />
            <Tooltip formatter={(v: number) => formatCurrency(v)} labelFormatter={formatMonth} />
            <Legend />
            <Bar dataKey="income" name="Income" fill="#059669" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" name="Expenses" fill="#DC2626" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Cumulative savings trend */}
      <ChartCard title="Cumulative Savings">
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={cumulativeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tickFormatter={formatMonth} />
            <YAxis tickFormatter={(v) => formatCurrency(v)} />
            <Tooltip formatter={(v: number) => formatCurrency(v)} labelFormatter={formatMonth} />
            <Legend />
            <Bar dataKey="cashFlow" name="Monthly Savings" radius={[4, 4, 0, 0]}>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {cumulativeData.map((entry: any, i: number) => (
                <Cell key={i} fill={entry.cashFlow >= 0 ? '#10b981' : '#ef4444'} />
              ))}
            </Bar>
            <Line
              type="monotone"
              dataKey="cumulativeSavings"
              name="Cumulative"
              stroke="#0D9488"
              strokeWidth={2}
              dot={{ fill: '#0D9488', r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Monthly comparison table */}
      <ChartCard title="Monthly Comparison">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Monthly Comparison</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Month</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Income</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Expenses</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Savings</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {[...monthlySummary].reverse().map((m: any) => {
                const rate = m.income > 0 ? ((m.cashFlow / m.income) * 100) : 0;
                return (
                  <tr key={m.month} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{formatMonth(m.month)}</td>
                    <td className="px-4 py-3 text-sm text-right text-green-600">{formatCurrency(m.income)}</td>
                    <td className="px-4 py-3 text-sm text-right text-red-600">{formatCurrency(m.expenses)}</td>
                    <td className={`px-4 py-3 text-sm text-right font-medium ${m.cashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(m.cashFlow)}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right ${rate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {rate.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CashFlowReport: React.FC<{ reports: any }> = ({ reports }) => {
  const { monthlySummary } = reports;

  // Compute running balance for waterfall effect
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const waterfallData = useMemo(() => {
    let runningBalance = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return monthlySummary.map((m: any) => {
      const prevBalance = runningBalance;
      runningBalance += m.cashFlow;
      return {
        ...m,
        runningBalance,
        waterfallBase: m.cashFlow >= 0 ? prevBalance : runningBalance,
        waterfallAmount: Math.abs(m.cashFlow),
      };
    });
  }, [monthlySummary]);

  return (
    <div className="space-y-6">
      {/* Income vs Expenses area */}
      <ChartCard title="Cash Flow Over Time">
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={monthlySummary}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tickFormatter={formatMonth} />
            <YAxis tickFormatter={(v) => formatCurrency(v)} />
            <Tooltip formatter={(v: number) => formatCurrency(v)} labelFormatter={formatMonth} />
            <Legend />
            <Area type="monotone" dataKey="income" name="Income" stroke="#059669" fill="#05966920" />
            <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#DC2626" fill="#DC262620" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Waterfall-style cash flow */}
      <ChartCard title="Monthly Cash Flow">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlySummary}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tickFormatter={formatMonth} />
            <YAxis tickFormatter={(v) => formatCurrency(v)} />
            <Tooltip formatter={(v: number) => formatCurrency(v)} labelFormatter={formatMonth} />
            <Bar
              dataKey="cashFlow"
              name="Cash Flow"
              radius={[4, 4, 0, 0]}
            >
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {monthlySummary.map((_: any, i: number) => (
                <Cell key={i} fill={monthlySummary[i].cashFlow >= 0 ? '#10b981' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Running balance line */}
      <ChartCard title="Cumulative Cash Flow">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={waterfallData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tickFormatter={formatMonth} />
            <YAxis tickFormatter={(v) => formatCurrency(v)} />
            <Tooltip formatter={(v: number) => formatCurrency(v)} labelFormatter={formatMonth} />
            <Legend />
            <Line
              type="monotone"
              dataKey="runningBalance"
              name="Cumulative Cash Flow"
              stroke="#0D9488"
              strokeWidth={3}
              dot={{ fill: '#0D9488', r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Monthly breakdown table */}
      <ChartCard title="Monthly Summary">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Month</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Income</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Expenses</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cash Flow</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cumulative</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {[...waterfallData].reverse().map((m: any) => (
                <tr key={m.month} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{formatMonth(m.month)}</td>
                  <td className="px-4 py-3 text-sm text-right text-green-600">{formatCurrency(m.income)}</td>
                  <td className="px-4 py-3 text-sm text-right text-red-600">{formatCurrency(m.expenses)}</td>
                  <td className={`px-4 py-3 text-sm text-right font-medium ${m.cashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(m.cashFlow)}
                  </td>
                  <td className={`px-4 py-3 text-sm text-right ${m.runningBalance >= 0 ? 'text-brand-700' : 'text-red-600'}`}>
                    {formatCurrency(m.runningBalance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MerchantReport: React.FC<{ reports: any }> = ({ reports }) => {
  const { topMerchants } = reports;
  const maxAmount = topMerchants.length > 0 ? topMerchants[0].amount : 1;
  const totalMerchantSpend = topMerchants.reduce((s: number, m: { amount: number }) => s + m.amount, 0);

  return (
    <div className="space-y-6">
      <ChartCard title="Top Merchants by Spending">
        {topMerchants.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">No merchant data available for this period.</p>
        ) : (
          <div className="space-y-3">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {topMerchants.map((m: any, i: number) => {
              const pct = totalMerchantSpend > 0 ? ((m.amount / totalMerchantSpend) * 100).toFixed(1) : '0';
              return (
                <div key={m.merchantName} className="flex items-center gap-4">
                  <span className="w-6 text-sm text-gray-400 text-right font-medium">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{m.merchantName}</span>
                      <div className="text-right">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatCurrency(m.amount)}</span>
                        <span className="text-xs text-gray-400 ml-2">({m.transactionCount} txns · {pct}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
                      <div
                        className="h-2.5 rounded-full transition-all"
                        style={{
                          width: `${(m.amount / maxAmount) * 100}%`,
                          backgroundColor: COLORS[i % COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ChartCard>
    </div>
  );
};

const NetWorthReport: React.FC<{ months: number }> = ({ months }) => {
  const { data, loading } = useQuery(GET_NET_WORTH_HISTORY, {
    variables: { months },
  });

  const history = data?.netWorthHistory ?? [];

  if (loading) return <LoadingSpinner />;
  if (history.length === 0) return <p className="text-gray-500 text-sm">No net worth data available yet.</p>;

  const latest = history[history.length - 1];
  const first = history[0];
  const change = latest.netWorth - first.netWorth;
  const changePct = first.netWorth !== 0 ? (change / Math.abs(first.netWorth) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Net Worth" value={formatCurrency(latest.netWorth)} valueClassName={latest.netWorth >= 0 ? 'text-brand-700' : 'text-red-600'} />
        <StatCard label="Assets" value={formatCurrency(latest.assets)} valueClassName="text-green-600" />
        <StatCard label="Liabilities" value={formatCurrency(latest.liabilities)} valueClassName="text-red-600" />
        <StatCard
          label={`Change (${months}mo)`}
          value={`${change >= 0 ? '+' : ''}${formatCurrency(change)} (${changePct >= 0 ? '+' : ''}${changePct.toFixed(1)}%)`}
          valueClassName={change >= 0 ? 'text-green-600' : 'text-red-600'}
        />
      </div>

      <ChartCard title="Net Worth Over Time">
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={history}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={formatMonth} />
            <YAxis tickFormatter={(v) => formatCurrency(v)} />
            <Tooltip formatter={(v: number) => formatCurrency(v)} labelFormatter={formatMonth} />
            <Legend />
            <Area type="monotone" dataKey="assets" name="Assets" stroke="#059669" fill="#05966930" stackId="1" />
            <Area type="monotone" dataKey="liabilities" name="Liabilities" stroke="#DC2626" fill="#DC262630" stackId="2" />
            <Line type="monotone" dataKey="netWorth" name="Net Worth" stroke="#0D9488" strokeWidth={3} dot={{ fill: '#0D9488', r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Monthly Breakdown">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Month</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Assets</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Liabilities</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Net Worth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[...history].reverse().map((h: { date: string; assets: number; liabilities: number; netWorth: number }) => (
                <tr key={h.date} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{formatMonth(h.date)}</td>
                  <td className="px-4 py-3 text-sm text-right text-green-600">{formatCurrency(h.assets)}</td>
                  <td className="px-4 py-3 text-sm text-right text-red-600">{formatCurrency(h.liabilities)}</td>
                  <td className={`px-4 py-3 text-sm text-right font-medium ${h.netWorth >= 0 ? 'text-brand-700' : 'text-red-600'}`}>
                    {formatCurrency(h.netWorth)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
};

const CategoryTrendsReport: React.FC<{ months: number }> = ({ months }) => {
  const { data: catData } = useQuery(GET_CATEGORIES);
  const categories = catData?.categories ?? [];

  const [selectedCatIds, setSelectedCatIds] = useState<string[]>([]);

  // Flatten categories (parents + children)
  const allCategories = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const flat: { id: string; name: string; icon?: string }[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    categories.forEach((cat: any) => {
      flat.push({ id: cat.id, name: cat.name, icon: cat.icon });
      if (cat.subcategories) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cat.subcategories.forEach((sub: any) => {
          flat.push({ id: sub.id, name: `${cat.name} > ${sub.name}`, icon: sub.icon });
        });
      }
    });
    return flat;
  }, [categories]);

  const { data: trendsData, loading } = useQuery(GET_CATEGORY_TRENDS, {
    variables: { categoryIds: selectedCatIds, months },
    skip: selectedCatIds.length === 0,
  });

  const trends = trendsData?.categoryTrends ?? [];

  // Transform trends into chart-friendly format: [{month, Cat1: amount, Cat2: amount}]
  const chartData = useMemo(() => {
    if (trends.length === 0) return [];
    const byMonth: Record<string, Record<string, number>> = {};
    trends.forEach((t: { month: string; categoryName: string; amount: number }) => {
      if (!byMonth[t.month]) byMonth[t.month] = { month: t.month as unknown as number } as unknown as Record<string, number>;
      byMonth[t.month][t.categoryName] = t.amount;
    });
    return Object.values(byMonth).sort((a, b) => (a.month as unknown as string).localeCompare(b.month as unknown as string));
  }, [trends]);

  const categoryNames = useMemo(() => {
    const names = new Set<string>();
    trends.forEach((t: { categoryName: string }) => names.add(t.categoryName));
    return Array.from(names);
  }, [trends]);

  const toggleCategory = (id: string) => {
    setSelectedCatIds(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : prev.length < 5 ? [...prev, id] : prev
    );
  };

  return (
    <div className="space-y-6">
      {/* Category selector */}
      <ChartCard title="Select Categories (up to 5)">
        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
          {allCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => toggleCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedCatIds.includes(cat.id)
                  ? 'bg-brand-100 text-brand-800 border border-brand-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </ChartCard>

      {selectedCatIds.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">Select categories above to see spending trends over time.</p>
      )}

      {loading && <LoadingSpinner />}

      {chartData.length > 0 && (
        <>
          <ChartCard title="Category Spending Trends">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tickFormatter={formatMonth} />
                <YAxis tickFormatter={(v) => formatCurrency(v)} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} labelFormatter={formatMonth} />
                <Legend />
                {categoryNames.map((name, i) => (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={COLORS[i % COLORS.length]}
                    strokeWidth={2}
                    dot={{ fill: COLORS[i % COLORS.length], r: 4 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Monthly Data">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Month</th>
                    {categoryNames.map(name => (
                      <th key={name} className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {[...chartData].reverse().map((row: any) => (
                    <tr key={row.month} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{formatMonth(row.month)}</td>
                      {categoryNames.map(name => (
                        <td key={name} className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100">
                          {row[name] != null ? formatCurrency(row[name]) : '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>
        </>
      )}
    </div>
  );
};

// Sankey / Money Flow Report — shows income flowing into expense categories
const SANKEY_COLORS = [
  '#0D9488', '#F59E0B', '#7C3AED', '#E11D48', '#0EA5E9',
  '#10B981', '#F97316', '#6366F1', '#84CC16', '#EC4899',
  '#06B6D4', '#8B5CF6', '#14B8A6', '#A855F7', '#EF4444',
];

const SankeyNode = ({ x, y, width, height, index, payload }: any) => {
  const isIncome = payload.depth === 0;
  return (
    <Layer key={`sankey-node-${index}`}>
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        fill={isIncome ? '#10B981' : SANKEY_COLORS[index % SANKEY_COLORS.length]}
        fillOpacity={0.9}
        rx={3}
        ry={3}
      />
      <text
        x={isIncome ? x - 6 : x + width + 6}
        y={y + height / 2}
        textAnchor={isIncome ? 'end' : 'start'}
        dominantBaseline="central"
        className="fill-gray-700 dark:fill-gray-300"
        fontSize={12}
        fontWeight={500}
      >
        {payload.name}
      </text>
      <text
        x={isIncome ? x - 6 : x + width + 6}
        y={y + height / 2 + 16}
        textAnchor={isIncome ? 'end' : 'start'}
        dominantBaseline="central"
        className="fill-gray-400 dark:fill-gray-500"
        fontSize={10}
      >
        {formatCurrency(payload.value)}
      </text>
    </Layer>
  );
};

const SankeyLink = (props: any) => {
  const { sourceX, targetX, sourceY, targetY, sourceControlX, targetControlX, linkWidth, index } = props;
  return (
    <Layer key={`sankey-link-${index}`}>
      <path
        d={`
          M${sourceX},${sourceY + linkWidth / 2}
          C${sourceControlX},${sourceY + linkWidth / 2}
           ${targetControlX},${targetY + linkWidth / 2}
           ${targetX},${targetY + linkWidth / 2}
          L${targetX},${targetY - linkWidth / 2}
          C${targetControlX},${targetY - linkWidth / 2}
           ${sourceControlX},${sourceY - linkWidth / 2}
           ${sourceX},${sourceY - linkWidth / 2}
          Z
        `}
        fill={SANKEY_COLORS[props.payload?.target?.index % SANKEY_COLORS.length] || '#94A3B8'}
        fillOpacity={0.3}
        strokeWidth={0}
      />
    </Layer>
  );
};

const MoneyFlowReport: React.FC<{ reports: any }> = ({ reports }) => {
  const sankeyData = useMemo(() => {
    if (!reports) return null;

    const { spendingByCategory, monthlySummary } = reports;
    if (!spendingByCategory?.length || !monthlySummary?.length) return null;

    // Calculate total income and total expenses
    const totalIncome = monthlySummary.reduce((sum: number, m: any) => sum + m.income, 0);
    const totalExpenses = monthlySummary.reduce((sum: number, m: any) => sum + m.expenses, 0);

    if (totalIncome <= 0) return null;

    // Build nodes: index 0 = "Income", then expense categories (top 12)
    const sortedCategories = [...spendingByCategory]
      .sort((a: any, b: any) => b.amount - a.amount)
      .slice(0, 12);

    // If there's a remainder (savings), add it
    const categoryTotal = sortedCategories.reduce((sum: number, c: any) => sum + c.amount, 0);
    const savings = totalIncome - totalExpenses;

    const nodes: { name: string }[] = [
      { name: 'Income' },
      ...sortedCategories.map((c: any) => ({ name: c.categoryName })),
    ];

    // Group remaining categories into "Other"
    const otherAmount = totalExpenses - categoryTotal;
    if (otherAmount > 10) {
      nodes.push({ name: 'Other Expenses' });
    }
    if (savings > 10) {
      nodes.push({ name: 'Savings' });
    }

    const links: { source: number; target: number; value: number }[] = [];

    // Income → each category
    sortedCategories.forEach((c: any, i: number) => {
      links.push({ source: 0, target: i + 1, value: Math.round(c.amount * 100) / 100 });
    });

    let nextIdx = sortedCategories.length + 1;
    if (otherAmount > 10) {
      links.push({ source: 0, target: nextIdx, value: Math.round(otherAmount * 100) / 100 });
      nextIdx++;
    }
    if (savings > 10) {
      links.push({ source: 0, target: nextIdx, value: Math.round(savings * 100) / 100 });
    }

    return { nodes, links };
  }, [reports]);

  if (!sankeyData) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p className="text-lg font-medium">Not enough data for money flow</p>
        <p className="mt-1 text-sm">Income and spending data is needed to generate this visualization.</p>
      </div>
    );
  }

  const totalIncome = reports.monthlySummary.reduce((s: number, m: any) => s + m.income, 0);
  const totalExpenses = reports.monthlySummary.reduce((s: number, m: any) => s + m.expenses, 0);
  const savings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (savings / totalIncome * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Income" value={formatCurrency(totalIncome)} valueClassName="text-green-600 dark:text-green-400" />
        <StatCard label="Total Expenses" value={formatCurrency(totalExpenses)} valueClassName="text-red-600 dark:text-red-400" />
        <StatCard label="Net Savings" value={formatCurrency(savings)} valueClassName={savings >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} />
        <StatCard label="Savings Rate" value={`${savingsRate.toFixed(1)}%`} valueClassName={savingsRate >= 20 ? 'text-green-600 dark:text-green-400' : savingsRate >= 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'} />
      </div>

      <ChartCard title="Income → Expense Flow" subtitle="How your income flows into spending categories">
        <div style={{ width: '100%', height: 500 }}>
          <ResponsiveContainer>
            <RechartsSankey
              data={sankeyData}
              nodeWidth={10}
              nodePadding={24}
              margin={{ top: 20, right: 160, bottom: 20, left: 160 }}
              link={<SankeyLink />}
              node={<SankeyNode />}
            >
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
              />
            </RechartsSankey>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Breakdown table */}
      <ChartCard title="Flow Breakdown" subtitle="Detailed allocation of income">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Category</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Amount</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">% of Income</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Share</th>
              </tr>
            </thead>
            <tbody>
              {sankeyData.links.map((link, i) => {
                const pct = totalIncome > 0 ? (link.value / totalIncome * 100) : 0;
                const node = sankeyData.nodes[link.target];
                return (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4 flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full inline-block"
                        style={{ backgroundColor: SANKEY_COLORS[link.target % SANKEY_COLORS.length] }}
                      />
                      {node.name}
                    </td>
                    <td className="py-3 px-4 text-right font-medium">{formatCurrency(link.value)}</td>
                    <td className="py-3 px-4 text-right text-gray-500 dark:text-gray-400">{pct.toFixed(1)}%</td>
                    <td className="py-3 px-4">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${Math.min(pct, 100)}%`,
                            backgroundColor: SANKEY_COLORS[link.target % SANKEY_COLORS.length],
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
};

export default ReportsPage;
