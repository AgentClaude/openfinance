require 'rails_helper'

RSpec.describe Analytics::AnnualSummaryService do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:checking) { create(:account, household: household, account_type: 'checking', current_balance_cents: 500_000) }
  let(:credit_card) { create(:account, household: household, account_type: 'credit_card', current_balance_cents: 50_000) }
  let(:groceries) { create(:category, household: household, name: 'Groceries', group_name: 'Food & Drink') }
  let(:dining) { create(:category, household: household, name: 'Dining', group_name: 'Food & Drink') }
  let(:rent) { create(:category, household: household, name: 'Rent', group_name: 'Housing') }
  let(:salary) { create(:category, :income, household: household, name: 'Salary') }

  let(:current_year) { Date.current.year }

  describe '.call' do
    context 'without household' do
      it 'returns failure' do
        result = described_class.call(household: nil)
        expect(result).to be_failure
        expect(result.errors).to include('Household is required')
      end
    end

    context 'with empty household (no transactions)' do
      it 'returns success with zero values' do
        result = described_class.call(household: household, year: current_year)
        expect(result).to be_success
        expect(result.data[:year]).to eq(current_year)
        expect(result.data[:income][:total]).to eq(0.0)
        expect(result.data[:spending][:total]).to eq(0.0)
        expect(result.data[:savings][:total]).to eq(0.0)
        expect(result.data[:savings][:rate]).to eq(0.0)
        expect(result.data[:transaction_count]).to eq(0)
        expect(result.data[:top_categories]).to be_empty
        expect(result.data[:top_merchants]).to be_empty
      end
    end

    context 'with transactions in a specific year' do
      before do
        # January income
        create(:transaction, :income, household: household, account: checking,
          category: salary, amount_cents: 500_000, date: Date.new(current_year, 1, 15),
          name: 'Paycheck', merchant_name: 'Employer Inc')

        # February income
        create(:transaction, :income, household: household, account: checking,
          category: salary, amount_cents: 500_000, date: Date.new(current_year, 2, 15),
          name: 'Paycheck', merchant_name: 'Employer Inc')

        # January expenses
        create(:transaction, household: household, account: checking,
          category: groceries, amount_cents: -30_000, date: Date.new(current_year, 1, 5),
          name: 'Grocery run', merchant_name: 'Whole Foods')
        create(:transaction, household: household, account: checking,
          category: rent, amount_cents: -150_000, date: Date.new(current_year, 1, 1),
          name: 'Rent payment', merchant_name: 'Landlord LLC')

        # February expenses
        create(:transaction, household: household, account: checking,
          category: groceries, amount_cents: -25_000, date: Date.new(current_year, 2, 8),
          name: 'Grocery run', merchant_name: 'Whole Foods')
        create(:transaction, household: household, account: checking,
          category: dining, amount_cents: -8_000, date: Date.new(current_year, 2, 14),
          name: 'Valentines dinner', merchant_name: 'Fancy Restaurant')
        create(:transaction, household: household, account: checking,
          category: rent, amount_cents: -150_000, date: Date.new(current_year, 2, 1),
          name: 'Rent payment', merchant_name: 'Landlord LLC')
      end

      it 'computes correct income totals' do
        result = described_class.call(household: household, year: current_year)
        expect(result.data[:income][:total]).to eq(10_000.0) # $5000 * 2
      end

      it 'computes correct spending totals' do
        result = described_class.call(household: household, year: current_year)
        # $300 + $1500 + $250 + $80 + $1500 = $3630
        expect(result.data[:spending][:total]).to eq(3_630.0)
      end

      it 'computes savings correctly' do
        result = described_class.call(household: household, year: current_year)
        expect(result.data[:savings][:total]).to eq(6_370.0) # $10000 - $3630
        expect(result.data[:savings][:rate]).to eq(63.7) # 63.7%
      end

      it 'computes monthly trends' do
        result = described_class.call(household: household, year: current_year)
        trends = result.data[:monthly_trends]

        jan = trends.find { |t| t[:month] == "#{current_year}-01" }
        expect(jan[:income]).to eq(5_000.0)
        expect(jan[:expenses]).to eq(1_800.0)
        expect(jan[:savings]).to eq(3_200.0)

        feb = trends.find { |t| t[:month] == "#{current_year}-02" }
        expect(feb[:income]).to eq(5_000.0)
        expect(feb[:expenses]).to eq(1_830.0)
      end

      it 'ranks top spending categories correctly' do
        result = described_class.call(household: household, year: current_year)
        top = result.data[:top_categories]

        expect(top.first[:category_name]).to eq('Rent')
        expect(top.first[:amount]).to eq(3_000.0)

        groceries_entry = top.find { |c| c[:category_name] == 'Groceries' }
        expect(groceries_entry[:amount]).to eq(550.0)
      end

      it 'ranks top merchants correctly' do
        result = described_class.call(household: household, year: current_year)
        merchants = result.data[:top_merchants]

        expect(merchants.first[:merchant_name]).to eq('Landlord LLC')
        expect(merchants.first[:amount]).to eq(3_000.0)
        expect(merchants.first[:transaction_count]).to eq(2)
      end

      it 'returns transaction count' do
        result = described_class.call(household: household, year: current_year)
        expect(result.data[:transaction_count]).to eq(7)
      end

      it 'computes highlights' do
        result = described_class.call(household: household, year: current_year)
        highlights = result.data[:highlights]

        expect(highlights[:biggest_expense][:amount]).to eq(1_500.0)
        expect(highlights[:biggest_expense][:description]).to eq('Landlord LLC')

        expect(highlights[:biggest_income][:amount]).to eq(5_000.0)

        # Whole Foods and Landlord LLC both have 2 transactions; order depends on DB
        expect(highlights[:most_frequent_merchant][:visit_count]).to eq(2)
        expect(['Whole Foods', 'Landlord LLC']).to include(highlights[:most_frequent_merchant][:name])
      end
    end

    context 'budget performance' do
      it 'tracks months on/over budget' do
        budget = create(:budget, household: household)

        # January: budget $2000 for groceries, spend $1500 → on budget
        create(:budget_item, budget: budget, category: groceries,
          month: Date.new(current_year, 1, 1), amount_cents: 200_000)
        create(:transaction, household: household, account: checking,
          category: groceries, amount_cents: -150_000, date: Date.new(current_year, 1, 10),
          merchant_name: 'Store')

        # February: budget $1000 for groceries, spend $1500 → over budget
        create(:budget_item, budget: budget, category: groceries,
          month: Date.new(current_year, 2, 1), amount_cents: 100_000)
        create(:transaction, household: household, account: checking,
          category: groceries, amount_cents: -150_000, date: Date.new(current_year, 2, 10),
          merchant_name: 'Store')

        result = described_class.call(household: household, year: current_year)
        perf = result.data[:budget_performance]

        expect(perf[:months_on_budget]).to eq(1)
        expect(perf[:months_over_budget]).to eq(1)
        expect(perf[:total_months]).to eq(2)
      end
    end

    context 'with a specific past year' do
      it 'scopes to that year only' do
        # 2025 transaction
        create(:transaction, :income, household: household, account: checking,
          category: salary, amount_cents: 100_000, date: Date.new(2025, 6, 15),
          merchant_name: 'Old Job')

        # Current year transaction
        create(:transaction, :income, household: household, account: checking,
          category: salary, amount_cents: 200_000, date: Date.new(current_year, 1, 15),
          merchant_name: 'New Job')

        result = described_class.call(household: household, year: 2025)
        expect(result.data[:year]).to eq(2025)
        expect(result.data[:income][:total]).to eq(1_000.0)
        expect(result.data[:days_tracked]).to eq(365)
      end
    end

    context 'goals achieved' do
      it 'counts goals achieved in the year' do
        # Use a past year so all 12 months are included
        test_year = current_year - 1
        g1 = create(:goal, :achieved, household: household, target_amount_cents: 10_000, current_amount_cents: 10_000)
        g1.update_columns(achieved_at: Time.zone.local(test_year, 3, 1, 12, 0))
        g2 = create(:goal, :achieved, household: household, target_amount_cents: 20_000, current_amount_cents: 20_000)
        g2.update_columns(achieved_at: Time.zone.local(test_year, 6, 1, 12, 0))
        # Goal from year before — should not count
        g3 = create(:goal, :achieved, household: household, target_amount_cents: 5_000, current_amount_cents: 5_000)
        g3.update_columns(achieved_at: Time.zone.local(test_year - 1, 12, 1, 12, 0))

        result = described_class.call(household: household, year: test_year)
        expect(result.data[:highlights][:goals_achieved]).to eq(2)
      end
    end

    context 'GraphQL query integration' do
      it 'resolves annualSummary query' do
        create(:transaction, :income, household: household, account: checking,
          category: salary, amount_cents: 300_000, date: Date.new(current_year, 1, 15),
          merchant_name: 'Employer')

        query = <<~GQL
          query AnnualSummary($year: Int) {
            annualSummary(year: $year) {
              year
              income { total monthlyAverage }
              spending { total monthlyAverage dailyAverage }
              savings { total rate }
              netWorthChange { startOfYear endOfPeriod change changePercentage }
              monthlyTrends { month label income expenses savings }
              topCategories { categoryName amount percentage transactionCount }
              topMerchants { merchantName amount transactionCount }
              budgetPerformance { monthsOnBudget monthsOverBudget totalMonths }
              highlights {
                biggestExpense { amount description date }
                biggestIncome { amount description date }
                mostFrequentMerchant { name visitCount }
                biggestSpendingMonth { month label expenses }
                mostFrugalMonth { month label expenses }
                goalsAchieved
              }
              transactionCount
              daysTracked
            }
          }
        GQL

        result = OpenfinanceSchema.execute(query,
          variables: { year: current_year },
          context: { current_user: user }
        )

        expect(result['errors']).to be_nil
        data = result['data']['annualSummary']
        expect(data['year']).to eq(current_year)
        expect(data['income']['total']).to eq(3_000.0)
        expect(data['transactionCount']).to eq(1)
      end
    end
  end
end
