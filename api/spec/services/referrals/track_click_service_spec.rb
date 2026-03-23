require 'rails_helper'

RSpec.describe Referrals::TrackClickService do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household, referral_clicks: 0) }

  describe '.call' do
    context 'with a valid referral code' do
      it 'increments the referral click counter' do
        expect {
          described_class.call(referral_code: user.referral_code)
        }.to change { user.reload.referral_clicks }.from(0).to(1)
      end

      it 'returns success with referrer info' do
        result = described_class.call(referral_code: user.referral_code)
        expect(result).to be_success
        expect(result.data[:referrer_name]).to eq(user.name.split(' ').first)
        expect(result.data[:referral_code]).to eq(user.referral_code)
      end

      it 'increments on multiple clicks' do
        3.times { described_class.call(referral_code: user.referral_code) }
        expect(user.reload.referral_clicks).to eq(3)
      end
    end

    context 'with an invalid referral code' do
      it 'returns failure' do
        result = described_class.call(referral_code: 'NONEXISTENT')
        expect(result).to be_failure
        expect(result.error_message).to eq('Invalid referral code')
      end
    end

    context 'with a blank referral code' do
      it 'returns failure' do
        result = described_class.call(referral_code: '')
        expect(result).to be_failure
      end
    end
  end
end
