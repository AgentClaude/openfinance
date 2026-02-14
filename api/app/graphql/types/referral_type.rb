module Types
  class ReferralType < Types::BaseObject
    field :id, ID, null: false
    field :referral_code, String, null: false
    field :status, String, null: false
    field :rewarded_at, GraphQL::Types::ISO8601DateTime, null: true
    field :referred_user, Types::UserType, null: false
    field :referrer, Types::UserType, null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
