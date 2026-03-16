module Types
  class PlaidCategoryMappingType < Types::BaseObject
    field :id, ID, null: false
    field :plaid_primary, String, null: false
    field :plaid_detailed, String, null: true
    field :category, Types::CategoryType, null: false
    field :is_default, Boolean, null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
