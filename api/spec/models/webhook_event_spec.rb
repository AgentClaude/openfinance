require 'rails_helper'

RSpec.describe WebhookEvent, type: :model do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:webhook) { create(:webhook_subscription, user: user, household: household) }

  describe 'validations' do
    it 'is valid with valid attributes' do
      event = build(:webhook_event, webhook_subscription: webhook)
      expect(event).to be_valid
    end

    it 'requires a valid event_type' do
      event = build(:webhook_event, webhook_subscription: webhook, event_type: 'invalid')
      expect(event).not_to be_valid
    end

    it 'requires a valid delivery_status' do
      event = build(:webhook_event, webhook_subscription: webhook, delivery_status: 'invalid')
      expect(event).not_to be_valid
    end
  end

  describe '#delivered!' do
    it 'marks event as delivered with response data' do
      event = create(:webhook_event, webhook_subscription: webhook)
      event.delivered!(status_code: 200, response_body: 'OK', response_time_ms: 42.5)

      event.reload
      expect(event.delivery_status).to eq('delivered')
      expect(event.status_code).to eq(200)
      expect(event.response_body).to eq('OK')
      expect(event.response_time_ms).to eq(42.5)
      expect(event.delivered_at).not_to be_nil
    end

    it 'truncates long response bodies' do
      event = create(:webhook_event, webhook_subscription: webhook)
      long_body = 'x' * 2000
      event.delivered!(status_code: 200, response_body: long_body)

      expect(event.response_body.length).to be <= 1003 # 1000 + "..."
    end
  end

  describe '#failed!' do
    it 'marks event as failed with error info' do
      event = create(:webhook_event, webhook_subscription: webhook)
      event.failed!(error_message: 'Connection refused', status_code: 502)

      event.reload
      expect(event.delivery_status).to eq('failed')
      expect(event.error_message).to eq('Connection refused')
      expect(event.status_code).to eq(502)
    end
  end

  describe 'scopes' do
    it '.recent orders by created_at desc' do
      old = create(:webhook_event, webhook_subscription: webhook, created_at: 2.hours.ago)
      new_event = create(:webhook_event, webhook_subscription: webhook, created_at: 1.hour.ago)

      expect(WebhookEvent.recent.first).to eq(new_event)
    end
  end
end
