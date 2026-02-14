import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { useBudget } from '@/hooks/useBudget';
import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';
import AmountDisplay from '@/components/ui/AmountDisplay';
import { format, startOfMonth } from 'date-fns';

const DashboardBudgetWidget: React.FC = () => {
  const currentMonth = format(startOfMonth(new Date()), 'yyyy-MM');
  const { loading, budgetItems, getTotalBudgeted, getTotalSpent, getBudgetProgress } = useBudget(currentMonth);

  if (loading) return null;

  const totalBudgeted = getTotalBudgeted();
  const totalSpent = getTotalSpent();
  const progress = getBudgetProgress();
  const remaining = totalBudgeted - totalSpent;

  if (budgetItems.length === 0) {
    return (
      <Card
        title="Budget"
        subtitle={format(new Date(), 'MMMM yyyy')}
        actions={
          <Link to="/budget" className="text-brand-700 hover:text-brand-800 text-sm font-medium flex items-center">
            Set up budget <ArrowRightIcon className="h-4 w-4 ml-1" />
          </Link>
        }
      >
        <p className="text-sm text-gray-500 dark:text-gray-400 py-4">
          No budget set for this month. Set up your budget to track spending.
        </p>
      </Card>
    );
  }

  const getColor = (): 'default' | 'warning' | 'danger' => {
    if (progress > 100) return 'danger';
    if (progress > 80) return 'warning';
    return 'default';
  };

  // Top 3 highest-spent categories
  const topCategories = [...budgetItems]
    .filter(i => i.budgeted > 0)
    .sort((a, b) => (b.spent / b.budgeted) - (a.spent / a.budgeted))
    .slice(0, 3);

  return (
    <Card
      title="Budget"
      subtitle={format(new Date(), 'MMMM yyyy')}
      actions={
        <Link to="/budget" className="text-brand-700 hover:text-brand-800 text-sm font-medium flex items-center">
          View budget <ArrowRightIcon className="h-4 w-4 ml-1" />
        </Link>
      }
    >
      <div className="space-y-4">
        {/* Main progress */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">
              <AmountDisplay amount={totalSpent} size="sm" colorize={false} className="inline font-medium" /> spent
            </span>
            <span className="text-gray-500 dark:text-gray-400">
              of <AmountDisplay amount={totalBudgeted} size="sm" colorize={false} className="inline" />
            </span>
          </div>
          <ProgressBar value={totalSpent} max={totalBudgeted || 1} color={getColor()} size="md" />
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {remaining >= 0 ? (
              <span className="text-green-600 font-medium">${remaining.toFixed(0)} remaining</span>
            ) : (
              <span className="text-red-600 font-medium">${Math.abs(remaining).toFixed(0)} over budget</span>
            )}
          </div>
        </div>

        {/* Top categories */}
        {topCategories.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-gray-100">
            {topCategories.map(item => {
              const pct = item.budgeted > 0 ? (item.spent / item.budgeted) * 100 : 0;
              return (
                <div key={item.id} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 dark:text-gray-400 w-24 truncate">{item.category?.name}</span>
                  <div className="flex-1">
                    <ProgressBar
                      value={item.spent}
                      max={item.budgeted || 1}
                      color={pct > 100 ? 'danger' : pct > 80 ? 'warning' : 'default'}
                      size="sm"
                      showPercentage={false}
                    />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 w-12 text-right">{Math.round(pct)}%</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
};

export default DashboardBudgetWidget;
