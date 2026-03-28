module Types
  class RecapDailySpendingType < Types::BaseObject
    field :date, String, null: false
    field :amount, Float, null: false
  end
end
