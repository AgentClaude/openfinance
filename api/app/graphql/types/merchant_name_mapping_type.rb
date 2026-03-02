module Types
  class MerchantNameMappingType < Types::BaseObject
    field :id, ID, null: false
    field :raw_pattern, String, null: false
    field :clean_name, String, null: false
    field :match_type, String, null: false
    field :applied_count, Integer, null: false
    field :is_active, Boolean, null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
