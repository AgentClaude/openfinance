module Types
  class InvitationType < Types::BaseObject
    field :id, ID, null: false
    field :email, String, null: false
    field :role, String, null: false
    field :status, String, null: false
    field :invited_by, Types::UserType, null: false
    field :household, Types::HouseholdType, null: false
    field :expires_at, GraphQL::Types::ISO8601DateTime, null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
