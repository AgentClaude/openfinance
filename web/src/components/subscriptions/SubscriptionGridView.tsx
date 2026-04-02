import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import Card from '@/components/ui/Card';
import type { TrackedSubscription } from '@/hooks/useSubscriptionTracker';

const CATEGORY_COLORS: Record<string, string> = {
  streaming: '#E11D48',
  music: '#7C3AED',
  software: '#0EA5E9',
  gaming: '#10B981',
  news: '#F59E0B',
  fitness: '#EC4899',
  shopping: '#F97316',
  cloud: '#6366F1',
  utilities: '#14B8A6',
  food: '#EF4444',
  other: '#94A3B8',
};

const CATEGORY_ICONS: Record<string, string> = {
  streaming: '📺',
  music: '🎵',
  software: '💻',
  gaming: '🎮',
  news: '📰',
  fitness: '💪',
  shopping: '🛒',
  cloud: '☁️',
  utilities: '🔧',
  food: '🍕',
  other: '📦',
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

const formatFrequency = (freq: string) => {
  const labels: Record<string, string> = {
    weekly: 'Weekly',
    biweekly: 'Bi-weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    semi_annually: 'Semi-annually',
    yearly: 'Yearly',
  };
  return labels[freq] || freq.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

const SubscriptionGridView: React.FC<{ subscriptions: TrackedSubscription[] }> = ({ subscriptions }) => (
  <div data-testid="subscriptions-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {subscriptions.map((sub) => (
      <Card key={sub.id} className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl" role="img" aria-hidden="true">
              {CATEGORY_ICONS[sub.subCategory] || '📦'}
            </span>
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">{sub.name}</p>
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mt-0.5"
                style={{
                  backgroundColor: `${CATEGORY_COLORS[sub.subCategory] || CATEGORY_COLORS.other}20`,
                  color: CATEGORY_COLORS[sub.subCategory] || CATEGORY_COLORS.other,
                }}
              >
                {sub.subCategory.charAt(0).toUpperCase() + sub.subCategory.slice(1)}
              </span>
            </div>
          </div>
          {sub.hasPriceVariance && (
            <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" title="Price changed" />
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">Monthly</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {formatCurrency(sub.monthlyCost)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">Annual</span>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {formatCurrency(sub.annualCost)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">Frequency</span>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {formatFrequency(sub.frequency)}
            </span>
          </div>
          {sub.daysUntilDue !== null && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Next Due</span>
              <span className={clsx(
                'text-sm font-medium',
                sub.daysUntilDue <= 0 ? 'text-red-600' :
                sub.daysUntilDue <= 3 ? 'text-amber-600' : 'text-gray-600 dark:text-gray-300'
              )}>
                {sub.daysUntilDue <= 0 ? 'Overdue' :
                 sub.daysUntilDue === 1 ? 'Tomorrow' :
                 `${sub.daysUntilDue} days`}
              </span>
            </div>
          )}
        </div>

        {sub.accountName && (
          <p className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400">
            via {sub.accountName}
          </p>
        )}
      </Card>
    ))}
  </div>
);

export default SubscriptionGridView;
