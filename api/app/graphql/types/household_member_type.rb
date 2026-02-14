module Types
  class HouseholdMemberType < Types::BaseObject
    field :id, ID, null: false
    field :user, Types::UserType, null: false
    field :role, String, null: false
    field :joined_at, GraphQL::Types::ISO8601DateTime, null: false
    field :is_primary, Boolean, null: false

    def joined_at
      object.respond_to?(:joined_at) ? object.joined_at : object.created_at
    end

    def is_primary
      object.respond_to?(:is_primary) ? object.is_primary : false
    end
  end
end
