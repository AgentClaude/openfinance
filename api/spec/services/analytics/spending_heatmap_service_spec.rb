require 'rails_helper'

RSpec.describe Analytics::SpendingHeatmapService do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:checking) { create(:account, household: household, account_type: 'checking', current_balance_cents: 500_000) }
  let(:groceries) { create(:category, household: household, name: 'Groceries', group_name: 'Food & Drink') }
  let(:dining) { create(:category, household: household, name: 'Dining', group_name: 'Food & Drink') }
  let(:rent) { create(:category, household: household, name: 'Rent', group_name: 'Housing') }
  let(:salary) { create(:category, :income, household: household, name: 'Salary') }

  let(:year) { Date.current.year }

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
        result = described_class.call(household: household, year: year)
        expect(result).to be_success
        data = result.data
        expect(data[:year]).to eq(year)
        expect(data[:daily_spending]).not_to be_empty
        expect(data[:daily_spending].first[:amount]).to eq(0.0)
        expect(data[:stats][:total_spent]).to eq(0.0)
        expect(data[:stats][:spending_days]).to eq(0)
        expect(data[:weekday_averages].size).to eq(7)
        expect(data[:category_heatmap]).to be_empty
      end
    end

    context 'with transactions' do
      let(:jan_5) { Date.new(year, 1, 5) }
      let(:jan_6) { Date.new(year, 1, 6) }
      let(:jan_10) { Date.new(year, 1, 10) }
      let(:feb_1) { Date.new(year, 2, 1) }

      before do
        # Skip if dates are in the future
        skip 'Test dates are in the future' if jan_5 > Date.current

        # Expenses
        create(:transaction, household: household, account: checking,
          category: groceries, amount_cents: -5_000, date: jan_5,
          name: 'Grocery Store', merchant_name: 'Kroger')
        create(:transaction, household: household, account: checking,
          category: groceries, amount_cents: -3_000, date: jan_5,
          name: 'Other groceries', merchant_name: 'Aldi')
        create(:transaction, household: household, account: checking,
          category: dining, amount_cents: -2_500, date: jan_6,
          name: 'Restaurant', merchant_name: 'Chipotle')
        create(:transaction, household: household, account: checking,
          category: rent, amount_cents: -150_000, date: jan_10,
          name: 'Rent', merchant_name: 'Landlord LLC')

        # Income (should be excluded from heatmap)
        create(:transaction, :income, household: household, account: checking,
          category: salary, amount_cents: 500_000, date: jan_5,
          name: 'Paycheck', merchant_name: 'Employer')

        # February spending
        if feb_1 <= Date.current
          create(:transaction, household: household, account: checking,
            category: groceries, amount_cents: -7_000, date: feb_1,
            name: 'Grocery', merchant_name: 'Kroger')
        end
      end

      it 'computes daily spending excluding income' do
        result = described_class.call(household: household, year: year)
        expect(result).to be_success

        data = result.data
        jan_5_entry = data[:daily_spending].find { |d| d[:date] == jan_5.iso8601 }
        expect(jan_5_entry).not_to be_nil
        expect(jan_5_entry[:amount]).to eq(80.0) # 50 + 30, no income
      end

      it 'computes correct stats' do
        result = described_class.call(household: household, year: year)
        data = result.data

        expect(data[:stats][:spending_days]).to be >= 3
        expect(data[:stats][:total_spent]).to be >= 1605.0 # at least jan expenses (50+30+25+1500)
        expect(data[:stats][:max_day_amount]).to eq(1500.0) # rent day
        expect(data[:stats][:max_day_date]).to eq(jan_10.iso8601)
      end

      it 'computes weekday averages for all 7 days' do
        result = described_class.call(household: household, year: year)
        data = result.data

        expect(data[:weekday_averages].size).to eq(7)
        expect(data[:weekday_averages].map { |w| w[:day_name] }).to eq(
          %w[Sunday Monday Tuesday Wednesday Thursday Friday Saturday]
        )
        # Each weekday average should be >= 0
        data[:weekday_averages].each do |w|
          expect(w[:average]).to be >= 0.0
          expect(w[:count]).to be > 0
        end
      end

      it 'computes monthly totals' do
        result = described_class.call(household: household, year: year)
        data = result.data

        jan_total = data[:monthly_totals].find { |m| m[:month] == "#{year}-01" }
        expect(jan_total).not_to be_nil
        expect(jan_total[:amount]).to eq(1605.0) # 50+30+25+1500 = 1605
      end

      it 'computes category heatmap with top categories' do
        result = described_class.call(household: household, year: year)
        data = result.data

        expect(data[:category_heatmap]).not_to be_empty
        cat_names = data[:category_heatmap].map { |c| c[:category_name] }
        expect(cat_names).to include('Rent')
        expect(cat_names).to include('Groceries')
      end

      it 'computes streak data' do
        result = described_class.call(household: household, year: year)
        data = result.data

        streaks = data[:streaks]
        expect(streaks[:longest_no_spend_days]).to be >= 1
        expect(streaks[:current_no_spend_streak]).to be >= 0
      end
    end

    context 'with specific year' do
      it 'uses provided year' do
        result = described_class.call(household: household, year: 2025)
        expect(result).to be_success
        expect(result.data[:year]).to eq(2025)
      end
    end

    context 'no-spend streak calculation' do
      before do
        # Create spending only on Jan 1 and Jan 5, leaving a 3-day gap
        skip 'Test dates are in the future' if Date.new(year, 1, 10) > Date.current

        create(:transaction, household: household, account: checking,
          category: groceries, amount_cents: -1_000, date: Date.new(year, 1, 1),
          name: 'Day 1', merchant_name: 'Store')
        create(:transaction, household: household, account: checking,
          category: groceries, amount_cents: -1_000, date: Date.new(year, 1, 5),
          name: 'Day 5', merchant_name: 'Store')
        create(:transaction, household: household, account: checking,
          category: groceries, amount_cents: -1_000, date: Date.new(year, 1, 10),
          name: 'Day 10', merchant_name: 'Store')
      end

      it 'finds longest no-spend streak' do
        result = described_class.call(household: household, year: year)
        data = result.data

        # Between Jan 5 and Jan 10 there's a 4-day gap (6,7,8,9)
        expect(data[:streaks][:longest_no_spend_days]).to be >= 4
      end
    end
  end
end
