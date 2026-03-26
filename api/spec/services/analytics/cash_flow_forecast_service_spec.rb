require 'rails_helper'

RSpec.describe Analytics::CashFlowForecastService do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }

  describe '.call' do
    context 'when household is nil' do
      it 'returns failure' do
        result = described_class.call(household: nil)
        expect(result).to be_failure
        expect(result.error_message).to include('Household is required')
      end
    end

    context 'with no accounts or data' do
      it 'returns a valid forecast with zero balances' do
        result = described_class.call(household: household)
        expect(result).to be_success
        expect(result.data[:starting_balance]).to eq(0.0)
        expect(result.data[:daily_projections]).to be_an(Array)
        expect(result.data[:daily_projections].length).to eq(91) # today + 90 days
        expect(result.data[:events]).to eq([])
        expect(result.data[:warnings]).to be_an(Array)
      end
    end

    context 'with liquid accounts' do
      before do
        create(:account, household: household, account_type: 'checking', current_balance_cents: 500_000)
        create(:account, household: household, account_type: 'savings', current_balance_cents: 1_000_000)
      end

      it 'calculates starting balance from checking and savings accounts' do
        result = described_class.call(household: household)
        expect(result).to be_success
        expect(result.data[:starting_balance]).to eq(15_000.0) # $5000 + $10000
      end

      it 'excludes hidden accounts' do
        create(:account, household: household, account_type: 'checking', current_balance_cents: 999_999, is_hidden: true)
        result = described_class.call(household: household)
        expect(result.data[:starting_balance]).to eq(15_000.0)
      end
    end

    context 'with recurring items' do
      let!(:checking) { create(:account, household: household, account_type: 'checking', current_balance_cents: 1_000_000) }

      it 'projects recurring expenses' do
        create(:recurring_item, household: household, name: 'Rent',
               amount_cents: 150_000, frequency: 'monthly', is_income: false,
               next_occurrence: 2.weeks.from_now.to_date)

        result = described_class.call(household: household, days: 60)
        expect(result).to be_success

        recurring_events = result.data[:events].select { |e| e[:source] == 'recurring' }
        expect(recurring_events).not_to be_empty
        rent_events = recurring_events.select { |e| e[:name] == 'Rent' }
        expect(rent_events.length).to be >= 1
        expect(rent_events.first[:amount]).to eq(-1500.0)
      end

      it 'projects recurring income' do
        create(:recurring_item, :income, household: household, name: 'Salary',
               amount_cents: 500_000, frequency: 'monthly',
               next_occurrence: 1.week.from_now.to_date)

        result = described_class.call(household: household, days: 60)
        income_events = result.data[:events].select { |e| e[:name] == 'Salary' }
        expect(income_events).not_to be_empty
        expect(income_events.first[:amount]).to eq(5000.0)
      end

      it 'skips inactive recurring items' do
        create(:recurring_item, :inactive, household: household, name: 'Cancelled Sub',
               amount_cents: 1000, next_occurrence: 1.week.from_now.to_date)

        result = described_class.call(household: household, days: 30)
        names = result.data[:events].map { |e| e[:name] }
        expect(names).not_to include('Cancelled Sub')
      end

      it 'handles weekly frequency correctly' do
        create(:recurring_item, household: household, name: 'Weekly Sub',
               amount_cents: 1000, frequency: 'weekly',
               next_occurrence: Date.current + 1.day)

        result = described_class.call(household: household, days: 30)
        weekly_events = result.data[:events].select { |e| e[:name] == 'Weekly Sub' }
        # Should have ~4 occurrences in 30 days
        expect(weekly_events.length).to be_between(3, 5)
      end
    end

    context 'with historical spending data' do
      let!(:checking) { create(:account, household: household, account_type: 'checking', current_balance_cents: 1_000_000) }
      let!(:groceries_cat) { create(:category, household: household, name: 'Groceries') }

      before do
        # Create 3 months of grocery spending
        3.times do |i|
          month_start = (i + 1).months.ago.beginning_of_month
          3.times do
            create(:transaction, household: household, account: checking,
                   category: groceries_cat, amount_cents: -15_000,
                   date: month_start + rand(28).days, is_recurring: false, is_transfer: false)
          end
        end
      end

      it 'estimates variable spending from history' do
        result = described_class.call(household: household, days: 60, include_variable_spending: true)
        expect(result).to be_success

        estimated_events = result.data[:events].select { |e| e[:source] == 'estimated' }
        expect(estimated_events).not_to be_empty
        grocery_estimates = estimated_events.select { |e| e[:name].include?('Groceries') }
        expect(grocery_estimates).not_to be_empty
        expect(grocery_estimates.first[:confidence]).to eq(0.6)
      end

      it 'can exclude variable spending' do
        result = described_class.call(household: household, days: 60, include_variable_spending: false)
        estimated_events = result.data[:events].select { |e| e[:source] == 'estimated' }
        expect(estimated_events).to be_empty
      end
    end

    context 'daily projections' do
      let!(:checking) { create(:account, household: household, account_type: 'checking', current_balance_cents: 500_000) }

      it 'builds correct daily balance progression' do
        create(:recurring_item, household: household, name: 'Bill',
               amount_cents: 100_000, frequency: 'monthly', is_income: false,
               next_occurrence: Date.current + 5.days)

        result = described_class.call(household: household, days: 10, include_variable_spending: false)
        projections = result.data[:daily_projections]

        expect(projections.length).to eq(11)
        expect(projections.first[:balance]).to eq(5000.0)

        # After the bill on day 5, balance should drop
        day_5 = projections[5]
        expect(day_5[:expenses]).to eq(1000.0)
        expect(day_5[:balance]).to eq(4000.0)
      end

      it 'respects the days parameter' do
        result = described_class.call(household: household, days: 30, include_variable_spending: false)
        expect(result.data[:daily_projections].length).to eq(31)
        expect(result.data[:forecast_days]).to eq(30)
      end

      it 'caps at 365 days' do
        result = described_class.call(household: household, days: 999, include_variable_spending: false)
        expect(result.data[:forecast_days]).to eq(365)
      end
    end

    context 'summary calculations' do
      let!(:checking) { create(:account, household: household, account_type: 'checking', current_balance_cents: 500_000) }

      it 'calculates income and expense totals' do
        create(:recurring_item, :income, household: household, name: 'Pay',
               amount_cents: 300_000, frequency: 'monthly',
               next_occurrence: Date.current + 7.days)
        create(:recurring_item, household: household, name: 'Rent',
               amount_cents: 150_000, frequency: 'monthly', is_income: false,
               next_occurrence: Date.current + 3.days)

        result = described_class.call(household: household, days: 60, include_variable_spending: false)

        expect(result.data[:total_projected_income]).to be > 0
        expect(result.data[:total_projected_expenses]).to be > 0
        expect(result.data[:net_cash_flow]).to eq(
          result.data[:total_projected_income] - result.data[:total_projected_expenses]
        )
      end

      it 'identifies min and max balance dates' do
        result = described_class.call(household: household, days: 30, include_variable_spending: false)
        expect(result.data[:min_balance_date]).to be_a(String)
        expect(result.data[:max_balance_date]).to be_a(String)
      end
    end

    context 'low balance warnings' do
      it 'warns when balance drops below threshold' do
        create(:account, household: household, account_type: 'checking', current_balance_cents: 100_000)
        create(:recurring_item, household: household, name: 'Big Bill',
               amount_cents: 95_000, frequency: 'monthly', is_income: false,
               next_occurrence: Date.current + 3.days)

        result = described_class.call(household: household, days: 30, include_variable_spending: false)
        expect(result.data[:warnings]).not_to be_empty
      end

      it 'warns on projected negative balance' do
        create(:account, household: household, account_type: 'checking', current_balance_cents: 50_000)
        create(:recurring_item, household: household, name: 'Big Expense',
               amount_cents: 60_000, frequency: 'monthly', is_income: false,
               next_occurrence: Date.current + 2.days)

        result = described_class.call(household: household, days: 30, include_variable_spending: false)
        negative_warnings = result.data[:warnings].select { |w| w[:message].include?('negative') }
        expect(negative_warnings).not_to be_empty
      end
    end
  end
end
