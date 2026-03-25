module Referrals
  class LookupCodeService < ApplicationService
    attr_accessor :code

    def call
      user = User.find_by(referral_code: code)

      if user
        success(valid: true, referrer_name: user.first_name, referral_code: code)
      else
        success(valid: false, referrer_name: nil, referral_code: code)
      end
    end
  end
end
