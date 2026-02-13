import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  Area, AreaChart,
} from 'recharts';
import { useReports } from '@/hooks/useReports';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6',
  '#8b5cf6', '#ef4444', '#14b8a6', '#f97316', '#06b6d4',
  '#84cc16', '#e879f9',
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

const formatMonth = (month: string) => {
  const [y, m] = month.split('-');
  const date = new Date(parseInt(y), parseInt(m) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
};

type ReportTab = 'overview' | 'spending' | 'cashflow' | 'merchants';

const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const [months, setMonths] = useState(6);
  const { reports, loading } = useReports({ months });

  if (loading) return <LoadingSpinner />;

  const tabs: { id: ReportTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'spending', label: 'Spending by Category' },
    { id: 'cashflow', label: 'Cash Flow' },
    { id: 'merchants', label: 'Top Merchants' },
  ];

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Understand your spending patterns and financial trends"
        actions={
          <select
            value={months}
            onChange={(e) => setMonths(parseInt(e.target.value))}
            className="rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value={3}>Last 3 months</option>
            <option value={6}>Last 6 months</option>
            <option value={12}>Last 12 months</option>
          </select>
        }
      />

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && reports && <OverviewReport reports={reports} />}
      {activeTab === 'spending' && reports && <SpendingReport reports={reports} />}
      {activeTab === 'cashflow' && reports && <CashFlowReport reports={reports} />}
      {activeTab === 'merchants' && reports && <MerchantReport reports={reports} />}
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const OverviewReport: React.FC<{ reports: any }> = ({ reports }) => {
  const { monthlySummary, spendingByCategory } = reports;

  const totalIncome = monthlySummary.reduce((s: number, m: { income: number }) => s + m.income, 0);
  const totalExpenses = monthlySummary.reduce((s: number, m: { expenses: number }) => s + m.expenses, 0);
  const avgMonthlyExpenses = monthlySummary.length > 0 ? totalExpenses / monthlySummary.length : 0;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-500">Total Income</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Total Expenses</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Net Cash Flow</p>
          <p className={`text-2xl font-bold ${totalIncome - totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(totalIncome - totalExpenses)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Avg Monthly Expenses</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(avgMonthlyExpenses)}</p>
        </Card>
      </div>

      {/* Income vs Expenses bar chart */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Income vs Expenses</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlySummary}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tickFormatter={formatMonth} />
            <YAxis tickFormatter={(v) => formatCurrency(v)} />
            <Tooltip formatter={(v: number) => formatCurrency(v)} labelFormatter={formatMonth} />
            <Legend />
            <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Spending by category donut */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Spending by Category</h3>
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
                  <span className="text-sm text-gray-700">
                    {cat.categoryIcon} {cat.categoryName}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-900">{formatCurrency(cat.amount)}</span>
                  <span className="text-xs text-gray-400 ml-2">{cat.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
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
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Spending by Category</h3>
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
      </Card>

      {/* Category breakdown table */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Category Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">%</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Transactions</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {spendingByCategory.map((cat: any, i: number) => (
                <tr key={cat.categoryId || i}>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {cat.categoryIcon} {cat.categoryName}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                    {formatCurrency(cat.amount)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-500">
                    {cat.percentage}%
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-500">
                    {cat.transactionCount}
                  </td>
                  <td className="px-4 py-3 w-32">
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
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
      </Card>
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CashFlowReport: React.FC<{ reports: any }> = ({ reports }) => {
  const { monthlySummary } = reports;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Cash Flow Over Time</h3>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={monthlySummary}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tickFormatter={formatMonth} />
            <YAxis tickFormatter={(v) => formatCurrency(v)} />
            <Tooltip formatter={(v: number) => formatCurrency(v)} labelFormatter={formatMonth} />
            <Legend />
            <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" fill="#10b98133" />
            <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" fill="#ef444433" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Cash Flow</h3>
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
      </Card>

      {/* Monthly breakdown table */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Summary</h3>
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Income</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Expenses</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cash Flow</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {[...monthlySummary].reverse().map((m: any) => (
              <tr key={m.month}>
                <td className="px-4 py-3 text-sm text-gray-900">{formatMonth(m.month)}</td>
                <td className="px-4 py-3 text-sm text-right text-green-600">{formatCurrency(m.income)}</td>
                <td className="px-4 py-3 text-sm text-right text-red-600">{formatCurrency(m.expenses)}</td>
                <td className={`px-4 py-3 text-sm text-right font-medium ${m.cashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(m.cashFlow)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MerchantReport: React.FC<{ reports: any }> = ({ reports }) => {
  const { topMerchants } = reports;
  const maxAmount = topMerchants.length > 0 ? topMerchants[0].amount : 1;

  return (
    <Card className="p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Top Merchants by Spending</h3>
      {topMerchants.length === 0 ? (
        <p className="text-gray-500 text-sm">No merchant data available for this period.</p>
      ) : (
        <div className="space-y-3">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {topMerchants.map((m: any, i: number) => (
            <div key={m.merchantName} className="flex items-center gap-4">
              <span className="w-6 text-sm text-gray-400 text-right">{i + 1}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">{m.merchantName}</span>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(m.amount)}</span>
                    <span className="text-xs text-gray-400 ml-2">({m.transactionCount} txns)</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-indigo-500"
                    style={{ width: `${(m.amount / maxAmount) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default ReportsPage;
