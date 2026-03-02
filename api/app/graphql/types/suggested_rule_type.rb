module Types
  class SuggestedRuleType < Types::BaseObject
    field :merchant_name, String, null: false
    field :category_id, ID, null: false
    field :category, Types::CategoryType, null: false
    field :transaction_count, Integer, null: false
    field :confidence, Float, null: false
    field :match_field, String, null: false
    field :match_type, String, null: false
    field :match_value, String, null: false

    def category
      Category.find(object[:category_id])
    end
  end
end
