require 'rails_helper'

RSpec.describe DeliverWebhookJob, type: :job do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:webhook) { create(:webhook_subscription, user: user, household: household, url: 'https://example.com/hook') }

  describe '#perform' do
    it 'delivers webhook payload with HMAC signature' do
      event = create(:webhook_event, webhook_subscription: webhook,
                     payload: { type: 'test', data: { id: 1 } })

      stub = stub_request(:post, 'https://example.com/hook')
        .with(
          headers: {
            'Content-Type' => 'application/json',
            'User-Agent' => 'OpenFinance-Webhooks/1.0'
          }
        )
        .to_return(status: 200, body: 'OK')

      DeliverWebhookJob.new.perform(event.id)

      expect(stub).to have_been_requested
      event.reload
      expect(event.delivery_status).to eq('delivered')
      expect(event.status_code).to eq(200)
      expect(event.delivered_at).not_to be_nil
    end

    it 'includes correct HMAC signature header' do
      event = create(:webhook_event, webhook_subscription: webhook,
                     payload: { type: 'test' })

      expected_payload = event.payload.to_json
      expected_sig = webhook.sign_payload(expected_payload)

      stub_request(:post, 'https://example.com/hook')
        .with(headers: { 'X-Webhook-Signature' => "sha256=#{expected_sig}" })
        .to_return(status: 200)

      DeliverWebhookJob.new.perform(event.id)
    end

    it 'records failure on non-2xx response' do
      event = create(:webhook_event, webhook_subscription: webhook)

      stub_request(:post, 'https://example.com/hook')
        .to_return(status: 500, body: 'Internal Server Error')

      DeliverWebhookJob.new.perform(event.id)

      event.reload
      expect(event.delivery_status).to eq('failed')
      expect(event.error_message).to eq('HTTP 500')
      expect(event.status_code).to eq(500)
    end

    it 'increments subscription failure count on error' do
      event = create(:webhook_event, webhook_subscription: webhook)

      stub_request(:post, 'https://example.com/hook')
        .to_return(status: 500)

      DeliverWebhookJob.new.perform(event.id)

      expect(webhook.reload.failure_count).to eq(1)
    end

    it 'resets failure count on success' do
      webhook.update!(failure_count: 5)
      event = create(:webhook_event, webhook_subscription: webhook)

      stub_request(:post, 'https://example.com/hook')
        .to_return(status: 200)

      DeliverWebhookJob.new.perform(event.id)

      expect(webhook.reload.failure_count).to eq(0)
    end

    it 'handles connection errors gracefully' do
      event = create(:webhook_event, webhook_subscription: webhook)

      stub_request(:post, 'https://example.com/hook')
        .to_raise(SocketError.new('Connection refused'))

      DeliverWebhookJob.new.perform(event.id)

      event.reload
      expect(event.delivery_status).to eq('failed')
      expect(event.error_message).to include('Connection error')
    end

    it 'handles timeout errors gracefully' do
      event = create(:webhook_event, webhook_subscription: webhook)

      stub_request(:post, 'https://example.com/hook')
        .to_raise(Net::ReadTimeout)

      DeliverWebhookJob.new.perform(event.id)

      event.reload
      expect(event.delivery_status).to eq('failed')
      expect(event.error_message).to include('Timeout')
    end

    it 'retries up to 3 attempts with exponential backoff' do
      event = create(:webhook_event, webhook_subscription: webhook, attempt: 1)

      stub_request(:post, 'https://example.com/hook')
        .to_return(status: 500)

      expect {
        DeliverWebhookJob.new.perform(event.id)
      }.to change(WebhookEvent, :count).by(1)
        .and have_enqueued_job(DeliverWebhookJob)

      retry_event = WebhookEvent.order(:created_at).last
      expect(retry_event.attempt).to eq(2)
    end

    it 'does not retry after 3rd attempt' do
      event = create(:webhook_event, webhook_subscription: webhook, attempt: 3)

      stub_request(:post, 'https://example.com/hook')
        .to_return(status: 500)

      expect {
        DeliverWebhookJob.new.perform(event.id)
      }.not_to change(WebhookEvent, :count)
    end

    it 'skips delivery for inactive subscriptions' do
      webhook.update!(is_active: false)
      event = create(:webhook_event, webhook_subscription: webhook)

      DeliverWebhookJob.new.perform(event.id)

      # No HTTP request should be made
      expect(WebMock).not_to have_requested(:post, 'https://example.com/hook')
    end

    it 'handles missing event gracefully' do
      expect { DeliverWebhookJob.new.perform('nonexistent-id') }.not_to raise_error
    end
  end
end
