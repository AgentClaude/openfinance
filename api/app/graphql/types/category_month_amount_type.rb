module Types
  class CategoryMonthAmountType < Types::BaseObject
    field :month, String, null: false
    field :amount, Float, null: false
  end
end
