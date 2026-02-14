import React from 'react';
import { useQuery } from '@apollo/client';
import { GET_BALANCE_ADJUSTMENTS } from '@/graphql/queries';
import { BalanceAdjustment } from '@/types';
import Card from '@/components/ui/Card';
import AmountDisplay from '@/components/ui/AmountDisplay';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { format, parseISO } from 'date-fns';

interface Props {
  accountId: string;
}

const BalanceHistory: React.FC<Props> = ({ accountId }) => {
  const { data, loading } = useQuery(GET_BALANCE_ADJUSTMENTS, {
    variables: { accountId },
  });

  const adjustments: BalanceAdjustment[] = data?.balanceAdjustments || [];

  if (loading) return <LoadingSpinner />;
  if (adjustments.length === 0) return null;

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Balance Adjustments
      </h3>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {adjustments.map((adj) => (
          <div key={adj.id} className="py-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {format(parseISO(adj.adjustedAt), 'MMM d, yyyy')}
              </div>
              {adj.notes && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {adj.notes}
                </div>
              )}
              {adj.createdByName && (
                <div className="text-xs text-gray-400 dark:text-gray-500">
                  by {adj.createdByName}
                </div>
              )}
            </div>
            <AmountDisplay amount={adj.amount} size="sm" colorize />
          </div>
        ))}
      </div>
    </Card>
  );
};

export default BalanceHistory;
