import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowRightIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useDashboard } from '@/hooks/useDashboard';
import Card from '@/components/ui/Card';
import AmountDisplay from '@/components/ui/AmountDisplay';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import { StatCard } from '@/components/shared';
import DashboardBudgetWidget from '@/components/DashboardBudgetWidget';
import DashboardBillsWidget from '@/components/DashboardBillsWidget';
import { format } from 'date-fns';
import clsx from 'clsx';

const COLORS = [
  '#0D9488', '#F59E0B', '#7C3AED', '#E11D48', '#0EA5E9',
  '#10B981', '#F97316', '#6366F1', '#84CC16', '#EC4899'
];

const DashboardPage: React.FC = () => {
  const { summary, loading, getNetWorthTrend, getNetWorthTrendPercentage } = useDashboard();

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const netWorthTrend = getNetWorthTrend();
  const netWorthTrendPercentage = Math.abs(getNetWorthTrendPercentage());

  const TrendIcon = netWorthTrend === 'up' ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;
  const trendColor = netWorthTrend === 'up' ? 'text-green-600' : netWorthTrend === 'down' ? 'text-red-600' : 'text-gray-600 dark:text-gray-400';

  const pieChartData = summary.spendingByCategory.map((category, index) => ({
    name: category.categoryName,
    value: Math.abs(category.amount),
    color: COLORS[index % COLORS.length],
  }));

  return (
    <div>
      <PageHeader 
        title="Dashboard" 
        subtitle="Your financial overview" 
        actions={
          summary.needsReviewCount > 0 && (
            <Link to="/transactions?needsReview=true">
              <Badge variant="warning" className="flex items-center gap-1">
                <EyeIcon className="h-4 w-4" />
                {summary.needsReviewCount} needs review
              </Badge>
            </Link>
          )
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Net Worth */}
        <Card title="Net Worth" className="bg-gradient-to-br from-brand-700 to-brand-900 text-white border-0">
          <div className="flex items-center justify-between">
            <div>
              <AmountDisplay 
                amount={summary.netWorth} 
                size="xl" 
                colorize={false} 
                className="text-white" 
              />
              {summary.netWorthChange !== 0 && (
                <div className="flex items-center mt-2 text-white/80">
                  <TrendIcon className={clsx('h-4 w-4 mr-1', trendColor)} />
                  <span className="text-sm font-medium">
                    {netWorthTrendPercentage.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Monthly Income */}
        <StatCard
          label="Monthly Income"
          value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(summary.monthlyIncome)}
          valueClassName="text-green-600"
        />

        {/* Monthly Expenses */}
        <StatCard
          label="Monthly Expenses"
          value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(summary.monthlyExpenses)}
          valueClassName="text-red-600"
        />

        {/* Cash Flow */}
        <StatCard
          label="Cash Flow"
          value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(summary.cashFlow)}
          valueClassName={summary.cashFlow >= 0 ? 'text-green-600' : 'text-red-600'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Spending by Category Chart */}
        <Card 
          title="Spending by Category" 
          subtitle="Current month breakdown"
          actions={
            <Link to="/transactions" className="text-brand-700 hover:text-brand-800 text-sm font-medium">
              View all
            </Link>
          }
        >
          {pieChartData.length > 0 ? (
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="w-full max-w-xs" style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={110}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [
                        new Intl.NumberFormat('en-US', { 
                          style: 'currency', 
                          currency: 'USD' 
                        }).format(value), 
                        'Amount'
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-1.5">
                {pieChartData.slice(0, 8).map((entry, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-gray-700 dark:text-gray-300 truncate max-w-[120px]">{entry.name}</span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(entry.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              title="No spending data"
              description="Start adding transactions to see your spending breakdown."
              className="py-8"
            />
          )}
        </Card>

        {/* Account Balances */}
        <Card 
          title="Account Balances" 
          subtitle="Current balances"
          actions={
            <Link to="/accounts" className="text-brand-700 hover:text-brand-800 text-sm font-medium">
              Manage accounts
            </Link>
          }
        >
          {summary.accountBalances.length > 0 ? (
            <div className="space-y-4">
              {summary.accountBalances.slice(0, 6).map((account) => (
                <div key={account.accountId} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{account.accountName}</div>
                    <Badge variant="secondary" size="sm">
                      {account.accountType.toLowerCase().replace('_', ' ')}
                    </Badge>
                  </div>
                  <AmountDisplay amount={account.balance} size="sm" />
                </div>
              ))}
              {summary.accountBalances.length > 6 && (
                <Link 
                  to="/accounts" 
                  className="flex items-center justify-center py-2 text-sm text-brand-700 hover:text-brand-800"
                >
                  View all {summary.accountBalances.length} accounts
                  <ArrowRightIcon className="h-4 w-4 ml-1" />
                </Link>
              )}
            </div>
          ) : (
            <EmptyState
              title="No accounts"
              description="Add your first account to get started."
              actionLabel="Add Account"
              onAction={() => window.location.href = '/accounts'}
              className="py-8"
            />
          )}
        </Card>
      </div>

      {/* Budget & Bills Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <DashboardBudgetWidget />
        <DashboardBillsWidget />
      </div>

      {/* Recent Transactions */}
      <Card 
        title="Recent Transactions" 
        subtitle="Latest activity"
        actions={
          <Link to="/transactions" className="text-brand-700 hover:text-brand-800 text-sm font-medium">
            View all
          </Link>
        }
      >
        {summary.recentTransactions.length > 0 ? (
          <div className="space-y-4">
            {summary.recentTransactions.slice(0, 10).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {transaction.description}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {transaction.account.name}
                        {transaction.account.mask && ` •••${transaction.account.mask}`}
                        {transaction.pending && (
                          <Badge variant="warning" size="sm" className="ml-2">
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <AmountDisplay amount={transaction.amount} size="sm" />
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date(transaction.date), 'MMM d')}
                      </div>
                    </div>
                  </div>
                  {transaction.category && (
                    <Badge 
                      variant="secondary" 
                      size="sm" 
                      className="mt-1"
                      style={{ backgroundColor: transaction.category.color + '20', color: transaction.category.color }}
                    >
                      {transaction.category.name}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No transactions"
            description="Your recent transactions will appear here once you add some accounts."
            className="py-8"
          />
        )}
      </Card>
    </div>
  );
};

export default DashboardPage;