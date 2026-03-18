module Types
  class BenchmarkComparisonPointType < Types::BaseObject
    field :date, String, null: false
    field :portfolio_value, Float, null: false
    field :benchmark_value, Float, null: false
  end
end
