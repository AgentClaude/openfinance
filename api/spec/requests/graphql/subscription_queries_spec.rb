require 'rails_helper'

RSpec.describe 'Subscription GraphQL Queries', type: :request do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household, role: 'owner') }
  let(:headers) { auth_headers(user).merge('Content-Type' => 'application/json') }

  describe 'plans query' do
    let!(:free_plan) { create(:plan, :free, slug: 'free-q', name: 'Free Q') }
    let!(:pro_plan) { create(:plan, slug: 'pro-q', name: 'Pro Q') }
    let!(:inactive_plan) { create(:plan, :inactive, slug: 'inactive-q', name: 'Inactive Q') }

    let(:query) do
      <<~GQL
        query {
          plans {
            id
            name
            slug
            monthlyPrice
            annualPrice
            annualMonthlyPrice
            annualSavingsPercentage
            maxAccounts
            maxTransactions
            hasReports
            hasBudgets
            hasGoals
            featureList
          }
        }
      GQL
    end

    it 'returns active plans ordered by position' do
      post '/graphql', params: { query: query }.to_json, headers: headers
      expect(response).to have_http_status(:ok)

      data = JSON.parse(response.body)['data']['plans']
      slugs = data.map { |p| p['slug'] }
      expect(slugs).to include('free-q', 'pro-q')
      expect(slugs).not_to include('inactive-q')
    end

    it 'returns correct pricing data' do
      post '/graphql', params: { query: query }.to_json, headers: headers
      data = JSON.parse(response.body)['data']['plans']
      pro = data.find { |p| p['slug'] == 'pro-q' }
      expect(pro['monthlyPrice']).to eq(9.99)
      expect(pro['annualPrice']).to eq(99.9)
      expect(pro['featureList']).to be_an(Array)
    end
  end

  describe 'mySubscription query' do
    let!(:plan) { create(:plan, slug: 'pro-sub-q', name: 'Pro Sub Q') }
    let!(:subscription) { create(:subscription, household: household, plan: plan) }

    let(:query) do
      <<~GQL
        query {
          mySubscription {
            id
            status
            billingInterval
            trialActive
            trialDaysRemaining
            daysUntilRenewal
            willCancel
            plan {
              name
              slug
              monthlyPrice
            }
          }
        }
      GQL
    end

    it 'returns the household subscription' do
      post '/graphql', params: { query: query }.to_json, headers: headers
      expect(response).to have_http_status(:ok)

      body = JSON.parse(response.body)
      expect(body['errors']).to be_nil, "GraphQL errors: #{body['errors']&.map { |e| e['message'] }}"
      data = body['data']['mySubscription']
      expect(data['status']).to eq('active')
      expect(data['plan']['name']).to eq('Pro Sub Q')
      expect(data['willCancel']).to be false
    end

    context 'without a subscription' do
      before { subscription.destroy! }

      it 'returns null' do
        post '/graphql', params: { query: query }.to_json, headers: headers
        data = JSON.parse(response.body)['data']['mySubscription']
        expect(data).to be_nil
      end
    end
  end
end
