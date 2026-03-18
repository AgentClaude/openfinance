require 'rails_helper'

RSpec.describe InvestmentTransaction, type: :model do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:account) { create(:account, household: household, account_type: 'investment') }
  let(:security) { create(:security, symbol: 'AAPL', name: 'Apple Inc.') }

  describe 'validations' do
    it 'is valid with required attributes' do
      txn = InvestmentTransaction.new(
        account: account,
        security: security,
        transaction_type: 'dividend',
        amount_cents: 5000,
        date: Date.current,
        currency: 'USD'
      )
      expect(txn).to be_valid
    end

    it 'requires transaction_type' do
      txn = InvestmentTransaction.new(account: account, security: security, amount_cents: 5000, date: Date.current)
      txn.transaction_type = nil
      expect(txn).not_to be_valid
    end

    it 'requires date' do
      txn = InvestmentTransaction.new(account: account, security: security, transaction_type: 'dividend', amount_cents: 5000)
      txn.date = nil
      expect(txn).not_to be_valid
    end

    it 'validates quantity is positive when present' do
      txn = InvestmentTransaction.new(
        account: account, security: security, transaction_type: 'buy',
        amount_cents: 10000, date: Date.current, quantity: -5
      )
      expect(txn).not_to be_valid
    end
  end

  describe 'scopes' do
    let!(:div1) { InvestmentTransaction.create!(account: account, security: security, transaction_type: 'dividend', amount_cents: 5000, date: Date.new(2026, 3, 15)) }
    let!(:div2) { InvestmentTransaction.create!(account: account, security: security, transaction_type: 'dividend', amount_cents: 3000, date: Date.new(2026, 6, 15)) }
    let!(:interest) { InvestmentTransaction.create!(account: account, security: security, transaction_type: 'interest', amount_cents: 1000, date: Date.new(2026, 3, 28)) }
    let!(:buy) { InvestmentTransaction.create!(account: account, security: security, transaction_type: 'buy', amount_cents: 50000, date: Date.new(2026, 1, 10), quantity: 5) }

    it '.dividends returns only dividend transactions' do
      expect(InvestmentTransaction.dividends).to contain_exactly(div1, div2)
    end

    it '.income returns dividends, interest, and capital gains' do
      expect(InvestmentTransaction.income).to contain_exactly(div1, div2, interest)
    end

    it '.in_year filters by year' do
      expect(InvestmentTransaction.in_year(2026).count).to eq(4)
      expect(InvestmentTransaction.in_year(2025).count).to eq(0)
    end

    it '.recent orders by date desc' do
      expect(InvestmentTransaction.recent.first).to eq(div2)
    end
  end

  describe '.dividend_summary' do
    before do
      security2 = create(:security, symbol: 'MSFT', name: 'Microsoft Corp.')
      InvestmentTransaction.create!(account: account, security: security, transaction_type: 'dividend', amount_cents: 5000, date: Date.new(2026, 3, 15))
      InvestmentTransaction.create!(account: account, security: security, transaction_type: 'dividend', amount_cents: 3000, date: Date.new(2026, 6, 15))
      InvestmentTransaction.create!(account: account, security: security2, transaction_type: 'dividend', amount_cents: 7500, date: Date.new(2026, 3, 15))
    end

    it 'returns total dividends for the year' do
      result = InvestmentTransaction.dividend_summary(household, year: 2026)
      expect(result[:total_dividends]).to eq(155.0) # (5000 + 3000 + 7500) / 100
    end

    it 'breaks down by security' do
      result = InvestmentTransaction.dividend_summary(household, year: 2026)
      symbols = result[:by_security].map { |d| d[:symbol] }
      expect(symbols).to include('AAPL', 'MSFT')
    end

    it 'breaks down by month' do
      result = InvestmentTransaction.dividend_summary(household, year: 2026)
      months = result[:by_month].map { |d| d[:month] }
      expect(months).to include('2026-03', '2026-06')
    end

    it 'returns correct transaction count' do
      result = InvestmentTransaction.dividend_summary(household, year: 2026)
      expect(result[:transaction_count]).to eq(3)
    end
  end

  describe '.income_summary' do
    before do
      InvestmentTransaction.create!(account: account, security: security, transaction_type: 'dividend', amount_cents: 5000, date: Date.new(2026, 3, 15))
      InvestmentTransaction.create!(account: account, security: security, transaction_type: 'interest', amount_cents: 1500, date: Date.new(2026, 3, 28))
      InvestmentTransaction.create!(account: account, security: security, transaction_type: 'capital_gain', amount_cents: 10000, date: Date.new(2026, 6, 15))
    end

    it 'returns total income' do
      result = InvestmentTransaction.income_summary(household, year: 2026)
      expect(result[:total_income]).to eq(165.0) # (5000 + 1500 + 10000) / 100
    end

    it 'breaks down by type' do
      result = InvestmentTransaction.income_summary(household, year: 2026)
      expect(result[:dividends]).to eq(50.0)
      expect(result[:interest]).to eq(15.0)
      expect(result[:capital_gains]).to eq(100.0)
    end
  end

  describe 'enums' do
    it 'supports all transaction types' do
      %w[dividend buy sell interest fee capital_gain].each do |type|
        txn = InvestmentTransaction.new(
          account: account, security: security,
          transaction_type: type, amount_cents: 1000, date: Date.current
        )
        expect(txn.transaction_type).to eq(type)
      end
    end
  end
end
