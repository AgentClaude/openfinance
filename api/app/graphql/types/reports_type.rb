module Types
  class ReportsType < Types::BaseObject
    field :monthly_summary, [Types::MonthlySummaryType], null: false
    field :spending_by_category, [Types::CategorySpendingReportType], null: false
    field :monthly_spending_by_category, [Types::MonthlySpendingByCategoryType], null: false
    field :top_merchants, [Types::MerchantSpendingType], null: false
  end
end
