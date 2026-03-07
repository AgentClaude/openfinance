require 'rails_helper'

RSpec.describe 'API v1 Webhooks', type: :request do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:api_key) { create(:api_key, user: user) }
  let(:headers) { { 'X-Api-Key' => api_key.key } }

  describe 'GET /api/v1/webhooks' do
    it 'returns an empty list when no webhooks exist' do
      get '/api/v1/webhooks', headers: headers
      expect(response).to have_http_status(:ok)
      expect(json_body['webhooks']).to eq([])
      expect(json_body['count']).to eq(0)
    end

    it 'returns user webhooks' do
      webhook = create(:webhook_subscription, user: user, household: household)

      get '/api/v1/webhooks', headers: headers
      expect(response).to have_http_status(:ok)
      expect(json_body['webhooks'].size).to eq(1)
      expect(json_body['webhooks'][0]['name']).to eq(webhook.name)
      expect(json_body['webhooks'][0]['url']).to eq(webhook.url)
      expect(json_body['webhooks'][0]['events']).to eq(webhook.events)
      # Secret should NOT be included in list view
      expect(json_body['webhooks'][0]).not_to have_key('secret')
    end

    it 'does not return other users webhooks' do
      other_user = create(:user, household: household)
      create(:webhook_subscription, user: other_user, household: household)

      get '/api/v1/webhooks', headers: headers
      expect(json_body['webhooks']).to eq([])
    end
  end

  describe 'GET /api/v1/webhooks/:id' do
    it 'returns a single webhook with secret' do
      webhook = create(:webhook_subscription, user: user, household: household)

      get "/api/v1/webhooks/#{webhook.id}", headers: headers
      expect(response).to have_http_status(:ok)
      expect(json_body['webhook']['id']).to eq(webhook.id)
      expect(json_body['webhook']['secret']).to eq(webhook.secret)
    end

    it 'returns 404 for other users webhook' do
      other_user = create(:user, household: household)
      webhook = create(:webhook_subscription, user: other_user, household: household)

      get "/api/v1/webhooks/#{webhook.id}", headers: headers
      expect(response).to have_http_status(:not_found)
    end
  end

  describe 'POST /api/v1/webhooks' do
    let(:valid_params) do
      {
        name: 'My Webhook',
        url: 'https://example.com/webhook',
        events: ['transaction.created', 'budget.exceeded']
      }
    end

    it 'creates a webhook' do
      post '/api/v1/webhooks', params: valid_params, headers: headers
      expect(response).to have_http_status(:created)
      expect(json_body['webhook']['name']).to eq('My Webhook')
      expect(json_body['webhook']['url']).to eq('https://example.com/webhook')
      expect(json_body['webhook']['events']).to eq(['transaction.created', 'budget.exceeded'])
      expect(json_body['webhook']['secret']).to start_with('whsec_')
      expect(json_body['webhook']['is_active']).to be true
    end

    it 'rejects non-HTTPS URLs' do
      post '/api/v1/webhooks', params: valid_params.merge(url: 'http://example.com/webhook'), headers: headers
      expect(response).to have_http_status(:unprocessable_entity)
      expect(json_body['errors']).to include(a_string_matching(/HTTPS/i))
    end

    it 'rejects unsupported events' do
      post '/api/v1/webhooks', params: valid_params.merge(events: ['invalid.event']), headers: headers
      expect(response).to have_http_status(:unprocessable_entity)
      expect(json_body['errors']).to include(a_string_matching(/unsupported/i))
    end

    it 'rejects missing name' do
      post '/api/v1/webhooks', params: valid_params.merge(name: ''), headers: headers
      expect(response).to have_http_status(:unprocessable_entity)
    end

    it 'rejects missing events' do
      post '/api/v1/webhooks', params: valid_params.merge(events: []), headers: headers
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe 'PATCH /api/v1/webhooks/:id' do
    let!(:webhook) { create(:webhook_subscription, user: user, household: household) }

    it 'updates webhook name' do
      patch "/api/v1/webhooks/#{webhook.id}", params: { name: 'Updated Name' }, headers: headers
      expect(response).to have_http_status(:ok)
      expect(json_body['webhook']['name']).to eq('Updated Name')
    end

    it 'can deactivate a webhook' do
      patch "/api/v1/webhooks/#{webhook.id}", params: { is_active: false }, headers: headers
      expect(response).to have_http_status(:ok)
      expect(json_body['webhook']['is_active']).to be false
    end

    it 'can update events list' do
      patch "/api/v1/webhooks/#{webhook.id}", params: { events: ['account.synced'] }, headers: headers
      expect(response).to have_http_status(:ok)
      expect(json_body['webhook']['events']).to eq(['account.synced'])
    end
  end

  describe 'DELETE /api/v1/webhooks/:id' do
    it 'deletes a webhook' do
      webhook = create(:webhook_subscription, user: user, household: household)

      expect {
        delete "/api/v1/webhooks/#{webhook.id}", headers: headers
      }.to change(WebhookSubscription, :count).by(-1)

      expect(response).to have_http_status(:ok)
    end

    it 'returns 404 for other users webhook' do
      other_user = create(:user, household: household)
      webhook = create(:webhook_subscription, user: other_user, household: household)

      delete "/api/v1/webhooks/#{webhook.id}", headers: headers
      expect(response).to have_http_status(:not_found)
    end
  end

  describe 'POST /api/v1/webhooks/:id/test' do
    it 'queues a test webhook delivery' do
      webhook = create(:webhook_subscription, user: user, household: household)

      expect {
        post "/api/v1/webhooks/#{webhook.id}/test", headers: headers
      }.to change(WebhookEvent, :count).by(1)
        .and have_enqueued_job(DeliverWebhookJob)

      expect(response).to have_http_status(:ok)
      expect(json_body['message']).to eq('Test webhook queued')
    end
  end

  describe 'GET /api/v1/webhooks/:id/events' do
    it 'returns webhook delivery history' do
      webhook = create(:webhook_subscription, user: user, household: household)
      event = create(:webhook_event, webhook_subscription: webhook,
                     event_type: 'transaction.created', delivery_status: 'delivered',
                     status_code: 200, response_time_ms: 45.2)

      get "/api/v1/webhooks/#{webhook.id}/events", headers: headers
      expect(response).to have_http_status(:ok)
      expect(json_body['events'].size).to eq(1)
      expect(json_body['events'][0]['event_type']).to eq('transaction.created')
      expect(json_body['events'][0]['delivery_status']).to eq('delivered')
      expect(json_body['events'][0]['status_code']).to eq(200)
    end

    it 'returns events in reverse chronological order' do
      webhook = create(:webhook_subscription, user: user, household: household)
      old_event = create(:webhook_event, webhook_subscription: webhook,
                         event_type: 'transaction.created', created_at: 2.hours.ago)
      new_event = create(:webhook_event, webhook_subscription: webhook,
                         event_type: 'budget.exceeded', created_at: 1.hour.ago)

      get "/api/v1/webhooks/#{webhook.id}/events", headers: headers
      event_types = json_body['events'].map { |e| e['event_type'] }
      expect(event_types).to eq(['budget.exceeded', 'transaction.created'])
    end

    it 'respects limit parameter' do
      webhook = create(:webhook_subscription, user: user, household: household)
      5.times { create(:webhook_event, webhook_subscription: webhook, event_type: 'transaction.created') }

      get "/api/v1/webhooks/#{webhook.id}/events", params: { limit: 2 }, headers: headers
      expect(json_body['events'].size).to eq(2)
    end
  end

  private

  def json_body
    JSON.parse(response.body)
  end
end
