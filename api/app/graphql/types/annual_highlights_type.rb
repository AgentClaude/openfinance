module Types
  class AnnualHighlightsType < Types::BaseObject
    field :biggest_expense, Types::TransactionHighlightType, null: true
    field :biggest_income, Types::TransactionHighlightType, null: true
    field :most_frequent_merchant, Types::MerchantHighlightType, null: true
    field :biggest_spending_month, Types::MonthlyTrendType, null: true
    field :most_frugal_month, Types::MonthlyTrendType, null: true
    field :goals_achieved, Integer, null: false
  end
end
