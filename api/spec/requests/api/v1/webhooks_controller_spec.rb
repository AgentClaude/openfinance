require 'rails_helper'

RSpec.describe "Api::V1::Webhooks", type: :request do
  let(:user) { create(:user) }
  let(:api_key) { create(:api_key, user: user) }
  let(:headers) { { 'X-Api-Key' => api_key.key } }

  describe "GET /api/v1/webhooks" do
    it "returns user's webhook subscriptions" do
      create(:webhook_subscription, user: user, url: 'https://example.com/hook1')
      create(:webhook_subscription, user: user, url: 'https://example.com/hook2')

      get '/api/v1/webhooks', headers: headers

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['count']).to eq(2)
      expect(json['supported_events']).to include('transaction.created')
    end

    it "does not return other users' webhooks" do
      other_user = create(:user)
      create(:webhook_subscription, user: other_user)
      create(:webhook_subscription, user: user)

      get '/api/v1/webhooks', headers: headers

      json = JSON.parse(response.body)
      expect(json['count']).to eq(1)
    end
  end

  describe "POST /api/v1/webhooks" do
    it "creates a webhook subscription" do
      post '/api/v1/webhooks', headers: headers, params: {
        url: 'https://myapp.com/webhooks',
        events: ['transaction.created', 'budget.exceeded']
      }

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json['webhook']['url']).to eq('https://myapp.com/webhooks')
      expect(json['webhook']['events']).to contain_exactly('transaction.created', 'budget.exceeded')
      expect(json['webhook']['secret']).to start_with('whsec_')
    end

    it "rejects non-HTTPS URLs" do
      post '/api/v1/webhooks', headers: headers, params: {
        url: 'http://insecure.com/webhooks',
        events: ['transaction.created']
      }

      expect(response).to have_http_status(:unprocessable_entity)
    end

    it "rejects unsupported events" do
      post '/api/v1/webhooks', headers: headers, params: {
        url: 'https://myapp.com/webhooks',
        events: ['invalid.event']
      }

      expect(response).to have_http_status(:unprocessable_entity)
    end

    it "rejects missing URL" do
      post '/api/v1/webhooks', headers: headers, params: {
        events: ['transaction.created']
      }

      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe "GET /api/v1/webhooks/:id" do
    it "returns webhook details with recent deliveries" do
      sub = create(:webhook_subscription, user: user)
      create(:webhook_delivery, webhook_subscription: sub, success: true)
      create(:webhook_delivery, :failed, webhook_subscription: sub)

      get "/api/v1/webhooks/#{sub.id}", headers: headers

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['webhook']['id']).to eq(sub.id)
      expect(json['recent_deliveries'].size).to eq(2)
    end

    it "returns 404 for another user's webhook" do
      other_sub = create(:webhook_subscription, user: create(:user))

      get "/api/v1/webhooks/#{other_sub.id}", headers: headers

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "PATCH /api/v1/webhooks/:id" do
    it "updates the webhook URL and events" do
      sub = create(:webhook_subscription, user: user)

      patch "/api/v1/webhooks/#{sub.id}", headers: headers, params: {
        url: 'https://newurl.com/hook',
        events: ['bill.upcoming', 'goal.achieved']
      }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['webhook']['url']).to eq('https://newurl.com/hook')
      expect(json['webhook']['events']).to contain_exactly('bill.upcoming', 'goal.achieved')
    end

    it "can deactivate a webhook" do
      sub = create(:webhook_subscription, user: user)

      patch "/api/v1/webhooks/#{sub.id}", headers: headers, params: { is_active: false }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['webhook']['is_active']).to be false
    end
  end

  describe "DELETE /api/v1/webhooks/:id" do
    it "deletes the webhook subscription" do
      sub = create(:webhook_subscription, user: user)

      expect {
        delete "/api/v1/webhooks/#{sub.id}", headers: headers
      }.to change(WebhookSubscription, :count).by(-1)

      expect(response).to have_http_status(:ok)
    end
  end

  describe "POST /api/v1/webhooks/:id/test" do
    it "queues a test delivery" do
      sub = create(:webhook_subscription, user: user)

      expect {
        post "/api/v1/webhooks/#{sub.id}/test", headers: headers
      }.to have_enqueued_job(DeliverWebhookJob)

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['message'].downcase).to include('test')
    end
  end
end
