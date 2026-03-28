module Types
  class RecapExpensesType < Types::BaseObject
    field :total, Float, null: false
    field :previous_month, Float, null: false
    field :change, Float, null: false
    field :change_percentage, Float, null: false
    field :daily_average, Float, null: false
    field :transaction_count, Integer, null: false
  end
end
