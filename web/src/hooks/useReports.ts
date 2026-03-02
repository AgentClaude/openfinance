import { useQuery } from '@apollo/client';
import { GET_REPORTS } from '@/graphql/queries';

export interface MonthlySummary {
  month: string;
  income: number;
  expenses: number;
  cashFlow: number;
}

export interface SpendingByCategory {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface MonthlySpendingByCategory {
  month: string;
  categories: {
    categoryId: string;
    categoryName: string;
    categoryColor: string;
    amount: number;
  }[];
}

export interface TopMerchant {
  merchantName: string;
  amount: number;
  transactionCount: number;
}

export interface Reports {
  monthlySummary: MonthlySummary[];
  spendingByCategory: SpendingByCategory[];
  monthlySpendingByCategory: MonthlySpendingByCategory[];
  topMerchants: TopMerchant[];
}

interface UseReportsOptions {
  months?: number;
  dateFrom?: string;
  dateTo?: string;
  accountIds?: string[];
  categoryIds?: string[];
}

export const useReports = (options: UseReportsOptions = {}) => {
  const { months = 6, dateFrom, dateTo, accountIds, categoryIds } = options;

  const { data, loading, error, refetch } = useQuery(GET_REPORTS, {
    variables: { months, dateFrom, dateTo, accountIds, categoryIds },
  });

  const reports: Reports | null = data?.reports || null;

  const getTotalIncome = () =>
    reports?.monthlySummary.reduce((sum, m) => sum + m.income, 0) ?? 0;

  const getTotalExpenses = () =>
    reports?.monthlySummary.reduce((sum, m) => sum + m.expenses, 0) ?? 0;

  const getAverageMonthlyExpenses = () => {
    if (!reports?.monthlySummary.length) return 0;
    return getTotalExpenses() / reports.monthlySummary.length;
  };

  return {
    reports,
    loading,
    error,
    refetch,
    getTotalIncome,
    getTotalExpenses,
    getAverageMonthlyExpenses,
  };
};
