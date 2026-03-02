require 'rails_helper'

RSpec.describe Reports::WeeklyDigestService do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:account) { create(:account, household: household) }
  let(:category) { create(:category, household: household, name: 'Groceries') }
  let(:income_category) { create(:category, :income, household: household, name: 'Salary') }

  describe '#call' do
    context 'with no transactions' do
      it 'returns a successful digest with zero amounts' do
        result = described_class.call(household: household)

        expect(result).to be_success
        digest = result.data[:digest]
        expect(digest[:spending_summary][:total_cents]).to eq(0)
        expect(digest[:income_summary][:total_cents]).to eq(0)
        expect(digest[:net_cash_flow]).to eq(0)
        expect(digest[:transaction_count]).to eq(0)
      end
    end

    context 'with transactions this week' do
      before do
        create(:transaction, household: household, account: account, category: category,
               amount_cents: -5000, date: 2.days.ago, merchant_name: 'Whole Foods')
        create(:transaction, household: household, account: account, category: category,
               amount_cents: -3000, date: 3.days.ago, merchant_name: 'Trader Joes')
        create(:transaction, :income, household: household, account: account, category: income_category,
               amount_cents: 200000, date: 1.day.ago)
      end

      it 'calculates spending summary correctly' do
        result = described_class.call(household: household)
        digest = result.data[:digest]

        expect(digest[:spending_summary][:total_cents]).to eq(8000)
        expect(digest[:income_summary][:total_cents]).to eq(200000)
        expect(digest[:net_cash_flow]).to eq(192000)
        expect(digest[:transaction_count]).to eq(3)
      end

      it 'returns top categories' do
        result = described_class.call(household: household)
        cats = result.data[:digest][:top_categories]

        expect(cats.length).to eq(1)
        expect(cats.first[:name]).to eq('Groceries')
        expect(cats.first[:amount_cents]).to eq(8000)
      end

      it 'returns top merchants' do
        result = described_class.call(household: household)
        merchants = result.data[:digest][:top_merchants]

        expect(merchants.length).to eq(2)
        expect(merchants.map { |m| m[:name] }).to include('Whole Foods', 'Trader Joes')
      end
    end

    context 'with week-over-week comparison' do
      before do
        # Last week
        create(:transaction, household: household, account: account, category: category,
               amount_cents: -10000, date: 10.days.ago)
        # This week
        create(:transaction, household: household, account: account, category: category,
               amount_cents: -15000, date: 2.days.ago)
      end

      it 'calculates change percentage' do
        result = described_class.call(household: household)
        summary = result.data[:digest][:spending_summary]

        expect(summary[:previous_week_cents]).to eq(10000)
        expect(summary[:total_cents]).to eq(15000)
        expect(summary[:change_percentage]).to eq(50.0)
      end
    end

    context 'with upcoming bills' do
      before do
        create(:recurring_item, :due_soon, household: household, name: 'Netflix', amount_cents: 1599)
      end

      it 'includes upcoming bills' do
        result = described_class.call(household: household)
        bills = result.data[:digest][:upcoming_bills]

        expect(bills.length).to eq(1)
        expect(bills.first[:name]).to eq('Netflix')
      end
    end

    context 'with account balances' do
      before do
        create(:account, household: household, name: 'Checking', account_type: 'checking',
               current_balance_cents: 500000)
      end

      it 'includes account balances' do
        result = described_class.call(household: household)
        accounts = result.data[:digest][:account_balances]

        expect(accounts).to be_present
        expect(accounts.map { |a| a[:name] }).to include('Checking')
      end
    end

    context 'without a household' do
      it 'returns failure' do
        result = described_class.call(household: nil)
        expect(result).not_to be_success
      end
    end
  end
end
