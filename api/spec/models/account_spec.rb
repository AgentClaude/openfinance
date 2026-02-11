require 'rails_helper'

RSpec.describe Account, type: :model do
  describe 'associations' do
    it { is_expected.to belong_to(:household) }
    it { is_expected.to belong_to(:connection).class_name('AccountConnection').optional }
    it { is_expected.to have_many(:transactions).dependent(:destroy) }
    it { is_expected.to have_many(:holdings).dependent(:destroy) }
    it { is_expected.to have_many(:balance_histories).dependent(:destroy) }
  end

  describe 'validations' do
    subject { build(:account) }

    it { is_expected.to validate_presence_of(:household) }
    it { is_expected.to validate_presence_of(:name) }
    it { is_expected.to validate_presence_of(:account_type) }
    it { is_expected.to validate_presence_of(:current_balance) }
  end

  describe 'scopes' do
    let(:household) { create(:household) }

    it '.visible excludes hidden accounts' do
      visible = create(:account, household: household, is_hidden: false)
      _hidden = create(:account, household: household, is_hidden: true)
      expect(Account.visible).to contain_exactly(visible)
    end

    it '.assets returns asset-type accounts' do
      checking = create(:account, household: household, account_type: 'checking')
      _credit = create(:account, household: household, account_type: 'credit_card')
      expect(Account.assets).to contain_exactly(checking)
    end

    it '.liabilities returns liability-type accounts' do
      _checking = create(:account, household: household, account_type: 'checking')
      credit = create(:account, household: household, account_type: 'credit_card')
      expect(Account.liabilities).to contain_exactly(credit)
    end
  end

  describe '#asset? / #liability?' do
    it 'checking is an asset' do
      expect(build(:account, account_type: 'checking')).to be_asset
    end

    it 'credit_card is a liability' do
      expect(build(:account, account_type: 'credit_card')).to be_liability
    end
  end

  describe '#display_balance' do
    it 'returns positive balance for assets' do
      account = build(:account, account_type: 'checking', current_balance: 1000)
      expect(account.display_balance).to eq(1000)
    end

    it 'returns negative balance for liabilities with positive balance' do
      account = build(:account, account_type: 'credit_card', current_balance: 500)
      expect(account.display_balance).to eq(-500)
    end
  end

  describe '#credit_utilization' do
    it 'calculates utilization for credit cards' do
      account = build(:account, account_type: 'credit_card', current_balance: 250, credit_limit: 1000)
      expect(account.credit_utilization).to eq(25.0)
    end

    it 'returns 0 for non-credit accounts' do
      account = build(:account, account_type: 'checking')
      expect(account.credit_utilization).to eq(0)
    end
  end

  describe 'callbacks' do
    it 'sets default currency to USD' do
      account = build(:account, currency: nil)
      account.valid?
      expect(account.currency).to eq('USD')
    end
  end
end
