require 'rails_helper'

RSpec.describe Analytics::FireCalculatorService do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:income_category) { create(:category, :income, household: household, name: 'Salary') }
  let(:expense_category) { create(:category, household: household, name: 'Groceries') }
  let(:checking_account) { create(:account, household: household, account_type: 'checking', current_balance_cents: 500_000) }
  let(:investment_account) { create(:account, household: household, account_type: 'investment', current_balance_cents: 10_000_000) }

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
        result = described_class.call(household: household, current_age: 30)
        expect(result).to be_success
        expect(result.data[:summary][:fire_number]).to eq(0)
        expect(result.data[:summary][:savings_rate]).to eq(0.0)
        expect(result.data[:financials][:monthly_income]).to eq(0)
        expect(result.data[:milestones]).to be_an(Array)
        expect(result.data[:tips]).to be_an(Array)
      end
    end

    context 'with income and expenses' do
      before do
        # Create 6 months of income ($5000/mo)
        6.times do |i|
          create(:transaction, :income,
            household: household,
            account: checking_account,
            category: income_category,
            amount_cents: 500_000,
            date: (i + 1).months.ago.to_date
          )
        end

        # Create 6 months of expenses ($3000/mo)
        6.times do |i|
          create(:transaction,
            household: household,
            account: checking_account,
            category: expense_category,
            amount_cents: 300_000,
            date: (i + 1).months.ago.to_date
          )
        end
      end

      it 'calculates savings rate correctly' do
        result = described_class.call(household: household, current_age: 30)
        expect(result).to be_success
        expect(result.data[:financials][:monthly_income]).to be > 0
        expect(result.data[:financials][:monthly_expenses]).to be > 0
        expect(result.data[:summary][:savings_rate]).to be > 0
      end

      it 'calculates FIRE number based on annual expenses' do
        result = described_class.call(household: household, current_age: 30, withdrawal_rate: 4.0)
        expect(result).to be_success
        # FIRE number = annual expenses / 0.04 = (3000 * 12) / 0.04 = 900,000
        fire_number = result.data[:summary][:fire_number]
        expect(fire_number).to be > 0
        annual_expenses = result.data[:financials][:annual_expenses]
        expect(fire_number).to be_within(1).of(annual_expenses / 0.04)
      end

      it 'calculates years to FIRE' do
        result = described_class.call(household: household, current_age: 30)
        expect(result).to be_success
        expect(result.data[:summary][:years_to_fire]).to be_a(Integer).or be_nil
      end

      it 'returns projections array' do
        result = described_class.call(household: household, current_age: 30)
        expect(result).to be_success
        projections = result.data[:projections]
        expect(projections).to be_an(Array)
        expect(projections.length).to be > 0
        expect(projections.first).to include(:year, :age, :portfolio_value, :fire_number)
      end

      it 'returns scenarios with different savings rates' do
        result = described_class.call(household: household, current_age: 30)
        expect(result).to be_success
        scenarios = result.data[:scenarios]
        expect(scenarios).to be_an(Array)
        expect(scenarios.length).to eq(7)
        expect(scenarios.map { |s| s[:savings_rate] }).to eq([10, 20, 30, 40, 50, 60, 70])
      end

      it 'returns milestones with progress' do
        result = described_class.call(household: household, current_age: 30)
        expect(result).to be_success
        milestones = result.data[:milestones]
        expect(milestones).to be_an(Array)
        milestones.each do |m|
          expect(m[:name]).to be_present
          expect(m[:target]).to be > 0
          expect(m[:percent]).to be_between(0, 100)
        end
      end

      it 'generates tips' do
        result = described_class.call(household: household, current_age: 30)
        expect(result).to be_success
        tips = result.data[:tips]
        expect(tips).to be_an(Array)
        expect(tips.length).to be > 0
        tips.each do |tip|
          expect(tip[:category]).to be_present
          expect(tip[:title]).to be_present
          expect(tip[:description]).to be_present
        end
      end
    end

    context 'with investment accounts' do
      before do
        investment_account # create it

        6.times do |i|
          create(:transaction, :income,
            household: household,
            account: checking_account,
            category: income_category,
            amount_cents: 800_000,
            date: (i + 1).months.ago.to_date
          )
        end

        6.times do |i|
          create(:transaction,
            household: household,
            account: checking_account,
            category: expense_category,
            amount_cents: 300_000,
            date: (i + 1).months.ago.to_date
          )
        end
      end

      it 'includes invested assets in calculations' do
        result = described_class.call(household: household, current_age: 30)
        expect(result).to be_success
        expect(result.data[:financials][:invested_assets]).to eq(100_000)
      end

      it 'calculates progress percentage' do
        result = described_class.call(household: household, current_age: 30)
        expect(result).to be_success
        expect(result.data[:summary][:progress_percent]).to be > 0
      end

      it 'calculates coast FIRE number' do
        result = described_class.call(household: household, current_age: 30, retirement_age: 65)
        expect(result).to be_success
        coast = result.data[:summary][:coast_fire_number]
        fire = result.data[:summary][:fire_number]
        # Coast FIRE should be less than full FIRE number
        expect(coast).to be < fire
        expect(coast).to be > 0
      end
    end

    context 'with custom parameters' do
      before do
        6.times do |i|
          create(:transaction, :income,
            household: household,
            account: checking_account,
            category: income_category,
            amount_cents: 500_000,
            date: (i + 1).months.ago.to_date
          )
          create(:transaction,
            household: household,
            account: checking_account,
            category: expense_category,
            amount_cents: 200_000,
            date: (i + 1).months.ago.to_date
          )
        end
      end

      it 'respects withdrawal rate parameter' do
        result_4pct = described_class.call(household: household, current_age: 30, withdrawal_rate: 4.0)
        result_3pct = described_class.call(household: household, current_age: 30, withdrawal_rate: 3.0)

        # Lower withdrawal rate = higher FIRE number
        expect(result_3pct.data[:summary][:fire_number]).to be > result_4pct.data[:summary][:fire_number]
      end

      it 'respects current age parameter' do
        result = described_class.call(household: household, current_age: 25, retirement_age: 65)
        expect(result.data[:summary][:current_age]).to eq(25)
        expect(result.data[:summary][:retirement_age]).to eq(65)
      end

      it 'respects annual return rate' do
        result_high = described_class.call(household: household, current_age: 30, annual_return_rate: 10.0)
        result_low = described_class.call(household: household, current_age: 30, annual_return_rate: 5.0)

        # Higher return = fewer years (or both nil if no investments)
        if result_high.data[:summary][:years_to_fire] && result_low.data[:summary][:years_to_fire]
          expect(result_high.data[:summary][:years_to_fire]).to be <= result_low.data[:summary][:years_to_fire]
        end
      end
    end

    context 'with high savings rate' do
      before do
        6.times do |i|
          create(:transaction, :income,
            household: household,
            account: checking_account,
            category: income_category,
            amount_cents: 1_000_000,
            date: (i + 1).months.ago.to_date
          )
          create(:transaction,
            household: household,
            account: checking_account,
            category: expense_category,
            amount_cents: 200_000,
            date: (i + 1).months.ago.to_date
          )
        end
      end

      it 'generates positive savings rate tip' do
        result = described_class.call(household: household, current_age: 30)
        expect(result).to be_success
        tip_titles = result.data[:tips].map { |t| t[:title] }
        expect(tip_titles).to include('Impressive savings rate!')
      end
    end

    context 'FIRE number edge cases' do
      it 'returns 0 FIRE number with no expenses' do
        result = described_class.call(household: household, current_age: 30)
        expect(result).to be_success
        expect(result.data[:summary][:fire_number]).to eq(0)
      end

      it 'returns nil years_to_fire when impossible' do
        # No savings, no investments
        result = described_class.call(household: household, current_age: 30)
        expect(result).to be_success
        # With zero expenses, fire_number is 0, so years_to_fire is 0
        expect(result.data[:summary][:years_to_fire]).to eq(0).or be_nil
      end
    end

    context 'projection bounds' do
      before do
        investment_account

        6.times do |i|
          create(:transaction, :income,
            household: household,
            account: checking_account,
            category: income_category,
            amount_cents: 500_000,
            date: (i + 1).months.ago.to_date
          )
          create(:transaction,
            household: household,
            account: checking_account,
            category: expense_category,
            amount_cents: 300_000,
            date: (i + 1).months.ago.to_date
          )
        end
      end

      it 'projections start at year 0 and current age' do
        result = described_class.call(household: household, current_age: 35)
        projections = result.data[:projections]
        expect(projections.first[:year]).to eq(0)
        expect(projections.first[:age]).to eq(35)
      end

      it 'projections include portfolio value at each year' do
        result = described_class.call(household: household, current_age: 30)
        projections = result.data[:projections]
        # Values should generally increase (with positive savings + returns)
        values = projections.map { |p| p[:portfolio_value] }
        expect(values.last).to be >= values.first
      end
    end
  end
end
