require 'rails_helper'

RSpec.describe Plaid::ExchangePublicTokenService, type: :service do
  let(:user) { create(:user) }
  let(:household) { user.household }
  let(:public_token) { 'public-sandbox-123456' }
  let(:metadata) do
    {
      'institution' => {
        'institution_id' => 'ins_123456',
        'name' => 'Test Bank'
      }
    }
  end

  let(:service) { described_class.new(public_token: public_token, user: user, metadata: metadata) }

  before do
    allow(PlaidConfig).to receive(:enabled?).and_return(true)
    allow(PlaidConfig).to receive(:client).and_return(double('Plaid::PlaidApi'))
  end

  describe '#call' do
    context 'with valid inputs' do
      before do
        stub_plaid_exchange_token(success: true)
        stub_plaid_institutions_get_by_id(success: true)
        stub_plaid_accounts_get(success: true)
        
        # Mock job scheduling to avoid Sidekiq issues
        allow(SyncTransactionsJob).to receive(:set).and_return(double('Job', perform_later: true))
      end

      it 'exchanges the public token successfully' do
        result = service.call

        expect(result.success?).to be true
        expect(result.value[:connection]).to be_a(AccountConnection)
        expect(result.value[:accounts]).to be_an(Array)
        expect(result.value[:institution]).to be_a(Institution)
      end

      it 'creates an institution from metadata' do
        expect { service.call }.to change(Institution, :count).by(1)

        institution = Institution.last
        expect(institution.plaid_institution_id).to eq('ins_123456')
        expect(institution.name).to eq('Test Bank')
      end

      it 'creates an account connection' do
        expect { service.call }.to change(AccountConnection, :count).by(1)

        connection = AccountConnection.last
        expect(connection.household).to eq(household)
        expect(connection.provider).to eq('plaid')
        expect(connection.provider_connection_id).to eq('item_123456')
        expect(connection.status).to eq('active')
      end

      it 'creates accounts' do
        expect { service.call }.to change(Account, :count).by(1)

        account = Account.last
        expect(account.household).to eq(household)
        expect(account.name).to eq('Checking Account')
        expect(account.plaid_account_id).to eq('acc_123456')
      end

      it 'schedules initial sync gracefully when Sidekiq is unavailable' do
        allow(SyncTransactionsJob).to receive(:set).and_raise(StandardError, 'Redis unavailable')
        allow(Rails.logger).to receive(:warn)
        allow(Rails.logger).to receive(:info)
        expect(Rails.logger).to receive(:warn).with(/Failed to schedule initial sync/)

        result = service.call
        expect(result.success?).to be true
      end
    end

    context 'with invalid inputs' do
      it 'fails when public_token is missing' do
        invalid_service = described_class.new(public_token: nil, user: user)
        result = invalid_service.call

        expect(result.success?).to be false
        expect(result.errors).to include(/[Pp]ublic.token/)
      end

      it 'fails when user is missing' do
        invalid_service = described_class.new(public_token: public_token, user: nil)
        result = invalid_service.call

        expect(result.success?).to be false
        expect(result.errors).to include(/[Uu]ser/)
      end

      it 'fails when Plaid is not configured' do
        allow(PlaidConfig).to receive(:enabled?).and_return(false)

        result = service.call
        expect(result.success?).to be false
        expect(result.errors).to include('Plaid is not configured')
      end
    end

    context 'with Plaid API errors' do
      before do
        allow(SyncTransactionsJob).to receive(:set).and_return(double('Job', perform_later: true))
      end

      it 'handles invalid public token error' do
        stub_plaid_exchange_token(success: false)

        result = service.call
        expect(result.success?).to be false
        expect(result.errors).to be_present
      end

      it 'handles institution fetch error gracefully' do
        stub_plaid_exchange_token(success: true)
        stub_plaid_institutions_get_by_id(success: false)
        stub_plaid_accounts_get(success: true)

        allow(Rails.logger).to receive(:warn)
        allow(Rails.logger).to receive(:info)
        expect(Rails.logger).to receive(:warn).with(/Failed to fetch institution/)

        result = service.call
        expect(result.success?).to be true
        expect(result.value[:institution]).to be_nil
      end

      it 'handles accounts fetch error' do
        stub_plaid_exchange_token(success: true)
        stub_plaid_institutions_get_by_id(success: true)
        stub_plaid_accounts_get(success: false)

        result = service.call
        expect(result.success?).to be false
      end
    end

    context 'with database transaction rollback' do
      before do
        stub_plaid_exchange_token(success: true)
        stub_plaid_institutions_get_by_id(success: true)
        stub_plaid_accounts_get(success: true)
        
        allow(SyncTransactionsJob).to receive(:set).and_return(double('Job', perform_later: true))
      end

      it 'rolls back all changes on error' do
        # Simulate an error during account creation
        allow_any_instance_of(Account).to receive(:save!).and_raise(StandardError, 'Database error')

        expect {
          expect {
            expect { service.call }.not_to change(AccountConnection, :count)
          }.not_to change(Institution, :count)
        }.not_to change(Account, :count)
      end
    end
  end

  describe 'private methods' do
    before do
      stub_plaid_exchange_token(success: true)
      stub_plaid_institutions_get_by_id(success: true)
      stub_plaid_accounts_get(success: true)
      allow(SyncTransactionsJob).to receive(:set).and_return(double('Job', perform_later: true))
    end

    it 'maps Plaid account types correctly' do
      service.send(:initialize, public_token: public_token, user: user, metadata: metadata)

      expect(service.send(:map_plaid_account_type, 'depository')).to eq('checking')
      expect(service.send(:map_plaid_account_type, 'credit')).to eq('credit_card')
      expect(service.send(:map_plaid_account_type, 'loan')).to eq('loan')
      expect(service.send(:map_plaid_account_type, 'investment')).to eq('investment')
      expect(service.send(:map_plaid_account_type, 'other')).to eq('other_asset')
    end

    it 'maps Plaid account subtypes correctly' do
      service.send(:initialize, public_token: public_token, user: user, metadata: metadata)

      expect(service.send(:map_plaid_account_subtype, 'checking')).to eq('checking')
      expect(service.send(:map_plaid_account_subtype, 'savings')).to eq('savings')
      expect(service.send(:map_plaid_account_subtype, 'credit card')).to eq('credit_card')
      expect(service.send(:map_plaid_account_subtype, '401k')).to eq('401k')
      expect(service.send(:map_plaid_account_subtype, 'unknown')).to eq('other')
    end
  end
end