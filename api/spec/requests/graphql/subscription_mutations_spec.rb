require 'rails_helper'

RSpec.describe 'Subscription GraphQL Mutations', type: :request do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household, role: 'owner') }
  let(:headers) { auth_headers(user).merge('Content-Type' => 'application/json') }

  describe 'createSubscription' do
    let!(:free_plan) { create(:plan, :free, slug: 'free-mut', name: 'Free Mut') }

    let(:mutation) do
      <<~GQL
        mutation($planId: ID!, $billingInterval: String) {
          createSubscription(planId: $planId, billingInterval: $billingInterval) {
            id
            status
            billingInterval
            plan {
              name
              slug
            }
          }
        }
      GQL
    end

    it 'creates a free subscription' do
      post '/graphql',
        params: { query: mutation, variables: { planId: free_plan.id, billingInterval: 'monthly' } }.to_json,
        headers: headers

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['errors']).to be_nil, "GraphQL errors: #{body['errors']&.map { |e| e['message'] }}"
      data = body['data']['createSubscription']
      expect(data['status']).to eq('active')
      expect(data['plan']['slug']).to eq('free-mut')
    end

    it 'fails when household already has subscription' do
      create(:subscription, household: household, plan: free_plan)

      post '/graphql',
        params: { query: mutation, variables: { planId: free_plan.id } }.to_json,
        headers: headers

      body = JSON.parse(response.body)
      expect(body['errors']).to be_present
    end
  end

  describe 'cancelSubscription' do
    let!(:plan) { create(:plan, slug: 'pro-cancel-mut', name: 'Pro Cancel Mut') }
    let!(:subscription) { create(:subscription, :with_stripe, household: household, plan: plan) }

    let(:mutation) do
      <<~GQL
        mutation($atPeriodEnd: Boolean) {
          cancelSubscription(atPeriodEnd: $atPeriodEnd) {
            id
            status
            cancelAtPeriodEnd
            willCancel
          }
        }
      GQL
    end

    before do
      allow(Stripe::Subscription).to receive(:update).and_return(true)
      allow(Stripe::Subscription).to receive(:cancel).and_return(true)
    end

    it 'cancels subscription at period end' do
      post '/graphql',
        params: { query: mutation, variables: { atPeriodEnd: true } }.to_json,
        headers: headers

      data = JSON.parse(response.body)['data']['cancelSubscription']
      expect(data['cancelAtPeriodEnd']).to be true
      expect(data['willCancel']).to be true
    end
  end

  describe 'changePlan' do
    let!(:pro_plan) { create(:plan, slug: 'pro-change-mut', name: 'Pro Change Mut') }
    let!(:free_plan) { create(:plan, :free, slug: 'free-change-mut', name: 'Free Change Mut') }
    let!(:subscription) { create(:subscription, :with_stripe, household: household, plan: pro_plan) }

    let(:mutation) do
      <<~GQL
        mutation($planId: ID!) {
          changePlan(planId: $planId) {
            id
            status
            plan {
              name
              slug
            }
          }
        }
      GQL
    end

    before do
      allow(Stripe::Subscription).to receive(:cancel).and_return(true)
    end

    it 'downgrades to free plan' do
      post '/graphql',
        params: { query: mutation, variables: { planId: free_plan.id } }.to_json,
        headers: headers

      data = JSON.parse(response.body)['data']['changePlan']
      expect(data['plan']['slug']).to eq('free-change-mut')
      expect(data['status']).to eq('active')
    end
  end

  describe 'reactivateSubscription' do
    let!(:plan) { create(:plan, slug: 'pro-react-mut', name: 'Pro React Mut') }
    let!(:subscription) { create(:subscription, :will_cancel, :with_stripe, household: household, plan: plan) }

    let(:mutation) do
      <<~GQL
        mutation {
          reactivateSubscription {
            id
            cancelAtPeriodEnd
            willCancel
          }
        }
      GQL
    end

    before do
      allow(Stripe::Subscription).to receive(:update).and_return(true)
    end

    it 'reactivates subscription' do
      post '/graphql',
        params: { query: mutation }.to_json,
        headers: headers

      data = JSON.parse(response.body)['data']['reactivateSubscription']
      expect(data['cancelAtPeriodEnd']).to be false
      expect(data['willCancel']).to be false
    end
  end
end
