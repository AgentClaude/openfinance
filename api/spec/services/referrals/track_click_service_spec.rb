require 'rails_helper'

RSpec.describe Referrals::TrackClickService do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household, referral_code: 'TEST-ABC123', referral_clicks: 0) }

  describe '.call' do
    context 'with a valid referral code' do
      it 'returns success with referrer first name' do
        result = described_class.call(referral_code: user.referral_code)

        expect(result).to be_success
        expect(result.data[:referrer_name]).to eq(user.name.split(' ').first)
        expect(result.data[:referral_code]).to eq('TEST-ABC123')
      end

      it 'increments the referral_clicks counter' do
        expect {
          described_class.call(referral_code: user.referral_code)
        }.to change { user.reload.referral_clicks }.from(0).to(1)
      end

      it 'increments on each call' do
        3.times { described_class.call(referral_code: user.referral_code) }
        expect(user.reload.referral_clicks).to eq(3)
      end
    end

    context 'with an invalid referral code' do
      it 'returns failure' do
        result = described_class.call(referral_code: 'INVALID-CODE')

        expect(result).to be_failure
        expect(result.error_message).to eq('Invalid referral code')
      end
    end
  end
end
