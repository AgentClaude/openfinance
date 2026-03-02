import { useQuery } from '@apollo/client';
import { GET_HOLDINGS, GET_PORTFOLIO_SUMMARY, GET_PORTFOLIO_HISTORY } from '@/graphql/queries';
import { Holding, PortfolioSummary } from '@/types';

export interface PortfolioHistoryPoint {
  date: string;
  totalValue: number;
  totalCostBasis: number;
  gainLoss: number;
}

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

  const {
    data: historyData,
    loading: historyLoading,
    refetch: refetchHistory,
  } = useQuery(GET_PORTFOLIO_HISTORY, { variables: { ...variables, months: 12 } });

  const holdings: Holding[] = holdingsData?.holdings || [];
  const summary: PortfolioSummary = summaryData?.portfolioSummary || {
    totalValue: 0,
    totalCostBasis: 0,
    totalGainLoss: 0,
    totalGainLossPercentage: 0,
    totalHoldingsCount: 0,
    allocations: [],
  };

  const history: PortfolioHistoryPoint[] = historyData?.portfolioHistory || [];

  return {
    holdings,
    summary,
    history,
    loading: holdingsLoading || summaryLoading || historyLoading,
    error: holdingsError || summaryError,
    refetch: () => {
      refetchHoldings();
      refetchSummary();
      refetchHistory();
    },
  };
};
