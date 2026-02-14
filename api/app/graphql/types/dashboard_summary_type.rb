module Types
  class DashboardSummaryType < Types::BaseObject
    field :net_worth, Float, null: false
    field :net_worth_change, Float, null: false
    field :monthly_income, Float, null: false
    field :monthly_expenses, Float, null: false
    field :cash_flow, Float, null: false
    field :spending_by_category, [Types::CategorySpendingType], null: false
    field :recent_transactions, [Types::TransactionType], null: false
    field :account_balances, [Types::AccountBalanceType], null: false
    field :needs_review_count, Integer, null: false
    field :goals_summary, [Types::GoalType], null: false
  end
end
