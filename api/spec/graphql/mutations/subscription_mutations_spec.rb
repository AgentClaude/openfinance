# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Subscription mutations' do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:free_plan) { create(:plan, name: 'Free', slug: 'free', price_cents: 0, annual_price_cents: 0) }
  let(:pro_plan) { create(:plan, name: 'Pro', slug: 'pro', price_cents: 999, annual_price_cents: 9990) }

  def execute(query, variables: {}, current_user: user)
    OpenfinanceSchema.execute(
      query,
      variables: variables,
      context: { current_user: current_user }
    )
  end

  describe 'createSubscription' do
    let(:mutation) do
      <<~GRAPHQL
        mutation($planId: ID!, $billingInterval: String) {
          createSubscription(planId: $planId, billingInterval: $billingInterval) {
            id
            status
            billingInterval
            plan { id name slug }
          }
        }
      GRAPHQL
    end

    context 'with a free plan' do
      it 'creates a subscription without Stripe' do
        result = execute(mutation, variables: { planId: free_plan.id.to_s, billingInterval: 'monthly' })
        sub = result.dig('data', 'createSubscription')
        expect(sub).to be_present
        expect(sub['status']).to eq('active')
        expect(sub['plan']['slug']).to eq('free')
      end
    end

    context 'with a paid plan' do
      before do
        stripe_customer = double('Stripe::Customer', id: 'cus_test123')
        stripe_sub = double('Stripe::Subscription',
                            id: 'sub_test123',
                            status: 'trialing',
                            trial_end: 14.days.from_now.to_i,
                            current_period_start: Time.current.to_i,
                            current_period_end: 30.days.from_now.to_i)
        allow(Stripe::Customer).to receive(:create).and_return(stripe_customer)
        allow(Stripe::Subscription).to receive(:create).and_return(stripe_sub)
      end

      it 'creates a Stripe subscription with trial' do
        result = execute(mutation, variables: { planId: pro_plan.id.to_s, billingInterval: 'monthly' })
        sub = result.dig('data', 'createSubscription')
        expect(sub).to be_present
        expect(sub['status']).to eq('trialing')
        expect(sub['plan']['slug']).to eq('pro')
      end
    end

    context 'when household already has a subscription' do
      before { create(:subscription, household: household, plan: free_plan) }

      it 'returns an error' do
        result = execute(mutation, variables: { planId: pro_plan.id.to_s })
        expect(result['errors']).to be_present
        expect(result['errors'].first['message']).to include('already has a subscription')
      end
    end
  end

  describe 'cancelSubscription' do
    let(:mutation) do
      <<~GRAPHQL
        mutation($atPeriodEnd: Boolean) {
          cancelSubscription(atPeriodEnd: $atPeriodEnd) {
            id
            status
            cancelAtPeriodEnd
            willCancel
          }
        }
      GRAPHQL
    end

    context 'with an active paid subscription' do
      let!(:subscription) do
        create(:subscription,
               household: household,
               plan: pro_plan,
               status: 'active',
               billing_interval: 'monthly',
               current_period_end: 15.days.from_now,
               stripe_subscription_id: 'sub_test456')
      end

      before do
        allow(Stripe::Subscription).to receive(:update)
      end

      it 'cancels at period end' do
        result = execute(mutation, variables: { atPeriodEnd: true })
        sub = result.dig('data', 'cancelSubscription')
        expect(sub['cancelAtPeriodEnd']).to be true
        expect(sub['willCancel']).to be true
      end
    end

    context 'without a subscription' do
      it 'returns an error' do
        result = execute(mutation, variables: { atPeriodEnd: true })
        expect(result['errors']).to be_present
      end
    end
  end

  describe 'changePlan' do
    let(:team_plan) { create(:plan, name: 'Team', slug: 'team', price_cents: 1999, annual_price_cents: 19990) }

    let(:mutation) do
      <<~GRAPHQL
        mutation($planId: ID!, $billingInterval: String) {
          changePlan(planId: $planId, billingInterval: $billingInterval) {
            id
            plan { id name slug }
            billingInterval
          }
        }
      GRAPHQL
    end

    context 'upgrading from free to free (downgrade to free)' do
      let!(:subscription) do
        create(:subscription,
               household: household,
               plan: pro_plan,
               status: 'active',
               stripe_subscription_id: 'sub_existing')
      end

      before do
        allow(Stripe::Subscription).to receive(:cancel)
      end

      it 'downgrades to free plan' do
        result = execute(mutation, variables: { planId: free_plan.id.to_s })
        sub = result.dig('data', 'changePlan')
        expect(sub['plan']['slug']).to eq('free')
      end
    end

    context 'when already on the same plan' do
      let!(:subscription) { create(:subscription, household: household, plan: pro_plan) }

      it 'returns an error' do
        result = execute(mutation, variables: { planId: pro_plan.id.to_s })
        expect(result['errors']).to be_present
        expect(result['errors'].first['message']).to include('Already on this plan')
      end
    end
  end

  describe 'reactivateSubscription' do
    let(:mutation) do
      <<~GRAPHQL
        mutation {
          reactivateSubscription {
            id
            cancelAtPeriodEnd
            willCancel
          }
        }
      GRAPHQL
    end

    context 'with a subscription pending cancellation' do
      let!(:subscription) do
        create(:subscription,
               household: household,
               plan: pro_plan,
               status: 'active',
               cancel_at_period_end: true,
               cancel_at: 15.days.from_now,
               stripe_subscription_id: 'sub_reactivate')
      end

      before do
        allow(Stripe::Subscription).to receive(:update)
      end

      it 'reactivates the subscription' do
        result = execute(mutation)
        sub = result.dig('data', 'reactivateSubscription')
        expect(sub['cancelAtPeriodEnd']).to be false
        expect(sub['willCancel']).to be false
      end
    end
  end
end
