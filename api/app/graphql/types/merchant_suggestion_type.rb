module Types
  class MerchantSuggestionType < Types::BaseObject
    field :raw_pattern, String, null: false
    field :suggested_name, String, null: false
    field :transaction_count, Integer, null: false
  end
end
