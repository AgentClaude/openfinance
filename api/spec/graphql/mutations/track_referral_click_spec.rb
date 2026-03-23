# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Mutations::TrackReferralClick do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household, referral_clicks: 0) }

  let(:mutation) do
    <<~GRAPHQL
      mutation($referralCode: String!) {
        trackReferralClick(referralCode: $referralCode) {
          success
          errors
        }
      }
    GRAPHQL
  end

  def execute(referral_code:)
    OpenfinanceSchema.execute(
      mutation,
      variables: { referralCode: referral_code },
      context: { current_user: nil } # Public mutation — no auth required
    )
  end

  context 'with a valid referral code' do
    it 'returns success' do
      result = execute(referral_code: user.referral_code)
      data = result.dig('data', 'trackReferralClick')
      expect(data['success']).to be true
      expect(data['errors']).to be_empty
    end

    it 'increments the click counter' do
      expect {
        execute(referral_code: user.referral_code)
      }.to change { user.reload.referral_clicks }.by(1)
    end
  end

  context 'with an invalid referral code' do
    it 'returns failure with error' do
      result = execute(referral_code: 'INVALID-CODE')
      data = result.dig('data', 'trackReferralClick')
      expect(data['success']).to be false
      expect(data['errors']).to include('Invalid referral code')
    end
  end
end
