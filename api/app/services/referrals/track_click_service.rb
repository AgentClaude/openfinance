module Referrals
  class TrackClickService < ApplicationService
    attr_accessor :referral_code

    def call
      user = User.find_by(referral_code: referral_code)
      return failure('Invalid referral code') unless user

      user.increment!(:referral_clicks)

      success(
        referrer_name: user.name.split(' ').first,
        referral_code: referral_code,
        clicks: user.referral_clicks
      )
    end
  end
end
