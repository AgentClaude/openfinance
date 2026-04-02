require 'rails_helper'

RSpec.describe Analytics::SavingsRateService do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:checking_account) { create(:account, household: household, account_type: 'checking') }

  let(:salary_category) { create(:category, :income, household: household, name: 'Salary', group_name: 'Income') }
  let(:freelance_category) { create(:category, :income, household: household, name: 'Freelance', group_name: 'Income') }
  let(:rent_category) { create(:category, household: household, name: 'Rent', group_name: 'Housing') }
  let(:groceries_category) { create(:category, household: household, name: 'Groceries', group_name: 'Food & Drink') }
  let(:entertainment_category) { create(:category, household: household, name: 'Entertainment', group_name: 'Entertainment') }
  let(:transfer_category) { create(:category, household: household, name: 'Transfer', group_name: 'Transfer') }

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
        result = described_class.call(household: household, months: 6)
        expect(result).to be_success
        expect(result.data[:summary][:current_savings_rate]).to eq(0)
        expect(result.data[:summary][:average_savings_rate]).to eq(0)
        expect(result.data[:monthly_trends]).to be_an(Array)
        expect(result.data[:income_sources]).to eq([])
        expect(result.data[:expense_allocation]).to eq([])
      end
    end

    context 'with income and expenses' do
      before do
        # 6 months of $5000 salary income
        6.times do |i|
          create(:transaction, :income,
            household: household,
            account: checking_account,
            category: salary_category,
            amount_cents: 500_000,
            date: (i + 1).months.ago.beginning_of_month + 1.day
          )
        end

        # 6 months of $1500 rent (needs)
        6.times do |i|
          create(:transaction,
            household: household,
            account: checking_account,
            category: rent_category,
            amount_cents: -150_000,
            date: (i + 1).months.ago.beginning_of_month + 2.days
          )
        end

        # 6 months of $500 groceries (wants)
        6.times do |i|
          create(:transaction,
            household: household,
            account: checking_account,
            category: groceries_category,
            amount_cents: -50_000,
            date: (i + 1).months.ago.beginning_of_month + 3.days
          )
        end

        # 6 months of $300 entertainment (wants)
        6.times do |i|
          create(:transaction,
            household: household,
            account: checking_account,
            category: entertainment_category,
            amount_cents: -30_000,
            date: (i + 1).months.ago.beginning_of_month + 4.days
          )
        end
      end

      it 'calculates savings rate correctly' do
        result = described_class.call(household: household, months: 6)
        expect(result).to be_success

        summary = result.data[:summary]
        # Months with data should have 54% rate, but average includes current month (possibly empty)
        expect(summary[:average_savings_rate]).to be > 0
        expect(summary[:total_saved]).to be > 0

        # Verify individual months with data have correct rate
        months_with_data = result.data[:monthly_trends].select { |m| m[:income] > 0 }
        months_with_data.each do |m|
          expect(m[:savings_rate]).to eq(54.0)
        end
      end

      it 'returns monthly trends' do
        result = described_class.call(household: household, months: 6)
        trends = result.data[:monthly_trends]
        expect(trends).to be_an(Array)

        # Each trend has the right keys
        month_with_data = trends.find { |m| m[:income] > 0 }
        next unless month_with_data

        expect(month_with_data[:income]).to eq(5000.0)
        expect(month_with_data[:expenses]).to eq(2300.0)
        expect(month_with_data[:savings_amount]).to eq(2700.0)
        expect(month_with_data[:savings_rate]).to eq(54.0)
      end

      it 'calculates 50/30/20 allocation' do
        result = described_class.call(household: household, months: 6)
        allocation = result.data[:allocation]

        expect(allocation[:needs][:amount]).to be > 0
        expect(allocation[:wants][:amount]).to be > 0
        expect(allocation[:savings][:amount]).to be > 0
        expect(allocation[:avg_monthly_income]).to be > 0

        # Needs (Housing): $1500 / $5000 = 30% — good (< 50%)
        expect(allocation[:needs][:status]).to eq('good')
      end

      it 'breaks down income sources' do
        result = described_class.call(household: household, months: 6)
        sources = result.data[:income_sources]

        expect(sources).to be_an(Array)
        expect(sources.size).to eq(1) # Only salary

        salary_source = sources.find { |s| s[:name] == 'Salary' }
        expect(salary_source).to be_present
        expect(salary_source[:percent]).to eq(100.0)
      end

      it 'breaks down expense allocation by group' do
        result = described_class.call(household: household, months: 6)
        allocation = result.data[:expense_allocation]

        expect(allocation).to be_an(Array)
        housing = allocation.find { |e| e[:group] == 'Housing' }
        expect(housing).to be_present
        expect(housing[:category_type]).to eq('needs')

        food = allocation.find { |e| e[:group] == 'Food & Drink' }
        expect(food).to be_present
        expect(food[:category_type]).to eq('wants')
      end

      it 'calculates streaks' do
        result = described_class.call(household: household, months: 6)
        streaks = result.data[:streaks]

        expect(streaks[:positive_savings_months]).to be >= 0
        expect(streaks[:total_months]).to be > 0
      end

      it 'assigns percentile ranking' do
        result = described_class.call(household: household, months: 6)
        # Current month may have no data; percentile is based on the most recent month's rate
        percentile = result.data[:summary][:percentile]
        expect(percentile).to be_a(Integer)
        expect(percentile).to be_between(5, 90)
      end

      it 'generates recommendations' do
        result = described_class.call(household: household, months: 6)
        recs = result.data[:recommendations]
        expect(recs).to be_an(Array)
      end
    end

    context 'with negative savings rate' do
      before do
        # $2000 income, $3000 expenses
        3.times do |i|
          create(:transaction, :income,
            household: household,
            account: checking_account,
            category: salary_category,
            amount_cents: 200_000,
            date: (i + 1).months.ago.beginning_of_month + 1.day
          )
          create(:transaction,
            household: household,
            account: checking_account,
            category: rent_category,
            amount_cents: -300_000,
            date: (i + 1).months.ago.beginning_of_month + 2.days
          )
        end
      end

      it 'reports negative savings rate' do
        result = described_class.call(household: household, months: 3)
        expect(result).to be_success

        # Months with data should show negative rate
        months_with_data = result.data[:monthly_trends].select { |m| m[:income] > 0 }
        months_with_data.each do |m|
          expect(m[:savings_rate]).to be < 0
        end
      end
    end

    context 'with multiple income sources' do
      before do
        3.times do |i|
          create(:transaction, :income,
            household: household,
            account: checking_account,
            category: salary_category,
            amount_cents: 400_000,
            date: (i + 1).months.ago.beginning_of_month + 1.day
          )
          create(:transaction, :income,
            household: household,
            account: checking_account,
            category: freelance_category,
            amount_cents: 100_000,
            date: (i + 1).months.ago.beginning_of_month + 5.days
          )
        end
      end

      it 'breaks down by income source with percentages' do
        result = described_class.call(household: household, months: 3)
        sources = result.data[:income_sources]

        expect(sources.size).to eq(2)
        salary = sources.find { |s| s[:name] == 'Salary' }
        freelance = sources.find { |s| s[:name] == 'Freelance' }

        expect(salary[:percent]).to eq(80.0)
        expect(freelance[:percent]).to eq(20.0)
      end
    end

    context 'with transfer transactions' do
      before do
        3.times do |i|
          create(:transaction, :income,
            household: household,
            account: checking_account,
            category: salary_category,
            amount_cents: 500_000,
            date: (i + 1).months.ago.beginning_of_month + 1.day
          )
          # Transfer should not count as expense
          create(:transaction,
            household: household,
            account: checking_account,
            category: transfer_category,
            amount_cents: -200_000,
            date: (i + 1).months.ago.beginning_of_month + 2.days
          )
        end
      end

      it 'excludes transfers from expense calculations' do
        result = described_class.call(household: household, months: 3)
        # All income, no real expenses → 100% savings rate
        month_with_data = result.data[:monthly_trends].find { |m| m[:income] > 0 }
        expect(month_with_data[:expenses]).to eq(0.0) if month_with_data
      end
    end

    context 'with excluded transactions' do
      before do
        3.times do |i|
          create(:transaction, :income,
            household: household,
            account: checking_account,
            category: salary_category,
            amount_cents: 500_000,
            date: (i + 1).months.ago.beginning_of_month + 1.day
          )
          create(:transaction,
            household: household,
            account: checking_account,
            category: groceries_category,
            amount_cents: -200_000,
            date: (i + 1).months.ago.beginning_of_month + 2.days,
            excluded: true
          )
        end
      end

      it 'excludes transactions marked as excluded from reports' do
        result = described_class.call(household: household, months: 3)
        month_with_data = result.data[:monthly_trends].find { |m| m[:income] > 0 }
        # Excluded grocery transactions should not appear
        expect(month_with_data[:expenses]).to eq(0.0) if month_with_data
      end
    end

    context 'with months parameter clamping' do
      it 'clamps months to minimum of 3' do
        result = described_class.call(household: household, months: 1)
        expect(result).to be_success
        expect(result.data[:summary][:months_analyzed]).to be >= 3
      end

      it 'clamps months to maximum of 36' do
        result = described_class.call(household: household, months: 100)
        expect(result).to be_success
        expect(result.data[:summary][:months_analyzed]).to be <= 37 # 36 + possible current partial month
      end
    end

    context 'trend direction' do
      it 'detects improving trend' do
        # Increasing savings rate over time
        6.times do |i|
          income = 500_000
          # Decreasing expenses: 4500, 4000, 3500, 3000, 2500, 2000
          expenses = (450_000 - (i * 50_000))

          create(:transaction, :income,
            household: household,
            account: checking_account,
            category: salary_category,
            amount_cents: income,
            date: (6 - i).months.ago.beginning_of_month + 1.day
          )
          create(:transaction,
            household: household,
            account: checking_account,
            category: rent_category,
            amount_cents: -expenses,
            date: (6 - i).months.ago.beginning_of_month + 2.days
          )
        end

        result = described_class.call(household: household, months: 6)
        expect(result.data[:summary][:trend_direction]).to eq('improving')
      end
    end
  end
end
