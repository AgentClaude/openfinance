module Types
  class ReferralCodeInfoType < Types::BaseObject
    field :valid, Boolean, null: false
    field :referrer_name, String, null: true
    field :referral_code, String, null: false
  end
end
