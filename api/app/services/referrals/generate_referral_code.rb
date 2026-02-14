module Referrals
  class GenerateReferralCode < ApplicationService
    def initialize(user)
      @user = user
    end

    def call
      return @user.referral_code if @user.referral_code.present?

      code = generate_unique_code
      @user.update!(referral_code: code)
      code
    end

    private

    def generate_unique_code
      loop do
        code = "#{@user.name.parameterize[0..7]}-#{SecureRandom.alphanumeric(6)}".upcase
        break code unless User.exists?(referral_code: code)
      end
    end
  end
end
