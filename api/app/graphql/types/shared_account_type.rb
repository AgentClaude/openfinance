# frozen_string_literal: true

module Types
  class SharedAccountType < Types::BaseObject
    field :id, ID, null: false
    field :account, Types::AccountType, null: false
    field :shared_with_user, Types::UserType, null: false
    field :shared_by_user, Types::UserType, null: false
    field :permission_level, String, null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
