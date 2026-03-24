# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'mySubscription query' do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:plan) { create(:plan, name: 'Pro', slug: 'pro', price_cents: 999, annual_price_cents: 9990) }

  let(:query) do
    <<~GRAPHQL
      query {
        mySubscription {
          id
          status
          billingInterval
          trialActive
          trialDaysRemaining
          daysUntilRenewal
          cancelAtPeriodEnd
          willCancel
          plan {
            id
            name
            slug
            monthlyPrice
            featureList
          }
        }
      }
    GRAPHQL
  end

  def execute(current_user:)
    OpenfinanceSchema.execute(
      query,
      context: { current_user: current_user }
    )
  end

  context 'with no subscription' do
    it 'returns null' do
      result = execute(current_user: user)
      expect(result.dig('data', 'mySubscription')).to be_nil
    end
  end

  context 'with an active subscription' do
    before do
      create(:subscription,
             household: household,
             plan: plan,
             status: 'active',
             billing_interval: 'monthly',
             current_period_start: 1.day.ago,
             current_period_end: 29.days.from_now)
    end

    it 'returns subscription details' do
      result = execute(current_user: user)
      sub = result.dig('data', 'mySubscription')
      expect(sub).to be_present
      expect(sub['status']).to eq('active')
      expect(sub['billingInterval']).to eq('monthly')
      expect(sub['plan']['name']).to eq('Pro')
      expect(sub['plan']['slug']).to eq('pro')
      expect(sub['cancelAtPeriodEnd']).to be false
      expect(sub['willCancel']).to be false
    end

    it 'returns days until renewal' do
      result = execute(current_user: user)
      sub = result.dig('data', 'mySubscription')
      expect(sub['daysUntilRenewal']).to be_between(28, 30)
    end
  end

  context 'with a trial subscription' do
    before do
      create(:subscription,
             household: household,
             plan: plan,
             status: 'trialing',
             billing_interval: 'annual',
             trial_ends_at: 10.days.from_now,
             current_period_start: Time.current,
             current_period_end: 1.year.from_now)
    end

    it 'returns trial details' do
      result = execute(current_user: user)
      sub = result.dig('data', 'mySubscription')
      expect(sub['status']).to eq('trialing')
      expect(sub['trialActive']).to be true
      expect(sub['trialDaysRemaining']).to be_between(9, 11)
      expect(sub['billingInterval']).to eq('annual')
    end
  end

  context 'with a subscription pending cancellation' do
    before do
      create(:subscription,
             household: household,
             plan: plan,
             status: 'active',
             billing_interval: 'monthly',
             cancel_at_period_end: true,
             cancel_at: 15.days.from_now,
             current_period_end: 15.days.from_now)
    end

    it 'returns cancellation status' do
      result = execute(current_user: user)
      sub = result.dig('data', 'mySubscription')
      expect(sub['cancelAtPeriodEnd']).to be true
      expect(sub['willCancel']).to be true
    end
  end
end
