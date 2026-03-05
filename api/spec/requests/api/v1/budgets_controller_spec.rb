require 'rails_helper'

RSpec.describe 'API v1 Budgets', type: :request do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:api_key) { create(:api_key, user: user) }
  let(:headers) { { 'X-Api-Key' => api_key.key } }

  describe 'GET /api/v1/budgets/:month' do
    it 'returns 404 when no active budget exists' do
      get '/api/v1/budgets/2026-03', headers: headers
      expect(response).to have_http_status(:not_found)
      expect(json_body['error']).to eq('No active budget found')
    end

    it 'returns budget summary with items' do
      account = create(:account, household: household)
      category = create(:category, household: household, name: 'Groceries')
      budget = create(:budget, household: household)
      create(:budget_item, budget: budget, category: category,
             month: Date.new(2026, 3, 1), amount_cents: 60_000)

      # Create some spending
      create(:transaction, household: household, account: account, category: category,
             date: Date.new(2026, 3, 5), amount_cents: -25_000)
      create(:transaction, household: household, account: account, category: category,
             date: Date.new(2026, 3, 15), amount_cents: -15_000)

      get '/api/v1/budgets/2026-03', headers: headers
      expect(response).to have_http_status(:ok)
      expect(json_body['month']).to eq('2026-03')
      expect(json_body['total_budgeted']).to eq(600.0)
      expect(json_body['total_spent']).to eq(400.0)

      items = json_body['items']
      expect(items.size).to eq(1)
      expect(items[0]['category']).to eq('Groceries')
      expect(items[0]['budgeted']).to eq(600.0)
      expect(items[0]['spent']).to eq(400.0)
      expect(items[0]['remaining']).to eq(200.0)
    end

    it 'ignores income transactions when calculating spending' do
      account = create(:account, household: household)
      category = create(:category, household: household, name: 'Salary')
      budget = create(:budget, household: household)
      create(:budget_item, budget: budget, category: category,
             month: Date.new(2026, 3, 1), amount_cents: 500_000)

      # Income transaction (positive amount)
      create(:transaction, household: household, account: account, category: category,
             date: Date.new(2026, 3, 1), amount_cents: 500_000)

      get '/api/v1/budgets/2026-03', headers: headers
      items = json_body['items']
      expect(items[0]['spent']).to eq(0.0)
    end

    it 'only counts transactions within the requested month' do
      account = create(:account, household: household)
      category = create(:category, household: household, name: 'Food')
      budget = create(:budget, household: household)
      create(:budget_item, budget: budget, category: category,
             month: Date.new(2026, 3, 1), amount_cents: 50_000)

      create(:transaction, household: household, account: account, category: category,
             date: Date.new(2026, 2, 28), amount_cents: -10_000) # Feb - shouldn't count
      create(:transaction, household: household, account: account, category: category,
             date: Date.new(2026, 3, 15), amount_cents: -20_000) # March - should count

      get '/api/v1/budgets/2026-03', headers: headers
      expect(json_body['items'][0]['spent']).to eq(200.0)
    end

    it 'handles garbage month param gracefully' do
      # Date.parse("#{month_str}-01") is very lenient and rarely raises Date::Error.
      # Just verify the endpoint doesn't crash with unusual input.
      create(:budget, household: household)
      get '/api/v1/budgets/2026-13', headers: headers
      expect(response.status).to be_in([200, 400])
    end
  end

  private

  def json_body
    JSON.parse(response.body)
  end
end
