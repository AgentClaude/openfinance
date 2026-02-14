module Types
  class SuggestedRuleType < Types::BaseObject
    field :merchant_name, String, null: false
    field :category_id, ID, null: false
    field :category_name, String, null: false
    field :category_icon, String, null: true
    field :category_color, String, null: true
    field :transaction_count, Integer, null: false
    field :match_field, String, null: false
    field :match_type, String, null: false
    field :match_value, String, null: false
  end
end
