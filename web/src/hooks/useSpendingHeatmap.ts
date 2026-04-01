import { useQuery } from '@apollo/client';
import { GET_SPENDING_HEATMAP } from '@/graphql/queries';

export interface HeatmapDay {
  date: string;
  amount: number;
  dayOfWeek: number;
  week: number;
}

export interface WeekdayAverage {
  dayOfWeek: number;
  dayName: string;
  average: number;
  total: number;
  count: number;
}

export interface HeatmapMonthlyTotal {
  month: string;
  amount: number;
}

export interface CategoryMonthAmount {
  month: string;
  amount: number;
}

export interface CategoryHeatmap {
  categoryId: string;
  categoryName: string;
  categoryIcon: string | null;
  categoryColor: string | null;
  months: CategoryMonthAmount[];
}

export interface HeatmapStats {
  totalSpent: number;
  daysTracked: number;
  spendingDays: number;
  noSpendDays: number;
  dailyAverage: number;
  maxDayAmount: number;
  maxDayDate: string | null;
  minSpendingDayAmount: number;
}

export interface HeatmapStreaks {
  longestNoSpendDays: number;
  longestNoSpendStart: string | null;
  longestNoSpendEnd: string | null;
  currentNoSpendStreak: number;
}

export interface SpendingHeatmapData {
  year: number;
  dailySpending: HeatmapDay[];
  weekdayAverages: WeekdayAverage[];
  monthlyTotals: HeatmapMonthlyTotal[];
  categoryHeatmap: CategoryHeatmap[];
  stats: HeatmapStats;
  streaks: HeatmapStreaks;
}

export const useSpendingHeatmap = (year?: number) => {
  const { data, loading, error, refetch } = useQuery(GET_SPENDING_HEATMAP, {
    variables: { year },
  });

  const heatmap: SpendingHeatmapData | null = data?.spendingHeatmap || null;

  return { heatmap, loading, error, refetch };
};
