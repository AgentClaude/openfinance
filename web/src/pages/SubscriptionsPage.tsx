import React, { useState, useMemo } from 'react';
import {
  CreditCardIcon,
  FunnelIcon,
  ListBulletIcon,
  Squares2X2Icon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useSubscriptionTracker } from '@/hooks/useSubscriptionTracker';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { StatCard } from '@/components/shared';
import { SubscriptionListView, SubscriptionGridView, SavingsTab, PriceChangesTab } from '@/components/subscriptions';
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

export default SubscriptionsPage;
