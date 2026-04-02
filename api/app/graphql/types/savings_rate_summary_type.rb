module Types
  class SavingsRateSummaryType < Types::BaseObject
    field :current_savings_rate, Float, null: false
    field :average_savings_rate, Float, null: false
    field :best_month, Types::SavingsRateMonthSnapshotType, null: true
    field :worst_month, Types::SavingsRateMonthSnapshotType, null: true
    field :trend_direction, String, null: false
    field :percentile, Integer, null: false
    field :months_analyzed, Integer, null: false
    field :total_saved, Float, null: false
    field :average_monthly_savings, Float, null: false
  end
end
