require 'rails_helper'

RSpec.describe WeeklyDigestService do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:account) { create(:account, household: household, account_type: 'checking', current_balance_cents: 500_000) }
  let(:category) { create(:category, household: household, name: 'Groceries') }

  subject { described_class.new(user) }

  describe '#call' do
    it 'returns nil if user has no household' do
      user_no_hh = build(:user, household: nil)
      allow(user_no_hh).to receive(:household).and_return(nil)
      result = described_class.new(user_no_hh).call
      expect(result).to be_nil
    end

    it 'returns a hash with expected keys' do
      result = subject.call
      expect(result).to include(
        :user, :period, :spending, :income, :top_categories,
        :top_merchants, :accounts, :net_worth, :budget_alerts,
        :upcoming_bills, :transaction_count, :needs_review_count
      )
    end

    context 'with transactions' do
      before do
        create(:transaction, household: household, account: account, category: category,
               amount_cents: -5000, date: 2.days.ago, merchant_name: 'Whole Foods')
        create(:transaction, household: household, account: account, category: category,
               amount_cents: -3000, date: 3.days.ago, merchant_name: 'Trader Joes')
        create(:transaction, household: household, account: account,
               amount_cents: 100_000, date: 1.day.ago)
      end

      it 'calculates spending totals' do
        result = subject.call
        expect(result[:spending][:total_cents]).to eq(8000)
        expect(result[:spending][:count]).to eq(2)
      end

      it 'calculates income totals' do
        result = subject.call
        expect(result[:income][:total_cents]).to eq(100_000)
      end

      it 'returns top categories' do
        result = subject.call
        expect(result[:top_categories].first[:name]).to eq('Groceries')
        expect(result[:top_categories].first[:amount_cents]).to eq(8000)
      end

      it 'returns top merchants' do
        result = subject.call
        expect(result[:top_merchants].first[:name]).to eq('Whole Foods')
      end

      it 'returns transaction count' do
        result = subject.call
        expect(result[:transaction_count]).to eq(3)
      end
    end

    context 'net worth' do
      before do
        create(:account, household: household, account_type: 'checking', current_balance_cents: 1_000_000)
        create(:account, household: household, account_type: 'credit_card', current_balance_cents: -200_000)
      end

      it 'calculates net worth correctly' do
        result = subject.call
        expect(result[:net_worth][:assets_cents]).to be > 0
        expect(result[:net_worth][:liabilities_cents]).to be >= 0
      end
    end
  end
end
