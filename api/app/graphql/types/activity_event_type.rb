# frozen_string_literal: true

module Types
  class ActivityEventType < Types::BaseObject
    field :id, ID, null: false
    field :action, String, null: false
    field :resource_type, String, null: false
    field :resource_id, ID, null: true
    field :description, String, null: false
    field :metadata, GraphQL::Types::JSON, null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false

    field :user, Types::UserType, null: false

    def user
      object.user
    end
  end
end
