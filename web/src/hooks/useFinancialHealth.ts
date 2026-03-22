import { useQuery } from '@apollo/client';
import { GET_FINANCIAL_HEALTH } from '@/graphql/queries';
import { FinancialHealth } from '@/types';

export function useFinancialHealth() {
  const { data, loading, error, refetch } = useQuery(GET_FINANCIAL_HEALTH, {
    pollInterval: 10 * 60 * 1000, // Refresh every 10 minutes
  });

  const health: FinancialHealth = data?.financialHealth || {
    score: 0,
    grade: 'F',
    components: [],
    recommendations: [],
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreRingColor = (score: number): string => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  };

  const getStatusBadgeVariant = (status: string): 'success' | 'warning' | 'danger' | 'default' => {
    switch (status) {
      case 'excellent': return 'success';
      case 'good': return 'success';
      case 'needs_work': return 'warning';
      case 'critical': return 'danger';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'excellent': return 'Excellent';
      case 'good': return 'Good';
      case 'needs_work': return 'Needs Work';
      case 'critical': return 'Critical';
      case 'no_data': return 'No Data';
      default: return status;
    }
  };

  return {
    health,
    loading,
    error,
    refetch,
    getScoreColor,
    getScoreRingColor,
    getStatusBadgeVariant,
    getStatusLabel,
  };
}
