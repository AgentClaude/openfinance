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
    field :referral_clicks, Integer, null: false
    field :referral_conversions, Integer, null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false

    def referral_count
      object.referrals_given.count
    end

    def referral_clicks
      object.referral_clicks || 0
    end

    def referral_conversions
      object.referrals_given.completed.count + object.referrals_given.rewarded.count
    end
  end
end
