module Types
  class ReferralLookupType < Types::BaseObject
    field :referrer_first_name, String, null: false
    field :referral_code, String, null: false
    field :valid, Boolean, null: false
  end
end
