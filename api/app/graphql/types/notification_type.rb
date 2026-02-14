module Types
  class NotificationType < Types::BaseObject
    field :id, ID, null: false
    field :title, String, null: false
    field :body, String, null: true
    field :notification_type, String, null: false
    field :priority, String, null: false
    field :is_read, Boolean, null: false
    field :read_at, GraphQL::Types::ISO8601DateTime, null: true
    field :data, GraphQL::Types::JSON, null: true
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
