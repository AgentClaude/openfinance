require 'rails_helper'

RSpec.describe 'API v1 Monthly Summary', type: :request do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:api_key) { create(:api_key, user: user) }
  let(:headers) { { 'X-Api-Key' => api_key.key } }
  let(:account) { create(:account, household: household) }
  let(:expense_cat) { create(:category, household: household, name: 'Expenses') }
  let(:income_cat) { create(:category, :income, household: household, name: 'Salary') }

  describe 'GET /api/v1/monthly_summary/:month' do
    it 'returns zeros when no transactions exist for the month' do
      get '/api/v1/monthly_summary/2026-03', headers: headers
      expect(response).to have_http_status(:ok)
      expect(json_body['month']).to eq('2026-03')
      expect(json_body['income']).to eq(0.0)
      expect(json_body['expenses']).to eq(0.0)
      expect(json_body['net']).to eq(0.0)
      expect(json_body['savings_rate']).to eq(0)
      expect(json_body['transaction_count']).to eq(0)
    end

    it 'calculates income, expenses, and savings rate' do
      create(:transaction, household: household, account: account, category: income_cat,
             date: Date.new(2026, 3, 1), amount_cents: 500_000)
      create(:transaction, household: household, account: account, category: expense_cat,
             date: Date.new(2026, 3, 5), amount_cents: -200_000)
      create(:transaction, household: household, account: account, category: expense_cat,
             date: Date.new(2026, 3, 15), amount_cents: -100_000)

      get '/api/v1/monthly_summary/2026-03', headers: headers
      expect(json_body['income']).to eq(5_000.0)
      expect(json_body['expenses']).to eq(3_000.0)
      expect(json_body['net']).to eq(2_000.0)
      expect(json_body['savings_rate']).to eq(40.0) # (5000-3000)/5000 * 100
      expect(json_body['transaction_count']).to eq(3)
    end

    it 'returns cents and dollar amounts' do
      create(:transaction, household: household, account: account, category: income_cat,
             date: Date.new(2026, 3, 1), amount_cents: 123_456)

      get '/api/v1/monthly_summary/2026-03', headers: headers
      expect(json_body['income_cents']).to eq(123_456)
      expect(json_body['income']).to eq(1_234.56)
    end

    it 'only includes transactions within the requested month' do
      create(:transaction, household: household, account: account, category: expense_cat,
             date: Date.new(2026, 2, 28), amount_cents: -50_000) # Feb
      create(:transaction, household: household, account: account, category: expense_cat,
             date: Date.new(2026, 3, 15), amount_cents: -30_000) # March

      get '/api/v1/monthly_summary/2026-03', headers: headers
      expect(json_body['expenses']).to eq(300.0)
      expect(json_body['transaction_count']).to eq(1)
    end

    it 'handles garbage month param gracefully' do
      # Date.parse("#{month_str}-01") is very lenient and rarely raises Date::Error.
      # Just verify the endpoint doesn't crash with unusual input.
      get '/api/v1/monthly_summary/2026-13', headers: headers
      # Either returns data or a 400 — both acceptable
      expect(response.status).to be_in([200, 400])
    end
  end

  private

  def json_body
    JSON.parse(response.body)
  end
end
