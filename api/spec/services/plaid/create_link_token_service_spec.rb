require 'rails_helper'

RSpec.describe Plaid::CreateLinkTokenService, type: :service do
  let(:user) { create(:user) }
  let(:webhook_url) { 'https://example.com/plaid/webhook' }
  let(:products) { %w[transactions auth] }
  let(:country_codes) { %w[US CA] }

  let(:plaid_client) { double('Plaid::PlaidApi') }

  before do
    allow(PlaidConfig).to receive(:enabled?).and_return(true)
    allow(PlaidConfig).to receive(:client).and_return(plaid_client)
  end

  describe '#call' do
    context 'with valid inputs' do
      before do
        allow(plaid_client).to receive(:link_token_create).and_return(
          double('LinkTokenCreateResponse', link_token: 'link-sandbox-123456', expiration: Time.current + 4.hours)
        )
      end

      it 'creates a link token successfully with minimal params' do
        service = described_class.new(user: user)
        result = service.call

        expect(result.success?).to be true
        expect(result.data[:link_token]).to eq('link-sandbox-123456')
        expect(result.data[:expiration]).to be_a(Time)
      end

      it 'creates a link token with custom webhook URL' do
        service = described_class.new(user: user, webhook_url: webhook_url)
        result = service.call

        expect(result.success?).to be true
        expect(result.data[:link_token]).to eq('link-sandbox-123456')
      end

      it 'creates a link token with custom products' do
        service = described_class.new(user: user, products: %w[transactions])
        result = service.call

        expect(result.success?).to be true
      end

      it 'creates a link token with custom country codes' do
        service = described_class.new(user: user, country_codes: %w[US])
        result = service.call

        expect(result.success?).to be true
      end

      it 'creates a link token in update mode' do
        service = described_class.new(user: user, update_mode: true)
        result = service.call

        expect(result.success?).to be true
      end

      it 'logs successful token creation' do
        allow(Rails.logger).to receive(:info)
        expect(Rails.logger).to receive(:info).with(/Created Plaid link token for user/)

        service = described_class.new(user: user)
        service.call
      end
    end

    context 'with invalid inputs' do
      it 'fails when user is missing' do
        service = described_class.new(user: nil)
        result = service.call

        expect(result.success?).to be false
        expect(result.errors).to include(/[Uu]ser/)
      end

      it 'fails when Plaid is not configured' do
        allow(PlaidConfig).to receive(:enabled?).and_return(false)

        service = described_class.new(user: user)
        result = service.call

        expect(result.success?).to be false
        expect(result.errors).to include('Plaid is not configured')
      end
    end

    context 'with Plaid API errors' do
      it 'handles Plaid API errors gracefully' do
        allow(plaid_client).to receive(:link_token_create).and_raise(
          Plaid::ApiError.new(response_body: '{"error_message":"INVALID_REQUEST","display_message":"Invalid request","error_type":"INVALID_REQUEST","error_code":"INVALID_BODY"}')
        )
        allow(Rails.logger).to receive(:error)

        service = described_class.new(user: user)
        result = service.call

        expect(result.success?).to be false
        expect(result.errors).to be_present
      end

      it 'handles generic errors' do
        allow(plaid_client).to receive(:link_token_create)
          .and_raise(StandardError, 'Network error')
        allow(Rails.logger).to receive(:error)

        service = described_class.new(user: user)
        result = service.call

        expect(result.success?).to be false
        expect(result.errors).to include('Failed to create link token')
      end
    end

    context 'with environment-specific behavior' do
      it 'uses webhook URL in production' do
        allow(Rails.env).to receive(:production?).and_return(true)
        allow(ENV).to receive(:[]).and_call_original
        allow(ENV).to receive(:[]).with('PLAID_WEBHOOK_URL').and_return(webhook_url)

        service = described_class.new(user: user)
        expect(service.send(:default_webhook_url)).to eq(webhook_url)
      end

      it 'does not use webhook URL in non-production' do
        allow(Rails.env).to receive(:production?).and_return(false)

        service = described_class.new(user: user)
        expect(service.send(:default_webhook_url)).to be_nil
      end
    end
  end

  describe 'private methods' do
    let(:service) { described_class.new(user: user, webhook_url: webhook_url, products: products) }

    before do
      service.send(:initialize, user: user, webhook_url: webhook_url, products: products, country_codes: country_codes)
    end

    it 'builds link token request correctly' do
      request = service.send(:build_link_token_request)

      expect(request).to be_a(Plaid::LinkTokenCreateRequest)
      expect(request.products).to eq(products)
      expect(request.client_name).to eq('OpenFinance')
      expect(request.country_codes).to eq(country_codes)
      expect(request.language).to eq('en')
      expect(request.user[:client_user_id]).to eq(user.id.to_s)
      expect(request.webhook).to eq(webhook_url)
    end

    it 'builds request with account filters in update mode' do
      update_service = described_class.new(user: user, update_mode: true)
      update_service.send(:initialize, user: user, update_mode: true)
      request = update_service.send(:build_link_token_request)

      expect(request.account_filters).to be_present
      expect(request.account_filters[:depository][:account_subtypes]).to include('checking', 'savings')
      expect(request.account_filters[:credit][:account_subtypes]).to include('credit_card')
    end

    it 'returns correct default values' do
      expect(service.send(:default_products)).to eq(%w[transactions auth])
      expect(service.send(:default_country_codes)).to eq(%w[US CA])
    end
  end
end