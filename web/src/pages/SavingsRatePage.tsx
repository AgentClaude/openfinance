import React, { useState } from 'react';
import {
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  LightBulbIcon,
  FireIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts';
import { useSavingsRate, type MonthlyTrend, type SavingsRecommendation } from '@/hooks/useSavingsRate';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Badge from '@/components/ui/Badge';

import { usePageTitle } from '@/hooks/usePageTitle';
import clsx from 'clsx';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

const formatMonth = (month: string) => {
  const [year, m] = month.split('-');
  const date = new Date(parseInt(year), parseInt(m) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
};

const ALLOCATION_COLORS = {
  needs: '#3B82F6',
  wants: '#F59E0B',
  savings: '#10B981',
  other: '#8B5CF6',
};

const EXPENSE_COLORS = [
  '#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6',
];

type Tab = 'overview' | 'trends' | 'allocation' | 'income';

const SavingsRatePage: React.FC = () => {
  usePageTitle('Savings Rate');
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [months, setMonths] = useState(12);

  const { data, loading, error } = useSavingsRate(months);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<XCircleIcon className="h-12 w-12" />}
        title="Error loading data"
        description={error.message}
      />
    );
  }

  if (!data || data.summary.monthsAnalyzed === 0) {
    return (
      <div>
        <PageHeader
          title="Savings Rate"
          subtitle="Track your savings rate and income allocation"
        />
        <EmptyState
          icon={<BanknotesIcon className="h-12 w-12" />}
          title="No data yet"
          description="Add some transactions to see your savings rate analysis."
        />
      </div>
    );
  }

  const { summary, monthlyTrends, allocation, incomeSources, expenseAllocation, streaks, recommendations } = data;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <ChartBarIcon className="h-4 w-4" /> },
    { id: 'trends', label: 'Trends', icon: <ArrowTrendingUpIcon className="h-4 w-4" /> },
    { id: 'allocation', label: '50/30/20', icon: <BanknotesIcon className="h-4 w-4" /> },
    { id: 'income', label: 'Income & Expenses', icon: <FireIcon className="h-4 w-4" /> },
  ];

  const trendIcon = summary.trendDirection === 'improving'
    ? <ArrowTrendingUpIcon className="h-5 w-5 text-emerald-500" />
    : summary.trendDirection === 'declining'
    ? <ArrowTrendingDownIcon className="h-5 w-5 text-red-500" />
    : <ChartBarIcon className="h-5 w-5 text-gray-400" />;

  const trendColor = summary.trendDirection === 'improving'
    ? 'text-emerald-600 dark:text-emerald-400'
    : summary.trendDirection === 'declining'
    ? 'text-red-600 dark:text-red-400'
    : 'text-gray-600 dark:text-gray-400';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Savings Rate"
        subtitle="Track your savings rate and income allocation over time"
      />

      {/* Time Range Selector */}
      <div className="flex items-center gap-2">
        {[6, 12, 24].map((m) => (
          <button
            key={m}
            onClick={() => setMonths(m)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              months === m
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
            )}
          >
            {m}mo
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Current Rate</div>
          <div className={clsx(
            'text-2xl font-bold mt-1',
            summary.currentSavingsRate >= 20 ? 'text-emerald-600 dark:text-emerald-400'
              : summary.currentSavingsRate >= 0 ? 'text-amber-600 dark:text-amber-400'
              : 'text-red-600 dark:text-red-400'
          )}>
            {summary.currentSavingsRate}%
          </div>
          <div className="flex items-center gap-1 mt-1 text-xs">
            {trendIcon}
            <span className={trendColor}>
              {summary.trendDirection === 'improving' ? 'Improving' : summary.trendDirection === 'declining' ? 'Declining' : 'Stable'}
            </span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Average Rate</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {summary.averageSavingsRate}%
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            over {summary.monthsAnalyzed} months
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Saved</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(summary.totalSaved)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {formatCurrency(summary.averageMonthlySavings)}/mo avg
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Percentile</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            Top {100 - summary.percentile}%
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            of US households
          </div>
        </Card>
      </div>

      {/* Streaks */}
      {(streaks.positiveSavingsMonths > 0 || streaks.above20PercentMonths > 0) && (
        <div className="flex flex-wrap gap-3">
          {streaks.positiveSavingsMonths > 0 && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-full">
              <FireIcon className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                {streaks.positiveSavingsMonths}-month positive savings streak
              </span>
            </div>
          )}
          {streaks.above20PercentMonths > 0 && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-full">
              <CheckCircleIcon className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                {streaks.above20PercentMonths} months above 20% target
              </span>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab
          monthlyTrends={monthlyTrends}
          recommendations={recommendations}
          allocation={allocation}
        />
      )}
      {activeTab === 'trends' && <TrendsTab monthlyTrends={monthlyTrends} />}
      {activeTab === 'allocation' && <AllocationTab allocation={allocation} expenseAllocation={expenseAllocation} />}
      {activeTab === 'income' && <IncomeTab incomeSources={incomeSources} expenseAllocation={expenseAllocation} />}
    </div>
  );
};

// ── Overview Tab ──────────────────────────────────────────────

interface OverviewTabProps {
  monthlyTrends: MonthlyTrend[];
  recommendations: SavingsRecommendation[];
  allocation: { needs: { amount: number; percent: number }; wants: { amount: number; percent: number }; savings: { amount: number; percent: number }; avgMonthlyIncome: number };
}

const OverviewTab: React.FC<OverviewTabProps> = ({ monthlyTrends, recommendations, allocation }) => {
  const chartData = monthlyTrends.map((m) => ({
    month: formatMonth(m.month),
    rate: m.savingsRate,
    savings: m.savingsAmount,
  }));

  return (
    <div className="space-y-6">
      {/* Savings Rate Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Savings Rate Over Time</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
              <YAxis
                tick={{ fontSize: 12 }}
                stroke="#9CA3AF"
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                formatter={(value: number) => [`${value}%`, 'Savings Rate']}
                contentStyle={{
                  backgroundColor: 'rgba(17, 24, 39, 0.9)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <ReferenceLine y={20} stroke="#F59E0B" strokeDasharray="5 5" label={{ value: '20% target', position: 'right', fontSize: 11, fill: '#F59E0B' }} />
              <Area
                type="monotone"
                dataKey="rate"
                stroke="#10B981"
                fill="url(#savingsGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* 50/30/20 Quick Summary */}
      {allocation.avgMonthlyIncome > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">50/30/20 Snapshot</h3>
          <div className="grid grid-cols-3 gap-4">
            <AllocationBar label="Needs" percent={allocation.needs.percent} target={50} color={ALLOCATION_COLORS.needs} amount={allocation.needs.amount} />
            <AllocationBar label="Wants" percent={allocation.wants.percent} target={30} color={ALLOCATION_COLORS.wants} amount={allocation.wants.amount} />
            <AllocationBar label="Savings" percent={allocation.savings.percent} target={20} color={ALLOCATION_COLORS.savings} amount={allocation.savings.amount} />
          </div>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <LightBulbIcon className="h-5 w-5 text-amber-500" />
            Recommendations
          </h3>
          <div className="space-y-3">
            {recommendations.map((rec, i) => (
              <RecommendationCard key={i} rec={rec} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

// ── Trends Tab ───────────────────────────────────────────────

const TrendsTab: React.FC<{ monthlyTrends: MonthlyTrend[] }> = ({ monthlyTrends }) => {
  const chartData = monthlyTrends.map((m) => ({
    month: formatMonth(m.month),
    income: m.income,
    expenses: m.expenses,
    savings: m.savingsAmount,
    rate: m.savingsRate,
  }));

  return (
    <div className="space-y-6">
      {/* Income vs Expenses */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Income vs Expenses</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
              <Tooltip
                formatter={(value: number, name: string) => [formatCurrency(value), name]}
                contentStyle={{
                  backgroundColor: 'rgba(17, 24, 39, 0.9)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Legend />
              <Bar dataKey="income" fill="#10B981" name="Income" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="#EF4444" name="Expenses" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Savings Amount */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Savings</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" tickFormatter={(v) => formatCurrency(v)} />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), 'Savings']}
                contentStyle={{
                  backgroundColor: 'rgba(17, 24, 39, 0.9)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <ReferenceLine y={0} stroke="#6B7280" />
              <Bar
                dataKey="savings"
                radius={[4, 4, 0, 0]}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.savings >= 0 ? '#10B981' : '#EF4444'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Monthly Details Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 text-gray-500 dark:text-gray-400">Month</th>
                <th className="text-right py-2 text-gray-500 dark:text-gray-400">Income</th>
                <th className="text-right py-2 text-gray-500 dark:text-gray-400">Expenses</th>
                <th className="text-right py-2 text-gray-500 dark:text-gray-400">Saved</th>
                <th className="text-right py-2 text-gray-500 dark:text-gray-400">Rate</th>
              </tr>
            </thead>
            <tbody>
              {[...monthlyTrends].reverse().map((m) => (
                <tr key={m.month} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2 text-gray-900 dark:text-white">{formatMonth(m.month)}</td>
                  <td className="text-right py-2 text-emerald-600 dark:text-emerald-400">{formatCurrency(m.income)}</td>
                  <td className="text-right py-2 text-red-600 dark:text-red-400">{formatCurrency(m.expenses)}</td>
                  <td className={clsx('text-right py-2', m.savingsAmount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
                    {formatCurrency(m.savingsAmount)}
                  </td>
                  <td className={clsx('text-right py-2 font-medium', m.savingsRate >= 20 ? 'text-emerald-600 dark:text-emerald-400' : m.savingsRate >= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400')}>
                    {m.savingsRate}%
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

// ── Allocation Tab ──────────────────────────────────────────

interface AllocationTabProps {
  allocation: {
    needs: { amount: number; percent: number; targetPercent: number; status: string };
    wants: { amount: number; percent: number; targetPercent: number; status: string };
    savings: { amount: number; percent: number; targetPercent: number; status: string };
    otherExpenses: { amount: number; percent: number };
    avgMonthlyIncome: number;
  };
  expenseAllocation: { group: string; total: number; monthlyAverage: number; percent: number; categoryType: string }[];
}

const AllocationTab: React.FC<AllocationTabProps> = ({ allocation, expenseAllocation }) => {
  const pieData = [
    { name: 'Needs', value: allocation.needs.percent, color: ALLOCATION_COLORS.needs },
    { name: 'Wants', value: allocation.wants.percent, color: ALLOCATION_COLORS.wants },
    { name: 'Savings', value: allocation.savings.percent, color: ALLOCATION_COLORS.savings },
  ];

  if (allocation.otherExpenses.percent > 0) {
    pieData.push({ name: 'Other', value: allocation.otherExpenses.percent, color: ALLOCATION_COLORS.other });
  }

  const targetData = [
    { name: 'Needs', value: 50, color: ALLOCATION_COLORS.needs },
    { name: 'Wants', value: 30, color: ALLOCATION_COLORS.wants },
    { name: 'Savings', value: 20, color: ALLOCATION_COLORS.savings },
  ];

  return (
    <div className="space-y-6">
      {/* 50/30/20 Comparison */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">50/30/20 Rule Analysis</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          The 50/30/20 rule suggests allocating 50% to needs, 30% to wants, and 20% to savings.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Your Allocation Pie */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 text-center">Your Allocation</h4>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value}%`]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Target Pie */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 text-center">Target (50/30/20)</h4>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={targetData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {targetData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value}%`]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </Card>

      {/* Detailed Breakdown */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Detailed Breakdown</h3>
        <div className="space-y-6">
          <AllocationRow
            label="Needs"
            description="Housing, transportation, healthcare, utilities"
            actual={allocation.needs.percent}
            target={allocation.needs.targetPercent}
            amount={allocation.needs.amount}
            status={allocation.needs.status}
            color={ALLOCATION_COLORS.needs}
          />
          <AllocationRow
            label="Wants"
            description="Dining, shopping, entertainment, personal care"
            actual={allocation.wants.percent}
            target={allocation.wants.targetPercent}
            amount={allocation.wants.amount}
            status={allocation.wants.status}
            color={ALLOCATION_COLORS.wants}
          />
          <AllocationRow
            label="Savings"
            description="Amount saved after needs and wants"
            actual={allocation.savings.percent}
            target={allocation.savings.targetPercent}
            amount={allocation.savings.amount}
            status={allocation.savings.status}
            color={ALLOCATION_COLORS.savings}
          />
        </div>
      </Card>

      {/* Expense Groups by Type */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Expense Groups</h3>
        <div className="space-y-3">
          {expenseAllocation.map((group, i) => (
            <div key={group.group} className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: EXPENSE_COLORS[i % EXPENSE_COLORS.length] }} />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{group.group}</span>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={(group.categoryType === 'needs' ? 'info' : group.categoryType === 'wants' ? 'warning' : 'default') as 'info' | 'warning' | 'default'}
                    >
                      {group.categoryType}
                    </Badge>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formatCurrency(group.monthlyAverage)}/mo
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white w-12 text-right">
                      {group.percent}%
                    </span>
                  </div>
                </div>
                <div className="mt-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(group.percent, 100)}%`, backgroundColor: EXPENSE_COLORS[i % EXPENSE_COLORS.length] }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ── Income Tab ──────────────────────────────────────────────

interface IncomeTabProps {
  incomeSources: { name: string; icon: string | null; total: number; monthlyAverage: number; percent: number }[];
  expenseAllocation: { group: string; total: number; monthlyAverage: number; percent: number; categoryType: string }[];
}

const IncomeTab: React.FC<IncomeTabProps> = ({ incomeSources, expenseAllocation }) => {
  const INCOME_COLORS = ['#10B981', '#059669', '#34D399', '#047857', '#6EE7B7', '#A7F3D0'];

  return (
    <div className="space-y-6">
      {/* Income Sources */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Income Sources</h3>
        {incomeSources.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No income data available.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={incomeSources.map((s, i) => ({ name: s.name, value: s.percent, color: INCOME_COLORS[i % INCOME_COLORS.length] }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {incomeSources.map((_, i) => (
                      <Cell key={i} fill={INCOME_COLORS[i % INCOME_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value}%`]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {incomeSources.map((source) => (
                <div key={source.name} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{source.icon || '💰'}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{source.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(source.monthlyAverage)}/mo</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{source.percent}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Top Expense Groups */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Expense Categories</h3>
        {expenseAllocation.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No expense data available.</p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expenseAllocation.slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9CA3AF" tickFormatter={(v) => formatCurrency(v)} />
                <YAxis type="category" dataKey="group" tick={{ fontSize: 12 }} stroke="#9CA3AF" width={120} />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'Monthly Average']}
                  contentStyle={{
                    backgroundColor: 'rgba(17, 24, 39, 0.9)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="monthlyAverage" radius={[0, 4, 4, 0]}>
                  {expenseAllocation.slice(0, 8).map((_, index) => (
                    <Cell key={index} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
};

// ── Shared Components ───────────────────────────────────────

const AllocationBar: React.FC<{
  label: string;
  percent: number;
  target: number;
  color: string;
  amount: number;
}> = ({ label, percent, target, color, amount }) => {
  const isOver = label === 'Savings' ? percent < target : percent > target;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className={clsx('text-sm font-semibold', isOver ? 'text-red-500' : 'text-emerald-500')}>
          {percent}% <span className="text-gray-400 font-normal">/ {target}%</span>
        </span>
      </div>
      <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="absolute h-full rounded-full transition-all"
          style={{ width: `${Math.min(percent, 100)}%`, backgroundColor: color }}
        />
        {/* Target marker */}
        <div
          className="absolute h-full w-0.5 bg-gray-900 dark:bg-white opacity-50"
          style={{ left: `${target}%` }}
        />
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatCurrency(amount)}/mo</div>
    </div>
  );
};

const AllocationRow: React.FC<{
  label: string;
  description: string;
  actual: number;
  target: number;
  amount: number;
  status: string;
  color: string;
}> = ({ label, description, actual, target, amount, status, color }) => {
  const isGood = status === 'good';

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{label}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{description}</span>
        </div>
        <div className="flex items-center gap-2">
          {isGood ? (
            <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
          ) : (
            <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" />
          )}
          <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(amount)}/mo</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="absolute h-full rounded-full transition-all"
            style={{ width: `${Math.min(actual, 100)}%`, backgroundColor: color }}
          />
          <div
            className="absolute h-full w-0.5 bg-gray-900 dark:bg-white opacity-50"
            style={{ left: `${target}%` }}
          />
        </div>
        <span className={clsx('text-sm font-bold w-16 text-right', isGood ? 'text-emerald-600' : 'text-amber-600')}>
          {actual}%
        </span>
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Target: {target}%</div>
    </div>
  );
};

const RecommendationCard: React.FC<{ rec: SavingsRecommendation }> = ({ rec }) => {
  const bgColor = {
    critical: 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800',
    warning: 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800',
    info: 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800',
    positive: 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800',
  }[rec.type] || 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';

  return (
    <div className={clsx('rounded-lg border p-4', bgColor)}>
      <div className="flex items-start gap-3">
        <span className="text-xl">{rec.icon}</span>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{rec.title}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{rec.description}</p>
          {rec.impact && (
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-2">{rec.impact}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SavingsRatePage;
