module Types
  class SyncLogType < Types::BaseObject
    field :id, ID, null: false
    field :status, String, null: false
    field :started_at, GraphQL::Types::ISO8601DateTime, null: false
    field :completed_at, GraphQL::Types::ISO8601DateTime, null: true
    field :transactions_added, Integer, null: true
    field :transactions_updated, Integer, null: true
    field :error_message, String, null: true
    field :duration_in_seconds, Float, null: true
  end
end
