import { useQuery } from '@apollo/client';
import { GET_ANNUAL_SUMMARY } from '@/graphql/queries';

export interface AnnualIncome {
  total: number;
  monthlyAverage: number;
}

export interface AnnualSpending {
  total: number;
  monthlyAverage: number;
  dailyAverage: number;
}

export interface AnnualSavings {
  total: number;
  rate: number;
}

export interface NetWorthChange {
  startOfYear: number;
  endOfPeriod: number;
  change: number;
  changePercentage: number;
}

export interface MonthlyTrend {
  month: string;
  label: string;
  income: number;
  expenses: number;
  savings: number;
}

export interface CategorySpending {
  categoryId: string;
  categoryName: string;
  categoryIcon: string | null;
  categoryColor: string | null;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface MerchantSpending {
  merchantName: string;
  amount: number;
  transactionCount: number;
}

export interface BudgetPerformance {
  monthsOnBudget: number;
  monthsOverBudget: number;
  totalMonths: number;
}

export interface TransactionHighlight {
  amount: number;
  description: string;
  date: string;
}

export interface MerchantHighlight {
  name: string;
  visitCount: number;
}

export interface AnnualHighlights {
  biggestExpense: TransactionHighlight | null;
  biggestIncome: TransactionHighlight | null;
  mostFrequentMerchant: MerchantHighlight | null;
  biggestSpendingMonth: MonthlyTrend | null;
  mostFrugalMonth: MonthlyTrend | null;
  goalsAchieved: number;
}

export interface AnnualSummary {
  year: number;
  income: AnnualIncome;
  spending: AnnualSpending;
  savings: AnnualSavings;
  netWorthChange: NetWorthChange;
  monthlyTrends: MonthlyTrend[];
  topCategories: CategorySpending[];
  topMerchants: MerchantSpending[];
  budgetPerformance: BudgetPerformance;
  highlights: AnnualHighlights;
  transactionCount: number;
  daysTracked: number;
}

export function useAnnualSummary(year?: number) {
  const { data, loading, error, refetch } = useQuery(GET_ANNUAL_SUMMARY, {
    variables: { year },
    fetchPolicy: 'cache-and-network',
  });

  const summary: AnnualSummary | null = data?.annualSummary || null;

  return {
    summary,
    loading,
    error,
    refetch,
  };
}
