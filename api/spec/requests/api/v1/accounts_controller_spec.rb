require 'rails_helper'

RSpec.describe 'API v1 Accounts', type: :request do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:api_key) { create(:api_key, user: user) }
  let(:headers) { { 'X-Api-Key' => api_key.key } }

  describe 'GET /api/v1/accounts' do
    it 'returns an empty list when no accounts exist' do
      get '/api/v1/accounts', headers: headers
      expect(response).to have_http_status(:ok)
      expect(json_body['accounts']).to eq([])
      expect(json_body['count']).to eq(0)
    end

    it 'returns visible accounts with balances' do
      account = create(:account, household: household, name: 'Main Checking',
                       account_type: 'checking', current_balance_cents: 150_000)

      get '/api/v1/accounts', headers: headers
      expect(response).to have_http_status(:ok)

      accounts = json_body['accounts']
      expect(accounts.size).to eq(1)
      expect(accounts[0]['name']).to eq('Main Checking')
      expect(accounts[0]['type']).to eq('checking')
      expect(accounts[0]['balance_cents']).to eq(150_000)
      expect(accounts[0]['balance']).to eq(1500.0)
      expect(accounts[0]['currency']).to eq('USD')
      expect(accounts[0]['asset']).to be true
      expect(accounts[0]['liability']).to be false
    end

    it 'excludes hidden accounts' do
      create(:account, household: household, name: 'Visible', is_hidden: false)
      create(:account, household: household, name: 'Hidden', is_hidden: true)

      get '/api/v1/accounts', headers: headers
      names = json_body['accounts'].map { |a| a['name'] }
      expect(names).to include('Visible')
      expect(names).not_to include('Hidden')
    end

    it 'does not return accounts from other households' do
      other_household = create(:household)
      create(:account, household: other_household, name: 'Other Account')
      create(:account, household: household, name: 'My Account')

      get '/api/v1/accounts', headers: headers
      names = json_body['accounts'].map { |a| a['name'] }
      expect(names).to eq(['My Account'])
    end

    it 'identifies credit cards as liabilities' do
      create(:account, :credit, household: household, name: 'Visa')

      get '/api/v1/accounts', headers: headers
      account = json_body['accounts'].first
      expect(account['asset']).to be false
      expect(account['liability']).to be true
    end

    it 'returns the correct count' do
      3.times { |i| create(:account, household: household, name: "Account #{i}") }

      get '/api/v1/accounts', headers: headers
      expect(json_body['count']).to eq(3)
    end
  end

  private

  def json_body
    JSON.parse(response.body)
  end
end
