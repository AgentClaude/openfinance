# frozen_string_literal: true

require 'rails_helper'

RSpec.describe AccountPolicy do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:other_household) { create(:household) }
  let(:other_user) { create(:user, household: other_household) }
  let(:account) { create(:account, household: household) }
  let(:other_account) { create(:account, household: other_household) }

  describe 'Scope' do
    subject(:resolved_scope) { described_class::Scope.new(user, Account).resolve }

    it 'includes accounts from own household' do
      expect(resolved_scope).to include(account)
    end

    it 'excludes accounts from other households' do
      expect(resolved_scope).not_to include(other_account)
    end

    context 'with shared accounts' do
      before do
        create(:shared_account, account: other_account, shared_with_user: user, shared_by_user: other_user)
      end

      it 'includes shared accounts' do
        expect(resolved_scope).to include(other_account)
      end
    end
  end

  describe '#show?' do
    it 'allows access to own household account' do
      expect(described_class.new(user, account).show?).to be true
    end

    it 'denies access to other household account' do
      expect(described_class.new(user, other_account).show?).to be false
    end

    context 'with shared account' do
      before do
        create(:shared_account, account: other_account, shared_with_user: user, shared_by_user: other_user)
      end

      it 'allows access to shared account' do
        expect(described_class.new(user, other_account).show?).to be true
      end
    end
  end

  describe '#share?' do
    it 'allows owner to share' do
      expect(described_class.new(user, account).share?).to be true
    end

    it 'denies non-owner from sharing' do
      expect(described_class.new(other_user, account).share?).to be false
    end
  end
end
