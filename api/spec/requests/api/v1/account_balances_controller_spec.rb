require 'rails_helper'

RSpec.describe 'API v1 Account Balances', type: :request do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:api_key) { create(:api_key, user: user) }
  let(:headers) { { 'X-Api-Key' => api_key.key } }

  describe 'GET /api/v1/account_balances' do
    it 'returns empty list when no accounts exist' do
      get '/api/v1/account_balances', headers: headers
      expect(response).to have_http_status(:ok)
      expect(json_body['accounts']).to eq([])
    end

    it 'returns account balances with expected fields' do
      create(:account, household: household, name: 'Savings',
             account_type: 'savings',
             current_balance_cents: 250_000, currency: 'USD')

      get '/api/v1/account_balances', headers: headers
      accounts = json_body['accounts']
      expect(accounts.size).to eq(1)
      expect(accounts[0]['name']).to eq('Savings')
      expect(accounts[0]['type']).to eq('savings')
      expect(accounts[0]).to have_key('subtype')
      expect(accounts[0]['balance_cents']).to eq(250_000)
      expect(accounts[0]['balance']).to eq(2_500.0)
      expect(accounts[0]['currency']).to eq('USD')
    end

    it 'excludes hidden accounts' do
      create(:account, household: household, name: 'Visible', is_hidden: false)
      create(:account, household: household, name: 'Hidden', is_hidden: true)

      get '/api/v1/account_balances', headers: headers
      names = json_body['accounts'].map { |a| a['name'] }
      expect(names).to include('Visible')
      expect(names).not_to include('Hidden')
    end

    it 'scopes to current user household only' do
      other_household = create(:household)
      create(:account, household: other_household, name: 'Not Mine')
      create(:account, household: household, name: 'Mine')

      get '/api/v1/account_balances', headers: headers
      names = json_body['accounts'].map { |a| a['name'] }
      expect(names).to eq(['Mine'])
    end
  end

  private

  def json_body
    JSON.parse(response.body)
  end
end
