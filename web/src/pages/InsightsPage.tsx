import React, { useState } from 'react';
import { LightBulbIcon, ArrowPathIcon, FunnelIcon } from '@heroicons/react/24/outline';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useSpendingInsights, SpendingInsight } from '@/hooks/useSpendingInsights';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import clsx from 'clsx';

type SeverityFilter = 'all' | 'critical' | 'warning' | 'info' | 'positive';

const InsightCard: React.FC<{
  insight: SpendingInsight;
  getSeverityBg: (s: string) => string;
  getSeverityColor: (s: string) => string;
  getSeverityIcon: (s: string) => string;
  getTypeLabel: (t: string) => string;
}> = ({ insight, getSeverityBg, getSeverityColor, getSeverityIcon, getTypeLabel }) => {
  return (
    <div
      className={clsx(
        'rounded-lg border p-4 transition-all hover:shadow-md',
        getSeverityBg(insight.severity)
      )}
      data-testid={`insight-${insight.type}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl mt-0.5 flex-shrink-0" role="img" aria-label={insight.severity}>
          {getSeverityIcon(insight.severity)}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className={clsx('font-semibold text-sm', getSeverityColor(insight.severity))}>
              {insight.title}
            </h3>
            <Badge variant={
              insight.severity === 'critical' ? 'danger' :
              insight.severity === 'warning' ? 'warning' :
              insight.severity === 'positive' ? 'success' : 'default'
            }>
              {getTypeLabel(insight.type)}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            {insight.message}
          </p>
          {insight.amount !== null && (
            <div className="mt-2 flex items-center gap-1">
              <span className={clsx(
                'text-sm font-semibold',
                insight.severity === 'positive' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-200'
              )}>
                {insight.severity === 'positive' ? '+' : ''}
                ${Math.abs(insight.amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
              {insight.categoryName && (
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                  • {insight.categoryName}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SeveritySummary: React.FC<{
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  positiveCount: number;
}> = ({ criticalCount, warningCount, infoCount, positiveCount }) => (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
    <Card className="p-3 text-center">
      <div className="text-2xl font-bold text-red-600 dark:text-red-400">{criticalCount}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Critical</div>
    </Card>
    <Card className="p-3 text-center">
      <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{warningCount}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Warnings</div>
    </Card>
    <Card className="p-3 text-center">
      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{infoCount}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Info</div>
    </Card>
    <Card className="p-3 text-center">
      <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{positiveCount}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Good News</div>
    </Card>
  </div>
);

const InsightsPage: React.FC = () => {
  const {
    insights,
    count,
    loading,
    error,
    refetch,
    getSeverityBg,
    getSeverityColor,
    getSeverityIcon,
    getTypeLabel,
  } = useSpendingInsights();

  const [filter, setFilter] = useState<SeverityFilter>('all');

  const filteredInsights = filter === 'all'
    ? insights
    : insights.filter(i => i.severity === filter);

  const criticalCount = insights.filter(i => i.severity === 'critical').length;
  const warningCount = insights.filter(i => i.severity === 'warning').length;
  const infoCount = insights.filter(i => i.severity === 'info').length;
  const positiveCount = insights.filter(i => i.severity === 'positive').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <PageHeader
          title="Spending Insights"
          subtitle="Something went wrong loading your insights"
        />
      </div>
    );
  }

  const filterButtons: { label: string; value: SeverityFilter; count: number }[] = [
    { label: 'All', value: 'all', count },
    { label: '🔴 Critical', value: 'critical', count: criticalCount },
    { label: '🟡 Warnings', value: 'warning', count: warningCount },
    { label: '🔵 Info', value: 'info', count: infoCount },
    { label: '🟢 Good', value: 'positive', count: positiveCount },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Spending Insights"
          subtitle="Smart analysis of your spending patterns, budgets, and subscriptions"
        />
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-sm transition-all"
          title="Refresh insights"
        >
          <ArrowPathIcon className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <SeveritySummary
        criticalCount={criticalCount}
        warningCount={warningCount}
        infoCount={infoCount}
        positiveCount={positiveCount}
      />

      {/* Filter bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <FunnelIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
        {filterButtons.map(fb => (
          <button
            key={fb.value}
            onClick={() => setFilter(fb.value)}
            className={clsx(
              'px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors',
              filter === fb.value
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
          >
            {fb.label} ({fb.count})
          </button>
        ))}
      </div>

      {/* Insights list */}
      {filteredInsights.length === 0 ? (
        <EmptyState
          icon={<LightBulbIcon className="h-12 w-12" />}
          title={count === 0 ? 'No insights yet' : 'No matching insights'}
          description={
            count === 0
              ? 'Keep tracking your transactions — insights will appear as patterns emerge.'
              : 'Try a different filter to see other insights.'
          }
        />
      ) : (
        <div className="space-y-3" data-testid="insights-list">
          {filteredInsights.map((insight, idx) => (
            <InsightCard
              key={`${insight.type}-${insight.categoryId || idx}`}
              insight={insight}
              getSeverityBg={getSeverityBg}
              getSeverityColor={getSeverityColor}
              getSeverityIcon={getSeverityIcon}
              getTypeLabel={getTypeLabel}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default InsightsPage;
