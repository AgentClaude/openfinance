import { useQuery, gql } from '@apollo/client';

export const GET_SAVINGS_RATE = gql`
  query SavingsRate($months: Int) {
    savingsRate(months: $months) {
      summary {
        currentSavingsRate
        averageSavingsRate
        bestMonth {
          month
          savingsRate
        }
        worstMonth {
          month
          savingsRate
        }
        trendDirection
        percentile
        monthsAnalyzed
        totalSaved
        averageMonthlySavings
      }
      monthlyTrends {
        month
        income
        expenses
        savingsAmount
        savingsRate
      }
      allocation {
        needs {
          amount
          percent
          targetPercent
          status
        }
        wants {
          amount
          percent
          targetPercent
          status
        }
        savings {
          amount
          percent
          targetPercent
          status
        }
        otherExpenses {
          amount
          percent
        }
        avgMonthlyIncome
      }
      incomeSources {
        name
        icon
        total
        monthlyAverage
        percent
      }
      expenseAllocation {
        group
        total
        monthlyAverage
        percent
        categoryType
      }
      streaks {
        positiveSavingsMonths
        above20PercentMonths
        totalMonths
      }
      recommendations {
        type
        icon
        title
        description
        impact
      }
    }
  }
`;

export interface SavingsRateSummary {
  currentSavingsRate: number;
  averageSavingsRate: number;
  bestMonth: { month: string; savingsRate: number } | null;
  worstMonth: { month: string; savingsRate: number } | null;
  trendDirection: string;
  percentile: number;
  monthsAnalyzed: number;
  totalSaved: number;
  averageMonthlySavings: number;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
  savingsAmount: number;
  savingsRate: number;
}

export interface AllocationCategory {
  amount: number;
  percent: number;
  targetPercent: number;
  status: string;
}

export interface AllocationBreakdown {
  needs: AllocationCategory;
  wants: AllocationCategory;
  savings: AllocationCategory;
  otherExpenses: { amount: number; percent: number };
  avgMonthlyIncome: number;
}

export interface IncomeSource {
  name: string;
  icon: string | null;
  total: number;
  monthlyAverage: number;
  percent: number;
}

export interface ExpenseAllocationGroup {
  group: string;
  total: number;
  monthlyAverage: number;
  percent: number;
  categoryType: string;
}

export interface SavingsStreak {
  positiveSavingsMonths: number;
  above20PercentMonths: number;
  totalMonths: number;
}

export interface SavingsRecommendation {
  type: string;
  icon: string;
  title: string;
  description: string;
  impact: string | null;
}

export interface SavingsRateData {
  summary: SavingsRateSummary;
  monthlyTrends: MonthlyTrend[];
  allocation: AllocationBreakdown;
  incomeSources: IncomeSource[];
  expenseAllocation: ExpenseAllocationGroup[];
  streaks: SavingsStreak;
  recommendations: SavingsRecommendation[];
}

export function useSavingsRate(months = 12) {
  const { data, loading, error, refetch } = useQuery(GET_SAVINGS_RATE, {
    variables: { months },
    fetchPolicy: 'cache-and-network',
  });

  return {
    data: data?.savingsRate as SavingsRateData | null,
    loading,
    error,
    refetch,
  };
}
