import { useQuery, gql } from '@apollo/client';

export const GET_FIRE_CALCULATOR = gql`
  query FireCalculator(
    $currentAge: Int
    $retirementAge: Int
    $annualReturnRate: Float
    $withdrawalRate: Float
    $inflationRate: Float
  ) {
    fireCalculator(
      currentAge: $currentAge
      retirementAge: $retirementAge
      annualReturnRate: $annualReturnRate
      withdrawalRate: $withdrawalRate
      inflationRate: $inflationRate
    ) {
      summary {
        fireNumber
        coastFireNumber
        coastFireAge
        yearsToFire
        fireAge
        savingsRate
        monthlySavings
        progressPercent
        currentAge
        retirementAge
        withdrawalRate
        annualReturnRate
        inflationRate
      }
      financials {
        monthlyIncome
        monthlyExpenses
        monthlySavings
        annualIncome
        annualExpenses
        annualSavings
        investedAssets
        totalNetWorth
      }
      projections {
        year
        age
        portfolioValue
        fireNumber
        isFireReached
      }
      scenarios {
        savingsRate
        monthlySavings
        yearsToFire
        isCurrent
      }
      milestones {
        name
        target
        current
        reached
        percent
      }
      tips {
        category
        title
        description
      }
    }
  }
`;

export interface FireParams {
  currentAge?: number;
  retirementAge?: number;
  annualReturnRate?: number;
  withdrawalRate?: number;
  inflationRate?: number;
}

export function useFireCalculator(params: FireParams = {}) {
  const { data, loading, error, refetch } = useQuery(GET_FIRE_CALCULATOR, {
    variables: {
      currentAge: params.currentAge ?? 30,
      retirementAge: params.retirementAge ?? 65,
      annualReturnRate: params.annualReturnRate ?? 7.0,
      withdrawalRate: params.withdrawalRate ?? 4.0,
      inflationRate: params.inflationRate ?? 3.0,
    },
    fetchPolicy: 'network-only',
  });

  return {
    data: data?.fireCalculator ?? null,
    loading,
    error,
    refetch,
  };
}
