require 'rails_helper'

RSpec.describe 'API v1 Embed Widgets', type: :request do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }

  describe 'GET /api/v1/embed/net_worth' do
    it 'returns net worth data with a valid share token' do
      share_token = create(:share_token, user: user, widget_type: 'net_worth')
      create(:account, household: household, account_type: 'checking', current_balance_cents: 500_000)
      create(:account, :credit, household: household, current_balance_cents: -50_000)

      get '/api/v1/embed/net_worth', params: { token: share_token.token }
      expect(response).to have_http_status(:ok)
      expect(json_body['net_worth']).to be_a(Numeric)
      expect(json_body['assets']).to eq(5_000.0)
      expect(json_body['liabilities']).to eq(-500.0)
      expect(json_body).to have_key('updated_at')
    end

    it 'returns 404 for invalid token' do
      get '/api/v1/embed/net_worth', params: { token: 'bad-token' }
      expect(response).to have_http_status(:not_found)
      expect(json_body['error']).to include('Invalid or expired')
    end

    it 'returns 404 for expired token' do
      share_token = create(:share_token, user: user, widget_type: 'net_worth', expires_at: 1.day.ago)
      get '/api/v1/embed/net_worth', params: { token: share_token.token }
      expect(response).to have_http_status(:not_found)
    end

    it 'returns 404 when using a spending token for net_worth endpoint' do
      share_token = create(:share_token, user: user, widget_type: 'spending')
      get '/api/v1/embed/net_worth', params: { token: share_token.token }
      expect(response).to have_http_status(:not_found)
    end

    it 'does not require X-Api-Key header' do
      share_token = create(:share_token, user: user, widget_type: 'net_worth')
      get '/api/v1/embed/net_worth', params: { token: share_token.token }
      expect(response).to have_http_status(:ok)
    end
  end

  describe 'GET /api/v1/embed/spending' do
    it 'returns spending data with a valid share token' do
      share_token = create(:share_token, user: user, widget_type: 'spending')
      account = create(:account, household: household)
      category = create(:category, household: household)
      create(:transaction, household: household, account: account, category: category,
             date: Date.current, amount_cents: -3500)

      get '/api/v1/embed/spending', params: { token: share_token.token }
      expect(response).to have_http_status(:ok)
      expect(json_body['month']).to eq(Date.current.strftime('%Y-%m'))
      expect(json_body['total_spent']).to eq(35.0)
      expect(json_body['transaction_count']).to eq(1)
      expect(json_body).to have_key('updated_at')
    end

    it 'returns 404 for invalid token' do
      get '/api/v1/embed/spending', params: { token: 'bad-token' }
      expect(response).to have_http_status(:not_found)
    end

    it 'excludes income from spending total' do
      share_token = create(:share_token, user: user, widget_type: 'spending')
      account = create(:account, household: household)
      category = create(:category, household: household)
      create(:transaction, household: household, account: account, category: category,
             date: Date.current, amount_cents: -2000) # expense
      create(:transaction, household: household, account: account, category: category,
             date: Date.current, amount_cents: 100_000) # income

      get '/api/v1/embed/spending', params: { token: share_token.token }
      expect(json_body['total_spent']).to eq(20.0)
      expect(json_body['transaction_count']).to eq(1)
    end
  end

  private

  def json_body
    JSON.parse(response.body)
  end
end
