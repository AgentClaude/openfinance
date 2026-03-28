import { useState, useMemo, useRef } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend, Cell,
} from 'recharts';
import { useDebtPayoff, DebtAccount, PayoffStrategy } from '@/hooks/useDebtPayoff';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { StatCard, ChartCard } from '@/components/shared';
import { usePageTitle } from '@/hooks/usePageTitle';

type Strategy = 'avalanche' | 'snowball';

const COLORS = {
  avalanche: '#0D9488',
  snowball: '#F59E0B',
  minimumOnly: '#94A3B8',
  savings: '#10B981',
};

const DEBT_COLORS = ['#E11D48', '#7C3AED', '#0EA5E9', '#F97316', '#6366F1', '#84CC16'];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const formatCurrencyCompact = (value: number) => {
  if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return formatCurrency(value);
};

const formatMonths = (months: number) => {
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (years === 0) return `${remainingMonths}mo`;
  if (remainingMonths === 0) return `${years}yr`;
  return `${years}yr ${remainingMonths}mo`;
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

const formatAccountType = (type: string) =>
  type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

function StrategyCard({
  strategy,
  label,
  description,
  color,
  isSelected,
  onSelect,
  monthsSaved,
  interestSaved,
}: {
  strategy: PayoffStrategy;
  label: string;
  description: string;
  color: string;
  isSelected: boolean;
  onSelect: () => void;
  monthsSaved: number;
  interestSaved: number;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
        isSelected
          ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/30 shadow-md'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{label}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
        </div>
        <div
          className="w-4 h-4 rounded-full border-2 mt-1 flex-shrink-0"
          style={{
            borderColor: isSelected ? color : '#D1D5DB',
            backgroundColor: isSelected ? color : 'transparent',
          }}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Payoff In</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {formatMonths(strategy.monthsToPayoff)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(strategy.payoffDate)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Interest</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(strategy.totalInterestCents / 100)}
          </p>
        </div>
      </div>
      {monthsSaved > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            Save {formatCurrency(interestSaved / 100)}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {monthsSaved} months faster than minimums
          </span>
        </div>
      )}
    </button>
  );
}

function DebtTable({ debts }: { debts: DebtAccount[] }) {
  const totalBalance = debts.reduce((sum, d) => sum + d.balanceCents, 0);
  const totalMinPayment = debts.reduce((sum, d) => sum + d.minimumPaymentCents, 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Account</th>
            <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Balance</th>
            <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rate</th>
            <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Min Payment</th>
            <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">% of Total</th>
          </tr>
        </thead>
        <tbody>
          {debts.map((debt, i) => (
            <tr key={debt.id} className="border-b border-gray-100 dark:border-gray-800">
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DEBT_COLORS[i % DEBT_COLORS.length] }} />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{debt.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{formatAccountType(debt.accountType)}</div>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4 text-right font-medium text-gray-900 dark:text-gray-100">
                {formatCurrency(debt.balanceCents / 100)}
              </td>
              <td className="py-3 px-4 text-right">
                <span className={`font-medium ${debt.interestRate > 15 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
                  {debt.interestRate.toFixed(2)}%
                </span>
              </td>
              <td className="py-3 px-4 text-right text-gray-900 dark:text-gray-100">
                {formatCurrency(debt.minimumPaymentCents / 100)}
              </td>
              <td className="py-3 px-4 text-right text-gray-500 dark:text-gray-400">
                {((debt.balanceCents / totalBalance) * 100).toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-gray-300 dark:border-gray-600">
            <td className="py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Total</td>
            <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-gray-100">
              {formatCurrency(totalBalance / 100)}
            </td>
            <td className="py-3 px-4 text-right text-gray-500 dark:text-gray-400">
              {(debts.reduce((sum, d) => sum + d.interestRate * d.balanceCents, 0) / totalBalance).toFixed(2)}% avg
            </td>
            <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-gray-100">
              {formatCurrency(totalMinPayment / 100)}
            </td>
            <td className="py-3 px-4 text-right text-gray-500 dark:text-gray-400">100%</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export default function DebtPayoffPage() {
  usePageTitle('Debt Payoff');
  const [extraPayment, setExtraPayment] = useState(200);
  const [debouncedExtra, setDebouncedExtra] = useState(200);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy>('avalanche');
  const { plan, loading, error } = useDebtPayoff(debouncedExtra * 100);

  // Debounce extra payment changes
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const handleExtraChange = (value: number) => {
    setExtraPayment(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedExtra(value), 500);
  };

  const timelineData = useMemo(() => {
    if (!plan) return [];
    const strategy = selectedStrategy === 'avalanche' ? plan.avalanche : plan.snowball;
    // Sample every 6 months for readability
    return strategy.timeline
      .filter((_, i) => i % 6 === 0 || i === strategy.timeline.length - 1)
      .map((point) => {
        const date = new Date();
        date.setMonth(date.getMonth() + point.month);
        return {
          label: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          month: point.month,
          remaining: point.totalRemainingCents / 100,
          interest: point.interestPaidCents / 100,
          principal: point.principalPaidCents / 100,
          ...plan.debts.reduce((acc, debt, i) => {
            acc[debt.name] = (point.balances[i] || 0) / 100;
            return acc;
          }, {} as Record<string, number>),
        };
      });
  }, [plan, selectedStrategy]);

  const comparisonData = useMemo(() => {
    if (!plan) return [];
    return [
      {
        name: 'Minimum Only',
        months: plan.minimumOnly.monthsToPayoff,
        interest: plan.minimumOnly.totalInterestCents / 100,
        fill: COLORS.minimumOnly,
      },
      {
        name: 'Snowball',
        months: plan.snowball.monthsToPayoff,
        interest: plan.snowball.totalInterestCents / 100,
        fill: COLORS.snowball,
      },
      {
        name: 'Avalanche',
        months: plan.avalanche.monthsToPayoff,
        interest: plan.avalanche.totalInterestCents / 100,
        fill: COLORS.avalanche,
      },
    ];
  }, [plan]);

  if (loading && !plan) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <PageHeader title="Debt Payoff Planner" subtitle="Error loading debt data" />
        <div className="bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 p-4 rounded-lg mt-4">
          {error.message}
        </div>
      </div>
    );
  }

  if (!plan || plan.debts.length === 0) {
    return (
      <div className="p-6">
        <PageHeader title="Debt Payoff Planner" subtitle="Plan your path to debt freedom" />
        <div className="mt-8 text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-4xl mb-3">🎉</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">No Debt Found</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            You're debt-free! Add credit cards, loans, or mortgages to use this planner.
          </p>
        </div>
      </div>
    );
  }

  const activeStrategy = selectedStrategy === 'avalanche' ? plan.avalanche : plan.snowball;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Debt Payoff Planner"
        subtitle={`${plan.debts.length} debt account${plan.debts.length > 1 ? 's' : ''} · ${formatCurrency(plan.totalDebtCents / 100)} total`}
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Debt"
          value={formatCurrency(plan.totalDebtCents / 100)}
          icon={<span className="text-2xl">💳</span>}
        />
        <StatCard
          label="Monthly Minimum"
          value={formatCurrency(plan.totalMinimumCents / 100)}
          icon={<span className="text-2xl">📅</span>}
        />
        <StatCard
          label="Interest Saved"
          value={formatCurrency(
            (selectedStrategy === 'avalanche'
              ? plan.interestSavedAvalancheCents
              : plan.interestSavedSnowballCents) / 100
          )}
          valueClassName="text-green-600 dark:text-green-400"
          icon={<span className="text-2xl">💰</span>}
        />
        <StatCard
          label="Debt-Free Date"
          value={formatDate(activeStrategy.payoffDate)}
          icon={<span className="text-2xl">🏁</span>}
        />
      </div>

      {/* Extra Payment Slider */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Extra Monthly Payment
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Additional amount above minimums each month
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">
              {formatCurrency(extraPayment)}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">/mo</span>
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={2000}
          step={50}
          value={extraPayment}
          onChange={(e) => handleExtraChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>$0</span>
          <span>$500</span>
          <span>$1,000</span>
          <span>$1,500</span>
          <span>$2,000</span>
        </div>
      </div>

      {/* Strategy Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StrategyCard
          strategy={plan.avalanche}
          label="🏔️ Avalanche"
          description="Pay highest interest rate first — saves the most money"
          color={COLORS.avalanche}
          isSelected={selectedStrategy === 'avalanche'}
          onSelect={() => setSelectedStrategy('avalanche')}
          monthsSaved={plan.monthsSavedAvalanche}
          interestSaved={plan.interestSavedAvalancheCents}
        />
        <StrategyCard
          strategy={plan.snowball}
          label="⛄ Snowball"
          description="Pay smallest balance first — builds momentum"
          color={COLORS.snowball}
          isSelected={selectedStrategy === 'snowball'}
          onSelect={() => setSelectedStrategy('snowball')}
          monthsSaved={plan.monthsSavedSnowball}
          interestSaved={plan.interestSavedSnowballCents}
        />
      </div>

      {/* Payoff Timeline Chart */}
      <ChartCard title="Payoff Timeline" subtitle={`${selectedStrategy === 'avalanche' ? 'Avalanche' : 'Snowball'} strategy`}>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={timelineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis
              tickFormatter={(v) => formatCurrencyCompact(v)}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              labelStyle={{ color: '#111827' }}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
              }}
            />
            <Legend />
            {plan.debts.map((debt, i) => (
              <Area
                key={debt.id}
                type="monotone"
                dataKey={debt.name}
                stackId="1"
                fill={DEBT_COLORS[i % DEBT_COLORS.length]}
                stroke={DEBT_COLORS[i % DEBT_COLORS.length]}
                fillOpacity={0.6}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Strategy Comparison Chart */}
      <ChartCard title="Strategy Comparison" subtitle="Total interest paid by strategy">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={comparisonData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis type="number" tickFormatter={(v) => formatCurrencyCompact(v)} tick={{ fontSize: 12 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="interest" name="Total Interest" radius={[0, 4, 4, 0]}>
              {comparisonData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Debt Accounts Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Your Debts
        </h3>
        <DebtTable debts={plan.debts} />
      </div>

      {/* Strategy Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30 rounded-xl p-5 border border-teal-200 dark:border-teal-800">
          <h4 className="font-semibold text-teal-800 dark:text-teal-200 mb-2">🏔️ Avalanche Method</h4>
          <p className="text-sm text-teal-700 dark:text-teal-300">
            Pay minimums on everything, then throw all extra cash at the <strong>highest interest rate</strong> debt.
            Mathematically optimal — saves the most money over time.
          </p>
          <div className="mt-3 text-sm">
            <div className="flex justify-between text-teal-600 dark:text-teal-400">
              <span>First target:</span>
              <span className="font-medium">
                {[...plan.debts].sort((a, b) => b.interestRate - a.interestRate)[0]?.name ?? 'N/A'}
              </span>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 rounded-xl p-5 border border-amber-200 dark:border-amber-800">
          <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">⛄ Snowball Method</h4>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Pay minimums on everything, then throw all extra cash at the <strong>smallest balance</strong> debt.
            Quick wins build momentum and motivation.
          </p>
          <div className="mt-3 text-sm">
            <div className="flex justify-between text-amber-600 dark:text-amber-400">
              <span>First target:</span>
              <span className="font-medium">
                {[...plan.debts].sort((a, b) => a.balanceCents - b.balanceCents)[0]?.name ?? 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
