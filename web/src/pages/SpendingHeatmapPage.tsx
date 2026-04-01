import React, { useState, useMemo } from 'react';
import {
  ChartBarSquareIcon,
  CalendarDaysIcon,
  ArrowTrendingDownIcon,
  FireIcon,
} from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useSpendingHeatmap, type HeatmapDay } from '@/hooks/useSpendingHeatmap';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Badge from '@/components/ui/Badge';
import { usePageTitle } from '@/hooks/usePageTitle';
import clsx from 'clsx';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(val);

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Map an amount to a heatmap intensity level (0 = no spend, 1-4 = quartiles). */
function getIntensity(amount: number, maxAmount: number): number {
  if (amount === 0) return 0;
  if (maxAmount === 0) return 0;
  const ratio = amount / maxAmount;
  if (ratio < 0.25) return 1;
  if (ratio < 0.5) return 2;
  if (ratio < 0.75) return 3;
  return 4;
}

const intensityColors: Record<number, string> = {
  0: 'bg-gray-100 dark:bg-gray-800',
  1: 'bg-emerald-200 dark:bg-emerald-900',
  2: 'bg-emerald-400 dark:bg-emerald-700',
  3: 'bg-orange-400 dark:bg-orange-700',
  4: 'bg-red-500 dark:bg-red-600',
};

const SpendingHeatmapPage: React.FC = () => {
  usePageTitle('Spending Heatmap');
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const { heatmap, loading } = useSpendingHeatmap(year);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!heatmap) {
    return (
      <EmptyState
        icon={<ChartBarSquareIcon className="w-12 h-12" />}
        title="No heatmap data"
        description="Add transactions to see your spending patterns."
      />
    );
  }

  return (
    <div>
      <PageHeader
        title="Spending Heatmap"
        subtitle="Visualize daily spending patterns across the year"
      />

      {/* Year selector */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setYear(year - 1)}
          className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
          aria-label="Previous year"
        >
          ← {year - 1}
        </button>
        <span className="text-lg font-semibold text-gray-900 dark:text-white">
          {year}
        </span>
        {year < currentYear && (
          <button
            onClick={() => setYear(year + 1)}
            className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
            aria-label="Next year"
          >
            {year + 1} →
          </button>
        )}
      </div>

      {/* Stats row */}
      <StatsRow stats={heatmap.stats} streaks={heatmap.streaks} />

      {/* GitHub-style heatmap */}
      <HeatmapGrid days={heatmap.dailySpending} year={year} />

      {/* Weekday averages + monthly totals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <WeekdayAveragesChart averages={heatmap.weekdayAverages} />
        <MonthlyTotalsChart totals={heatmap.monthlyTotals} />
      </div>

      {/* Category heatmap */}
      {heatmap.categoryHeatmap.length > 0 && (
        <CategoryHeatmapTable categories={heatmap.categoryHeatmap} />
      )}
    </div>
  );
};

/* ── Stats Row ─────────────────────────────────────────────── */
interface StatsRowProps {
  stats: {
    totalSpent: number;
    daysTracked: number;
    spendingDays: number;
    noSpendDays: number;
    dailyAverage: number;
    maxDayAmount: number;
    maxDayDate: string | null;
    minSpendingDayAmount: number;
  };
  streaks: {
    longestNoSpendDays: number;
    longestNoSpendStart: string | null;
    longestNoSpendEnd: string | null;
    currentNoSpendStreak: number;
  };
}

const StatsRow: React.FC<StatsRowProps> = ({ stats, streaks }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
    <Card className="p-4 text-center">
      <div className="text-xs text-gray-500 dark:text-gray-400">Total Spent</div>
      <div className="text-lg font-bold text-gray-900 dark:text-white mt-1">
        {formatCurrency(stats.totalSpent)}
      </div>
    </Card>
    <Card className="p-4 text-center">
      <div className="text-xs text-gray-500 dark:text-gray-400">Daily Average</div>
      <div className="text-lg font-bold text-gray-900 dark:text-white mt-1">
        {formatCurrency(stats.dailyAverage)}
      </div>
    </Card>
    <Card className="p-4 text-center">
      <div className="text-xs text-gray-500 dark:text-gray-400">Spending Days</div>
      <div className="text-lg font-bold text-gray-900 dark:text-white mt-1">
        {stats.spendingDays}
      </div>
      <div className="text-xs text-gray-400 dark:text-gray-500">
        of {stats.daysTracked}
      </div>
    </Card>
    <Card className="p-4 text-center">
      <div className="text-xs text-gray-500 dark:text-gray-400">No-Spend Days</div>
      <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
        {stats.noSpendDays}
      </div>
    </Card>
    <Card className="p-4 text-center">
      <div className="text-xs text-gray-500 dark:text-gray-400">Biggest Day</div>
      <div className="text-lg font-bold text-red-600 dark:text-red-400 mt-1">
        {formatCurrency(stats.maxDayAmount)}
      </div>
      {stats.maxDayDate && (
        <div className="text-xs text-gray-400 dark:text-gray-500">
          {new Date(stats.maxDayDate + 'T00:00').toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
        </div>
      )}
    </Card>
    <Card className="p-4 text-center">
      <div className="text-xs text-gray-500 dark:text-gray-400">Best Streak</div>
      <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
        {streaks.longestNoSpendDays}
        <span className="text-xs font-normal ml-1">days</span>
      </div>
      {streaks.currentNoSpendStreak > 0 && (
        <Badge variant="success" className="mt-1">
          🔥 {streaks.currentNoSpendStreak} current
        </Badge>
      )}
    </Card>
  </div>
);

/* ── Heatmap Grid (GitHub-style) ──────────────────────────── */
interface HeatmapGridProps {
  days: HeatmapDay[];
  year: number;
}

const HeatmapGrid: React.FC<HeatmapGridProps> = ({ days, year }) => {
  const { grid, maxAmount } = useMemo(() => {
    const max = Math.max(...days.map((d) => d.amount), 1);
    // Organize by week columns, 7 rows (Sun-Sat)
    const weeks: (HeatmapDay | null)[][] = [];
    let currentWeek: (HeatmapDay | null)[] = [];

    // Pad the first week with nulls for days before Jan 1
    const jan1 = new Date(year, 0, 1);
    const startDow = jan1.getDay();
    for (let i = 0; i < startDow; i++) {
      currentWeek.push(null);
    }

    for (const day of days) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      weeks.push(currentWeek);
    }

    return { grid: weeks, maxAmount: max };
  }, [days, year]);

  return (
    <Card className="overflow-x-auto">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <CalendarDaysIcon className="w-5 h-5 text-blue-500" />
        Daily Spending
      </h3>

      {/* Month labels */}
      <div className="flex mb-1 ml-8">
        {MONTH_LABELS.map((m) => (
          <div
            key={m}
            className="text-xs text-gray-400 dark:text-gray-500"
            style={{ width: `${100 / 12}%` }}
          >
            {m}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="flex gap-[2px] relative">
        {/* Day-of-week labels */}
        <div className="flex flex-col gap-[2px] mr-1">
          {DAY_LABELS.map((d, i) => (
            <div
              key={d}
              className="text-[10px] text-gray-400 dark:text-gray-500 h-[13px] flex items-center"
            >
              {i % 2 === 1 ? d : ''}
            </div>
          ))}
        </div>

        {/* Week columns */}
        {grid.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[2px]">
            {week.map((day, di) => (
              <div
                key={di}
                className={clsx(
                  'w-[13px] h-[13px] rounded-sm cursor-pointer transition-transform hover:scale-125',
                  day
                    ? intensityColors[getIntensity(day.amount, maxAmount)]
                    : 'bg-transparent'
                )}
                title={
                  day
                    ? `${day.date}: ${formatCurrency(day.amount)}`
                    : undefined
                }
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 text-xs text-gray-500 dark:text-gray-400">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={clsx(
              'w-[13px] h-[13px] rounded-sm',
              intensityColors[level]
            )}
          />
        ))}
        <span>More</span>
      </div>
    </Card>
  );
};

/* ── Weekday Averages ─────────────────────────────────────── */
interface WeekdayAveragesChartProps {
  averages: Array<{
    dayOfWeek: number;
    dayName: string;
    average: number;
    total: number;
    count: number;
  }>;
}

const WeekdayAveragesChart: React.FC<WeekdayAveragesChartProps> = ({
  averages,
}) => (
  <Card>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
      <ArrowTrendingDownIcon className="w-5 h-5 text-purple-500" />
      Spending by Day of Week
    </h3>
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={averages}>
        <CartesianGrid
          strokeDasharray="3 3"
          className="stroke-gray-200 dark:stroke-gray-700"
        />
        <XAxis dataKey="dayName" tick={{ fontSize: 12 }} />
        <YAxis
          tickFormatter={(v: number) => `$${v}`}
          tick={{ fontSize: 12 }}
        />
        <Tooltip
          formatter={(value: number) => [formatCurrency(value), 'Daily Avg']}
          contentStyle={{
            backgroundColor: 'rgba(0,0,0,0.8)',
            border: 'none',
            borderRadius: 8,
            color: '#fff',
          }}
        />
        <Bar dataKey="average" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </Card>
);

/* ── Monthly Totals ───────────────────────────────────────── */
interface MonthlyTotalsChartProps {
  totals: Array<{ month: string; amount: number }>;
}

const MonthlyTotalsChart: React.FC<MonthlyTotalsChartProps> = ({ totals }) => {
  const chartData = totals.map((t) => ({
    ...t,
    label: MONTH_LABELS[parseInt(t.month.split('-')[1], 10) - 1] || t.month,
  }));

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <FireIcon className="w-5 h-5 text-orange-500" />
        Monthly Totals
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData}>
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-gray-200 dark:stroke-gray-700"
          />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis
            tickFormatter={(v: number) => `$${v}`}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), 'Total']}
            contentStyle={{
              backgroundColor: 'rgba(0,0,0,0.8)',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
            }}
          />
          <Bar dataKey="amount" fill="#f97316" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

/* ── Category Heatmap Table ───────────────────────────────── */
interface CategoryHeatmapTableProps {
  categories: Array<{
    categoryId: string;
    categoryName: string;
    categoryIcon: string | null;
    categoryColor: string | null;
    months: Array<{ month: string; amount: number }>;
  }>;
}

const CategoryHeatmapTable: React.FC<CategoryHeatmapTableProps> = ({
  categories,
}) => {
  const maxCatAmount = useMemo(() => {
    let max = 0;
    for (const cat of categories) {
      for (const m of cat.months) {
        if (m.amount > max) max = m.amount;
      }
    }
    return max || 1;
  }, [categories]);

  return (
    <Card className="mt-6 overflow-x-auto">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Category Spending by Month
      </h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-2 pr-4 text-gray-500 dark:text-gray-400 font-medium sticky left-0 bg-white dark:bg-gray-900">
              Category
            </th>
            {MONTH_LABELS.map((m) => (
              <th
                key={m}
                className="text-center py-2 px-1 text-gray-500 dark:text-gray-400 font-medium text-xs"
              >
                {m}
              </th>
            ))}
            <th className="text-right py-2 pl-4 text-gray-500 dark:text-gray-400 font-medium">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => {
            const total = cat.months.reduce((s, m) => s + m.amount, 0);
            return (
              <tr
                key={cat.categoryId}
                className="border-b border-gray-100 dark:border-gray-800"
              >
                <td className="py-2 pr-4 text-gray-900 dark:text-white font-medium whitespace-nowrap sticky left-0 bg-white dark:bg-gray-900">
                  {cat.categoryIcon && (
                    <span className="mr-1">{cat.categoryIcon}</span>
                  )}
                  {cat.categoryName}
                </td>
                {cat.months.map((m) => {
                  const intensity = getIntensity(m.amount, maxCatAmount);
                  return (
                    <td key={m.month} className="py-2 px-1 text-center">
                      <div
                        className={clsx(
                          'w-8 h-8 rounded-md flex items-center justify-center text-[10px] font-medium mx-auto',
                          intensity === 0
                            ? 'bg-gray-50 dark:bg-gray-800 text-gray-300 dark:text-gray-600'
                            : intensity <= 2
                            ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                            : intensity === 3
                            ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300'
                            : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
                        )}
                        title={`${cat.categoryName} - ${m.month}: ${formatCurrency(m.amount)}`}
                      >
                        {m.amount > 0
                          ? m.amount >= 1000
                            ? `${(m.amount / 1000).toFixed(0)}k`
                            : `$${Math.round(m.amount)}`
                          : '–'}
                      </div>
                    </td>
                  );
                })}
                <td className="py-2 pl-4 text-right text-gray-900 dark:text-white font-medium">
                  {formatCurrency(total)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
};

export default SpendingHeatmapPage;
