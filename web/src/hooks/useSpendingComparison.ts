import { useQuery, gql } from '@apollo/client';

export const GET_SPENDING_COMPARISON = gql`
  query SpendingComparison(
    $periodAStart: String!
    $periodAEnd: String!
    $periodBStart: String!
    $periodBEnd: String!
  ) {
    spendingComparison(
      periodAStart: $periodAStart
      periodAEnd: $periodAEnd
      periodBStart: $periodBStart
      periodBEnd: $periodBEnd
    ) {
      periodA
      periodB
      periodAStart
      periodAEnd
      periodBStart
      periodBEnd
      totals {
        periodAIncome
        periodBIncome
        incomeChange
        incomeChangePercent
        periodAExpenses
        periodBExpenses
        expensesChange
        expensesChangePercent
        periodANet
        periodBNet
        netChange
        periodATransactionCount
        periodBTransactionCount
      }
      categoryComparison {
        categoryId
        categoryName
        categoryIcon
        categoryColor
        periodAAmount
        periodBAmount
        change
        changePercent
      }
      merchantComparison {
        merchantName
        periodAAmount
        periodBAmount
        change
        changePercent
      }
      dailyCurves {
        day
        periodACumulative
        periodBCumulative
      }
    }
  }
`;

export interface ComparisonTotals {
  periodAIncome: number;
  periodBIncome: number;
  incomeChange: number;
  incomeChangePercent: number;
  periodAExpenses: number;
  periodBExpenses: number;
  expensesChange: number;
  expensesChangePercent: number;
  periodANet: number;
  periodBNet: number;
  netChange: number;
  periodATransactionCount: number;
  periodBTransactionCount: number;
}

export interface CategoryComparison {
  categoryId: string | null;
  categoryName: string;
  categoryIcon: string | null;
  categoryColor: string | null;
  periodAAmount: number;
  periodBAmount: number;
  change: number;
  changePercent: number;
}

export interface MerchantComparison {
  merchantName: string;
  periodAAmount: number;
  periodBAmount: number;
  change: number;
  changePercent: number;
}

export interface DailyCurvePoint {
  day: number;
  periodACumulative: number | null;
  periodBCumulative: number | null;
}

export interface SpendingComparisonData {
  periodA: string;
  periodB: string;
  periodAStart: string;
  periodAEnd: string;
  periodBStart: string;
  periodBEnd: string;
  totals: ComparisonTotals;
  categoryComparison: CategoryComparison[];
  merchantComparison: MerchantComparison[];
  dailyCurves: DailyCurvePoint[];
}

export function useSpendingComparison(
  periodAStart: string,
  periodAEnd: string,
  periodBStart: string,
  periodBEnd: string
) {
  const { data, loading, error, refetch } = useQuery(GET_SPENDING_COMPARISON, {
    variables: { periodAStart, periodAEnd, periodBStart, periodBEnd },
    fetchPolicy: 'cache-and-network',
  });

  return {
    data: data?.spendingComparison as SpendingComparisonData | undefined,
    loading,
    error,
    refetch,
  };
}
