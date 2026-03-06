require 'rails_helper'

RSpec.describe WebhookSubscription, type: :model do
  describe 'validations' do
    it { is_expected.to belong_to(:user) }
    it { is_expected.to have_many(:webhook_deliveries).dependent(:destroy) }

    it 'requires HTTPS URL' do
      sub = build(:webhook_subscription, url: 'http://insecure.com/hook')
      expect(sub).not_to be_valid
      expect(sub.errors[:url]).to include('must be an HTTPS URL')
    end

    it 'accepts HTTPS URL' do
      sub = build(:webhook_subscription, url: 'https://secure.com/hook')
      expect(sub).to be_valid
    end

    it 'rejects unsupported events' do
      sub = build(:webhook_subscription, events: ['fake.event'])
      expect(sub).not_to be_valid
    end

    it 'accepts supported events' do
      sub = build(:webhook_subscription, events: ['transaction.created', 'budget.exceeded'])
      expect(sub).to be_valid
    end

    context 'SSRF protection' do
      before do
        allow(Resolv).to receive(:getaddress).and_return('93.184.216.34') # public IP
      end

      it 'rejects URLs pointing to private IPs' do
        allow(Resolv).to receive(:getaddress).with('internal.example.com').and_return('192.168.1.1')
        sub = build(:webhook_subscription, url: 'https://internal.example.com/hook')
        expect(sub).not_to be_valid
        expect(sub.errors[:url]).to include('must not point to internal/private addresses')
      end

      it 'rejects URLs pointing to loopback addresses' do
        allow(Resolv).to receive(:getaddress).with('localhost').and_return('127.0.0.1')
        sub = build(:webhook_subscription, url: 'https://localhost/hook')
        expect(sub).not_to be_valid
        expect(sub.errors[:url]).to include('must not point to internal/private addresses')
      end

      it 'rejects URLs pointing to link-local addresses' do
        allow(Resolv).to receive(:getaddress).with('link-local.example.com').and_return('169.254.1.1')
        sub = build(:webhook_subscription, url: 'https://link-local.example.com/hook')
        expect(sub).not_to be_valid
        expect(sub.errors[:url]).to include('must not point to internal/private addresses')
      end

      it 'accepts URLs pointing to public IPs' do
        allow(Resolv).to receive(:getaddress).with('secure.com').and_return('93.184.216.34')
        sub = build(:webhook_subscription, url: 'https://secure.com/hook')
        expect(sub).to be_valid
      end

      it 'rejects URLs that fail DNS resolution' do
        allow(Resolv).to receive(:getaddress).and_raise(Resolv::ResolvError)
        sub = build(:webhook_subscription, url: 'https://nonexistent.invalid/hook')
        expect(sub).not_to be_valid
        expect(sub.errors[:url]).to include('is not a valid URL')
      end
    end

    it 'auto-generates secret on create' do
      sub = create(:webhook_subscription)
      expect(sub.secret).to start_with('whsec_')
    end
  end

  describe 'scopes' do
    it '.active returns only active subscriptions' do
      active = create(:webhook_subscription)
      create(:webhook_subscription, :inactive)

      expect(described_class.active).to contain_exactly(active)
    end

    it '.for_event returns subscriptions listening for that event' do
      sub1 = create(:webhook_subscription, events: ['transaction.created', 'budget.exceeded'])
      create(:webhook_subscription, events: ['bill.upcoming'])

      expect(described_class.for_event('transaction.created')).to contain_exactly(sub1)
    end
  end

  describe '#disable_if_failing!' do
    it 'deactivates after MAX_FAILURES consecutive failures' do
      sub = create(:webhook_subscription, failure_count: WebhookSubscription::MAX_FAILURES)
      sub.disable_if_failing!
      expect(sub.reload.is_active).to be false
    end

    it 'does not deactivate below threshold' do
      sub = create(:webhook_subscription, failure_count: 5)
      sub.disable_if_failing!
      expect(sub.reload.is_active).to be true
    end
  end

  describe '#record_success!' do
    it 'resets failure count' do
      sub = create(:webhook_subscription, failure_count: 5)
      sub.record_success!
      expect(sub.failure_count).to eq(0)
      expect(sub.last_triggered_at).to be_present
    end
  end

  describe '#record_failure!' do
    it 'increments failure count and records error' do
      sub = create(:webhook_subscription, failure_count: 0)
      sub.record_failure!('HTTP 500')
      expect(sub.failure_count).to eq(1)
      expect(sub.last_error).to eq('HTTP 500')
      expect(sub.last_failed_at).to be_present
    end
  end
end
