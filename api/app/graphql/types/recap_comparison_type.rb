module Types
  class RecapComparisonType < Types::BaseObject
    field :income_change, Float, null: false
    field :expense_change, Float, null: false
    field :savings_change, Float, null: false
    field :transaction_count, Integer, null: false
    field :previous_transaction_count, Integer, null: false
  end
end
