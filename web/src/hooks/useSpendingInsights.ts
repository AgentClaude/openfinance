import { useQuery } from '@apollo/client';
import { GET_SPENDING_INSIGHTS } from '@/graphql/queries';

export interface SpendingInsight {
  type: string;
  severity: 'critical' | 'warning' | 'info' | 'positive';
  title: string;
  message: string;
  amount: number | null;
  categoryId: string | null;
  categoryName: string | null;
  icon: string | null;
  metadata: Record<string, unknown>;
}

export interface SpendingInsightsResult {
  count: number;
  generatedAt: string;
  insights: SpendingInsight[];
}

export function useSpendingInsights() {
  const { data, loading, error, refetch } = useQuery(GET_SPENDING_INSIGHTS, {
    pollInterval: 10 * 60 * 1000, // Refresh every 10 minutes
  });

  const result: SpendingInsightsResult = data?.spendingInsights || {
    count: 0,
    generatedAt: new Date().toISOString(),
    insights: [],
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 dark:text-red-400';
      case 'warning': return 'text-amber-600 dark:text-amber-400';
      case 'info': return 'text-blue-600 dark:text-blue-400';
      case 'positive': return 'text-emerald-600 dark:text-emerald-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning': return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
      case 'info': return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'positive': return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
      default: return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🔴';
      case 'warning': return '🟡';
      case 'info': return '🔵';
      case 'positive': return '🟢';
      default: return '⚪';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'critical': return 'Critical';
      case 'warning': return 'Warning';
      case 'info': return 'Info';
      case 'positive': return 'Good News';
      default: return severity;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'spending_anomaly': return 'Spending Anomaly';
      case 'budget_at_risk': return 'Budget Alert';
      case 'budget_on_track': return 'Budget On Track';
      case 'subscription_change': return 'Subscription Change';
      case 'merchant_spike': return 'Merchant Spike';
      case 'savings_opportunity': return 'Savings Opportunity';
      case 'income_change': return 'Income Change';
      case 'uncategorized_alert': return 'Needs Attention';
      default: return type;
    }
  };

  const criticalCount = result.insights.filter(i => i.severity === 'critical').length;
  const warningCount = result.insights.filter(i => i.severity === 'warning').length;

  return {
    insights: result.insights,
    count: result.count,
    generatedAt: result.generatedAt,
    criticalCount,
    warningCount,
    loading,
    error,
    refetch,
    getSeverityColor,
    getSeverityBg,
    getSeverityIcon,
    getSeverityLabel,
    getTypeLabel,
  };
}
