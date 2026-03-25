require 'rails_helper'

RSpec.describe Referrals::LookupCodeService do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household, name: 'Alice Wonder', referral_code: 'ALICE-XYZ') }

  describe '.call' do
    context 'with a valid referral code' do
      it 'returns success with valid true and referrer first name' do
        result = described_class.call(code: user.referral_code)

        expect(result).to be_success
        expect(result.data[:valid]).to be true
        expect(result.data[:referrer_name]).to eq('Alice')
        expect(result.data[:referral_code]).to eq('ALICE-XYZ')
      end
    end

    context 'with an invalid referral code' do
      it 'returns success with valid false' do
        result = described_class.call(code: 'NOPE-000')

        expect(result).to be_success
        expect(result.data[:valid]).to be false
        expect(result.data[:referrer_name]).to be_nil
        expect(result.data[:referral_code]).to eq('NOPE-000')
      end
    end
  end
end
