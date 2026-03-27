import React from 'react';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, MinusIcon } from '@heroicons/react/24/outline';
import { useFinancialHealth } from '@/hooks/useFinancialHealth';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import AmountDisplay from '@/components/ui/AmountDisplay';
import clsx from 'clsx';
import { usePageTitle } from '@/hooks/usePageTitle';

const ScoreGauge: React.FC<{ score: number; grade: string; color: string }> = ({ score, grade, color }) => {
  const strokeWidth = 12;
  const size = 200;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-bold text-gray-900 dark:text-white">{score}</span>
        <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">Grade {grade}</span>
      </div>
    </div>
  );
};

const ComponentCard: React.FC<{
  component: {
    name: string;
    label: string;
    rawScore: number;
    weight: number;
    weightedScore: number;
    status: string;
    details: Record<string, number | string>;
  };
  getStatusBadgeVariant: (status: string) => 'success' | 'warning' | 'danger' | 'default';
  getStatusLabel: (status: string) => string;
}> = ({ component, getStatusBadgeVariant, getStatusLabel }) => {
  const barColor = component.status === 'excellent' || component.status === 'good'
    ? 'bg-emerald-500'
    : component.status === 'needs_work'
      ? 'bg-amber-500'
      : component.status === 'critical'
        ? 'bg-red-500'
        : 'bg-gray-400';

  const icons: Record<string, React.ReactNode> = {
    savings_rate: <ArrowTrendingUpIcon className="h-5 w-5 text-emerald-500" />,
    budget_adherence: <span className="text-lg">📊</span>,
    debt_ratio: <span className="text-lg">⚖️</span>,
    emergency_fund: <span className="text-lg">🛡️</span>,
    net_worth_trend: <ArrowTrendingUpIcon className="h-5 w-5 text-blue-500" />,
  };

  const renderDetails = () => {
    const d = component.details;
    switch (component.name) {
      case 'savings_rate':
        return (
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Rate</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">{d.rate}%</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Income</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                <AmountDisplay amount={Number(d.monthly_income)} />
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Expenses</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                <AmountDisplay amount={Number(d.monthly_expenses)} />
              </div>
            </div>
          </div>
        );
      case 'budget_adherence':
        return (
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">On Track</div>
              <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{d.on_track}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Over Budget</div>
              <div className="text-sm font-semibold text-red-600 dark:text-red-400">{d.over_budget}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Adherence</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">{d.adherence_pct}%</div>
            </div>
          </div>
        );
      case 'debt_ratio':
        return (
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Assets</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                <AmountDisplay amount={Number(d.assets)} />
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Liabilities</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                <AmountDisplay amount={Number(d.liabilities)} />
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Ratio</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">{d.ratio}%</div>
            </div>
          </div>
        );
      case 'emergency_fund':
        return (
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Liquid</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                <AmountDisplay amount={Number(d.liquid_balance)} />
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Monthly Exp.</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                <AmountDisplay amount={Number(d.monthly_expenses)} />
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Months</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">{d.months_covered}</div>
            </div>
          </div>
        );
      case 'net_worth_trend':
        return (
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Change</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                <AmountDisplay amount={Number(d.change_amount)} showSign />
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Percent</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {Number(d.change_pct) >= 0 ? '+' : ''}{d.change_pct}%
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Trend</div>
              <div className="flex items-center gap-1 text-sm font-semibold">
                {d.trend === 'growing'
                  ? <><ArrowTrendingUpIcon className="h-4 w-4 text-emerald-500" /> <span className="text-emerald-600 dark:text-emerald-400">Growing</span></>
                  : d.trend === 'declining'
                    ? <><ArrowTrendingDownIcon className="h-4 w-4 text-red-500" /> <span className="text-red-600 dark:text-red-400">Declining</span></>
                    : <><MinusIcon className="h-4 w-4 text-gray-500" /> <span className="text-gray-600 dark:text-gray-400">Stable</span></>
                }
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icons[component.name]}
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{component.label}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusBadgeVariant(component.status)} size="sm">
            {getStatusLabel(component.status)}
          </Badge>
          <span className="text-lg font-bold text-gray-900 dark:text-white">{component.rawScore}</span>
        </div>
      </div>

      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all duration-700 ease-out', barColor)}
          style={{ width: `${component.rawScore}%` }}
        />
      </div>

      <div className="flex items-center justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
        <span>Weight: {component.weight}%</span>
        <span>Contributes {component.weightedScore} pts</span>
      </div>

      {renderDetails()}
    </Card>
  );
};

const FinancialHealthPage: React.FC = () => {
  usePageTitle('Financial Health');
  const { health, loading, getScoreRingColor, getStatusBadgeVariant, getStatusLabel } = useFinancialHealth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial Health"
        subtitle="Your overall financial wellness score based on key indicators"
      />

      {/* Score Overview */}
      <Card>
        <div className="text-center py-4">
          <ScoreGauge score={health.score} grade={health.grade} color={getScoreRingColor(health.score)} />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 max-w-md mx-auto">
            {health.score >= 80
              ? "Your finances are in great shape! Keep up the excellent work."
              : health.score >= 60
                ? "You're on the right track. A few improvements could boost your score."
                : health.score >= 40
                  ? "There's room for improvement. Focus on the areas below."
                  : "Your financial health needs attention. Check the recommendations below."
            }
          </p>
        </div>
      </Card>

      {/* Component Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {health.components.map((comp) => (
          <ComponentCard
            key={comp.name}
            component={comp}
            getStatusBadgeVariant={getStatusBadgeVariant}
            getStatusLabel={getStatusLabel}
          />
        ))}
      </div>

      {/* Recommendations */}
      {health.recommendations.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Recommendations</h3>
          <div className="space-y-3">
            {health.recommendations.map((rec, idx) => (
              <div
                key={idx}
                className={clsx(
                  'flex items-start gap-3 px-4 py-3 rounded-lg text-sm',
                  rec.type === 'positive'
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300'
                    : rec.type === 'critical'
                      ? 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                      : 'bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300'
                )}
              >
                <span className="flex-shrink-0 mt-0.5">
                  {rec.type === 'positive' ? '✅' : rec.type === 'critical' ? '🚨' : '⚠️'}
                </span>
                <span>{rec.message}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Methodology */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">How Your Score Is Calculated</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          Your Financial Health Score is calculated from five key indicators, each weighted by importance:
          Savings Rate (25%), Budget Adherence (20%), Debt-to-Asset Ratio (20%), Emergency Fund Coverage (20%),
          and Net Worth Trend (15%). Each component is scored 0-100, then combined using the weights above.
          The score updates automatically as your financial data changes.
        </p>
      </Card>
    </div>
  );
};

export default FinancialHealthPage;
