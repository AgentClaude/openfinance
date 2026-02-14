require 'rails_helper'

RSpec.describe Providers::Plaid, type: :service do
  let(:provider_name) { 'plaid' }

  it_behaves_like 'a provider adapter'

  describe '.implements_interface?' do
    it 'returns true' do
      expect(described_class.implements_interface?).to be true
    end
  end

  describe '#create_link_token' do
    let(:adapter) { described_class.new(nil) }
    let(:user) { create(:user) }

    context 'when Plaid is not configured' do
      before { allow(PlaidConfig).to receive(:enabled?).and_return(false) }

      it 'returns failure' do
        result = adapter.create_link_token(user: user)
        expect(result).to be_failure
      end
    end
  end

  describe '#sync_transactions' do
    let(:connection) { create(:account_connection, provider: 'plaid', status: 'active') }
    let(:adapter) { described_class.new(connection) }

    context 'when Plaid is not configured' do
      before { allow(PlaidConfig).to receive(:enabled?).and_return(false) }

      it 'returns failure' do
        result = adapter.sync_transactions
        expect(result).to be_failure
      end
    end

    context 'when connection is not active' do
      let(:connection) { create(:account_connection, provider: 'plaid', status: 'error') }

      before { allow(PlaidConfig).to receive(:enabled?).and_return(true) }

      it 'returns failure' do
        result = adapter.sync_transactions
        expect(result).to be_failure
      end
    end
  end
end
