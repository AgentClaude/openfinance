require 'rails_helper'

RSpec.describe WeeklyDigestService do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:account) { create(:account, household: household, account_type: 'checking', current_balance_cents: 500_000) }
  let(:category) { create(:category, household: household, name: 'Groceries') }

  let(:week_start) { Date.current.beginning_of_week }
  let(:service) { described_class.new(user, week_start: week_start) }

  describe '#generate' do
    it 'returns digest data with all expected keys' do
      result = service.generate
      expect(result.keys).to include(
        :user, :household, :period, :spending, :income, :net,
        :top_categories, :top_merchants, :large_transactions,
        :budget_status, :upcoming_bills, :account_balances, :net_worth
      )
    end

    context 'with transactions this week' do
      before do
        # Spending transactions (negative amount_cents = expense)
        create(:transaction, household: household, account: account, category: category,
               date: week_start + 1.day, amount_cents: -5000, merchant_name: 'Whole Foods')
        create(:transaction, household: household, account: account, category: category,
               date: week_start + 2.days, amount_cents: -3000, merchant_name: 'Trader Joes')
        # Income (positive amount_cents)
        create(:transaction, household: household, account: account, category: category,
               date: week_start + 3.days, amount_cents: 200_000, merchant_name: 'Employer')
      end

      it 'calculates spending total' do
        result = service.generate
        expect(result[:spending][:total_cents]).to eq(8000)
        expect(result[:spending][:count]).to eq(2)
      end

      it 'calculates income total' do
        result = service.generate
        expect(result[:income][:total_cents]).to eq(200_000)
      end

      it 'calculates net cash flow' do
        result = service.generate
        expect(result[:net][:cents]).to eq(200_000 - 8000)
        expect(result[:net][:positive]).to be true
      end

      it 'returns top categories' do
        result = service.generate
        expect(result[:top_categories].first[:name]).to eq('Groceries')
        expect(result[:top_categories].first[:total_cents]).to eq(8000)
      end

      it 'returns top merchants' do
        result = service.generate
        merchants = result[:top_merchants].map { |m| m[:name] }
        expect(merchants).to include('Whole Foods')
      end
    end

    context 'with large transactions' do
      before do
        create(:transaction, household: household, account: account, category: category,
               date: week_start + 1.day, amount_cents: -50_000, merchant_name: 'Best Buy')
      end

      it 'includes transactions over $100' do
        result = service.generate
        expect(result[:large_transactions].length).to eq(1)
        expect(result[:large_transactions].first[:amount_cents]).to eq(50_000)
      end
    end

    context 'week-over-week comparison' do
      before do
        # Last week
        create(:transaction, household: household, account: account, category: category,
               date: week_start - 3.days, amount_cents: -10_000)
        # This week
        create(:transaction, household: household, account: account, category: category,
               date: week_start + 1.day, amount_cents: -15_000)
      end

      it 'calculates change percentage' do
        result = service.generate
        expect(result[:spending][:change_pct]).to eq(50.0)
      end
    end

    context 'net worth' do
      let!(:savings) { create(:account, household: household, account_type: 'savings', current_balance_cents: 300_000) }
      let!(:investment) { create(:account, household: household, account_type: 'investment', current_balance_cents: 500_000) }
      let!(:credit_card) { create(:account, household: household, account_type: 'credit_card', current_balance_cents: -50_000) }

      it 'calculates assets, liabilities, and net' do
        result = service.generate
        expect(result[:net_worth][:assets_cents]).to eq(800_000)
        expect(result[:net_worth][:liabilities_cents]).to eq(50_000)
        expect(result[:net_worth][:net_cents]).to eq(750_000)
      end
    end
  end
end
