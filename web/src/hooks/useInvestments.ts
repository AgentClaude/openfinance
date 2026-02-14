import { useQuery } from '@apollo/client';
import { GET_HOLDINGS, GET_PORTFOLIO_SUMMARY } from '@/graphql/queries';
import { Holding, PortfolioSummary } from '@/types';

export const useInvestments = (accountId?: string) => {
  const variables = accountId ? { accountId } : {};

  const {
    data: holdingsData,
    loading: holdingsLoading,
    error: holdingsError,
    refetch: refetchHoldings,
  } = useQuery(GET_HOLDINGS, { variables });

  const {
    data: summaryData,
    loading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useQuery(GET_PORTFOLIO_SUMMARY, { variables });

  const holdings: Holding[] = holdingsData?.holdings || [];
  const summary: PortfolioSummary = summaryData?.portfolioSummary || {
    totalValue: 0,
    totalCostBasis: 0,
    totalGainLoss: 0,
    totalGainLossPercentage: 0,
    totalHoldingsCount: 0,
    allocations: [],
  };

  return {
    holdings,
    summary,
    loading: holdingsLoading || summaryLoading,
    error: holdingsError || summaryError,
    refetch: () => {
      refetchHoldings();
      refetchSummary();
    },
  };
};
