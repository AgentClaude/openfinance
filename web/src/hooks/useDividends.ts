import { useQuery } from '@apollo/client';
import { GET_DIVIDEND_SUMMARY, GET_INVESTMENT_INCOME_SUMMARY, GET_INVESTMENT_TRANSACTIONS } from '@/graphql/queries';
import { DividendSummary, InvestmentIncomeSummary, InvestmentTransaction } from '@/types';

export const useDividends = (year?: number, accountId?: string) => {
  const variables: Record<string, unknown> = {};
  if (year) variables.year = year;
  if (accountId) variables.accountId = accountId;

  const {
    data: summaryData,
    loading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useQuery(GET_DIVIDEND_SUMMARY, { variables });

  const {
    data: incomeData,
    loading: incomeLoading,
    error: incomeError,
    refetch: refetchIncome,
  } = useQuery(GET_INVESTMENT_INCOME_SUMMARY, { variables });

  const {
    data: txnData,
    loading: txnLoading,
    error: txnError,
    refetch: refetchTxns,
  } = useQuery(GET_INVESTMENT_TRANSACTIONS, {
    variables: { ...variables, transactionType: 'dividend', limit: 50 },
  });

  const dividendSummary: DividendSummary = summaryData?.dividendSummary || {
    totalDividends: 0,
    bySecurity: [],
    byMonth: [],
    transactionCount: 0,
  };

  const incomeSummary: InvestmentIncomeSummary = incomeData?.investmentIncomeSummary || {
    totalIncome: 0,
    dividends: 0,
    interest: 0,
    capitalGains: 0,
  };

  const transactions: InvestmentTransaction[] = txnData?.investmentTransactions || [];

  return {
    dividendSummary,
    incomeSummary,
    transactions,
    loading: summaryLoading || incomeLoading || txnLoading,
    error: summaryError || incomeError || txnError,
    refetch: () => {
      refetchSummary();
      refetchIncome();
      refetchTxns();
    },
  };
};
