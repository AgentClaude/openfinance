require 'rails_helper'

RSpec.describe Webhooks::PublishService do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }

  describe '.call' do
    it 'creates events and enqueues jobs for matching subscriptions' do
      webhook = create(:webhook_subscription, user: user, household: household,
                       events: ['transaction.created'])

      result = nil
      expect {
        result = described_class.call(
          household: household,
          event_type: 'transaction.created',
          data: { id: 'txn_123', amount: -50.00 }
        )
      }.to change(WebhookEvent, :count).by(1)
        .and have_enqueued_job(DeliverWebhookJob)

      expect(result).to be_success
      expect(result.data[:events_count]).to eq(1)
    end

    it 'publishes to multiple matching subscriptions' do
      create(:webhook_subscription, user: user, household: household,
             events: ['transaction.created'])
      other_user = create(:user, household: household)
      create(:webhook_subscription, user: other_user, household: household,
             events: ['transaction.created'])

      result = described_class.call(
        household: household,
        event_type: 'transaction.created',
        data: { id: 'txn_123' }
      )

      expect(result.data[:events_count]).to eq(2)
    end

    it 'skips subscriptions not listening for the event' do
      create(:webhook_subscription, user: user, household: household,
             events: ['budget.exceeded'])

      result = described_class.call(
        household: household,
        event_type: 'transaction.created',
        data: { id: 'txn_123' }
      )

      expect(result.data[:events_count]).to eq(0)
    end

    it 'skips inactive subscriptions' do
      create(:webhook_subscription, user: user, household: household,
             events: ['transaction.created'], is_active: false)

      result = described_class.call(
        household: household,
        event_type: 'transaction.created',
        data: { id: 'txn_123' }
      )

      expect(result.data[:events_count]).to eq(0)
    end

    it 'returns failure for unsupported event types' do
      result = described_class.call(
        household: household,
        event_type: 'invalid.event',
        data: { id: 'test' }
      )

      expect(result).to be_failure
    end

    it 'includes correct payload structure' do
      create(:webhook_subscription, user: user, household: household,
             events: ['transaction.created'])

      described_class.call(
        household: household,
        event_type: 'transaction.created',
        data: { id: 'txn_123', amount: -50.00 }
      )

      event = WebhookEvent.last
      expect(event.payload).to include('type' => 'transaction.created')
      expect(event.payload['data']).to include('id' => 'txn_123', 'amount' => -50.0)
      expect(event.payload).to have_key('id')
      expect(event.payload).to have_key('created_at')
    end
  end
end
