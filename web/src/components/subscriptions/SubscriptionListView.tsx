import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
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

const SubscriptionListView: React.FC<{ subscriptions: TrackedSubscription[] }> = ({ subscriptions }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
      <thead className="bg-gray-50 dark:bg-gray-900/50">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Service</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Category</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Frequency</th>
          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cost</th>
          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Annual</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Next Due</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
        {subscriptions.map((sub) => (
          <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-lg" role="img" aria-hidden="true">
                  {CATEGORY_ICONS[sub.subCategory] || '📦'}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{sub.name}</p>
                  {sub.accountName && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{sub.accountName}</p>
                  )}
                </div>
                {sub.hasPriceVariance && (
                  <ExclamationTriangleIcon className="h-4 w-4 text-amber-500 flex-shrink-0" title="Price changed" />
                )}
              </div>
            </td>
            <td className="px-4 py-3 hidden sm:table-cell">
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: `${CATEGORY_COLORS[sub.subCategory] || CATEGORY_COLORS.other}20`,
                  color: CATEGORY_COLORS[sub.subCategory] || CATEGORY_COLORS.other,
                }}
              >
                {sub.subCategory.charAt(0).toUpperCase() + sub.subCategory.slice(1)}
              </span>
            </td>
            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 hidden md:table-cell">
              {formatFrequency(sub.frequency)}
            </td>
            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 text-right">
              {formatCurrency(sub.monthlyCost)}<span className="text-xs text-gray-400">/mo</span>
            </td>
            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 text-right hidden lg:table-cell">
              {formatCurrency(sub.annualCost)}
            </td>
            <td className="px-4 py-3 text-sm hidden md:table-cell">
              {sub.daysUntilDue !== null ? (
                <span className={clsx(
                  sub.daysUntilDue <= 0 ? 'text-red-600 font-medium' :
                  sub.daysUntilDue <= 3 ? 'text-amber-600' : 'text-gray-600 dark:text-gray-400'
                )}>
                  {sub.daysUntilDue <= 0 ? 'Overdue' :
                   sub.daysUntilDue === 1 ? 'Tomorrow' :
                   `${sub.daysUntilDue} days`}
                </span>
              ) : (
                <span className="text-gray-400">—</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default SubscriptionListView;
