import { gql, useQuery, useMutation } from '@apollo/client';

export const DEBT_PAYOFF_PLAN_QUERY = gql`
  query DebtPayoffPlan($extraPaymentCents: Int) {
    debtPayoffPlan(extraPaymentCents: $extraPaymentCents) {
      totalDebtCents
      totalMinimumCents
      extraPaymentCents
      debts {
        id
        name
        accountType
        balanceCents
        interestRate
        minimumPaymentCents
      }
      snowball {
        strategy
        monthsToPayoff
        totalInterestCents
        totalCostCents
        payoffDate
        timeline {
          month
          totalRemainingCents
          interestPaidCents
          principalPaidCents
          balances
        }
      }
      avalanche {
        strategy
        monthsToPayoff
        totalInterestCents
        totalCostCents
        payoffDate
        timeline {
          month
          totalRemainingCents
          interestPaidCents
          principalPaidCents
          balances
        }
      }
      minimumOnly {
        strategy
        monthsToPayoff
        totalInterestCents
        totalCostCents
        payoffDate
        timeline {
          month
          totalRemainingCents
          interestPaidCents
          principalPaidCents
          balances
        }
      }
      interestSavedSnowballCents
      interestSavedAvalancheCents
      monthsSavedSnowball
      monthsSavedAvalanche
    }
  }
`;

export const UPDATE_DEBT_DETAILS_MUTATION = gql`
  mutation UpdateDebtDetails($accountId: ID!, $interestRate: Float, $minimumPayment: Float) {
    updateDebtDetails(accountId: $accountId, interestRate: $interestRate, minimumPayment: $minimumPayment) {
      account {
        id
        interestRate
        minimumPayment
      }
      errors
    }
  }
`;

export interface DebtAccount {
  id: string;
  name: string;
  accountType: string;
  balanceCents: number;
  interestRate: number;
  minimumPaymentCents: number;
}

export interface TimelinePoint {
  month: number;
  totalRemainingCents: number;
  interestPaidCents: number;
  principalPaidCents: number;
  balances: number[];
}

export interface PayoffStrategy {
  strategy: string;
  monthsToPayoff: number;
  totalInterestCents: number;
  totalCostCents: number;
  payoffDate: string;
  timeline: TimelinePoint[];
}

export interface DebtPayoffPlan {
  totalDebtCents: number;
  totalMinimumCents: number;
  extraPaymentCents: number;
  debts: DebtAccount[];
  snowball: PayoffStrategy;
  avalanche: PayoffStrategy;
  minimumOnly: PayoffStrategy;
  interestSavedSnowballCents: number;
  interestSavedAvalancheCents: number;
  monthsSavedSnowball: number;
  monthsSavedAvalanche: number;
}

export function useDebtPayoff(extraPaymentCents: number = 0) {
  const { data, loading, error, refetch } = useQuery<{ debtPayoffPlan: DebtPayoffPlan | null }>(
    DEBT_PAYOFF_PLAN_QUERY,
    {
      variables: { extraPaymentCents },
      fetchPolicy: 'cache-and-network',
    }
  );

  const [updateDebtDetails] = useMutation(UPDATE_DEBT_DETAILS_MUTATION, {
    refetchQueries: [{ query: DEBT_PAYOFF_PLAN_QUERY, variables: { extraPaymentCents } }],
  });

  return {
    plan: data?.debtPayoffPlan ?? null,
    loading,
    error,
    refetch,
    updateDebtDetails,
  };
}
