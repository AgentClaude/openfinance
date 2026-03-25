module Referrals
  class TrackClickService < ApplicationService
    attr_accessor :referral_code

    def call
      user = User.find_by(referral_code: referral_code)
      return failure('Invalid referral code') unless user

      User.update_counters(user.id, referral_clicks: 1)
      user.reload

      success(
        referrer_name: user.first_name,
        referral_code: referral_code,
        clicks: user.referral_clicks
      )
    end
  end
end
