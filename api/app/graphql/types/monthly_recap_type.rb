module Types
  class MonthlyRecapType < Types::BaseObject
    field :month, String, null: false
    field :income, Types::RecapIncomeType, null: false
    field :expenses, Types::RecapExpensesType, null: false
    field :savings, Types::RecapSavingsType, null: false
    field :net_worth, Types::RecapNetWorthType, null: false
    field :budget_performance, Types::RecapBudgetType, null: false
    field :category_breakdown, [Types::RecapCategoryType], null: false
    field :top_merchants, [Types::MerchantSpendingType], null: false
    field :recurring_summary, Types::RecapRecurringType, null: false
    field :notable_transactions, Types::RecapNotableType, null: false
    field :comparison, Types::RecapComparisonType, null: false
    field :daily_spending, [Types::RecapDailySpendingType], null: false
  end
end
