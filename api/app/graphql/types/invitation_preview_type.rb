module Types
  class InvitationPreviewType < Types::BaseObject
    field :id, ID, null: false
    field :email, String, null: false
    field :role, String, null: false
    field :status, String, null: false
    field :household_name, String, null: true
    field :invited_by_name, String, null: true
    field :expires_at, GraphQL::Types::ISO8601DateTime, null: false
    field :expired, Boolean, null: false

    def household_name
      object.household&.name
    end

    def invited_by_name
      object.invited_by&.name || object.invited_by&.email
    end

    def expired
      object.expired?
    end
  end
end
