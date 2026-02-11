import { useQuery } from '@apollo/client';
import { GET_DASHBOARD_SUMMARY } from '@/graphql/queries';
import { DashboardSummary } from '@/types';

export const useDashboard = () => {
  const { data, loading, error, refetch } = useQuery(GET_DASHBOARD_SUMMARY, {
    // Refetch every 5 minutes to keep dashboard data fresh
    pollInterval: 5 * 60 * 1000,
  });

  const summary: DashboardSummary = data?.dashboardSummary || {
    netWorth: 0,
    netWorthChange: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    cashFlow: 0,
    spendingByCategory: [],
    recentTransactions: [],
    accountBalances: [],
    needsReviewCount: 0,
  };

  const getNetWorthTrend = () => {
    if (summary.netWorthChange > 0) return 'up';
    if (summary.netWorthChange < 0) return 'down';
    return 'flat';
  };

  const getNetWorthTrendPercentage = () => {
    if (summary.netWorth === 0) return 0;
    return (summary.netWorthChange / (summary.netWorth - summary.netWorthChange)) * 100;
  };

  const getCashFlowTrend = () => {
    if (summary.cashFlow > 0) return 'positive';
    if (summary.cashFlow < 0) return 'negative';
    return 'neutral';
  };

  const getTopSpendingCategories = (limit = 5) => {
    return summary.spendingByCategory
      .slice()
      .sort((a, b) => b.amount - a.amount)
      .slice(0, limit);
  };

  const getTotalSpending = () => {
    return summary.spendingByCategory.reduce((total, category) => total + category.amount, 0);
  };

  const getSpendingBreakdown = () => {
    const total = getTotalSpending();
    if (total === 0) return [];

    return summary.spendingByCategory.map(category => ({
      ...category,
      percentage: (category.amount / total) * 100,
    }));
  };

  return {
    summary,
    loading,
    error,
    refetch,
    getNetWorthTrend,
    getNetWorthTrendPercentage,
    getCashFlowTrend,
    getTopSpendingCategories,
    getTotalSpending,
    getSpendingBreakdown,
  };
};