import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  CreditCardIcon,
  ChartBarIcon,
  SparklesIcon,
  ArrowsRightLeftIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  WalletIcon,
} from '@heroicons/react/24/outline';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { useMonthlyRecap, RecapCategory, RecapBudgetCategory } from '@/hooks/useMonthlyRecap';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import AmountDisplay from '@/components/ui/AmountDisplay';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import { usePageTitle } from '@/hooks/usePageTitle';
import clsx from 'clsx';
import { format, parse, addMonths, subMonths } from 'date-fns';

const COLORS = [
  '#0D9488', '#F59E0B', '#7C3AED', '#E11D48', '#0EA5E9',
  '#10B981', '#F97316', '#6366F1', '#84CC16', '#EC4899',
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

const formatCurrencyFull = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const ChangeIndicator: React.FC<{ value: number; suffix?: string; invert?: boolean }> = ({ value, suffix = '%', invert = false }) => {
  const isPositive = invert ? value < 0 : value > 0;
  const isNegative = invert ? value > 0 : value < 0;
  if (value === 0) return <span className="text-sm text-gray-400">—</span>;
  return (
    <span className={clsx('inline-flex items-center text-sm font-medium',
      isPositive && 'text-emerald-600 dark:text-emerald-400',
      isNegative && 'text-red-600 dark:text-red-400',
    )}>
      {value > 0 ? <ArrowTrendingUpIcon className="h-4 w-4 mr-0.5" /> : <ArrowTrendingDownIcon className="h-4 w-4 mr-0.5" />}
      {Math.abs(value).toFixed(1)}{suffix}
    </span>
  );
};

const StatCard: React.FC<{
  label: string;
  value: number;
  change?: number;
  changeSuffix?: string;
  invertChange?: boolean;
  icon: React.ElementType;
  colorize?: boolean;
}> = ({ label, value, change, changeSuffix = '%', invertChange, icon: Icon, colorize = false }) => (
  <Card className="relative overflow-hidden">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <p className={clsx('mt-1 text-2xl font-bold tabular-nums',
          colorize && value > 0 && 'text-emerald-600 dark:text-emerald-400',
          colorize && value < 0 && 'text-red-600 dark:text-red-400',
          !colorize && 'text-gray-900 dark:text-gray-100',
        )}>
          {formatCurrency(value)}
        </p>
        {change !== undefined && (
          <div className="mt-1">
            <ChangeIndicator value={change} suffix={changeSuffix} invert={invertChange} />
            <span className="text-xs text-gray-400 ml-1">vs last month</span>
          </div>
        )}
      </div>
      <div className="rounded-lg bg-brand-50 dark:bg-brand-900/30 p-2">
        <Icon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
      </div>
    </div>
  </Card>
);

const MonthlyRecapPage: React.FC = () => {
  usePageTitle('Monthly Recap');
  const [currentMonth, setCurrentMonth] = useState(() => format(new Date(), 'yyyy-MM'));

  const { recap, loading } = useMonthlyRecap(currentMonth);

  const monthDate = parse(currentMonth, 'yyyy-MM', new Date());
  const navigateMonth = (dir: 'prev' | 'next') => {
    const newDate = dir === 'prev' ? subMonths(monthDate, 1) : addMonths(monthDate, 1);
    setCurrentMonth(format(newDate, 'yyyy-MM'));
  };

  const isCurrentMonth = currentMonth === format(new Date(), 'yyyy-MM');

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!recap) return null;

  const pieData = recap.categoryBreakdown.slice(0, 8).map((cat: RecapCategory, i: number) => ({
    name: cat.categoryName,
    value: cat.amount,
    color: cat.categoryColor || COLORS[i % COLORS.length],
  }));

  const dailyChartData = recap.dailySpending.map((d) => ({
    date: format(new Date(d.date + 'T12:00:00'), 'd'),
    amount: d.amount,
  }));

  return (
    <div className="space-y-8">
      {/* Header with month navigation */}
      <PageHeader
        title="Monthly Recap"
        subtitle={
          <div className="flex items-center gap-3 mt-1">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeftIcon className="h-5 w-5 text-gray-500" />
            </button>
            <span className="text-lg font-semibold text-gray-900 dark:text-gray-100 min-w-[160px] text-center">
              {format(monthDate, 'MMMM yyyy')}
            </span>
            <button
              onClick={() => navigateMonth('next')}
              disabled={isCurrentMonth}
              className={clsx(
                'p-1 rounded-lg transition-colors',
                isCurrentMonth ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
              aria-label="Next month"
            >
              <ChevronRightIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Income"
          value={recap.income.total}
          change={recap.income.changePercentage}
          icon={BanknotesIcon}
        />
        <StatCard
          label="Expenses"
          value={recap.expenses.total}
          change={recap.expenses.changePercentage}
          invertChange
          icon={CreditCardIcon}
        />
        <StatCard
          label="Saved"
          value={recap.savings.amount}
          colorize
          icon={WalletIcon}
        />
        <Card className="relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Savings Rate</p>
              <p className={clsx('mt-1 text-2xl font-bold tabular-nums',
                recap.savings.rate >= 20 ? 'text-emerald-600 dark:text-emerald-400' :
                recap.savings.rate >= 0 ? 'text-yellow-600 dark:text-yellow-400' :
                'text-red-600 dark:text-red-400',
              )}>
                {recap.savings.rate.toFixed(1)}%
              </p>
              <div className="mt-1">
                <ChangeIndicator value={recap.savings.rate - recap.savings.previousRate} suffix=" pp" />
              </div>
            </div>
            <div className="rounded-lg bg-brand-50 dark:bg-brand-900/30 p-2">
              <ChartBarIcon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Net Worth Card */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Net Worth</h2>
          <Link to="/net-worth" className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400">
            View details →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Current</p>
            <AmountDisplay amount={recap.netWorth.current} size="lg" colorize={false} />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Change this month</p>
            <AmountDisplay amount={recap.netWorth.change} size="lg" showSign />
            <ChangeIndicator value={recap.netWorth.changePercentage} />
          </div>
          <div className="flex gap-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Assets</p>
              <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(recap.netWorth.assets)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Liabilities</p>
              <p className="text-lg font-semibold text-red-600 dark:text-red-400 tabular-nums">{formatCurrency(recap.netWorth.liabilities)}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Middle Section: Spending Breakdown + Daily Spending */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Spending by Category</h2>
            <Link to="/reports" className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400">
              Reports →
            </Link>
          </div>
          <div className="flex items-center gap-6">
            <div className="w-40 h-40 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={65}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrencyFull(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2 max-h-40 overflow-y-auto">
              {recap.categoryBreakdown.slice(0, 6).map((cat: RecapCategory, i: number) => (
                <div key={cat.categoryId || i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.categoryColor || COLORS[i % COLORS.length] }} />
                    <span className="text-gray-700 dark:text-gray-300 truncate max-w-[120px]">{cat.categoryName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100 tabular-nums">{formatCurrency(cat.amount)}</span>
                    <ChangeIndicator value={cat.changePercentage} invert />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Daily Spending Chart */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Daily Spending</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Avg: {formatCurrencyFull(recap.expenses.dailyAverage)}/day
            </p>
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyChartData}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" stroke="#9CA3AF" />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}`} stroke="#9CA3AF" width={45} />
                <Tooltip formatter={(value: number) => formatCurrencyFull(value)} labelFormatter={(d) => `Day ${d}`} />
                <Bar dataKey="amount" fill="#0D9488" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Budget Performance */}
      {recap.budgetPerformance.hasBudget && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Budget Performance</h2>
            <div className="flex items-center gap-2">
              {recap.budgetPerformance.onTrack ? (
                <Badge variant="success">
                  <CheckCircleIcon className="h-3.5 w-3.5 mr-1" /> On Track
                </Badge>
              ) : (
                <Badge variant="danger">
                  <ExclamationTriangleIcon className="h-3.5 w-3.5 mr-1" /> Over Budget
                </Badge>
              )}
              <Link to="/budget" className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400">
                View budget →
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Budgeted</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{formatCurrency(recap.budgetPerformance.totalBudgeted)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Spent</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{formatCurrency(recap.budgetPerformance.totalSpent)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Remaining</p>
              <AmountDisplay amount={recap.budgetPerformance.remaining} size="lg" />
            </div>
          </div>

          <div className="mb-3">
            <ProgressBar
              value={Math.min(recap.budgetPerformance.percentUsed || 0, 100)}
              max={100}
              color={
                (recap.budgetPerformance.percentUsed || 0) > 100 ? 'danger' :
                (recap.budgetPerformance.percentUsed || 0) > 80 ? 'warning' : 'success'
              }
            />
          </div>

          {recap.budgetPerformance.categories.length > 0 && (
            <div className="space-y-2 mt-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {recap.budgetPerformance.categoriesOverBudget || 0} categories over budget
              </p>
              {recap.budgetPerformance.categories.slice(0, 5).map((cat: RecapBudgetCategory) => (
                <div key={cat.categoryName} className="flex items-center justify-between text-sm">
                  <span className={clsx(
                    'truncate max-w-[200px]',
                    cat.overBudget ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-700 dark:text-gray-300'
                  )}>
                    {cat.categoryIcon && <span className="mr-1">{cat.categoryIcon}</span>}
                    {cat.categoryName}
                  </span>
                  <span className="tabular-nums text-gray-600 dark:text-gray-400">
                    {formatCurrency(cat.spent)} / {formatCurrency(cat.budgeted)}
                    <span className={clsx('ml-2', cat.overBudget ? 'text-red-600' : 'text-gray-400')}>
                      ({cat.percentUsed.toFixed(0)}%)
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Bottom Section: Top Merchants + Recurring + Notable */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Merchants */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Top Merchants</h2>
          <div className="space-y-3">
            {recap.topMerchants.slice(0, 7).map((m, i) => (
              <div key={m.merchantName} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-4 text-right">{i + 1}.</span>
                  <span className="text-gray-700 dark:text-gray-300 truncate max-w-[140px]">{m.merchantName}</span>
                </div>
                <div className="text-right">
                  <span className="font-medium text-gray-900 dark:text-gray-100 tabular-nums">{formatCurrency(m.amount)}</span>
                  <span className="text-xs text-gray-400 ml-1">({m.transactionCount})</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recurring Bills */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recurring Bills</h2>
            <Link to="/recurring" className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Monthly Recurring</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{formatCurrency(recap.recurringSummary.totalRecurringExpenses)}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Bills Due</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {recap.recurringSummary.billsPaidCount}/{recap.recurringSummary.billsDueCount} paid
              </p>
            </div>
          </div>
          {recap.recurringSummary.upcoming.length > 0 && (
            <div className="space-y-2">
              {recap.recurringSummary.upcoming.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300 truncate max-w-[140px]">{item.name}</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100 tabular-nums">{formatCurrencyFull(item.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Notable Transactions */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            <SparklesIcon className="h-5 w-5 inline mr-1 text-yellow-500" />
            Highlights
          </h2>
          <div className="space-y-4">
            {recap.notableTransactions.largestExpense && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Biggest Expense</p>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[140px]">
                    {recap.notableTransactions.largestExpense.name}
                  </span>
                  <AmountDisplay amount={recap.notableTransactions.largestExpense.amount} size="sm" />
                </div>
                {recap.notableTransactions.largestExpense.categoryName && (
                  <p className="text-xs text-gray-400 mt-0.5">{recap.notableTransactions.largestExpense.categoryName}</p>
                )}
              </div>
            )}
            {recap.notableTransactions.largestIncome && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Biggest Income</p>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[140px]">
                    {recap.notableTransactions.largestIncome.name}
                  </span>
                  <AmountDisplay amount={recap.notableTransactions.largestIncome.amount} size="sm" />
                </div>
              </div>
            )}
            {recap.notableTransactions.unusualTransactions.length > 0 && (
              <div>
                <p className="text-xs font-medium text-yellow-500 uppercase tracking-wider">
                  ⚠ Unusual Spending
                </p>
                {recap.notableTransactions.unusualTransactions.slice(0, 3).map((t) => (
                  <div key={t.id} className="flex justify-between items-center mt-1 text-sm">
                    <span className="text-gray-700 dark:text-gray-300 truncate max-w-[140px]">{t.name}</span>
                    <AmountDisplay amount={t.amount} size="sm" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Month Comparison Summary */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          <ArrowsRightLeftIcon className="h-5 w-5 inline mr-1" />
          Month-over-Month
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Income</p>
            <ChangeIndicator value={recap.comparison.incomeChange} />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Expenses</p>
            <ChangeIndicator value={recap.comparison.expenseChange} invert />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Savings Rate</p>
            <ChangeIndicator value={recap.comparison.savingsChange} suffix=" pp" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Transactions</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{recap.comparison.transactionCount}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Daily Average</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{formatCurrencyFull(recap.expenses.dailyAverage)}</p>
          </div>
        </div>
      </Card>

      {/* Income Sources */}
      {recap.income.topSources.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Income Sources</h2>
          <div className="space-y-2">
            {recap.income.topSources.map((src) => (
              <div key={src.name} className="flex items-center justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300">{src.name}</span>
                <div>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(src.amount)}</span>
                  <span className="text-xs text-gray-400 ml-1">({src.count}x)</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default MonthlyRecapPage;
