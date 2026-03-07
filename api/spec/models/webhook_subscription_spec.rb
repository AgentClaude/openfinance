require 'rails_helper'

RSpec.describe WebhookSubscription, type: :model do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }

  describe 'validations' do
    it 'is valid with valid attributes' do
      webhook = build(:webhook_subscription, user: user, household: household)
      expect(webhook).to be_valid
    end

    it 'requires HTTPS URL' do
      webhook = build(:webhook_subscription, user: user, household: household,
                      url: 'http://example.com/webhook')
      expect(webhook).not_to be_valid
      expect(webhook.errors[:url]).to include('must use HTTPS')
    end

    it 'requires a name' do
      webhook = build(:webhook_subscription, user: user, household: household, name: '')
      expect(webhook).not_to be_valid
    end

    it 'requires events' do
      webhook = build(:webhook_subscription, user: user, household: household, events: [])
      expect(webhook).not_to be_valid
    end

    it 'rejects unsupported events' do
      webhook = build(:webhook_subscription, user: user, household: household,
                      events: ['transaction.created', 'invalid.event'])
      expect(webhook).not_to be_valid
      expect(webhook.errors[:events].first).to include('invalid.event')
    end

    it 'accepts all supported events' do
      WebhookSubscription::SUPPORTED_EVENTS.each do |event|
        webhook = build(:webhook_subscription, user: user, household: household, events: [event])
        expect(webhook).to be_valid, "Expected #{event} to be valid"
      end
    end
  end

  describe 'secret generation' do
    it 'auto-generates a secret on create' do
      webhook = create(:webhook_subscription, user: user, household: household)
      expect(webhook.secret).to start_with('whsec_')
      expect(webhook.secret.length).to eq(54) # "whsec_" + 48 hex chars
    end

    it 'does not overwrite an existing secret' do
      webhook = create(:webhook_subscription, user: user, household: household,
                       secret: 'whsec_custom123')
      expect(webhook.secret).to eq('whsec_custom123')
    end
  end

  describe '#sign_payload' do
    it 'produces an HMAC-SHA256 signature' do
      webhook = create(:webhook_subscription, user: user, household: household)
      payload = '{"test": true}'
      signature = webhook.sign_payload(payload)

      expected = OpenSSL::HMAC.hexdigest('SHA256', webhook.secret, payload)
      expect(signature).to eq(expected)
    end

    it 'produces different signatures for different payloads' do
      webhook = create(:webhook_subscription, user: user, household: household)
      sig1 = webhook.sign_payload('payload1')
      sig2 = webhook.sign_payload('payload2')
      expect(sig1).not_to eq(sig2)
    end
  end

  describe '#record_failure!' do
    it 'increments failure count' do
      webhook = create(:webhook_subscription, user: user, household: household)
      webhook.record_failure!
      expect(webhook.reload.failure_count).to eq(1)
    end

    it 'disables after 10 consecutive failures' do
      webhook = create(:webhook_subscription, user: user, household: household, failure_count: 9)
      webhook.record_failure!
      webhook.reload
      expect(webhook.is_active).to be false
      expect(webhook.disabled_at).not_to be_nil
    end
  end

  describe '#record_success!' do
    it 'resets failure count' do
      webhook = create(:webhook_subscription, user: user, household: household, failure_count: 5)
      webhook.record_success!
      expect(webhook.reload.failure_count).to eq(0)
    end
  end

  describe 'scopes' do
    it '.active returns only active, non-disabled subscriptions' do
      active = create(:webhook_subscription, user: user, household: household)
      inactive = create(:webhook_subscription, user: user, household: household, is_active: false)
      disabled = create(:webhook_subscription, user: user, household: household,
                        disabled_at: Time.current)

      expect(WebhookSubscription.active).to contain_exactly(active)
    end

    it '.for_event returns subscriptions listening for a specific event' do
      txn_webhook = create(:webhook_subscription, user: user, household: household,
                           events: ['transaction.created'])
      budget_webhook = create(:webhook_subscription, user: user, household: household,
                              events: ['budget.exceeded'])
      both_webhook = create(:webhook_subscription, user: user, household: household,
                            events: ['transaction.created', 'budget.exceeded'])

      expect(WebhookSubscription.for_event('transaction.created'))
        .to contain_exactly(txn_webhook, both_webhook)
    end
  end
end
