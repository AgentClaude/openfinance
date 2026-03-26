import React, { useState } from 'react';
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChevronDownIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend,
} from 'recharts';
import { useCashFlowForecast, ForecastEvent } from '@/hooks/useCashFlowForecast';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { StatCard } from '@/components/shared';
import clsx from 'clsx';
import { format, parseISO, isToday, isTomorrow, differenceInDays } from 'date-fns';

type TimeRange = 30 | 60 | 90 | 180 | 365;
type EventFilter = 'all' | 'recurring' | 'estimated';

const ForecastPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>(90);
  const [includeEstimates, setIncludeEstimates] = useState(true);
  const [eventFilter, setEventFilter] = useState<EventFilter>('all');
  const [showAllEvents, setShowAllEvents] = useState(false);

  const { forecast, loading, error, refetch, hasWarnings } = useCashFlowForecast({
    days: timeRange,
    includeVariableSpending: includeEstimates,
  });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

  const formatCurrencyFull = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const timeRangeOptions: { value: TimeRange; label: string }[] = [
    { value: 30, label: '30 days' },
    { value: 60, label: '60 days' },
    { value: 90, label: '90 days' },
    { value: 180, label: '6 months' },
    { value: 365, label: '1 year' },
  ];

  // Chart data - sample every N days for readability
  const chartData = React.useMemo(() => {
    if (!forecast?.dailyProjections.length) return [];
    const projections = forecast.dailyProjections;
    const step = projections.length > 90 ? Math.ceil(projections.length / 90) : 1;
    return projections
      .filter((_, i) => i === 0 || i % step === 0 || i === projections.length - 1)
      .map((day) => ({
        date: day.date,
        label: format(parseISO(day.date), 'MMM d'),
        balance: day.balance,
        income: day.income,
        expenses: day.expenses,
      }));
  }, [forecast]);

  // Filter events
  const filteredEvents = React.useMemo(() => {
    if (!forecast?.events) return [];
    let events = [...forecast.events];
    if (eventFilter === 'recurring') events = events.filter((e) => e.source === 'recurring');
    if (eventFilter === 'estimated') events = events.filter((e) => e.source === 'estimated');
    return events.sort((a, b) => a.date.localeCompare(b.date));
  }, [forecast, eventFilter]);

  const visibleEvents = showAllEvents ? filteredEvents : filteredEvents.slice(0, 20);

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    const daysAway = differenceInDays(date, new Date());
    if (daysAway <= 7) return `In ${daysAway} days`;
    return format(date, 'MMM d, yyyy');
  };

  if (loading && !forecast) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Failed to load forecast"
        description="There was an error generating your cash flow forecast."
        icon={<ExclamationTriangleIcon className="h-12 w-12" />}
        actionLabel="Retry"
        onAction={() => refetch()}
      />
    );
  }

  if (!forecast || forecast.startingBalance === 0) {
    return (
      <div>
        <PageHeader
          title="Cash Flow Forecast"
          subtitle="Project your future account balances"
        />
        <EmptyState
          title="No accounts to forecast"
          description="Add checking or savings accounts to see your projected cash flow."
          icon={<BanknotesIcon className="h-12 w-12" />}
        />
      </div>
    );
  }

  const balanceChange = forecast.endingBalance - forecast.startingBalance;
  const balanceChangePercent = forecast.startingBalance !== 0
    ? ((balanceChange / forecast.startingBalance) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6" data-testid="forecast-page">
      {/* Header */}
      <PageHeader
        title="Cash Flow Forecast"
        subtitle={`${timeRange}-day projection based on recurring items${includeEstimates ? ' and spending patterns' : ''}`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIncludeEstimates(!includeEstimates)}
              className={clsx(
                'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors',
                includeEstimates
                  ? 'bg-teal-50 border-teal-200 text-teal-700 dark:bg-teal-900/20 dark:border-teal-800 dark:text-teal-400'
                  : 'bg-white border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'
              )}
              data-testid="toggle-estimates"
            >
              {includeEstimates ? <EyeIcon className="h-4 w-4" /> : <EyeSlashIcon className="h-4 w-4" />}
              Estimates
            </button>
            <button
              onClick={() => refetch()}
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Refresh forecast"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
          </div>
        }
      />

      {/* Warnings */}
      {hasWarnings && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4" data-testid="forecast-warnings">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">Balance Alert</h3>
              <ul className="mt-1 space-y-1">
                {forecast.warnings.map((w, i) => (
                  <li key={i} className="text-sm text-amber-700 dark:text-amber-400">
                    {format(parseISO(w.date), 'MMM d')}: {w.message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Current Balance"
          value={formatCurrency(forecast.startingBalance)}
          icon={<BanknotesIcon className="h-5 w-5 text-teal-600" />}
        />
        <StatCard
          label={`Balance in ${timeRange}d`}
          value={formatCurrency(forecast.endingBalance)}
          trend={{
            direction: balanceChange >= 0 ? 'up' : 'down',
            value: `${balanceChange >= 0 ? '+' : ''}${balanceChangePercent}%`,
          }}
        />
        <StatCard
          label="Projected Income"
          value={formatCurrency(forecast.totalProjectedIncome)}
          icon={<ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />}
        />
        <StatCard
          label="Projected Expenses"
          value={formatCurrency(forecast.totalProjectedExpenses)}
          icon={<ArrowTrendingDownIcon className="h-5 w-5 text-red-500" />}
        />
      </div>

      {/* Time Range Selector */}
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
        {timeRangeOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setTimeRange(opt.value)}
            className={clsx(
              'px-3 py-1.5 text-sm rounded-md transition-colors',
              timeRange === opt.value
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm font-medium'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Balance Projection Chart */}
      <Card>
        <div className="p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Projected Balance
          </h2>
          <div className="h-80" data-testid="forecast-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D9488" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0D9488" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12 }}
                  className="text-gray-600 dark:text-gray-400"
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 12 }}
                  className="text-gray-600 dark:text-gray-400"
                  width={60}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{data.label}</p>
                        <p className="text-sm text-teal-600 dark:text-teal-400 font-semibold mt-1">
                          Balance: {formatCurrencyFull(data.balance)}
                        </p>
                        {data.income > 0 && (
                          <p className="text-xs text-green-600 mt-0.5">+{formatCurrencyFull(data.income)} income</p>
                        )}
                        {data.expenses > 0 && (
                          <p className="text-xs text-red-500 mt-0.5">-{formatCurrencyFull(data.expenses)} expenses</p>
                        )}
                      </div>
                    );
                  }}
                />
                <ReferenceLine
                  y={0}
                  stroke="#EF4444"
                  strokeDasharray="3 3"
                  label={{ value: '$0', position: 'insideLeft', fill: '#EF4444', fontSize: 11 }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="balance"
                  name="Balance"
                  stroke="#0D9488"
                  fill="url(#balanceGradient)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      {/* Two-column layout: Events + Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Events */}
        <div className="lg:col-span-2">
          <Card>
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Projected Events
                  <span className="ml-2 text-sm font-normal text-gray-500">({filteredEvents.length})</span>
                </h2>
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
                  {(['all', 'recurring', 'estimated'] as EventFilter[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setEventFilter(f)}
                      className={clsx(
                        'px-2.5 py-1 text-xs rounded-md capitalize transition-colors',
                        eventFilter === f
                          ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm font-medium'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {filteredEvents.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
                  No projected events for this time period.
                </p>
              ) : (
                <div className="space-y-1" data-testid="forecast-events">
                  {visibleEvents.map((event, i) => (
                    <EventRow key={`${event.date}-${event.name}-${i}`} event={event} getDateLabel={getDateLabel} formatCurrencyFull={formatCurrencyFull} />
                  ))}
                  {filteredEvents.length > 20 && !showAllEvents && (
                    <button
                      onClick={() => setShowAllEvents(true)}
                      className="w-full py-2 text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 flex items-center justify-center gap-1"
                    >
                      <ChevronDownIcon className="h-4 w-4" />
                      Show all {filteredEvents.length} events
                    </button>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Forecast Details */}
        <div className="space-y-4">
          <Card>
            <div className="p-4 sm:p-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Forecast Summary</h3>
              <dl className="space-y-3">
                <DetailRow label="Net Cash Flow" value={formatCurrencyFull(forecast.netCashFlow)} positive={forecast.netCashFlow >= 0} />
                <DetailRow label="Lowest Balance" value={formatCurrencyFull(forecast.minBalance)}
                  sublabel={forecast.minBalanceDate ? format(parseISO(forecast.minBalanceDate), 'MMM d') : undefined}
                  positive={forecast.minBalance >= 0} />
                <DetailRow label="Highest Balance" value={formatCurrencyFull(forecast.maxBalance)}
                  sublabel={forecast.maxBalanceDate ? format(parseISO(forecast.maxBalanceDate), 'MMM d') : undefined}
                  positive />
                <DetailRow label="Recurring Events" value={String(forecast.events.filter((e) => e.source === 'recurring').length)} />
                <DetailRow label="Estimated Events" value={String(forecast.events.filter((e) => e.source === 'estimated').length)} />
              </dl>
            </div>
          </Card>

          <Card>
            <div className="p-4 sm:p-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">About this Forecast</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                This forecast projects your liquid account balances using your recurring bills and income.
                {includeEstimates && ' Variable spending estimates are based on your 3-month spending averages by category.'}
                {' '}Confidence is higher for recurring items (90%) than estimates (60%).
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Sub-components
const EventRow: React.FC<{
  event: ForecastEvent;
  getDateLabel: (d: string) => string;
  formatCurrencyFull: (n: number) => string;
}> = ({ event, getDateLabel, formatCurrencyFull }) => {
  const isIncome = event.amount > 0;
  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className={clsx(
          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
          isIncome ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
        )}>
          {isIncome
            ? <ArrowTrendingUpIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
            : <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 dark:text-red-400" />}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{event.name}</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">{getDateLabel(event.date)}</span>
            {event.categoryName && (
              <span className="text-xs text-gray-400 dark:text-gray-500">· {event.categoryName}</span>
            )}
            <Badge
              variant={event.source === 'recurring' ? 'default' : 'warning'}
              size="sm"
            >
              {event.source === 'recurring' ? 'recurring' : 'estimate'}
            </Badge>
          </div>
        </div>
      </div>
      <span className={clsx(
        'text-sm font-semibold tabular-nums flex-shrink-0 ml-2',
        isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
      )}>
        {isIncome ? '+' : ''}{formatCurrencyFull(event.amount)}
      </span>
    </div>
  );
};

const DetailRow: React.FC<{
  label: string;
  value: string;
  sublabel?: string;
  positive?: boolean;
}> = ({ label, value, sublabel, positive }) => (
  <div className="flex items-center justify-between">
    <dt className="text-sm text-gray-500 dark:text-gray-400">{label}</dt>
    <dd className="text-right">
      <span className={clsx(
        'text-sm font-semibold',
        positive === undefined ? 'text-gray-900 dark:text-white' :
        positive ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
      )}>
        {value}
      </span>
      {sublabel && <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">({sublabel})</span>}
    </dd>
  </div>
);

export default ForecastPage;
