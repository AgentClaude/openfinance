module Types
  class NotificationRuleType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :rule_type, String, null: false
    field :is_active, Boolean, null: false
    field :conditions, GraphQL::Types::JSON, null: false
    field :settings, GraphQL::Types::JSON, null: true
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
