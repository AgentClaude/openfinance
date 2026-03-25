module Mutations
  class TrackReferralClick < BaseMutation
    argument :referral_code, String, required: true

    field :success, Boolean, null: false
    field :referrer_name, String, null: true
    field :errors, [String], null: false

    def resolve(referral_code:)
      result = Referrals::TrackClickService.call(referral_code: referral_code)

      if result.success?
        {
          success: true,
          referrer_name: result.data[:referrer_name],
          errors: []
        }
      else
        {
          success: false,
          referrer_name: nil,
          errors: result.errors
        }
      end
    end
  end
end
