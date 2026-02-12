require 'rails_helper'

RSpec.describe Transaction, type: :model do
  describe 'associations' do
    it { is_expected.to belong_to(:household) }
    it { is_expected.to belong_to(:account) }
    it { is_expected.to belong_to(:category).optional }
    it { is_expected.to have_many(:transaction_tags).dependent(:destroy) }
    it { is_expected.to have_many(:tags).through(:transaction_tags) }
  end

  describe 'validations' do
    subject { build(:transaction) }

    it { is_expected.to validate_presence_of(:household) }
    it { is_expected.to validate_presence_of(:account) }
    it { is_expected.to validate_presence_of(:date) }
    # amount uses monetize which wraps nil → Money(0), so presence_of doesn't work with shoulda
    it { is_expected.to validate_numericality_of(:amount) }
  end

  describe 'custom validations' do
    it 'validates household matches account household' do
      household1 = create(:household)
      household2 = create(:household)
      account = create(:account, household: household1)
      txn = build(:transaction, household: household2, account: account)
      expect(txn).not_to be_valid
      expect(txn.errors[:household]).to include("must match account's household")
    end
  end

  describe 'scopes' do
    let(:household) { create(:household) }
    let(:account) { create(:account, household: household) }

    it '.income returns positive amounts' do
      income = create(:transaction, :income, household: household, account: account)
      _expense = create(:transaction, household: household, account: account)
      expect(Transaction.income).to include(income)
      expect(Transaction.income).not_to include(_expense)
    end

    it '.expenses returns negative amounts' do
      _income = create(:transaction, :income, household: household, account: account)
      expense = create(:transaction, household: household, account: account)
      expect(Transaction.expenses).to include(expense)
    end

    it '.needs_review returns flagged transactions' do
      flagged = create(:transaction, :needs_review, household: household, account: account)
      _normal = create(:transaction, household: household, account: account)
      expect(Transaction.needs_review).to contain_exactly(flagged)
    end
  end

  describe '#income? / #expense?' do
    it 'positive amount is income' do
      txn = build(:transaction, amount: 100)
      expect(txn).to be_income
      expect(txn).not_to be_expense
    end

    it 'negative amount is expense' do
      txn = build(:transaction, amount: -50)
      expect(txn).to be_expense
      expect(txn).not_to be_income
    end
  end

  describe '#categorized? / #uncategorized?' do
    it 'with category is categorized' do
      txn = build(:transaction, category: build(:category))
      expect(txn).to be_categorized
    end

    it 'without category is uncategorized' do
      txn = build(:transaction, category: nil)
      expect(txn).to be_uncategorized
    end
  end

  describe 'callbacks' do
    it 'sets currency from account' do
      account = build(:account, currency: 'EUR')
      txn = build(:transaction, account: account, currency: nil)
      txn.valid?
      expect(txn.currency).to eq('EUR')
    end

    it 'strips merchant name whitespace on save' do
      household = create(:household)
      account = create(:account, household: household)
      txn = create(:transaction, household: household, account: account, merchant_name: '  Starbucks  ')
      expect(txn.merchant_name).to eq('Starbucks')
    end
  end
end
