require 'rails_helper'

RSpec.describe 'API v1 Authentication', type: :request do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:api_key) { create(:api_key, user: user) }

  describe 'X-Api-Key header authentication' do
    it 'returns 401 when no API key is provided' do
      get '/api/v1/accounts'
      expect(response).to have_http_status(:unauthorized)
      expect(json_body['error']).to eq('Missing API key')
    end

    it 'returns 401 when an invalid API key is provided' do
      get '/api/v1/accounts', headers: { 'X-Api-Key' => 'invalid-key-123' }
      expect(response).to have_http_status(:unauthorized)
      expect(json_body['error']).to eq('Invalid or revoked API key')
    end

    it 'returns 401 when a revoked API key is provided' do
      api_key.revoke!
      get '/api/v1/accounts', headers: { 'X-Api-Key' => api_key.key }
      expect(response).to have_http_status(:unauthorized)
      expect(json_body['error']).to eq('Invalid or revoked API key')
    end

    it 'authenticates successfully with a valid API key' do
      get '/api/v1/accounts', headers: { 'X-Api-Key' => api_key.key }
      expect(response).to have_http_status(:ok)
    end

    it 'updates last_used_at on the API key' do
      expect { get '/api/v1/accounts', headers: { 'X-Api-Key' => api_key.key } }
        .to change { api_key.reload.last_used_at }
    end

    it 'includes rate limit headers in response' do
      get '/api/v1/accounts', headers: { 'X-Api-Key' => api_key.key }
      expect(response.headers['X-RateLimit-Limit']).to eq('60')
    end
  end

  private

  def json_body
    JSON.parse(response.body)
  end
end
