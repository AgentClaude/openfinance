module Types
  class RecapNotableType < Types::BaseObject
    field :largest_expense, Types::RecapTransactionSummaryType, null: true
    field :largest_income, Types::RecapTransactionSummaryType, null: true
    field :unusual_transactions, [Types::RecapTransactionSummaryType], null: false
  end
end
