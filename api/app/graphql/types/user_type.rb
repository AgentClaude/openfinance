module Types
  class UserType < Types::BaseObject
    field :id, ID, null: false
    field :email, String, null: false
    field :name, String, null: false
    field :role, String, null: false
    field :household_id, ID, null: true
    field :household, Types::HouseholdType, null: true
    field :referral_code, String, null: true
    field :referral_count, Integer, null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false

    def referral_count
      object.referrals_given.count
    end
  end
end
