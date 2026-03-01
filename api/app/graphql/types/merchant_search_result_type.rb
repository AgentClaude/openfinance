module Types
  class MerchantSearchResultType < Types::BaseObject
    field :name, String, null: false
    field :transaction_count, Integer, null: false
    field :total_amount, Float, null: false
  end
end
