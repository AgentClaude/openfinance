module Types
  class SavingsRateMonthType < Types::BaseObject
    field :month, String, null: false
    field :income, Float, null: false
    field :expenses, Float, null: false
    field :savings_amount, Float, null: false
    field :savings_rate, Float, null: false
  end
end
