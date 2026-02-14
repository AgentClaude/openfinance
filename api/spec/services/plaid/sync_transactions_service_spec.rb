require 'rails_helper'

RSpec.describe Plaid::SyncTransactionsService, type: :service do
  let(:user) { create(:user) }
  let(:household) { user.household }
  let(:institution) { create(:institution) }
  let(:connection) { create(:account_connection, household: household, institution: institution, provider_access_token: 'access-token') }
  let(:account) { create(:account, household: household, connection: connection, plaid_account_id: 'acc_123456') }
  let(:category) { create(:category, household: household, name: 'Food & Dining') }

  let(:plaid_client) { double('Plaid::PlaidApi') }
  let(:service) { described_class.new(connection: connection) }

  before do
    allow(PlaidConfig).to receive(:enabled?).and_return(true)
    allow(PlaidConfig).to receive(:client).and_return(plaid_client)

    # Ensure account exists
    account
    category
  end

  describe '#call' do
    context 'with valid connection' do
      let(:mock_added_transaction) do
        double(
          'Plaid::Transaction',
          transaction_id: 'txn_123456',
          account_id: 'acc_123456',
          amount: 25.50,
          date: Date.today,
          name: 'Coffee Shop',
          merchant_name: 'Local Coffee',
          pending: false,
          iso_currency_code: 'USD',
          personal_finance_category: {
            'primary' => 'FOOD_AND_DRINK',
            'detailed' => 'FOOD_AND_DRINK_RESTAURANTS'
          }
        )
      end

      let(:mock_modified_transaction) do
        double(
          'Plaid::Transaction',
          transaction_id: 'txn_modified',
          account_id: 'acc_123456',
          amount: 30.00,
          date: Date.today,
          name: 'Updated Transaction',
          merchant_name: 'Updated Merchant',
          pending: false,
          iso_currency_code: 'USD'
        )
      end

      let(:mock_removed_transaction) do
        double(
          'Plaid::Transaction',
          transaction_id: 'txn_removed'
        )
      end

      let(:mock_sync_response) do
        double(
          'Plaid::TransactionsSyncResponse',
          added: [mock_added_transaction],
          modified: [mock_modified_transaction],
          removed: [mock_removed_transaction],
          next_cursor: 'next_cursor_123',
          has_more: false
        )
      end

      before do
        allow(plaid_client).to receive(:transactions_sync)
          .and_return(mock_sync_response)

        # Create a transaction to be modified
        create(:transaction, 
               plaid_transaction_id: 'txn_modified',
               account: account,
               household: household)

        # Create a transaction to be removed
        create(:transaction,
               plaid_transaction_id: 'txn_removed',
               account: account,
               household: household)
      end

      it 'syncs transactions successfully' do
        result = service.call

        expect(result.success?).to be true
        expect(result.value[:added]).to eq(1)
        expect(result.value[:modified]).to eq(1)
        expect(result.value[:removed]).to eq(1)
      end

      it 'updates connection sync metadata' do
        freeze_time do
          service.call
          
          connection.reload
          expect(connection.last_synced_at).to eq(Time.current)
          expect(connection.sync_cursor).to eq('next_cursor_123')
        end
      end

      it 'creates new transactions from added transactions' do
        expect { service.call }.to change(Transaction, :count).by(0) # +1 added, -1 removed

        new_transaction = Transaction.find_by(plaid_transaction_id: 'txn_123456')
        expect(new_transaction).to be_present
        expect(new_transaction.name).to eq('Coffee Shop')
        expect(new_transaction.merchant_name).to eq('Local Coffee')
        expect(new_transaction.amount_cents).to eq(-2550) # Plaid positive becomes negative
        expect(new_transaction.account).to eq(account)
        expect(new_transaction.household).to eq(household)
      end

      it 'updates existing transactions from modified transactions' do
        service.call

        modified_transaction = Transaction.find_by(plaid_transaction_id: 'txn_modified')
        expect(modified_transaction.name).to eq('Updated Transaction')
        expect(modified_transaction.merchant_name).to eq('Updated Merchant')
        expect(modified_transaction.amount_cents).to eq(-3000)
      end

      it 'removes transactions from removed list' do
        expect { service.call }.to change { 
          Transaction.exists?(plaid_transaction_id: 'txn_removed') 
        }.from(true).to(false)
      end

      it 'maps categories correctly' do
        service.call

        new_transaction = Transaction.find_by(plaid_transaction_id: 'txn_123456')
        expect(new_transaction.category).to eq(category)
      end

      it 'handles transactions without categories' do
        allow(mock_added_transaction).to receive(:personal_finance_category).and_return(nil)

        service.call

        new_transaction = Transaction.find_by(plaid_transaction_id: 'txn_123456')
        expect(new_transaction.category).to be_nil
      end

      context 'with multiple pages' do
        let(:mock_first_response) do
          double(
            'Plaid::TransactionsSyncResponse',
            added: [mock_added_transaction],
            modified: [],
            removed: [],
            next_cursor: 'cursor_page_2',
            has_more: true
          )
        end

        let(:mock_second_response) do
          double(
            'Plaid::TransactionsSyncResponse',
            added: [],
            modified: [mock_modified_transaction],
            removed: [mock_removed_transaction],
            next_cursor: 'final_cursor',
            has_more: false
          )
        end

        before do
          allow(plaid_client).to receive(:transactions_sync)
            .and_return(mock_first_response, mock_second_response)
        end

        it 'handles multiple pages of results' do
          result = service.call

          expect(result.success?).to be true
          expect(result.value[:added]).to eq(1)
          expect(result.value[:modified]).to eq(1)
          expect(result.value[:removed]).to eq(1)

          connection.reload
          expect(connection.sync_cursor).to eq('final_cursor')
        end
      end
    end

    context 'with invalid inputs' do
      it 'fails when connection is missing' do
        service = described_class.new(connection: nil)
        result = service.call

        expect(result.success?).to be false
        expect(result.errors).to include(/connection/)
      end

      it 'fails when Plaid is not configured' do
        allow(PlaidConfig).to receive(:enabled?).and_return(false)

        result = service.call
        expect(result.success?).to be false
        expect(result.errors).to include('Plaid is not configured')
      end

      it 'fails when connection is not active' do
        connection.update!(status: 'error')

        result = service.call
        expect(result.success?).to be false
        expect(result.errors).to include('Connection is not active')
      end
    end

    context 'with Plaid API errors' do
      before do
        allow(plaid_client).to receive(:transactions_sync)
          .and_raise(mock_plaid_error('ITEM_ERROR', 'ITEM_LOGIN_REQUIRED'))
      end

      it 'handles authentication errors by marking connection as error' do
        expect(connection).to receive(:mark_error!).with('ITEM_LOGIN_REQUIRED', anything)

        result = service.call
        expect(result.success?).to be false
      end

      it 'logs Plaid errors' do
        expect(Rails.logger).to receive(:error).with(/Plaid sync error/)

        service.call
      end
    end

    context 'with generic errors' do
      before do
        allow(plaid_client).to receive(:transactions_sync)
          .and_raise(StandardError, 'Network timeout')
      end

      it 'handles generic errors gracefully' do
        expect(Rails.logger).to receive(:error).with(/Transaction sync failed/)

        result = service.call
        expect(result.success?).to be false
        expect(result.errors).to include('Failed to sync transactions: Network timeout')
      end
    end

    context 'with orphaned transactions' do
      let(:mock_orphaned_transaction) do
        double(
          'Plaid::Transaction',
          transaction_id: 'txn_orphaned',
          account_id: 'acc_nonexistent',
          amount: 25.50,
          date: Date.today,
          name: 'Orphaned Transaction',
          merchant_name: nil,
          pending: false,
          iso_currency_code: 'USD',
          personal_finance_category: nil
        )
      end

      let(:mock_sync_response_with_orphan) do
        double(
          'Plaid::TransactionsSyncResponse',
          added: [mock_orphaned_transaction],
          modified: [],
          removed: [],
          next_cursor: 'cursor_123',
          has_more: false
        )
      end

      before do
        allow(plaid_client).to receive(:transactions_sync)
          .and_return(mock_sync_response_with_orphan)
      end

      it 'skips transactions for nonexistent accounts' do
        expect { service.call }.not_to change(Transaction, :count)

        result = service.call
        expect(result.success?).to be true
        expect(result.value[:added]).to eq(0)
      end
    end
  end

  describe 'private methods' do
    it 'finds accounts by plaid_account_id' do
      service.send(:initialize, connection: connection)
      found_account = service.send(:find_account, 'acc_123456')

      expect(found_account).to eq(account)
    end

    it 'maps Plaid categories to household categories' do
      service.send(:initialize, connection: connection)
      
      personal_finance_category = {
        'primary' => 'FOOD_AND_DRINK',
        'detailed' => 'FOOD_AND_DRINK_RESTAURANTS'
      }

      mapped_category = service.send(:map_category, personal_finance_category)
      expect(mapped_category).to eq(category)
    end

    it 'returns nil for unknown categories' do
      service.send(:initialize, connection: connection)
      
      personal_finance_category = {
        'primary' => 'UNKNOWN_CATEGORY',
        'detailed' => 'UNKNOWN_DETAILED'
      }

      mapped_category = service.send(:map_category, personal_finance_category)
      expect(mapped_category).to be_nil
    end
  end
end
