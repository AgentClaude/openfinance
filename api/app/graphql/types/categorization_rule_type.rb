module Types
  class CategorizationRuleType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :match_field, String, null: false
    field :match_type, String, null: false
    field :match_value, String, null: false
    field :rename_to, String, null: true
    field :priority, Integer, null: false
    field :is_active, Boolean, null: false
    field :matches_count, Integer, null: false
    field :category_id, ID, null: false
    field :category, Types::CategoryType, null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
