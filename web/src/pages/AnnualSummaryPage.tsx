import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import {
  CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon,
  BanknotesIcon, ArrowTrendingUpIcon, CurrencyDollarIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { useAnnualSummary, CategorySpending, MerchantSpending } from '@/hooks/useAnnualSummary';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { StatCard, ChartCard } from '@/components/shared';
import clsx from 'clsx';
import { usePageTitle } from '@/hooks/usePageTitle';

const COLORS = [
  '#0D9488', '#F59E0B', '#7C3AED', '#E11D48', '#0EA5E9',
  '#10B981', '#F97316', '#6366F1', '#84CC16', '#EC4899',
];

const fmt = (value: number, decimals = 0) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);

const fmtPct = (value: number) =>
  `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

const AnnualSummaryPage: React.FC = () => {
  usePageTitle('Year in Review');
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const { summary, loading, error } = useAnnualSummary(year);

  if (loading && !summary) {
    return (
      <div className="p-6">
        <PageHeader title="Year in Review" subtitle="Loading your annual financial summary..." />
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <PageHeader title="Year in Review" />
        <EmptyState title="Error loading summary" description={error.message} icon={<CalendarDaysIcon className="h-12 w-12" />} />
      </div>
    );
  }

  if (!summary || summary.transactionCount === 0) {
    return (
      <div className="p-6">
        <PageHeader
          title="Year in Review"
          actions={<YearSelector year={year} onChange={setYear} currentYear={currentYear} />}
        />
        <EmptyState
          title={`No data for ${year}`}
          description="There are no transactions recorded for this year yet."
          icon={<CalendarDaysIcon className="h-12 w-12" />}
        />
      </div>
    );
  }

  const { income, spending, savings, netWorthChange, monthlyTrends, topCategories, topMerchants, budgetPerformance, highlights, transactionCount, daysTracked } = summary;

  return (
    <div className="p-6 space-y-6" data-testid="annual-summary-page">
      {/* Header */}
      <PageHeader
        title={`${year} Year in Review`}
        subtitle={`${transactionCount.toLocaleString()} transactions across ${daysTracked} days`}
        actions={<YearSelector year={year} onChange={setYear} currentYear={currentYear} />}
      />

      {/* Top-level KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="kpi-cards">
        <StatCard
          label="Total Income"
          value={fmt(income.total)}
          icon={<BanknotesIcon className="h-6 w-6" />}
          trend={{ direction: 'neutral', value: `${fmt(income.monthlyAverage)}/mo` }}
          valueClassName="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          label="Total Spending"
          value={fmt(spending.total)}
          icon={<CurrencyDollarIcon className="h-6 w-6" />}
          trend={{ direction: 'neutral', value: `${fmt(spending.dailyAverage)}/day` }}
          valueClassName="text-red-600 dark:text-red-400"
        />
        <StatCard
          label="Net Savings"
          value={fmt(savings.total)}
          icon={<SparklesIcon className="h-6 w-6" />}
          trend={{
            direction: savings.rate >= 0 ? 'up' : 'down',
            value: `${savings.rate.toFixed(1)}% savings rate`,
          }}
          valueClassName={savings.total >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}
        />
        <StatCard
          label="Net Worth Change"
          value={fmt(netWorthChange.change)}
          icon={<ArrowTrendingUpIcon className="h-6 w-6" />}
          trend={{
            direction: netWorthChange.change >= 0 ? 'up' : 'down',
            value: fmtPct(netWorthChange.changePercentage),
          }}
          valueClassName={netWorthChange.change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}
        />
      </div>

      {/* Monthly Income vs Spending Chart */}
      <ChartCard title="Monthly Overview" subtitle="Income vs. spending by month">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyTrends} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v: number) => fmt(v)} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number, name: string) => [fmt(value), name]}
                labelFormatter={(label: string) => `Month: ${label}`}
              />
              <Legend />
              <Bar dataKey="income" name="Income" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Savings Trend */}
      <ChartCard title="Savings Trend" subtitle="Monthly savings (income minus spending)">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyTrends} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v: number) => fmt(v)} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: number) => [fmt(value), 'Savings']} />
              <defs>
                <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="savings"
                stroke="#10B981"
                fill="url(#savingsGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Two columns: Top Categories + Top Merchants */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Top Spending Categories" subtitle="Where your money went">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="h-64 w-full lg:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topCategories.slice(0, 8)}
                    dataKey="amount"
                    nameKey="categoryName"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ categoryName, percentage }: CategorySpending) =>
                      `${categoryName} ${percentage}%`
                    }
                    labelLine={false}
                  >
                    {topCategories.slice(0, 8).map((_: CategorySpending, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => fmt(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2" data-testid="category-list">
              {topCategories.slice(0, 8).map((cat: CategorySpending, i: number) => (
                <div key={cat.categoryId || i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span className="text-gray-700 dark:text-gray-300">{cat.categoryName}</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                    {fmt(cat.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Top Merchants" subtitle="Most spent by merchant">
          <div className="space-y-3" data-testid="merchant-list">
            {topMerchants.map((m: MerchantSpending, i: number) => (
              <div key={m.merchantName} className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-5 text-right">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {m.merchantName}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 tabular-nums ml-2">
                      {fmt(m.amount)}
                    </span>
                  </div>
                  <div className="mt-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-500 rounded-full"
                      style={{
                        width: `${topMerchants.length > 0 ? (m.amount / topMerchants[0].amount * 100) : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {m.transactionCount} transactions
                  </span>
                </div>
              </div>
            ))}
            {topMerchants.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No merchant data</p>
            )}
          </div>
        </ChartCard>
      </div>

      {/* Highlights */}
      <ChartCard title="Highlights" subtitle={`Notable moments from ${year}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="highlights">
          {highlights.biggestExpense && (
            <HighlightCard
              emoji="💸"
              title="Biggest Expense"
              value={fmt(highlights.biggestExpense.amount)}
              detail={highlights.biggestExpense.description}
              subdetail={formatDate(highlights.biggestExpense.date)}
            />
          )}
          {highlights.biggestIncome && (
            <HighlightCard
              emoji="💰"
              title="Biggest Income"
              value={fmt(highlights.biggestIncome.amount)}
              detail={highlights.biggestIncome.description}
              subdetail={formatDate(highlights.biggestIncome.date)}
            />
          )}
          {highlights.mostFrequentMerchant && (
            <HighlightCard
              emoji="🏪"
              title="Most Visited"
              value={`${highlights.mostFrequentMerchant.visitCount} visits`}
              detail={highlights.mostFrequentMerchant.name}
            />
          )}
          {highlights.biggestSpendingMonth && (
            <HighlightCard
              emoji="📈"
              title="Highest Spending Month"
              value={fmt(highlights.biggestSpendingMonth.expenses)}
              detail={highlights.biggestSpendingMonth.label}
            />
          )}
          {highlights.mostFrugalMonth && (
            <HighlightCard
              emoji="🎯"
              title="Most Frugal Month"
              value={fmt(highlights.mostFrugalMonth.expenses)}
              detail={highlights.mostFrugalMonth.label}
            />
          )}
          {highlights.goalsAchieved > 0 && (
            <HighlightCard
              emoji="🏆"
              title="Goals Achieved"
              value={`${highlights.goalsAchieved}`}
              detail={`Financial goal${highlights.goalsAchieved !== 1 ? 's' : ''} completed`}
            />
          )}
          {budgetPerformance.totalMonths > 0 && (
            <HighlightCard
              emoji="📊"
              title="Budget Performance"
              value={`${budgetPerformance.monthsOnBudget}/${budgetPerformance.totalMonths}`}
              detail="Months on budget"
            />
          )}
        </div>
      </ChartCard>

      {/* Net Worth Change */}
      {(netWorthChange.startOfYear !== 0 || netWorthChange.endOfPeriod !== 0) && (
        <Card className="p-6" data-testid="net-worth-card">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Net Worth Journey</h3>
          <div className="flex items-center justify-between">
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">Jan 1</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{fmt(netWorthChange.startOfYear)}</p>
            </div>
            <div className="flex-1 mx-6 h-px bg-gradient-to-r from-gray-300 via-teal-400 to-gray-300 dark:from-gray-600 dark:via-teal-500 dark:to-gray-600 relative">
              <div className="absolute left-1/2 -translate-x-1/2 -top-4 bg-white dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-600">
                <span className={clsx(
                  'text-sm font-bold',
                  netWorthChange.change >= 0 ? 'text-emerald-600' : 'text-red-600'
                )}>
                  {netWorthChange.change >= 0 ? '+' : ''}{fmt(netWorthChange.change)} ({fmtPct(netWorthChange.changePercentage)})
                </span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">{year === currentYear ? 'Today' : 'Dec 31'}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{fmt(netWorthChange.endOfPeriod)}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

// ── Sub-components ──────────────────────────────────────────

const YearSelector: React.FC<{ year: number; onChange: (y: number) => void; currentYear: number }> = ({
  year, onChange, currentYear,
}) => (
  <div className="flex items-center gap-2">
    <button
      onClick={() => onChange(year - 1)}
      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      aria-label="Previous year"
    >
      <ChevronLeftIcon className="h-5 w-5 text-gray-500" />
    </button>
    <span className="text-lg font-semibold text-gray-900 dark:text-gray-100 min-w-[4rem] text-center">
      {year}
    </span>
    <button
      onClick={() => onChange(year + 1)}
      disabled={year >= currentYear}
      className={clsx(
        'p-1.5 rounded-lg transition-colors',
        year >= currentYear
          ? 'opacity-30 cursor-not-allowed'
          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
      )}
      aria-label="Next year"
    >
      <ChevronRightIcon className="h-5 w-5 text-gray-500" />
    </button>
  </div>
);

const HighlightCard: React.FC<{
  emoji: string;
  title: string;
  value: string;
  detail: string;
  subdetail?: string;
}> = ({ emoji, title, value, detail, subdetail }) => (
  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
    <div className="flex items-start gap-3">
      <span className="text-2xl">{emoji}</span>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</p>
        <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-0.5">{value}</p>
        <p className="text-sm text-gray-600 dark:text-gray-300">{detail}</p>
        {subdetail && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subdetail}</p>
        )}
      </div>
    </div>
  </div>
);

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default AnnualSummaryPage;
