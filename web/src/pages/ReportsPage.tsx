import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  Area, AreaChart,
  LineChart, Line,
  ComposedChart,
} from 'recharts';
import { useQuery } from '@apollo/client';
import { useReports } from '@/hooks/useReports';
import { GET_NET_WORTH_HISTORY } from '@/graphql/queries';
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

type ReportTab = 'overview' | 'spending' | 'income-expenses' | 'cashflow' | 'merchants' | 'category-trends' | 'net-worth';

type DateRangeMode = 'preset' | 'custom';

const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const [months, setMonths] = useState(6);
  const [dateRangeMode, setDateRangeMode] = useState<DateRangeMode>('preset');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const queryVars = dateRangeMode === 'custom' && customFrom && customTo
    ? { dateFrom: customFrom, dateTo: customTo }
    : { months };

  const { reports, loading } = useReports(queryVars);

  const tabs: { id: ReportTab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'spending', label: 'Spending by Category', icon: '🍩' },
    { id: 'income-expenses', label: 'Income vs Expenses', icon: '⚖️' },
    { id: 'cashflow', label: 'Cash Flow', icon: '💰' },
    { id: 'merchants', label: 'Top Merchants', icon: '🏪' },
    { id: 'category-trends', label: 'Category Trends', icon: '📈' },
    { id: 'net-worth', label: 'Net Worth', icon: '💎' },
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
          {activeTab === 'category-trends' && <CategoryTrendsReport reports={reports} />}
          {activeTab === 'net-worth' && <NetWorthReport months={dateRangeMode === 'preset' ? months : 12} />}
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CategoryTrendsReport: React.FC<{ reports: any }> = ({ reports }) => {
  const { monthlySpendingByCategory, spendingByCategory } = reports;

  // Get top 8 categories for trend lines
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const topCats = spendingByCategory.slice(0, 8).map((c: any) => c.categoryName);

  // Transform data: each month as a row with category amounts as columns
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const trendData = monthlySpendingByCategory.map((m: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row: any = { month: m.month };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    m.categories.forEach((c: any) => {
      if (topCats.includes(c.categoryName)) {
        row[c.categoryName] = c.amount;
      }
    });
    // Fill missing categories with 0
    topCats.forEach((name: string) => {
      if (row[name] === undefined) row[name] = 0;
    });
    return row;
  });

  return (
    <div className="space-y-6">
      <ChartCard title="Category Spending Trends">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tickFormatter={formatMonth} />
            <YAxis tickFormatter={(v) => formatCurrency(v)} />
            <Tooltip formatter={(v: number) => formatCurrency(v)} labelFormatter={formatMonth} />
            <Legend />
            {topCats.map((name: string, i: number) => (
              <Line
                key={name}
                type="monotone"
                dataKey={name}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Month-over-month change table */}
      <ChartCard title="Month-over-Month Changes">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Category</th>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {trendData.slice(-3).map((m: any) => (
                  <th key={m.month} className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    {formatMonth(m.month)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topCats.map((name: string, i: number) => (
                <tr key={name} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    {name}
                  </td>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {trendData.slice(-3).map((m: any) => (
                    <td key={m.month} className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100">
                      {formatCurrency(m[name] || 0)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
};

interface NetWorthSnapshot {
  date: string;
  assets: number;
  liabilities: number;
  netWorth: number;
}

const NetWorthReport: React.FC<{ months: number }> = ({ months }) => {
  const { data, loading } = useQuery(GET_NET_WORTH_HISTORY, {
    variables: { months },
  });

  if (loading) return <LoadingSpinner />;

  const history: NetWorthSnapshot[] = data?.netWorthHistory || [];

  if (history.length === 0) {
    return (
      <ChartCard title="Net Worth Over Time">
        <p className="text-gray-500 dark:text-gray-400 text-sm py-8 text-center">
          No balance history data available. Net worth tracking requires account balance snapshots.
        </p>
      </ChartCard>
    );
  }

  const latest = history[history.length - 1];
  const earliest = history[0];
  const change = latest.netWorth - earliest.netWorth;
  const changePct = earliest.netWorth !== 0 ? (change / Math.abs(earliest.netWorth) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Current Net Worth" value={formatCurrency(latest.netWorth)} valueClassName={latest.netWorth >= 0 ? 'text-green-600' : 'text-red-600'} />
        <StatCard label="Total Assets" value={formatCurrency(latest.assets)} valueClassName="text-green-600" />
        <StatCard label="Total Liabilities" value={formatCurrency(latest.liabilities)} valueClassName="text-red-600" />
        <StatCard
          label={`Change (${history.length} mo)`}
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
            <Area type="monotone" dataKey="assets" name="Assets" stroke="#059669" fill="#05966920" stackId="1" />
            <Area type="monotone" dataKey="liabilities" name="Liabilities" stroke="#DC2626" fill="#DC262620" />
            <Line type="monotone" dataKey="netWorth" name="Net Worth" stroke="#0D9488" strokeWidth={3} dot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Monthly Net Worth">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Month</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Assets</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Liabilities</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Net Worth</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[...history].reverse().map((h, i) => {
                const prev = history[history.length - 1 - i - 1];
                const monthChange = prev ? h.netWorth - prev.netWorth : 0;
                return (
                  <tr key={h.date} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{formatMonth(h.date)}</td>
                    <td className="px-4 py-3 text-sm text-right text-green-600">{formatCurrency(h.assets)}</td>
                    <td className="px-4 py-3 text-sm text-right text-red-600">{formatCurrency(h.liabilities)}</td>
                    <td className={`px-4 py-3 text-sm text-right font-medium ${h.netWorth >= 0 ? 'text-brand-700' : 'text-red-600'}`}>
                      {formatCurrency(h.netWorth)}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right ${monthChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {i < history.length - 1 ? `${monthChange >= 0 ? '+' : ''}${formatCurrency(monthChange)}` : '—'}
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
