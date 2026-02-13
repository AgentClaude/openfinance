module Types
  class MerchantSpendingType < Types::BaseObject
    field :merchant_name, String, null: false
    field :amount, Float, null: false
    field :transaction_count, Integer, null: false
  end
end
