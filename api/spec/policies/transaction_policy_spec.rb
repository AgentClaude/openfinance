# frozen_string_literal: true

require 'rails_helper'

RSpec.describe TransactionPolicy do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:account) { create(:account, household: household) }
  let(:transaction) { create(:transaction, account: account, household: household) }
  let(:other_household) { create(:household) }
  let(:other_user) { create(:user, household: other_household) }
  let(:other_account) { create(:account, household: other_household) }
  let(:other_transaction) { create(:transaction, account: other_account, household: other_household) }

  describe 'Scope' do
    subject(:resolved_scope) { described_class::Scope.new(user, Transaction).resolve }

    it 'includes transactions from own household accounts' do
      expect(resolved_scope).to include(transaction)
    end

    it 'excludes transactions from other households' do
      expect(resolved_scope).not_to include(other_transaction)
    end

    context 'with shared accounts' do
      before do
        create(:shared_account, account: other_account, shared_with_user: user, shared_by_user: other_user)
      end

      it 'includes transactions from shared accounts' do
        expect(resolved_scope).to include(other_transaction)
      end
    end
  end
end
