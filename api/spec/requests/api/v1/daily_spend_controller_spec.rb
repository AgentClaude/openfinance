require 'rails_helper'

RSpec.describe 'API v1 Daily Spend', type: :request do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:api_key) { create(:api_key, user: user) }
  let(:headers) { { 'X-Api-Key' => api_key.key } }
  let(:account) { create(:account, household: household, name: 'Checking') }
  let(:category) { create(:category, household: household, name: 'Food') }

  describe 'GET /api/v1/daily_spend/:date' do
    it 'returns zeros when no spending on the date' do
      get '/api/v1/daily_spend/2026-03-05', headers: headers
      expect(response).to have_http_status(:ok)
      expect(json_body['date']).to eq('2026-03-05')
      expect(json_body['total']).to eq(0.0)
      expect(json_body['transaction_count']).to eq(0)
      expect(json_body['transactions']).to eq([])
    end

    it 'returns spending breakdown for a date' do
      create(:transaction, household: household, account: account, category: category,
             date: Date.new(2026, 3, 5), merchant_name: 'Trader Joes', amount_cents: -4500)
      create(:transaction, household: household, account: account, category: category,
             date: Date.new(2026, 3, 5), merchant_name: 'Starbucks', amount_cents: -650)

      get '/api/v1/daily_spend/2026-03-05', headers: headers
      expect(json_body['total']).to eq(51.50)
      expect(json_body['total_cents']).to eq(5150)
      expect(json_body['transaction_count']).to eq(2)

      merchants = json_body['transactions'].map { |t| t['merchant'] }
      expect(merchants).to contain_exactly('Trader Joes', 'Starbucks')
    end

    it 'includes category and account in transaction details' do
      create(:transaction, household: household, account: account, category: category,
             date: Date.new(2026, 3, 5), merchant_name: 'Store', amount_cents: -1000)

      get '/api/v1/daily_spend/2026-03-05', headers: headers
      txn = json_body['transactions'].first
      expect(txn['category']).to eq('Food')
      expect(txn['account']).to eq('Checking')
      expect(txn['amount']).to eq(10.0)
    end

    it 'excludes income transactions' do
      create(:transaction, household: household, account: account, category: category,
             date: Date.new(2026, 3, 5), amount_cents: -2000) # expense
      create(:transaction, household: household, account: account, category: category,
             date: Date.new(2026, 3, 5), amount_cents: 50_000) # income

      get '/api/v1/daily_spend/2026-03-05', headers: headers
      expect(json_body['transaction_count']).to eq(1)
      expect(json_body['total']).to eq(20.0)
    end

    it 'only includes transactions for the requested date' do
      create(:transaction, household: household, account: account, category: category,
             date: Date.new(2026, 3, 4), amount_cents: -9999)
      create(:transaction, household: household, account: account, category: category,
             date: Date.new(2026, 3, 5), amount_cents: -1000)

      get '/api/v1/daily_spend/2026-03-05', headers: headers
      expect(json_body['transaction_count']).to eq(1)
    end

    it 'returns 400 for invalid date format' do
      get '/api/v1/daily_spend/not-a-date', headers: headers
      expect(response).to have_http_status(:bad_request)
      expect(json_body['error']).to include('Invalid date')
    end
  end

  private

  def json_body
    JSON.parse(response.body)
  end
end
