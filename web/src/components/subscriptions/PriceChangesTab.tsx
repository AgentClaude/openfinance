import React from 'react';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import type { PriceChange } from '@/hooks/useSubscriptionTracker';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

const PriceChangesTab: React.FC<{ changes: PriceChange[] }> = ({ changes }) => {
  if (changes.length === 0) {
    return (
      <EmptyState
        icon={<ArrowTrendingUpIcon className="h-12 w-12" />}
        title="No price changes detected"
        description="We'll track when your subscription prices change and notify you here."
      />
    );
  }

  return (
    <div className="space-y-3">
      {changes.map((change) => (
        <Card key={change.id} className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {change.direction === 'increased' ? (
                <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-2">
                  <ArrowTrendingUpIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
              ) : (
                <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-2">
                  <ArrowTrendingDownIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{change.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatCurrency(change.previousAmount)} → {formatCurrency(change.currentAmount)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={clsx(
                'text-sm font-semibold',
                change.direction === 'increased' ? 'text-red-600' : 'text-green-600'
              )}>
                {change.direction === 'increased' ? '+' : ''}{formatCurrency(change.changeAmount)}
              </p>
              <p className="text-xs text-gray-500">
                {change.direction === 'increased' ? '+' : ''}{change.changePercentage}%
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default PriceChangesTab;
