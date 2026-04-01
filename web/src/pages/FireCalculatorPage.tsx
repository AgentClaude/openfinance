import React, { useState, useEffect } from 'react';
import {
  FireIcon,
  ChartBarIcon,
  AdjustmentsHorizontalIcon,
  LightBulbIcon,
  FlagIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  Area,
  AreaChart,
} from 'recharts';
import { useFireCalculator } from '@/hooks/useFireCalculator';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import { usePageTitle } from '@/hooks/usePageTitle';
import clsx from 'clsx';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

const formatCompact = (val: number) => {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return formatCurrency(val);
};

type Tab = 'overview' | 'projections' | 'scenarios' | 'milestones';

const FireCalculatorPage: React.FC = () => {
  usePageTitle('FIRE Calculator');
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [currentAge, setCurrentAge] = useState(30);
  const [retirementAge, setRetirementAge] = useState(65);
  const [withdrawalRate, setWithdrawalRate] = useState(4.0);
  const [annualReturnRate, setAnnualReturnRate] = useState(7.0);
  const [inflationRate, setInflationRate] = useState(3.0);

  // Debounce params to avoid refetching on every keystroke
  const [debouncedParams, setDebouncedParams] = useState({
    currentAge, retirementAge, withdrawalRate, annualReturnRate, inflationRate,
  });
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedParams({ currentAge, retirementAge, withdrawalRate, annualReturnRate, inflationRate });
    }, 500);
    return () => clearTimeout(timer);
  }, [currentAge, retirementAge, withdrawalRate, annualReturnRate, inflationRate]);

  const { data, loading } = useFireCalculator(debouncedParams);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!data) {
    return <EmptyState icon={<FireIcon className="w-12 h-12" />} title="Unable to load FIRE calculator" description="Please try again later." />;
  }

  const { summary, financials, projections, scenarios, milestones, tips } = data;

  const tabs = [
    { id: 'overview' as Tab, label: 'Overview', icon: FireIcon },
    { id: 'projections' as Tab, label: 'Projections', icon: ChartBarIcon },
    { id: 'scenarios' as Tab, label: 'Scenarios', icon: AdjustmentsHorizontalIcon },
    { id: 'milestones' as Tab, label: 'Milestones', icon: FlagIcon },
  ];

  return (
    <div>
      <PageHeader
        title="🔥 FIRE Calculator"
        subtitle="Financial Independence, Retire Early — Track your path to freedom"
      />

      {/* Parameter Controls */}
      <Card className="mb-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Current Age</label>
            <input
              type="number"
              value={currentAge}
              onChange={(e) => setCurrentAge(Number(e.target.value))}
              min={18}
              max={80}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
              aria-label="Current age"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Target Retirement</label>
            <input
              type="number"
              value={retirementAge}
              onChange={(e) => setRetirementAge(Number(e.target.value))}
              min={currentAge + 1}
              max={100}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
              aria-label="Retirement age"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Return Rate (%)</label>
            <input
              type="number"
              value={annualReturnRate}
              onChange={(e) => setAnnualReturnRate(Number(e.target.value))}
              min={1}
              max={15}
              step={0.5}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
              aria-label="Annual return rate"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Withdrawal (%)</label>
            <input
              type="number"
              value={withdrawalRate}
              onChange={(e) => setWithdrawalRate(Number(e.target.value))}
              min={2}
              max={6}
              step={0.5}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
              aria-label="Withdrawal rate"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Inflation (%)</label>
            <input
              type="number"
              value={inflationRate}
              onChange={(e) => setInflationRate(Number(e.target.value))}
              min={1}
              max={8}
              step={0.5}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
              aria-label="Inflation rate"
            />
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center',
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <OverviewTab summary={summary} financials={financials} tips={tips} />
      )}
      {activeTab === 'projections' && (
        <ProjectionsTab projections={projections} summary={summary} />
      )}
      {activeTab === 'scenarios' && (
        <ScenariosTab scenarios={scenarios} />
      )}
      {activeTab === 'milestones' && (
        <MilestonesTab milestones={milestones} />
      )}
    </div>
  );
};

/* ── Overview Tab ──────────────────────────────────────────── */
interface OverviewProps {
  summary: Record<string, number | null>;
  financials: Record<string, number>;
  tips: Array<{ category: string; title: string; description: string }>;
}

const OverviewTab: React.FC<OverviewProps> = ({ summary, financials, tips }) => (
  <div className="space-y-6">
    {/* Hero Stats */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="text-center p-6">
        <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
          {formatCompact(summary.fireNumber ?? 0)}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">FIRE Number</div>
        <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          25× annual expenses at {summary.withdrawalRate}% withdrawal
        </div>
      </Card>

      <Card className="text-center p-6">
        <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
          {summary.yearsToFire != null ? `${summary.yearsToFire} years` : '—'}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Time to FIRE</div>
        <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          {summary.fireAge != null ? `Age ${summary.fireAge}` : 'Increase savings to calculate'}
        </div>
      </Card>

      <Card className="text-center p-6">
        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
          {summary.progressPercent?.toFixed(1)}%
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Progress to FIRE</div>
        <ProgressBar
          value={summary.progressPercent ?? 0}
          max={100}
          className="mt-2"
          color={
            (summary.progressPercent ?? 0) >= 75
              ? 'success'
              : (summary.progressPercent ?? 0) >= 25
              ? 'warning'
              : 'danger'
          }
        />
      </Card>
    </div>

    {/* Secondary Stats */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="p-4">
        <div className="text-xs text-gray-500 dark:text-gray-400">Savings Rate</div>
        <div className="text-xl font-semibold text-gray-900 dark:text-white mt-1">{summary.savingsRate}%</div>
      </Card>
      <Card className="p-4">
        <div className="text-xs text-gray-500 dark:text-gray-400">Monthly Savings</div>
        <div className="text-xl font-semibold text-gray-900 dark:text-white mt-1">{formatCurrency(summary.monthlySavings ?? 0)}</div>
      </Card>
      <Card className="p-4">
        <div className="text-xs text-gray-500 dark:text-gray-400">Coast FIRE</div>
        <div className="text-xl font-semibold text-gray-900 dark:text-white mt-1">{formatCompact(summary.coastFireNumber ?? 0)}</div>
        {summary.coastFireAge != null && (
          <div className="text-xs text-gray-400 dark:text-gray-500">Reach by age {summary.coastFireAge}</div>
        )}
      </Card>
      <Card className="p-4">
        <div className="text-xs text-gray-500 dark:text-gray-400">Invested Assets</div>
        <div className="text-xl font-semibold text-gray-900 dark:text-white mt-1">{formatCurrency(financials.investedAssets)}</div>
      </Card>
    </div>

    {/* Income/Expense Breakdown */}
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Financial Snapshot</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500 dark:text-gray-400">Monthly Income</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">{formatCurrency(financials.monthlyIncome)}</span>
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500 dark:text-gray-400">Monthly Expenses</span>
            <span className="text-red-600 dark:text-red-400 font-medium">{formatCurrency(financials.monthlyExpenses)}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold border-t border-gray-200 dark:border-gray-700 pt-1 mt-1">
            <span className="text-gray-700 dark:text-gray-300">Monthly Savings</span>
            <span className={financials.monthlySavings >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>{formatCurrency(financials.monthlySavings)}</span>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500 dark:text-gray-400">Annual Income</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">{formatCurrency(financials.annualIncome)}</span>
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500 dark:text-gray-400">Annual Expenses</span>
            <span className="text-red-600 dark:text-red-400 font-medium">{formatCurrency(financials.annualExpenses)}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold border-t border-gray-200 dark:border-gray-700 pt-1 mt-1">
            <span className="text-gray-700 dark:text-gray-300">Annual Savings</span>
            <span className={financials.annualSavings >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>{formatCurrency(financials.annualSavings)}</span>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500 dark:text-gray-400">Invested Assets</span>
            <span className="text-blue-600 dark:text-blue-400 font-medium">{formatCurrency(financials.investedAssets)}</span>
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500 dark:text-gray-400">Net Worth</span>
            <span className="text-purple-600 dark:text-purple-400 font-medium">{formatCurrency(financials.totalNetWorth)}</span>
          </div>
        </div>
      </div>
    </Card>

    {/* Tips */}
    {tips.length > 0 && (
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <LightBulbIcon className="w-5 h-5 text-yellow-500" />
          Tips & Insights
        </h3>
        <div className="space-y-3">
          {tips.map((tip, i) => (
            <div key={i} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Badge
                variant={tip.category === 'savings' ? 'success' : tip.category === 'actionable' ? 'info' : tip.category === 'foundation' ? 'danger' : 'default'}
                className="self-start whitespace-nowrap"
              >
                {tip.category}
              </Badge>
              <div>
                <div className="font-medium text-sm text-gray-900 dark:text-white">{tip.title}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{tip.description}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    )}
  </div>
);

/* ── Projections Tab ──────────────────────────────────────── */
interface ProjectionsProps {
  projections: Array<{ year: number; age: number; portfolioValue: number; fireNumber: number; isFireReached: boolean }>;
  summary: Record<string, number | null>;
}

const ProjectionsTab: React.FC<ProjectionsProps> = ({ projections, summary }) => (
  <div className="space-y-6">
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <ArrowTrendingUpIcon className="w-5 h-5 text-orange-500" />
        Portfolio Growth Projection
      </h3>
      {projections.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={projections}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis
              dataKey="age"
              label={{ value: 'Age', position: 'insideBottom', offset: -5 }}
              className="text-gray-500"
            />
            <YAxis
              tickFormatter={(v: number) => formatCompact(v)}
              className="text-gray-500"
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                formatCurrency(value),
                name === 'portfolioValue' ? 'Portfolio' : 'FIRE Target',
              ]}
              labelFormatter={(label: number) => `Age ${label}`}
              contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: 8, color: '#fff' }}
            />
            <Area
              type="monotone"
              dataKey="portfolioValue"
              stroke="#f97316"
              fill="#f9731620"
              strokeWidth={2}
              name="portfolioValue"
            />
            <ReferenceLine
              y={summary.fireNumber ?? 0}
              stroke="#10b981"
              strokeDasharray="5 5"
              label={{ value: `FIRE: ${formatCompact(summary.fireNumber ?? 0)}`, fill: '#10b981', fontSize: 12 }}
            />
            {summary.coastFireNumber && summary.coastFireNumber > 0 && (
              <ReferenceLine
                y={summary.coastFireNumber}
                stroke="#6366f1"
                strokeDasharray="3 3"
                label={{ value: `Coast: ${formatCompact(summary.coastFireNumber)}`, fill: '#6366f1', fontSize: 12 }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          No projection data available. Add income and expense transactions to calculate.
        </p>
      )}
    </Card>

    {/* Projection Table */}
    {projections.length > 0 && (
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Year-by-Year Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 text-gray-500 dark:text-gray-400 font-medium">Age</th>
                <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Portfolio Value</th>
                <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">FIRE Target</th>
                <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Gap</th>
                <th className="text-center py-2 text-gray-500 dark:text-gray-400 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {projections.filter((_, i) => i % 5 === 0 || i === projections.length - 1).map((p) => {
                const gap = p.fireNumber - p.portfolioValue;
                const reached = p.portfolioValue >= p.fireNumber && p.fireNumber > 0;
                return (
                  <tr key={p.year} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 text-gray-900 dark:text-white font-medium">{p.age}</td>
                    <td className="py-2 text-right text-gray-900 dark:text-white">{formatCurrency(p.portfolioValue)}</td>
                    <td className="py-2 text-right text-gray-500 dark:text-gray-400">{formatCurrency(p.fireNumber)}</td>
                    <td className={clsx('py-2 text-right', reached ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
                      {reached ? `+${formatCurrency(Math.abs(gap))}` : `-${formatCurrency(gap)}`}
                    </td>
                    <td className="py-2 text-center">
                      {reached ? (
                        <Badge variant="success">🔥 FIRE</Badge>
                      ) : (
                        <Badge variant="default">Building</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    )}
  </div>
);

/* ── Scenarios Tab ──────────────────────────────────────────── */
interface ScenariosProps {
  scenarios: Array<{ savingsRate: number; monthlySavings: number; yearsToFire: number | null; isCurrent: boolean }>;
}

const ScenariosTab: React.FC<ScenariosProps> = ({ scenarios }) => (
  <div className="space-y-6">
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <AdjustmentsHorizontalIcon className="w-5 h-5 text-orange-500" />
        Savings Rate vs Years to FIRE
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        See how different savings rates affect your timeline. Your current rate is highlighted.
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={scenarios.filter((s) => s.yearsToFire != null)}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis dataKey="savingsRate" tickFormatter={(v: number) => `${v}%`} />
          <YAxis label={{ value: 'Years', angle: -90, position: 'insideLeft' }} />
          <Tooltip
            formatter={(value: number) => [`${value} years`, 'Time to FIRE']}
            labelFormatter={(label: number) => `${label}% savings rate`}
            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: 8, color: '#fff' }}
          />
          <Bar dataKey="yearsToFire" radius={[4, 4, 0, 0]}>
            {scenarios.filter((s) => s.yearsToFire != null).map((entry, index) => (
              <Cell
                key={index}
                fill={entry.isCurrent ? '#f97316' : '#94a3b8'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>

    {/* Scenarios Table */}
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Scenario Comparison</h3>
      <div className="space-y-2">
        {scenarios.map((s) => (
          <div
            key={s.savingsRate}
            className={clsx(
              'flex items-center justify-between p-3 rounded-lg',
              s.isCurrent
                ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800'
                : 'bg-gray-50 dark:bg-gray-800'
            )}
          >
            <div className="flex items-center gap-3">
              <span className={clsx(
                'text-lg font-bold w-12',
                s.isCurrent ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'
              )}>
                {s.savingsRate}%
              </span>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {formatCurrency(s.monthlySavings)}/month
                </div>
                {s.isCurrent && (
                  <Badge variant="warning" className="mt-1">← Your rate</Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              {s.yearsToFire != null ? (
                <>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">{s.yearsToFire}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">years</span>
                </>
              ) : (
                <span className="text-sm text-gray-400 dark:text-gray-500">100+ years</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  </div>
);

/* ── Milestones Tab ──────────────────────────────────────────── */
interface MilestonesProps {
  milestones: Array<{ name: string; target: number; current: number; reached: boolean; percent: number }>;
}

const MilestonesTab: React.FC<MilestonesProps> = ({ milestones }) => (
  <div className="space-y-6">
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <FlagIcon className="w-5 h-5 text-orange-500" />
        FIRE Milestones
      </h3>
      {milestones.length > 0 ? (
        <div className="space-y-4">
          {milestones.map((m) => (
            <div key={m.name} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className={clsx(
                  'font-medium',
                  m.reached ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'
                )}>
                  {m.reached ? '✅ ' : ''}{m.name}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {formatCompact(m.current)} / {formatCompact(m.target)}
                </span>
              </div>
              <ProgressBar
                value={m.percent}
                max={100}
                color={m.reached ? 'success' : m.percent >= 50 ? 'warning' : 'danger'}
              />
              <div className="text-xs text-gray-400 dark:text-gray-500 text-right">{m.percent.toFixed(1)}%</div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          Add financial data to see your milestones.
        </p>
      )}
    </Card>

    {/* Disclaimer */}
    <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
      <div className="flex gap-3">
        <LightBulbIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800 dark:text-amber-200">
          <div className="font-medium mb-1">Disclaimer</div>
          <p>
            This calculator provides estimates based on simplified assumptions. Actual results will vary due to market
            volatility, tax implications, inflation changes, and life events. The 4% rule is a guideline, not a guarantee.
            Consult a financial advisor for personalized planning.
          </p>
        </div>
      </div>
    </Card>
  </div>
);

export default FireCalculatorPage;
