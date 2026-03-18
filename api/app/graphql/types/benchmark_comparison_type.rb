module Types
  class BenchmarkComparisonType < Types::BaseObject
    field :benchmark_name, String, null: true
    field :benchmark_symbol, String, null: false
    field :period_months, Integer, null: false
    field :portfolio_return, Float, null: false
    field :benchmark_return, Float, null: false
    field :alpha, Float, null: false
    field :outperforming, Boolean, null: false
    field :data_points, [Types::BenchmarkComparisonPointType], null: false
  end
end
