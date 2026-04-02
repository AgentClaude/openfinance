module Types
  class SpendingComparisonType < Types::BaseObject
    field :period_a, String, null: false
    field :period_b, String, null: false
    field :period_a_start, String, null: false
    field :period_a_end, String, null: false
    field :period_b_start, String, null: false
    field :period_b_end, String, null: false
    field :totals, Types::ComparisonTotalsType, null: false
    field :category_comparison, [Types::CategoryComparisonType], null: false
    field :merchant_comparison, [Types::MerchantComparisonType], null: false
    field :daily_curves, [Types::DailyCurvePointType], null: false
  end
end
