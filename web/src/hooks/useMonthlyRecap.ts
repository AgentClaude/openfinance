import { useQuery } from '@apollo/client';
import { GET_MONTHLY_RECAP } from '@/graphql/queries';

export interface RecapIncomeSource {
  name: string;
  amount: number;
  count: number;
}

export interface RecapIncome {
  total: number;
  previousMonth: number;
  change: number;
  changePercentage: number;
  topSources: RecapIncomeSource[];
}

export interface RecapExpenses {
  total: number;
  previousMonth: number;
  change: number;
  changePercentage: number;
  dailyAverage: number;
  transactionCount: number;
}

export interface RecapSavings {
  amount: number;
  rate: number;
  previousAmount: number;
  previousRate: number;
}

export interface RecapNetWorth {
  current: number;
  startOfMonth: number;
  change: number;
  changePercentage: number;
  assets: number;
  liabilities: number;
}

export interface RecapBudgetCategory {
  categoryName: string;
  categoryIcon: string | null;
  budgeted: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  overBudget: boolean;
}

export interface RecapBudget {
  hasBudget: boolean;
  totalBudgeted: number;
  totalSpent: number;
  remaining: number;
  percentUsed: number;
  onTrack: boolean;
  categoriesOverBudget: number;
  categories: RecapBudgetCategory[];
}

export interface RecapCategory {
  categoryId: string | null;
  categoryName: string;
  categoryIcon: string | null;
  categoryColor: string | null;
  amount: number;
  percentage: number;
  transactionCount: number;
  previousAmount: number;
  change: number;
  changePercentage: number;
}

export interface RecapMerchant {
  merchantName: string;
  amount: number;
  transactionCount: number;
}

export interface RecapRecurringItem {
  name: string;
  amount: number;
  dueDate: string | null;
  isPaid: boolean;
}

export interface RecapRecurring {
  totalRecurringExpenses: number;
  totalRecurringIncome: number;
  billsDueCount: number;
  billsPaidCount: number;
  upcoming: RecapRecurringItem[];
}

export interface RecapTransactionSummary {
  id: string;
  name: string;
  amount: number;
  date: string;
  categoryName: string | null;
  accountName: string | null;
}

export interface RecapNotable {
  largestExpense: RecapTransactionSummary | null;
  largestIncome: RecapTransactionSummary | null;
  unusualTransactions: RecapTransactionSummary[];
}

export interface RecapComparison {
  incomeChange: number;
  expenseChange: number;
  savingsChange: number;
  transactionCount: number;
  previousTransactionCount: number;
}

export interface RecapDailySpending {
  date: string;
  amount: number;
}

export interface MonthlyRecap {
  month: string;
  income: RecapIncome;
  expenses: RecapExpenses;
  savings: RecapSavings;
  netWorth: RecapNetWorth;
  budgetPerformance: RecapBudget;
  categoryBreakdown: RecapCategory[];
  topMerchants: RecapMerchant[];
  recurringSummary: RecapRecurring;
  notableTransactions: RecapNotable;
  comparison: RecapComparison;
  dailySpending: RecapDailySpending[];
}

export const useMonthlyRecap = (month?: string) => {
  const { data, loading, error, refetch } = useQuery(GET_MONTHLY_RECAP, {
    variables: { month },
  });

  const recap: MonthlyRecap | null = data?.monthlyRecap || null;

  return { recap, loading, error, refetch };
};
