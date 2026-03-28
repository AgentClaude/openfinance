module Types
  class RecapIncomeSourceType < Types::BaseObject
    field :name, String, null: false
    field :amount, Float, null: false
    field :count, Integer, null: false
  end
end
