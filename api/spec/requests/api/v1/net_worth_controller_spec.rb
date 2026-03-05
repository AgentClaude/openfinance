require 'rails_helper'

RSpec.describe 'API v1 Net Worth', type: :request do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:api_key) { create(:api_key, user: user) }
  let(:headers) { { 'X-Api-Key' => api_key.key } }

  describe 'GET /api/v1/net_worth' do
    it 'returns zero net worth when no accounts exist' do
      get '/api/v1/net_worth', headers: headers
      expect(response).to have_http_status(:ok)
      expect(json_body['net_worth']).to eq(0.0)
      expect(json_body['assets']).to eq(0.0)
      expect(json_body['liabilities']).to eq(0.0)
      expect(json_body['accounts']).to eq([])
    end

    it 'calculates net worth from assets and liabilities' do
      create(:account, household: household, name: 'Checking',
             account_type: 'checking', current_balance_cents: 500_000)
      create(:account, household: household, name: 'Savings',
             account_type: 'savings', current_balance_cents: 1_000_000)
      create(:account, :credit, household: household, name: 'Credit Card',
             current_balance_cents: -200_000)

      get '/api/v1/net_worth', headers: headers
      expect(json_body['assets']).to eq(15_000.0) # 5000 + 10000
      expect(json_body['liabilities']).to eq(-2_000.0)
      expect(json_body['net_worth']).to eq(17_000.0) # assets - liabilities (liabilities are negative)
    end

    it 'includes account breakdown' do
      create(:account, household: household, name: 'Checking',
             account_type: 'checking', current_balance_cents: 100_000)

      get '/api/v1/net_worth', headers: headers
      accounts = json_body['accounts']
      expect(accounts.size).to eq(1)
      expect(accounts[0]['name']).to eq('Checking')
      expect(accounts[0]['balance']).to eq(1_000.0)
      expect(accounts[0]['asset']).to be true
    end

    it 'excludes hidden accounts' do
      create(:account, household: household, name: 'Visible',
             account_type: 'checking', current_balance_cents: 100_000, is_hidden: false)
      create(:account, household: household, name: 'Hidden',
             account_type: 'checking', current_balance_cents: 999_999, is_hidden: true)

      get '/api/v1/net_worth', headers: headers
      expect(json_body['assets']).to eq(1_000.0)
      names = json_body['accounts'].map { |a| a['name'] }
      expect(names).not_to include('Hidden')
    end

    it 'returns cents and dollar amounts' do
      create(:account, household: household, account_type: 'checking',
             current_balance_cents: 123_456)

      get '/api/v1/net_worth', headers: headers
      expect(json_body['net_worth_cents']).to eq(123_456)
      expect(json_body['net_worth']).to eq(1_234.56)
      expect(json_body['assets_cents']).to eq(123_456)
    end
  end

  private

  def json_body
    JSON.parse(response.body)
  end
end
