require 'rails_helper'

RSpec.describe AccountConnection, type: :model do
  describe 'associations' do
    it { is_expected.to belong_to(:household) }
    it { is_expected.to belong_to(:institution).optional }
    it { is_expected.to belong_to(:created_by).class_name('User') }
    it { is_expected.to have_many(:sync_logs).dependent(:destroy) }
  end

  describe 'validations' do
    subject { build(:account_connection) }

    it { is_expected.to validate_presence_of(:household) }
    it { is_expected.to validate_presence_of(:status) }
    it { is_expected.to validate_presence_of(:created_by) }

    it 'validates provider inclusion' do
      conn = build(:account_connection)
      %w[plaid finicity mx manual].each do |valid_provider|
        conn.provider = valid_provider
        conn.valid?
        expect(conn.errors[:provider]).to be_empty, "Expected #{valid_provider} to be valid"
      end
    end
  end

  describe '#has_errors?' do
    it 'returns true for error status' do
      conn = build(:account_connection, :error)
      expect(conn).to have_errors
    end

    it 'returns false for active status' do
      conn = build(:account_connection, status: 'active')
      expect(conn).not_to have_errors
    end
  end

  describe '#error_display_message' do
    it 'returns user-friendly message for ITEM_LOGIN_REQUIRED' do
      conn = build(:account_connection, status: 'error', error_code: 'ITEM_LOGIN_REQUIRED')
      expect(conn.error_display_message).to include('reconnect')
    end

    it 'returns nil for active connections' do
      conn = build(:account_connection, status: 'active')
      expect(conn.error_display_message).to be_nil
    end
  end

  describe '#institution_name' do
    it 'returns institution name when present' do
      inst = build(:institution, name: 'Chase')
      conn = build(:account_connection, institution: inst)
      expect(conn.institution_name).to eq('Chase')
    end

    it 'returns Unknown Institution when no institution' do
      conn = build(:account_connection, institution: nil)
      expect(conn.institution_name).to eq('Unknown Institution')
    end
  end

  describe '#retryable_error?' do
    it 'returns true for institution down errors' do
      conn = build(:account_connection, status: 'error', error_code: 'INSTITUTION_DOWN')
      expect(conn.retryable_error?).to be true
    end

    it 'returns false for login required errors' do
      conn = build(:account_connection, status: 'error', error_code: 'ITEM_LOGIN_REQUIRED')
      expect(conn.retryable_error?).to be false
    end
  end
end
