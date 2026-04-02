import React, { useState, useMemo } from 'react';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ScaleIcon,
  MinusIcon,
  ChartBarIcon,
  BuildingStorefrontIcon,
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
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { useSpendingComparison, type CategoryComparison, type MerchantComparison } from '@/hooks/useSpendingComparison';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Badge from '@/components/ui/Badge';
import { usePageTitle } from '@/hooks/usePageTitle';
import clsx from 'clsx';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

const formatPercent = (val: number) => `${val > 0 ? '+' : ''}${val.toFixed(1)}%`;

type Tab = 'overview' | 'categories' | 'merchants' | 'cumulative';

type Preset = 'month-over-month' | 'quarter-over-quarter' | 'year-over-year' | 'custom';

function getPresetDates(preset: Preset): { aStart: string; aEnd: string; bStart: string; bEnd: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  if (preset === 'month-over-month') {
    // Previous month vs current month
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const prevStart = new Date(prevYear, prevMonth, 1);
    const prevEnd = new Date(prevYear, prevMonth + 1, 0);
    const currStart = new Date(year, month, 1);
    const currEnd = new Date(year, month + 1, 0);
    return {
      aStart: fmt(prevStart),
      aEnd: fmt(prevEnd),
      bStart: fmt(currStart),
      bEnd: fmt(currEnd),
    };
  }
  if (preset === 'quarter-over-quarter') {
    const currQ = Math.floor(month / 3);
    const prevQ = currQ === 0 ? 3 : currQ - 1;
    const prevQYear = currQ === 0 ? year - 1 : year;
    return {
      aStart: fmt(new Date(prevQYear, prevQ * 3, 1)),
      aEnd: fmt(new Date(prevQYear, prevQ * 3 + 3, 0)),
      bStart: fmt(new Date(year, currQ * 3, 1)),
      bEnd: fmt(new Date(year, currQ * 3 + 3, 0)),
    };
  }
  if (preset === 'year-over-year') {
    // Same month last year vs this month
    return {
      aStart: fmt(new Date(year - 1, month, 1)),
      aEnd: fmt(new Date(year - 1, month + 1, 0)),
      bStart: fmt(new Date(year, month, 1)),
      bEnd: fmt(new Date(year, month + 1, 0)),
    };
  }
  // custom — default to month-over-month
  return getPresetDates('month-over-month');
}

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const SpendingComparisonPage: React.FC = () => {
  usePageTitle('Spending Comparison');
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [preset, setPreset] = useState<Preset>('month-over-month');
  const [sortBy, setSortBy] = useState<'total' | 'change'>('total');

  const dates = useMemo(() => getPresetDates(preset), [preset]);
  const { data, loading, error } = useSpendingComparison(dates.aStart, dates.aEnd, dates.bStart, dates.bEnd);

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: ScaleIcon },
    { id: 'categories', label: 'Categories', icon: ChartBarIcon },
    { id: 'merchants', label: 'Merchants', icon: BuildingStorefrontIcon },
    { id: 'cumulative', label: 'Spending Curve', icon: ArrowTrendingUpIcon },
  ];

  if (loading && !data) {
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
        title="Error loading comparison"
        description={error.message}
      />
    );
  }

  if (!data) {
    return (
      <EmptyState
        icon={<ScaleIcon className="h-12 w-12" />}
        title="No data available"
        description="Add some transactions to see spending comparisons."
      />
    );
  }

  const { totals, categoryComparison, merchantComparison, dailyCurves, periodA, periodB } = data;

  const sortedCategories = [...categoryComparison]
    .filter(c => c.periodAAmount > 0 || c.periodBAmount > 0)
    .sort((a, b) =>
      sortBy === 'total'
        ? (b.periodAAmount + b.periodBAmount) - (a.periodAAmount + a.periodBAmount)
        : Math.abs(b.change) - Math.abs(a.change)
    );

  const sortedMerchants = [...merchantComparison]
    .filter(m => m.periodAAmount > 0 || m.periodBAmount > 0)
    .sort((a, b) =>
      sortBy === 'total'
        ? (b.periodAAmount + b.periodBAmount) - (a.periodAAmount + a.periodBAmount)
        : Math.abs(b.change) - Math.abs(a.change)
    );

  return (
    <div>
      <PageHeader
        title="Spending Comparison"
        subtitle="Compare your finances across two time periods"
        actions={
          <div className="flex items-center gap-2">
            {(['month-over-month', 'quarter-over-quarter', 'year-over-year'] as Preset[]).map((p) => (
              <button
                key={p}
                onClick={() => setPreset(p)}
                className={clsx(
                  'px-3 py-1.5 text-sm rounded-lg transition-colors',
                  preset === p
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                )}
              >
                {p === 'month-over-month' ? 'Month' : p === 'quarter-over-quarter' ? 'Quarter' : 'Year'}
              </button>
            ))}
          </div>
        }
      />

      {/* Period labels */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{periodA}</span>
        </div>
        <span className="text-gray-400">vs</span>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{periodB}</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <SummaryCard
          label="Expenses"
          valueA={totals.periodAExpenses}
          valueB={totals.periodBExpenses}
          change={totals.expensesChange}
          changePercent={totals.expensesChangePercent}
          invertColor
        />
        <SummaryCard
          label="Income"
          valueA={totals.periodAIncome}
          valueB={totals.periodBIncome}
          change={totals.incomeChange}
          changePercent={totals.incomeChangePercent}
        />
        <SummaryCard
          label="Net Cash Flow"
          valueA={totals.periodANet}
          valueB={totals.periodBNet}
          change={totals.netChange}
          changePercent={totals.periodANet !== 0 ? ((totals.periodBNet - totals.periodANet) / Math.abs(totals.periodANet)) * 100 : 0}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-700">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeTab === id
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <OverviewTab
          categories={sortedCategories.slice(0, 8)}
          merchants={sortedMerchants.slice(0, 8)}
          periodA={periodA}
          periodB={periodB}
          totals={totals}
        />
      )}
      {activeTab === 'categories' && (
        <CategoryTab
          categories={sortedCategories}
          periodA={periodA}
          periodB={periodB}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />
      )}
      {activeTab === 'merchants' && (
        <MerchantTab
          merchants={sortedMerchants}
          periodA={periodA}
          periodB={periodB}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />
      )}
      {activeTab === 'cumulative' && (
        <CumulativeTab
          dailyCurves={dailyCurves}
          periodA={periodA}
          periodB={periodB}
        />
      )}
    </div>
  );
};

/* ── Summary Card ─────────────────────────────────────────── */
function SummaryCard({
  label,
  valueA,
  valueB,
  change,
  changePercent,
  invertColor = false,
}: {
  label: string;
  valueA: number;
  valueB: number;
  change: number;
  changePercent: number;
  invertColor?: boolean;
}) {
  const isPositive = invertColor ? change <= 0 : change >= 0;
  const ChangeIcon = change > 0 ? ArrowTrendingUpIcon : change < 0 ? ArrowTrendingDownIcon : MinusIcon;

  return (
    <Card className="p-5">
      <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">{label}</div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Previous</div>
          <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(valueA)}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Current</div>
          <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatCurrency(valueB)}</div>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2">
        <ChangeIcon className={clsx('h-4 w-4', isPositive ? 'text-emerald-500' : 'text-red-500')} />
        <span className={clsx('text-sm font-medium', isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
          {formatCurrency(Math.abs(change))} ({formatPercent(changePercent)})
        </span>
      </div>
    </Card>
  );
}

/* ── Overview Tab ─────────────────────────────────────────── */
function OverviewTab({
  categories,
  merchants,
  periodA,
  periodB,
  totals,
}: {
  categories: CategoryComparison[];
  merchants: MerchantComparison[];
  periodA: string;
  periodB: string;
  totals: { periodATransactionCount: number; periodBTransactionCount: number };
}) {
  const barData = categories.map(c => ({
    name: c.categoryName.length > 12 ? c.categoryName.slice(0, 12) + '…' : c.categoryName,
    [periodA]: c.periodAAmount,
    [periodB]: c.periodBAmount,
  }));

  return (
    <div className="space-y-6">
      {/* Transaction counts */}
      <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
        <span>{periodA}: {totals.periodATransactionCount} transactions</span>
        <span>•</span>
        <span>{periodB}: {totals.periodBTransactionCount} transactions</span>
      </div>

      {/* Category comparison chart */}
      <Card className="p-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Top Categories</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} layout="vertical" margin={{ left: 80, right: 20, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <Bar dataKey={periodA} fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={14} />
              <Bar dataKey={periodB} fill="#10B981" radius={[0, 4, 4, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Top movers */}
      <Card className="p-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Biggest Changes</h3>
        <div className="space-y-3">
          {[...categories]
            .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
            .slice(0, 5)
            .map((c, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                <div className="flex items-center gap-3">
                  {c.categoryIcon && <span className="text-lg">{c.categoryIcon}</span>}
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{c.categoryName}</span>
                </div>
                <div className="text-right">
                  <div className={clsx('text-sm font-semibold', c.change > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400')}>
                    {c.change > 0 ? '+' : ''}{formatCurrency(c.change)}
                  </div>
                  <div className="text-xs text-gray-400">{formatPercent(c.changePercent)}</div>
                </div>
              </div>
            ))}
        </div>
      </Card>

      {/* Top merchant changes */}
      <Card className="p-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Merchant Changes</h3>
        <div className="space-y-3">
          {[...merchants]
            .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
            .slice(0, 5)
            .map((m, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{m.merchantName}</span>
                <div className="text-right">
                  <div className={clsx('text-sm font-semibold', m.change > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400')}>
                    {m.change > 0 ? '+' : ''}{formatCurrency(m.change)}
                  </div>
                  <div className="text-xs text-gray-400">{formatPercent(m.changePercent)}</div>
                </div>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
}

/* ── Category Tab ─────────────────────────────────────────── */
function CategoryTab({
  categories,
  periodA,
  periodB,
  sortBy,
  setSortBy,
}: {
  categories: CategoryComparison[];
  periodA: string;
  periodB: string;
  sortBy: 'total' | 'change';
  setSortBy: (s: 'total' | 'change') => void;
}) {
  const maxAmount = Math.max(...categories.map(c => Math.max(c.periodAAmount, c.periodBAmount)), 1);

  return (
    <div>
      <div className="flex justify-end mb-4">
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
          {(['total', 'change'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={clsx(
                'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                sortBy === s
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              )}
            >
              Sort by {s === 'total' ? 'Total' : 'Change'}
            </button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800/50">
            <div className="col-span-3">Category</div>
            <div className="col-span-3 text-right">{periodA}</div>
            <div className="col-span-3 text-right">{periodB}</div>
            <div className="col-span-3 text-right">Change</div>
          </div>

          {categories.map((c, i) => (
            <div key={i} className="grid grid-cols-12 gap-4 px-5 py-3 items-center hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
              <div className="col-span-3 flex items-center gap-2">
                {c.categoryIcon && <span>{c.categoryIcon}</span>}
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{c.categoryName}</span>
              </div>
              <div className="col-span-3">
                <div className="text-sm text-right text-gray-700 dark:text-gray-300 mb-1">{formatCurrency(c.periodAAmount)}</div>
                <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: `${(c.periodAAmount / maxAmount) * 100}%` }} />
                </div>
              </div>
              <div className="col-span-3">
                <div className="text-sm text-right text-gray-700 dark:text-gray-300 mb-1">{formatCurrency(c.periodBAmount)}</div>
                <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(c.periodBAmount / maxAmount) * 100}%` }} />
                </div>
              </div>
              <div className="col-span-3 text-right">
                <div className={clsx(
                  'text-sm font-semibold',
                  c.change > 0 ? 'text-red-600 dark:text-red-400' : c.change < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500'
                )}>
                  {c.change > 0 ? '+' : ''}{formatCurrency(c.change)}
                </div>
                <div className="text-xs text-gray-400">{formatPercent(c.changePercent)}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ── Merchant Tab ─────────────────────────────────────────── */
function MerchantTab({
  merchants,
  periodA,
  periodB,
  sortBy,
  setSortBy,
}: {
  merchants: MerchantComparison[];
  periodA: string;
  periodB: string;
  sortBy: 'total' | 'change';
  setSortBy: (s: 'total' | 'change') => void;
}) {
  const barData = merchants.slice(0, 10).map(m => ({
    name: m.merchantName.length > 15 ? m.merchantName.slice(0, 15) + '…' : m.merchantName,
    [periodA]: m.periodAAmount,
    [periodB]: m.periodBAmount,
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
          {(['total', 'change'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={clsx(
                'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                sortBy === s
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              )}
            >
              Sort by {s === 'total' ? 'Total' : 'Change'}
            </button>
          ))}
        </div>
      </div>

      <Card className="p-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Merchant Spending</h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} layout="vertical" margin={{ left: 100, right: 20, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tickFormatter={(v: number) => `$${v.toFixed(0)}`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <Bar dataKey={periodA} fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={12} />
              <Bar dataKey={periodB} fill="#10B981" radius={[0, 4, 4, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Detailed list */}
      <Card className="overflow-hidden">
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          <div className="grid grid-cols-12 gap-4 px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800/50">
            <div className="col-span-4">Merchant</div>
            <div className="col-span-2 text-right">{periodA}</div>
            <div className="col-span-2 text-right">{periodB}</div>
            <div className="col-span-2 text-right">Change</div>
            <div className="col-span-2 text-right">%</div>
          </div>
          {merchants.map((m, i) => (
            <div key={i} className="grid grid-cols-12 gap-4 px-5 py-3 items-center hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
              <div className="col-span-4 text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{m.merchantName}</div>
              <div className="col-span-2 text-sm text-right text-gray-700 dark:text-gray-300">{formatCurrency(m.periodAAmount)}</div>
              <div className="col-span-2 text-sm text-right text-gray-700 dark:text-gray-300">{formatCurrency(m.periodBAmount)}</div>
              <div className={clsx(
                'col-span-2 text-sm text-right font-semibold',
                m.change > 0 ? 'text-red-600 dark:text-red-400' : m.change < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500'
              )}>
                {m.change > 0 ? '+' : ''}{formatCurrency(m.change)}
              </div>
              <div className="col-span-2 text-right">
                <Badge variant={m.change > 0 ? 'danger' : m.change < 0 ? 'success' : 'default'}>
                  {formatPercent(m.changePercent)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ── Cumulative Spending Curve Tab ────────────────────────── */
function CumulativeTab({
  dailyCurves,
  periodA,
  periodB,
}: {
  dailyCurves: { day: number; periodACumulative: number | null; periodBCumulative: number | null }[];
  periodA: string;
  periodB: string;
}) {
  return (
    <div className="space-y-6">
      <Card className="p-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">Cumulative Spending</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Day-by-day spending accumulation — see how your pace compares between periods.
        </p>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyCurves} margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="day"
                label={{ value: 'Day of Period', position: 'insideBottom', offset: -5 }}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(v: number | string | (number | string)[]) => typeof v === 'number' ? formatCurrency(v) : '—'}
                labelFormatter={(day: number) => `Day ${day}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="periodACumulative"
                name={periodA}
                stroke="#3B82F6"
                strokeWidth={2.5}
                dot={false}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="periodBCumulative"
                name={periodB}
                stroke="#10B981"
                strokeWidth={2.5}
                dot={false}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Pace summary */}
      {dailyCurves.length > 0 && (() => {
        const lastA = dailyCurves.filter(d => d.periodACumulative !== null).pop();
        const lastB = dailyCurves.filter(d => d.periodBCumulative !== null).pop();
        const midpoint = Math.floor(dailyCurves.length / 2);
        const midA = dailyCurves[midpoint]?.periodACumulative;
        const midB = dailyCurves[midpoint]?.periodBCumulative;

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-5">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Midpoint Spending</div>
              <div className="flex justify-between">
                <div>
                  <div className="text-xs text-blue-500">{periodA}</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{midA != null ? formatCurrency(midA) : '—'}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-emerald-500">{periodB}</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{midB != null ? formatCurrency(midB) : '—'}</div>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Final Total</div>
              <div className="flex justify-between">
                <div>
                  <div className="text-xs text-blue-500">{periodA}</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{lastA?.periodACumulative != null ? formatCurrency(lastA.periodACumulative) : '—'}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-emerald-500">{periodB}</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{lastB?.periodBCumulative != null ? formatCurrency(lastB.periodBCumulative) : '—'}</div>
                </div>
              </div>
            </Card>
          </div>
        );
      })()}
    </div>
  );
}

export default SpendingComparisonPage;
