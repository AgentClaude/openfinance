module Types
  class MerchantComparisonType < Types::BaseObject
    field :merchant_name, String, null: false
    field :period_a_amount, Float, null: false
    field :period_b_amount, Float, null: false
    field :change, Float, null: false
    field :change_percent, Float, null: false
  end
end
