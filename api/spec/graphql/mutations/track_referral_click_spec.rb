require 'rails_helper'

RSpec.describe 'trackReferralClick mutation' do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household, name: 'Bob Smith', referral_code: 'BOB-ABC123', referral_clicks: 5) }

  let(:mutation) do
    <<~GQL
      mutation TrackReferralClick($referralCode: String!) {
        trackReferralClick(referralCode: $referralCode) {
          success
          referrerName
          errors
        }
      }
    GQL
  end

  def execute(referral_code:, current_user: nil)
    OpenfinanceSchema.execute(
      mutation,
      variables: { referralCode: referral_code },
      context: { current_user: current_user }
    )
  end

  context 'with a valid referral code' do
    it 'returns success and referrer first name' do
      result = execute(referral_code: user.referral_code)
      data = result.dig('data', 'trackReferralClick')

      expect(data['success']).to be true
      expect(data['referrerName']).to eq('Bob')
      expect(data['errors']).to be_empty
    end

    it 'increments click counter' do
      expect {
        execute(referral_code: user.referral_code)
      }.to change { user.reload.referral_clicks }.from(5).to(6)
    end
  end

  context 'with an invalid referral code' do
    it 'returns failure' do
      result = execute(referral_code: 'NOPE-999')
      data = result.dig('data', 'trackReferralClick')

      expect(data['success']).to be false
      expect(data['referrerName']).to be_nil
      expect(data['errors']).to include('Invalid referral code')
    end
  end

  context 'without authentication' do
    it 'works without auth (public mutation for click tracking)' do
      result = execute(referral_code: user.referral_code, current_user: nil)
      data = result.dig('data', 'trackReferralClick')

      expect(data['success']).to be true
    end
  end
end
