require 'rails_helper'

RSpec.describe Providers::Factory do
  describe '.for' do
    it 'returns Plaid adapter for plaid connections' do
      connection = create(:account_connection, provider: 'plaid')
      adapter = described_class.for(connection)
      expect(adapter).to be_a(Providers::Plaid)
      expect(adapter.connection).to eq(connection)
    end

    it 'returns MX adapter for mx connections' do
      connection = create(:account_connection, provider: 'mx')
      adapter = described_class.for(connection)
      expect(adapter).to be_a(Providers::Mx)
    end

    it 'returns Finicity adapter for finicity connections' do
      connection = create(:account_connection, provider: 'finicity')
      adapter = described_class.for(connection)
      expect(adapter).to be_a(Providers::Finicity)
    end

    it 'raises ArgumentError for unknown provider' do
      connection = double(provider: 'unknown')
      expect { described_class.for(connection) }.to raise_error(ArgumentError, /Unknown provider/)
    end
  end

  describe '.supported_providers' do
    it 'returns all supported provider types' do
      expect(described_class.supported_providers).to contain_exactly('plaid', 'mx', 'finicity')
    end
  end

  describe '.supports?' do
    it 'returns true for supported providers' do
      expect(described_class.supports?('plaid')).to be true
      expect(described_class.supports?('mx')).to be true
    end

    it 'returns false for unsupported providers' do
      expect(described_class.supports?('unknown')).to be false
      expect(described_class.supports?('manual')).to be false
    end
  end
end
