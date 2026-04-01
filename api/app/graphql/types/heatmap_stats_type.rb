module Types
  class HeatmapStatsType < Types::BaseObject
    field :total_spent, Float, null: false
    field :days_tracked, Integer, null: false
    field :spending_days, Integer, null: false
    field :no_spend_days, Integer, null: false
    field :daily_average, Float, null: false
    field :max_day_amount, Float, null: false
    field :max_day_date, String, null: true
    field :min_spending_day_amount, Float, null: false
  end
end
