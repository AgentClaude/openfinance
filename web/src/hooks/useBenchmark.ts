import { useQuery } from '@apollo/client';
import { GET_BENCHMARK_COMPARISON } from '@/graphql/queries';

export interface BenchmarkDataPoint {
  date: string;
  portfolioValue: number;
  benchmarkValue: number;
}

export interface BenchmarkComparison {
  benchmarkName: string | null;
  benchmarkSymbol: string;
  periodMonths: number;
  portfolioReturn: number;
  benchmarkReturn: number;
  alpha: number;
  outperforming: boolean;
  dataPoints: BenchmarkDataPoint[];
}

export const useBenchmark = (months: number = 12, accountId?: string) => {
  const { data, loading, error, refetch } = useQuery(GET_BENCHMARK_COMPARISON, {
    variables: {
      benchmarkSymbol: 'SPY',
      months,
      ...(accountId ? { accountId } : {}),
    },
  });

  const comparison: BenchmarkComparison = data?.benchmarkComparison || {
    benchmarkName: null,
    benchmarkSymbol: 'SPY',
    periodMonths: months,
    portfolioReturn: 0,
    benchmarkReturn: 0,
    alpha: 0,
    outperforming: false,
    dataPoints: [],
  };

  return { comparison, loading, error, refetch };
};
