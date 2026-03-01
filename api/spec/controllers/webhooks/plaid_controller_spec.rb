require 'rails_helper'

RSpec.describe Webhooks::PlaidController, type: :request do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:institution) { create(:institution, name: 'Chase', plaid_institution_id: 'ins_1') }
  let!(:connection) do
    AccountConnection.create!(
      household: household,
      institution: institution,
      provider: 'plaid',
      provider_connection_id: 'item_abc123',
      provider_access_token: 'access_test',
      status: 'active',
      created_by: user
    )
  end

  describe 'POST /webhooks/plaid' do
    it 'returns 200 for valid TRANSACTIONS webhook' do
      post '/webhooks/plaid', params: {
        webhook_type: 'TRANSACTIONS',
        webhook_code: 'SYNC_UPDATES_AVAILABLE',
        item_id: 'item_abc123'
      }
      expect(response).to have_http_status(:ok)
    end

    it 'returns 200 for unknown item_id' do
      post '/webhooks/plaid', params: {
        webhook_type: 'TRANSACTIONS',
        webhook_code: 'SYNC_UPDATES_AVAILABLE',
        item_id: 'unknown_item'
      }
      expect(response).to have_http_status(:ok)
    end

    it 'marks connection as error on ITEM ERROR webhook' do
      post '/webhooks/plaid', params: {
        webhook_type: 'ITEM',
        webhook_code: 'ERROR',
        item_id: 'item_abc123',
        error: {
          error_code: 'ITEM_LOGIN_REQUIRED',
          error_message: 'Login required'
        }
      }
      expect(response).to have_http_status(:ok)
      connection.reload
      expect(connection.status).to eq('error')
      expect(connection.error_code).to eq('ITEM_LOGIN_REQUIRED')
    end

    it 'handles USER_PERMISSION_REVOKED' do
      post '/webhooks/plaid', params: {
        webhook_type: 'ITEM',
        webhook_code: 'USER_PERMISSION_REVOKED',
        item_id: 'item_abc123'
      }
      expect(response).to have_http_status(:ok)
      connection.reload
      expect(connection.status).to eq('disconnected')
    end

    it 'returns 200 for unhandled webhook types' do
      post '/webhooks/plaid', params: {
        webhook_type: 'UNKNOWN_TYPE',
        webhook_code: 'UNKNOWN_CODE',
        item_id: 'item_abc123'
      }
      expect(response).to have_http_status(:ok)
    end
  end
end
