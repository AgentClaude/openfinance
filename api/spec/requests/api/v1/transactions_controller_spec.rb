require 'rails_helper'

RSpec.describe 'API v1 Transactions', type: :request do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:api_key) { create(:api_key, user: user) }
  let(:headers) { { 'X-Api-Key' => api_key.key } }
  let(:account) { create(:account, household: household) }
  let(:category) { create(:category, household: household, name: 'Groceries') }

  describe 'GET /api/v1/transactions' do
    it 'returns an empty list when no transactions exist' do
      get '/api/v1/transactions', headers: headers
      expect(response).to have_http_status(:ok)
      expect(json_body['transactions']).to eq([])
      expect(json_body['total']).to eq(0)
    end

    it 'returns transactions with all expected fields' do
      txn = create(:transaction, household: household, account: account, category: category,
                   date: Date.new(2026, 3, 1), merchant_name: 'Whole Foods',
                   amount_cents: -5000, is_pending: false)

      get '/api/v1/transactions', headers: headers
      items = json_body['transactions']
      expect(items.size).to eq(1)
      expect(items[0]['date']).to eq('2026-03-01')
      expect(items[0]['merchant']).to eq('Whole Foods')
      expect(items[0]['amount_cents']).to eq(-5000)
      expect(items[0]['amount']).to eq(-50.0)
      expect(items[0]['category']).to eq('Groceries')
      expect(items[0]['pending']).to be false
    end

    it 'defaults to 50 results' do
      get '/api/v1/transactions', headers: headers
      expect(json_body['limit']).to eq(50)
    end

    it 'caps limit at 200' do
      get '/api/v1/transactions', params: { limit: 500 }, headers: headers
      expect(json_body['limit']).to eq(200)
    end

    it 'supports pagination with offset' do
      5.times { |i| create(:transaction, household: household, account: account, category: category, date: Date.new(2026, 3, 5 - i)) }

      get '/api/v1/transactions', params: { limit: 2, offset: 0 }, headers: headers
      expect(json_body['transactions'].size).to eq(2)
      expect(json_body['total']).to eq(5)

      get '/api/v1/transactions', params: { limit: 2, offset: 2 }, headers: headers
      expect(json_body['transactions'].size).to eq(2)
      expect(json_body['offset']).to eq(2)
    end

    it 'filters by start_date' do
      create(:transaction, household: household, account: account, category: category, date: Date.new(2026, 2, 15))
      create(:transaction, household: household, account: account, category: category, date: Date.new(2026, 3, 5))

      get '/api/v1/transactions', params: { start_date: '2026-03-01' }, headers: headers
      expect(json_body['transactions'].size).to eq(1)
      expect(json_body['transactions'][0]['date']).to eq('2026-03-05')
    end

    it 'filters by end_date' do
      create(:transaction, household: household, account: account, category: category, date: Date.new(2026, 2, 15))
      create(:transaction, household: household, account: account, category: category, date: Date.new(2026, 3, 5))

      get '/api/v1/transactions', params: { end_date: '2026-02-28' }, headers: headers
      expect(json_body['transactions'].size).to eq(1)
      expect(json_body['transactions'][0]['date']).to eq('2026-02-15')
    end

    it 'filters by category name' do
      other_cat = create(:category, household: household, name: 'Dining')
      create(:transaction, household: household, account: account, category: category, merchant_name: 'Store')
      create(:transaction, household: household, account: account, category: other_cat, merchant_name: 'Restaurant')

      get '/api/v1/transactions', params: { category: 'Groceries' }, headers: headers
      expect(json_body['transactions'].size).to eq(1)
      expect(json_body['transactions'][0]['merchant']).to eq('Store')
    end

    it 'filters by account_id' do
      other_account = create(:account, household: household)
      create(:transaction, household: household, account: account, category: category)
      create(:transaction, household: household, account: other_account, category: category)

      get '/api/v1/transactions', params: { account_id: account.id }, headers: headers
      expect(json_body['transactions'].size).to eq(1)
    end

    it 'returns 400 for invalid date format' do
      get '/api/v1/transactions', params: { start_date: 'not-a-date' }, headers: headers
      expect(response).to have_http_status(:bad_request)
      expect(json_body['error']).to include('Invalid date')
    end

    it 'does not return transactions from other households' do
      other_household = create(:household)
      other_account = create(:account, household: other_household)
      other_category = create(:category, household: other_household)
      create(:transaction, household: other_household, account: other_account, category: other_category)
      create(:transaction, household: household, account: account, category: category)

      get '/api/v1/transactions', headers: headers
      expect(json_body['total']).to eq(1)
    end
  end

  private

  def json_body
    JSON.parse(response.body)
  end
end
