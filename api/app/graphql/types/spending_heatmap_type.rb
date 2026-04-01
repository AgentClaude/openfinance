module Types
  class SpendingHeatmapType < Types::BaseObject
    field :year, Integer, null: false
    field :daily_spending, [Types::HeatmapDayType], null: false
    field :weekday_averages, [Types::WeekdayAverageType], null: false
    field :monthly_totals, [Types::HeatmapMonthlyTotalType], null: false
    field :category_heatmap, [Types::CategoryHeatmapType], null: false
    field :stats, Types::HeatmapStatsType, null: false
    field :streaks, Types::HeatmapStreaksType, null: false
  end
end
