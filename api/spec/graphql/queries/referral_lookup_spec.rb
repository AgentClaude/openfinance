# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'referralLookup query' do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household, name: 'Alice Johnson') }

  let(:query) do
    <<~GRAPHQL
      query($code: String!) {
        referralLookup(code: $code) {
          referrerFirstName
          referralCode
          valid
        }
      }
    GRAPHQL
  end

  def execute(code:)
    OpenfinanceSchema.execute(
      query,
      variables: { code: code },
      context: { current_user: nil } # Public query — no auth required
    )
  end

  context 'with a valid referral code' do
    it 'returns the referrer first name' do
      result = execute(code: user.referral_code)
      data = result.dig('data', 'referralLookup')
      expect(data['referrerFirstName']).to eq('Alice')
      expect(data['referralCode']).to eq(user.referral_code)
      expect(data['valid']).to be true
    end
  end

  context 'with an invalid referral code' do
    it 'returns null' do
      result = execute(code: 'NONEXISTENT')
      expect(result.dig('data', 'referralLookup')).to be_nil
    end
  end

  context 'with an empty code' do
    it 'returns null' do
      result = execute(code: '')
      expect(result.dig('data', 'referralLookup')).to be_nil
    end
  end
end
