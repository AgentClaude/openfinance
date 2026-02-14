module Mutations
  class RedeemReferral < BaseMutation
    argument :referral_code, String, required: true

    field :referral, Types::ReferralType, null: true
    field :errors, [String], null: false

    def resolve(referral_code:)
      current_user = context[:current_user]
      return { referral: nil, errors: ['Not authenticated'] } unless current_user

      referrer = User.find_by(referral_code: referral_code)
      return { referral: nil, errors: ['Invalid referral code'] } unless referrer
      return { referral: nil, errors: ['You cannot refer yourself'] } if referrer.id == current_user.id

      existing = Referral.find_by(referrer: referrer, referred_user: current_user)
      return { referral: nil, errors: ['Referral already redeemed'] } if existing

      referral = Referral.create!(
        referrer: referrer,
        referred_user: current_user,
        referral_code: referral_code,
        status: 'completed'
      )

      { referral: referral, errors: [] }
    rescue ActiveRecord::RecordInvalid => e
      { referral: nil, errors: e.record.errors.full_messages }
    end
  end
end
