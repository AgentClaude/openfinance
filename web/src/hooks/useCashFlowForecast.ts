import { useQuery } from '@apollo/client';
import { GET_CASH_FLOW_FORECAST } from '@/graphql/queries';

export interface ForecastDay {
  date: string;
  balance: number;
  income: number;
  expenses: number;
  net: number;
  eventCount: number;
}

export interface ForecastEvent {
  date: string;
  amount: number;
  name: string;
  categoryName: string | null;
  source: 'recurring' | 'estimated';
  recurringItemId: string | null;
  confidence: number;
}

export interface ForecastWarning {
  date: string;
  projectedBalance: number;
  message: string;
}

export interface CashFlowForecast {
  startingBalance: number;
  endingBalance: number;
  forecastDays: number;
  totalProjectedIncome: number;
  totalProjectedExpenses: number;
  netCashFlow: number;
  minBalance: number;
  minBalanceDate: string | null;
  maxBalance: number;
  maxBalanceDate: string | null;
  dailyProjections: ForecastDay[];
  events: ForecastEvent[];
  warnings: ForecastWarning[];
}

interface UseCashFlowForecastOptions {
  days?: number;
  includeVariableSpending?: boolean;
}

export function useCashFlowForecast(options: UseCashFlowForecastOptions = {}) {
  const { days = 90, includeVariableSpending = true } = options;

  const { data, loading, error, refetch } = useQuery<{ cashFlowForecast: CashFlowForecast }>(
    GET_CASH_FLOW_FORECAST,
    {
      variables: { days, includeVariableSpending },
      fetchPolicy: 'cache-and-network',
    }
  );

  const forecast = data?.cashFlowForecast ?? null;

  // Get upcoming events (next 14 days)
  const upcomingEvents = forecast?.events
    .filter((e) => {
      const eventDate = new Date(e.date);
      const twoWeeks = new Date();
      twoWeeks.setDate(twoWeeks.getDate() + 14);
      return eventDate <= twoWeeks;
    })
    .sort((a, b) => a.date.localeCompare(b.date)) ?? [];

  // Weekly summary from daily projections
  const weeklySummary = forecast?.dailyProjections
    .filter((_, i) => i % 7 === 0 || i === (forecast?.dailyProjections.length ?? 0) - 1)
    .map((day) => ({
      date: day.date,
      balance: day.balance,
    })) ?? [];

  return {
    forecast,
    loading,
    error,
    refetch,
    upcomingEvents,
    weeklySummary,
    hasWarnings: (forecast?.warnings.length ?? 0) > 0,
  };
}
