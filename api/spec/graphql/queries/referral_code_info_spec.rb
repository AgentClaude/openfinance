require 'rails_helper'

RSpec.describe 'referralCodeInfo query' do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household, name: 'Jane Doe', referral_code: 'JANE-XYZ789') }

  let(:query) do
    <<~GQL
      query GetReferralCodeInfo($code: String!) {
        referralCodeInfo(code: $code) {
          valid
          referrerName
          referralCode
        }
      }
    GQL
  end

  def execute(code:, current_user: nil)
    OpenfinanceSchema.execute(
      query,
      variables: { code: code },
      context: { current_user: current_user }
    )
  end

  context 'with a valid referral code' do
    it 'returns valid true with referrer first name' do
      result = execute(code: user.referral_code)
      info = result.dig('data', 'referralCodeInfo')

      expect(info['valid']).to be true
      expect(info['referrerName']).to eq('Jane')
      expect(info['referralCode']).to eq('JANE-XYZ789')
    end
  end

  context 'with an invalid referral code' do
    it 'returns valid false' do
      result = execute(code: 'DOESNT-EXIST')
      info = result.dig('data', 'referralCodeInfo')

      expect(info['valid']).to be false
      expect(info['referrerName']).to be_nil
      expect(info['referralCode']).to eq('DOESNT-EXIST')
    end
  end

  context 'without authentication' do
    it 'works without a logged-in user (public query)' do
      result = execute(code: user.referral_code, current_user: nil)
      info = result.dig('data', 'referralCodeInfo')

      expect(info['valid']).to be true
      expect(info['referrerName']).to eq('Jane')
    end
  end
end
