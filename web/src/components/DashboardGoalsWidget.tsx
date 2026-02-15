import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon, FlagIcon } from '@heroicons/react/24/outline';
import { useGetGoalsQuery } from '@/generated/graphql';
import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';
import AmountDisplay from '@/components/ui/AmountDisplay';

const DashboardGoalsWidget: React.FC = () => {
  const { data, loading } = useGetGoalsQuery({ variables: { activeOnly: true } });

  if (loading) return null;

  const goals = data?.goals || [];

  if (goals.length === 0) {
    return (
      <Card
        title="Goals"
        subtitle="Financial targets"
        actions={
          <Link to="/goals" className="text-brand-700 hover:text-brand-800 text-sm font-medium flex items-center">
            Create a goal <ArrowRightIcon className="h-4 w-4 ml-1" />
          </Link>
        }
      >
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <FlagIcon className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Set savings or debt payoff goals to track your progress.
          </p>
        </div>
      </Card>
    );
  }

  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalCurrent = goals.reduce((s, g) => s + g.currentAmount, 0);
  const overallProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

  // Show top 3 goals sorted by progress descending
  const topGoals = [...goals]
    .sort((a, b) => b.progressPercentage - a.progressPercentage)
    .slice(0, 3);

  const getColor = (pct: number, overdue: boolean): 'success' | 'warning' | 'danger' | 'default' => {
    if (overdue) return 'danger';
    if (pct >= 75) return 'success';
    if (pct >= 40) return 'default';
    return 'warning';
  };

  return (
    <Card
      title="Goals"
      subtitle={`${goals.length} active`}
      actions={
        <Link to="/goals" className="text-brand-700 hover:text-brand-800 text-sm font-medium flex items-center">
          View all <ArrowRightIcon className="h-4 w-4 ml-1" />
        </Link>
      }
    >
      {/* Overall progress */}
      <div className="mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600 dark:text-gray-400">Overall progress</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">{overallProgress.toFixed(0)}%</span>
        </div>
        <ProgressBar
          value={totalCurrent}
          max={totalTarget}
          color={overallProgress >= 75 ? 'success' : overallProgress >= 40 ? 'default' : 'warning'}
          size="md"
        />
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <AmountDisplay amount={totalCurrent} size="sm" />
          <span>of <AmountDisplay amount={totalTarget} size="sm" /></span>
        </div>
      </div>

      {/* Individual goals */}
      <div className="space-y-3">
        {topGoals.map((goal) => (
          <div key={goal.id}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate mr-2">
                {goal.name}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {goal.progressPercentage.toFixed(0)}%
              </span>
            </div>
            <ProgressBar
              value={goal.currentAmount}
              max={goal.targetAmount}
              color={getColor(goal.progressPercentage, goal.isOverdue)}
              size="sm"
            />
            {goal.monthlyTarget > 0 && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                <AmountDisplay amount={goal.monthlyTarget} size="sm" />/mo needed
              </div>
            )}
          </div>
        ))}
      </div>

      {goals.length > 3 && (
        <Link
          to="/goals"
          className="block text-center text-sm text-brand-700 hover:text-brand-800 mt-3 pt-2 border-t border-gray-100 dark:border-gray-700"
        >
          +{goals.length - 3} more goals
        </Link>
      )}
    </Card>
  );
};

export default DashboardGoalsWidget;
