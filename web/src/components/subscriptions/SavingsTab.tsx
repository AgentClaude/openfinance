import React from 'react';
import { LightBulbIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import type { SavingsOpportunity } from '@/hooks/useSubscriptionTracker';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

interface SavingsTabProps {
  opportunities: SavingsOpportunity[];
  totalMonthly: number;
}

const SavingsTab: React.FC<SavingsTabProps> = ({ opportunities, totalMonthly }) => {
  const totalPotentialSavings = opportunities.reduce((sum, o) => sum + o.potentialSavingsMonthly, 0);

  if (opportunities.length === 0) {
    return (
      <EmptyState
        icon={<LightBulbIcon className="h-12 w-12" />}
        title="No savings opportunities found"
        description="Your subscription setup looks good! We'll alert you when we spot potential savings."
      />
    );
  }

  return (
    <div>
      {totalPotentialSavings > 0 && (
        <Card className="p-6 mb-6 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/50 p-3">
              <LightBulbIcon className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-emerald-700 dark:text-emerald-300">Potential Monthly Savings</p>
              <p className="text-3xl font-bold text-emerald-800 dark:text-emerald-200">
                {formatCurrency(totalPotentialSavings)}
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                That&apos;s {formatCurrency(totalPotentialSavings * 12)}/year ({((totalPotentialSavings / totalMonthly) * 100).toFixed(0)}% of total)
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {opportunities.map((opp, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-start gap-4">
              <div className={clsx(
                'rounded-lg p-2 flex-shrink-0',
                opp.opportunityType === 'overlapping_services' ? 'bg-amber-100 dark:bg-amber-900/30' :
                opp.opportunityType === 'duplicate_category' ? 'bg-red-100 dark:bg-red-900/30' :
                opp.opportunityType === 'high_cost' ? 'bg-orange-100 dark:bg-orange-900/30' :
                'bg-blue-100 dark:bg-blue-900/30'
              )}>
                {opp.opportunityType === 'overlapping_services' ? '🔄' :
                 opp.opportunityType === 'duplicate_category' ? '♊' :
                 opp.opportunityType === 'high_cost' ? '💰' : '📅'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{opp.title}</h3>
                  {opp.potentialSavingsMonthly > 0 && (
                    <Badge variant="success" className="text-xs">
                      Save {formatCurrency(opp.potentialSavingsMonthly)}/mo
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{opp.description}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {opp.affectedSubscriptions.map((name) => (
                    <span
                      key={name}
                      className="inline-flex items-center rounded-md bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs text-gray-600 dark:text-gray-300"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SavingsTab;
