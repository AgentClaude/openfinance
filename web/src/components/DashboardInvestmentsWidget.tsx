import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { ArrowRightIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, ChartBarSquareIcon } from '@heroicons/react/24/outline';
import { GET_PORTFOLIO_SUMMARY } from '@/graphql/queries';
import Card from '@/components/ui/Card';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const formatPercent = (value: number) =>
  `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;

const DashboardInvestmentsWidget: React.FC = () => {
  const { data, loading } = useQuery(GET_PORTFOLIO_SUMMARY);

  if (loading) return null;

  const summary = data?.portfolioSummary;
  if (!summary || summary.totalHoldingsCount === 0) {
    return (
      <Card
        title="Investments"
        subtitle="Portfolio overview"
        actions={
          <Link to="/investments" className="text-brand-700 hover:text-brand-800 text-sm font-medium flex items-center">
            View investments <ArrowRightIcon className="h-4 w-4 ml-1" />
          </Link>
        }
      >
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <ChartBarSquareIcon className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Connect a brokerage account to track investments.
          </p>
        </div>
      </Card>
    );
  }

  const isPositive = summary.totalGainLoss >= 0;
  const topHoldings = (summary.allocations || []).slice(0, 5);

  return (
    <Card
      title="Investments"
      subtitle="Portfolio overview"
      actions={
        <Link to="/investments" className="text-brand-700 hover:text-brand-800 text-sm font-medium flex items-center">
          Details <ArrowRightIcon className="h-4 w-4 ml-1" />
        </Link>
      }
    >
      <div className="space-y-4">
        {/* Summary */}
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(summary.totalValue)}
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? <ArrowTrendingUpIcon className="h-4 w-4" /> : <ArrowTrendingDownIcon className="h-4 w-4" />}
              {formatCurrency(Math.abs(summary.totalGainLoss))} ({formatPercent(summary.totalGainLossPercentage)})
            </div>
          </div>
          <div className="text-right text-sm text-gray-500 dark:text-gray-400">
            {summary.totalHoldingsCount} holding{summary.totalHoldingsCount !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Top Holdings */}
        <div className="space-y-2">
          {topHoldings.map((h: { symbol: string; securityName: string; value: number; percentage: number }) => (
            <div key={h.symbol} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-medium text-gray-900 dark:text-gray-100">{h.symbol}</span>
                <span className="text-gray-500 dark:text-gray-400 truncate">{h.securityName}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-gray-500 dark:text-gray-400 tabular-nums">{h.percentage.toFixed(1)}%</span>
                <span className="font-medium text-gray-900 dark:text-gray-100 tabular-nums">{formatCurrency(h.value)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default DashboardInvestmentsWidget;
