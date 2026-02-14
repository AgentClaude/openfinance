module Types
  class ShareTokenType < Types::BaseObject
    field :id, ID, null: false
    field :token, String, null: false
    field :widget_type, String, null: false
    field :config, GraphQL::Types::JSON, null: false
    field :expires_at, GraphQL::Types::ISO8601DateTime, null: true
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
