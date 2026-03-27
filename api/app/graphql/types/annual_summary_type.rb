module Types
  class AnnualSummaryType < Types::BaseObject
    field :year, Integer, null: false
    field :income, Types::AnnualIncomeType, null: false
    field :spending, Types::AnnualSpendingType, null: false
    field :savings, Types::AnnualSavingsType, null: false
    field :net_worth_change, Types::NetWorthChangeType, null: false
    field :monthly_trends, [Types::MonthlyTrendType], null: false
    field :top_categories, [Types::CategorySpendingType], null: false
    field :top_merchants, [Types::MerchantSpendingType], null: false
    field :budget_performance, Types::BudgetPerformanceType, null: false
    field :highlights, Types::AnnualHighlightsType, null: false
    field :transaction_count, Integer, null: false
    field :days_tracked, Integer, null: false
  end
end
