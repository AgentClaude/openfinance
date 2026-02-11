module Types
  class UserType < Types::BaseObject
    field :id, ID, null: false
    field :email, String, null: false
    field :name, String, null: false
    field :role, String, null: false
    field :household_id, ID, null: true
    field :household, Types::HouseholdType, null: true
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
