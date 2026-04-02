import React, { useState, useMemo } from 'react';
import {
  CreditCardIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  LightBulbIcon,
  FunnelIcon,
  ListBulletIcon,
  Squares2X2Icon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import {
  useSubscriptionTracker,
  type TrackedSubscription,
  type PriceChange,
  type SavingsOpportunity,
} from '@/hooks/useSubscriptionTracker';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { StatCard } from '@/components/shared';
import clsx from 'clsx';
import { usePageTitle } from '@/hooks/usePageTitle';

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
    yearly: 'Yearly',
  };
  return labels[freq] || freq;
};

type ViewMode = 'list' | 'grid';
type SortBy = 'cost' | 'name' | 'next-due' | 'category';

const SubscriptionsPage: React.FC = () => {
  usePageTitle('Subscriptions');
  const { data, loading, error } = useSubscriptionTracker();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortBy, setSortBy] = useState<SortBy>('cost');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'savings' | 'changes'>('overview');

  const sortedSubscriptions = useMemo(() => {
    if (!data?.subscriptions) return [];
    let subs = [...data.subscriptions];

    if (filterCategory !== 'all') {
      subs = subs.filter(s => s.subCategory === filterCategory);
    }

    switch (sortBy) {
      case 'cost':
        return subs.sort((a, b) => b.monthlyCost - a.monthlyCost);
      case 'name':
        return subs.sort((a, b) => a.name.localeCompare(b.name));
      case 'next-due':
        return subs.sort((a, b) => (a.daysUntilDue ?? 999) - (b.daysUntilDue ?? 999));
      case 'category':
        return subs.sort((a, b) => a.subCategory.localeCompare(b.subCategory));
      default:
        return subs;
    }
  }, [data?.subscriptions, sortBy, filterCategory]);

  const pieData = useMemo(() => {
    if (!data?.categoryBreakdown) return [];
    return data.categoryBreakdown.map(c => ({
      name: c.label,
      value: c.monthlyTotal,
      color: CATEGORY_COLORS[c.category] || CATEGORY_COLORS.other,
    }));
  }, [data?.categoryBreakdown]);

  const barData = useMemo(() => {
    if (!data?.categoryBreakdown) return [];
    return data.categoryBreakdown.map(c => ({
      name: c.label,
      monthly: c.monthlyTotal,
      annual: c.annualTotal,
      fill: CATEGORY_COLORS[c.category] || CATEGORY_COLORS.other,
    }));
  }, [data?.categoryBreakdown]);

  if (loading && !data) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<ExclamationTriangleIcon className="h-12 w-12" />}
        title="Error loading subscriptions"
        description={error.message}
      />
    );
  }

  if (!data || data.subscriptions.length === 0) {
    return (
      <div>
        <PageHeader
          title="Subscriptions"
          subtitle="Track and manage your recurring subscriptions"
        />
        <EmptyState
          icon={<CreditCardIcon className="h-12 w-12" />}
          title="No subscriptions found"
          description="Your recurring expenses will appear here once detected. Add recurring items on the Recurring page to get started."
        />
      </div>
    );
  }

  const { summary, priceChanges, savingsOpportunities, costPerDay } = data;

  const tabs = [
    { id: 'overview' as const, label: 'Overview', count: data.subscriptions.length },
    { id: 'savings' as const, label: 'Savings', count: savingsOpportunities.length },
    { id: 'changes' as const, label: 'Price Changes', count: priceChanges.length },
  ];

  const uniqueCategories = [...new Set(data.subscriptions.map(s => s.subCategory))];

  return (
    <div>
      <PageHeader
        title="Subscriptions"
        subtitle={`${summary.subscriptionCount} active subscriptions · ${formatCurrency(summary.totalMonthly)}/mo · ${formatCurrency(summary.totalAnnual)}/yr`}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          label="Monthly Cost"
          value={formatCurrency(summary.totalMonthly)}
          valueClassName="text-red-600 dark:text-red-400"
          icon={<CreditCardIcon className="h-6 w-6" />}
        />
        <StatCard
          label="Annual Cost"
          value={formatCurrency(summary.totalAnnual)}
          valueClassName="text-red-600 dark:text-red-400"
        />
        <StatCard
          label="Daily Cost"
          value={formatCurrency(costPerDay)}
          valueClassName="text-gray-900 dark:text-gray-100"
        />
        <StatCard
          label="Avg per Subscription"
          value={formatCurrency(summary.averageMonthly)}
          valueClassName="text-gray-900 dark:text-gray-100"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              )}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={clsx(
                  'ml-2 rounded-full px-2 py-0.5 text-xs',
                  activeTab === tab.id
                    ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Category Donut */}
            <Card title="Cost by Category" className="p-4">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(label: string) => label}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3 mt-2 justify-center">
                {pieData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                    {entry.name}
                  </div>
                ))}
              </div>
            </Card>

            {/* Category Bar Chart */}
            <Card title="Monthly Cost by Category" className="p-4">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis type="number" tickFormatter={(v) => `$${v}`} fontSize={12} />
                    <YAxis type="category" dataKey="name" width={80} fontSize={12} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="monthly" radius={[0, 4, 4, 0]}>
                      {barData.map((entry, index) => (
                        <Cell key={`bar-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-4 w-4 text-gray-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="text-sm rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 py-1.5 pr-8"
              >
                <option value="all">All Categories</option>
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>
                    {CATEGORY_ICONS[cat] || '📦'} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="text-sm rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 py-1.5 pr-8"
            >
              <option value="cost">Sort by Cost</option>
              <option value="name">Sort by Name</option>
              <option value="next-due">Sort by Next Due</option>
              <option value="category">Sort by Category</option>
            </select>

            <div className="flex items-center rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden ml-auto">
              <button
                onClick={() => setViewMode('list')}
                className={clsx(
                  'p-1.5 transition-colors',
                  viewMode === 'list' ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400' : 'text-gray-400 hover:text-gray-600'
                )}
                aria-label="List view"
              >
                <ListBulletIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={clsx(
                  'p-1.5 transition-colors',
                  viewMode === 'grid' ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400' : 'text-gray-400 hover:text-gray-600'
                )}
                aria-label="Grid view"
              >
                <Squares2X2Icon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Subscription List/Grid */}
          {viewMode === 'list' ? (
            <SubscriptionListView subscriptions={sortedSubscriptions} />
          ) : (
            <SubscriptionGridView subscriptions={sortedSubscriptions} />
          )}
        </>
      )}

      {activeTab === 'savings' && (
        <SavingsTab opportunities={savingsOpportunities} totalMonthly={summary.totalMonthly} />
      )}

      {activeTab === 'changes' && (
        <PriceChangesTab changes={priceChanges} />
      )}
    </div>
  );
};

/* ────────────────────────────────────────── */
/* Subscription List View                     */
/* ────────────────────────────────────────── */
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

/* ────────────────────────────────────────── */
/* Subscription Grid View                     */
/* ────────────────────────────────────────── */
const SubscriptionGridView: React.FC<{ subscriptions: TrackedSubscription[] }> = ({ subscriptions }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

/* ────────────────────────────────────────── */
/* Savings Tab                                */
/* ────────────────────────────────────────── */
const SavingsTab: React.FC<{
  opportunities: SavingsOpportunity[];
  totalMonthly: number;
}> = ({ opportunities, totalMonthly }) => {
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
                opp.type === 'overlapping_services' ? 'bg-amber-100 dark:bg-amber-900/30' :
                opp.type === 'duplicate_category' ? 'bg-red-100 dark:bg-red-900/30' :
                opp.type === 'high_cost' ? 'bg-orange-100 dark:bg-orange-900/30' :
                'bg-blue-100 dark:bg-blue-900/30'
              )}>
                {opp.type === 'overlapping_services' ? '🔄' :
                 opp.type === 'duplicate_category' ? '♊' :
                 opp.type === 'high_cost' ? '💰' : '📅'}
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

/* ────────────────────────────────────────── */
/* Price Changes Tab                          */
/* ────────────────────────────────────────── */
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

export default SubscriptionsPage;
