require 'rails_helper'

RSpec.describe DeliverWebhookJob, type: :job do
  let(:subscription) { create(:webhook_subscription) }

  describe '#perform' do
    it 'sends HTTP POST to the webhook URL' do
      stub_request(:post, subscription.url)
        .to_return(status: 200, body: 'OK')

      described_class.new.perform(subscription.id, 'transaction.created', { amount: 42.50 })

      expect(WebMock).to have_requested(:post, subscription.url)
        .with { |req|
          body = JSON.parse(req.body)
          body['event'] == 'transaction.created' &&
            body['data']['amount'] == 42.50 &&
            req.headers['X-Openfinance-Event'] == 'transaction.created' &&
            req.headers['X-Openfinance-Signature'].start_with?('v1=')
        }
    end

    it 'records successful delivery' do
      stub_request(:post, subscription.url)
        .to_return(status: 200, body: 'OK')

      described_class.new.perform(subscription.id, 'transaction.created', { amount: 42.50 })

      delivery = subscription.webhook_deliveries.last
      expect(delivery.success).to be true
      expect(delivery.response_code).to eq(200)
      expect(delivery.event_type).to eq('transaction.created')
      expect(subscription.reload.failure_count).to eq(0)
    end

    it 'records failed delivery' do
      stub_request(:post, subscription.url)
        .to_return(status: 500, body: 'Internal Server Error')

      described_class.new.perform(subscription.id, 'transaction.created', { amount: 42.50 })

      delivery = subscription.webhook_deliveries.last
      expect(delivery.success).to be false
      expect(delivery.response_code).to eq(500)
      expect(subscription.reload.failure_count).to eq(1)
    end

    it 'skips delivery for inactive subscriptions' do
      subscription.update!(is_active: false)

      described_class.new.perform(subscription.id, 'transaction.created', { amount: 42.50 })

      expect(WebMock).not_to have_requested(:post, subscription.url)
    end

    it 'skips delivery for non-existent subscriptions' do
      expect {
        described_class.new.perform(-1, 'transaction.created', { amount: 42.50 })
      }.not_to raise_error
    end

    it 'includes HMAC signature in headers' do
      stub_request(:post, subscription.url)
        .to_return(status: 200, body: 'OK')

      described_class.new.perform(subscription.id, 'test.ping', { message: 'hello' })

      expect(WebMock).to have_requested(:post, subscription.url)
        .with { |req|
          timestamp = req.headers['X-Openfinance-Timestamp']
          signature = req.headers['X-Openfinance-Signature']
          expected = OpenSSL::HMAC.hexdigest('SHA256', subscription.signing_key, "#{timestamp}.#{req.body}")
          signature == "v1=#{expected}"
        }
    end
  end
end
