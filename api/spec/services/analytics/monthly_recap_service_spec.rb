require 'rails_helper'

RSpec.describe Analytics::MonthlyRecapService do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:checking) { create(:account, household: household, account_type: 'checking', current_balance_cents: 500_000) }
  let(:credit_card) { create(:account, household: household, account_type: 'credit_card', current_balance_cents: 50_000) }
  let(:groceries) { create(:category, household: household, name: 'Groceries', group_name: 'Food & Drink') }
  let(:dining) { create(:category, household: household, name: 'Dining', group_name: 'Food & Drink') }
  let(:rent) { create(:category, household: household, name: 'Rent', group_name: 'Housing') }
  let(:salary) { create(:category, :income, household: household, name: 'Salary') }

  let(:this_month) { Date.current.beginning_of_month }
  let(:month_str) { this_month.strftime('%Y-%m') }

  describe '.call' do
    context 'without household' do
      it 'returns failure' do
        result = described_class.call(household: nil)
        expect(result).to be_failure
        expect(result.errors).to include('Household is required')
      end
    end

    context 'with empty household' do
      it 'returns success with zero values' do
        result = described_class.call(household: household, month: month_str)
        expect(result).to be_success
        data = result.data
        expect(data[:month]).to eq(month_str)
        expect(data[:income][:total]).to eq(0.0)
        expect(data[:expenses][:total]).to eq(0.0)
        expect(data[:savings][:amount]).to eq(0.0)
        expect(data[:savings][:rate]).to eq(0.0)
        expect(data[:category_breakdown]).to be_empty
        expect(data[:top_merchants]).to be_empty
        expect(data[:daily_spending]).to be_empty
      end
    end

    context 'with transactions' do
      before do
        # This month: income
        create(:transaction, :income, household: household, account: checking,
          category: salary, amount_cents: 500_000, date: this_month + 14.days,
          name: 'Paycheck', merchant_name: 'Employer Inc')

        # This month: expenses
        create(:transaction, household: household, account: checking,
          category: groceries, amount_cents: -15_000, date: this_month + 5.days,
          name: 'Whole Foods', merchant_name: 'Whole Foods')
        create(:transaction, household: household, account: checking,
          category: groceries, amount_cents: -8_000, date: this_month + 12.days,
          name: 'Trader Joes', merchant_name: 'Trader Joes')
        create(:transaction, household: household, account: checking,
          category: dining, amount_cents: -5_000, date: this_month + 8.days,
          name: 'Pizza Hut', merchant_name: 'Pizza Hut')
        create(:transaction, household: household, account: checking,
          category: rent, amount_cents: -150_000, date: this_month + 1.day,
          name: 'Rent Payment', merchant_name: 'Landlord LLC')

        # Previous month: different amounts for comparison
        prev_month = this_month - 1.month
        create(:transaction, :income, household: household, account: checking,
          category: salary, amount_cents: 480_000, date: prev_month + 14.days,
          name: 'Paycheck', merchant_name: 'Employer Inc')
        create(:transaction, household: household, account: checking,
          category: groceries, amount_cents: -20_000, date: prev_month + 5.days,
          name: 'Whole Foods', merchant_name: 'Whole Foods')
        create(:transaction, household: household, account: checking,
          category: rent, amount_cents: -150_000, date: prev_month + 1.day,
          name: 'Rent Payment', merchant_name: 'Landlord LLC')
      end

      it 'calculates income correctly' do
        result = described_class.call(household: household, month: month_str)
        expect(result).to be_success
        expect(result.data[:income][:total]).to eq(5000.0)
        expect(result.data[:income][:previous_month]).to eq(4800.0)
        expect(result.data[:income][:change]).to eq(200.0)
      end

      it 'calculates expenses correctly' do
        result = described_class.call(household: household, month: month_str)
        expect(result.data[:expenses][:total]).to eq(1780.0)
        expect(result.data[:expenses][:previous_month]).to eq(1700.0)
        expect(result.data[:expenses][:transaction_count]).to eq(4)
      end

      it 'calculates savings rate' do
        result = described_class.call(household: household, month: month_str)
        savings = result.data[:savings]
        expect(savings[:amount]).to eq(3220.0)
        expect(savings[:rate]).to eq(64.4) # (5000 - 1780) / 5000 * 100
      end

      it 'returns category breakdown sorted by amount' do
        result = described_class.call(household: household, month: month_str)
        categories = result.data[:category_breakdown]
        expect(categories.length).to eq(3)
        expect(categories.first[:category_name]).to eq('Rent')
        expect(categories.first[:amount]).to eq(1500.0)
        expect(categories.last[:category_name]).to eq('Dining')
        expect(categories.last[:amount]).to eq(50.0)
      end

      it 'includes category change from previous month' do
        result = described_class.call(household: household, month: month_str)
        groceries_cat = result.data[:category_breakdown].find { |c| c[:category_name] == 'Groceries' }
        expect(groceries_cat[:previous_amount]).to eq(200.0)
        expect(groceries_cat[:change]).to eq(30.0)
      end

      it 'returns top merchants' do
        result = described_class.call(household: household, month: month_str)
        merchants = result.data[:top_merchants]
        expect(merchants.length).to eq(4)
        expect(merchants.first[:merchant_name]).to eq('Landlord LLC')
        expect(merchants.first[:amount]).to eq(1500.0)
      end

      it 'returns notable transactions' do
        result = described_class.call(household: household, month: month_str)
        notable = result.data[:notable_transactions]
        expect(notable[:largest_expense]).not_to be_nil
        expect(notable[:largest_expense][:amount]).to eq(-1500.0)
        expect(notable[:largest_income]).not_to be_nil
        expect(notable[:largest_income][:amount]).to eq(5000.0)
      end

      it 'returns month-over-month comparison' do
        result = described_class.call(household: household, month: month_str)
        comparison = result.data[:comparison]
        expect(comparison[:transaction_count]).to eq(5)
        expect(comparison[:previous_transaction_count]).to eq(3)
      end

      it 'returns daily spending data' do
        result = described_class.call(household: household, month: month_str)
        daily = result.data[:daily_spending]
        expect(daily.length).to be > 0
        # Rent day should have 1500
        rent_day = daily.find { |d| d[:date] == (this_month + 1.day).iso8601 }
        expect(rent_day[:amount]).to eq(1500.0) if rent_day
      end

      it 'calculates income top sources' do
        result = described_class.call(household: household, month: month_str)
        sources = result.data[:income][:top_sources]
        expect(sources.length).to eq(1)
        expect(sources.first[:name]).to eq('Employer Inc')
        expect(sources.first[:amount]).to eq(5000.0)
      end
    end

    context 'with net worth data' do
      before do
        # Create accounts for net worth calculation
        checking
        credit_card
      end

      it 'calculates net worth' do
        result = described_class.call(household: household, month: month_str)
        nw = result.data[:net_worth]
        expect(nw[:assets]).to eq(5000.0)
        expect(nw[:liabilities]).to eq(500.0)
        expect(nw[:current]).to eq(4500.0)
      end
    end

    context 'with budget data' do
      let!(:budget) { create(:budget, household: household) }

      before do
        create(:budget_item, budget: budget, category: groceries, month: this_month, amount_cents: 30_000)
        create(:budget_item, budget: budget, category: rent, month: this_month, amount_cents: 150_000)

        # Transactions within budget
        create(:transaction, household: household, account: checking,
          category: groceries, amount_cents: -25_000, date: this_month + 10.days)
        create(:transaction, household: household, account: checking,
          category: rent, amount_cents: -150_000, date: this_month + 1.day)
      end

      it 'returns budget performance' do
        result = described_class.call(household: household, month: month_str)
        perf = result.data[:budget_performance]
        expect(perf[:has_budget]).to be true
        expect(perf[:total_budgeted]).to eq(1800.0)
        expect(perf[:total_spent]).to eq(1750.0)
        expect(perf[:on_track]).to be true
        expect(perf[:categories].length).to eq(2)
      end

      it 'identifies over-budget categories' do
        # Add an expense that pushes groceries over budget
        create(:transaction, household: household, account: checking,
          category: groceries, amount_cents: -10_000, date: this_month + 15.days)

        result = described_class.call(household: household, month: month_str)
        perf = result.data[:budget_performance]
        over = perf[:categories].find { |c| c[:category_name] == 'Groceries' }
        expect(over[:over_budget]).to be true
        expect(over[:percent_used]).to be > 100.0
      end
    end

    context 'with recurring items' do
      before do
        create(:recurring_item, household: household, name: 'Netflix',
          amount_cents: 1599, is_active: true, is_income: false,
          next_occurrence: this_month + 10.days)
        create(:recurring_item, household: household, name: 'Spotify',
          amount_cents: 999, is_active: true, is_income: false,
          next_occurrence: this_month + 15.days)
      end

      it 'returns recurring summary' do
        result = described_class.call(household: household, month: month_str)
        recurring = result.data[:recurring_summary]
        expect(recurring[:total_recurring_expenses]).to be > 0
        expect(recurring[:bills_due_count]).to eq(2)
        expect(recurring[:upcoming].length).to eq(2)
      end
    end

    context 'defaults to current month' do
      it 'uses current month when month param is nil' do
        result = described_class.call(household: household, month: nil)
        expect(result).to be_success
        expect(result.data[:month]).to eq(Date.current.strftime('%Y-%m'))
      end
    end
  end
end
