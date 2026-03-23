module Mutations
  class TrackReferralClick < BaseMutation
    description "Track a click on a referral link (public, no auth required)"

    argument :referral_code, String, required: true

    field :success, Boolean, null: false
    field :errors, [String], null: false

    def resolve(referral_code:)
      result = Referrals::TrackClickService.call(referral_code: referral_code)

      if result.success?
        { success: true, errors: [] }
      else
        { success: false, errors: result.errors }
      end
    end
  end
end
