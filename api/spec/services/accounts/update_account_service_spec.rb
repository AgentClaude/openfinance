# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Accounts::UpdateAccountService do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:account) { create(:account, household: household, name: 'Checking', account_type: 'checking', is_hidden: false) }

  describe '.call' do
    context 'when updating name' do
      it 'updates the account name' do
        result = described_class.call(account: account, user: user, params: { name: 'Primary Checking' })
        expect(result).to be_success
        expect(result.data[:account].name).to eq('Primary Checking')
      end

      it 'does not update name to blank' do
        result = described_class.call(account: account, user: user, params: { name: '' })
        expect(result).to be_success
        expect(result.data[:account].name).to eq('Checking') # unchanged
      end
    end

    context 'when hiding/showing account' do
      it 'hides the account' do
        result = described_class.call(account: account, user: user, params: { is_hidden: true })
        expect(result).to be_success
        expect(result.data[:account].is_hidden).to be true
      end

      it 'unhides the account' do
        account.update!(is_hidden: true)
        result = described_class.call(account: account, user: user, params: { is_hidden: false })
        expect(result).to be_success
        expect(result.data[:account].is_hidden).to be false
      end
    end

    context 'when updating display_order' do
      it 'updates the display order' do
        result = described_class.call(account: account, user: user, params: { display_order: 5 })
        expect(result).to be_success
        expect(result.data[:account].display_order).to eq(5)
      end
    end

    context 'when updating financial details' do
      let(:credit_account) { create(:account, household: household, name: 'Visa', account_type: 'credit_card') }

      it 'updates interest rate' do
        result = described_class.call(account: credit_account, user: user, params: { interest_rate: 19.99 })
        expect(result).to be_success
        expect(result.data[:account].interest_rate).to eq(19.99)
      end

      it 'updates credit limit' do
        result = described_class.call(account: credit_account, user: user, params: { credit_limit: 5000.0 })
        expect(result).to be_success
        expect(result.data[:account].credit_limit_cents).to eq(500000)
      end

      it 'updates minimum payment' do
        result = described_class.call(account: credit_account, user: user, params: { minimum_payment: 25.0 })
        expect(result).to be_success
        expect(result.data[:account].minimum_payment_cents).to eq(2500)
      end
    end

    context 'when account is nil' do
      it 'returns failure' do
        result = described_class.call(account: nil, user: user, params: { name: 'Test' })
        expect(result).to be_failure
        expect(result.errors).to include("Account not found")
      end
    end

    context 'authorization' do
      let(:other_household) { create(:household) }
      let(:other_user) { create(:user, household: other_household) }

      it 'rejects unauthorized user' do
        result = described_class.call(account: account, user: other_user, params: { name: 'Hacked' })
        expect(result).to be_failure
      end
    end
  end
end
