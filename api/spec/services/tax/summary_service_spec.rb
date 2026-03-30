require 'rails_helper'

RSpec.describe Tax::SummaryService do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:checking) { create(:account, household: household, account_type: 'checking', current_balance_cents: 500_000) }

  # Income categories
  let(:salary_cat) { create(:category, :income, household: household, name: 'Salary', group_name: 'Income') }
  let(:freelance_cat) { create(:category, :income, household: household, name: 'Freelance', group_name: 'Income') }
  let(:interest_cat) { create(:category, :income, household: household, name: 'Interest Income', group_name: 'Income') }
  let(:investment_cat) { create(:category, :income, household: household, name: 'Investment Income', group_name: 'Income') }

  # Deductible expense categories
  let(:medical_cat) { create(:category, household: household, name: 'Doctor', group_name: 'Healthcare') }
  let(:charity_cat) { create(:category, household: household, name: 'Charitable', group_name: 'Financial') }
  let(:mortgage_cat) { create(:category, household: household, name: 'Mortgage', group_name: 'Bills & Utilities') }

  # Non-deductible
  let(:groceries_cat) { create(:category, household: household, name: 'Groceries', group_name: 'Food & Drink') }
  let(:entertainment_cat) { create(:category, household: household, name: 'Movies & TV', group_name: 'Entertainment') }

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
        expect(data[:filing_status]).to eq('single')
        expect(data[:income_summary][:total]).to eq(0.0)
        expect(data[:deduction_summary][:standard_deduction]).to eq(15_000.0)
        expect(data[:deduction_summary][:should_itemize]).to be false
        expect(data[:tax_estimate][:total_estimated_tax]).to eq(0.0)
        expect(data[:quarterly_breakdown]).to have_attributes(size: 4)
        expect(data[:category_details]).to be_empty
        expect(data[:tips]).not_to be_empty # Should still generate generic tips
      end
    end

    context 'with W-2 income only' do
      before do
        create(:transaction, :income, household: household, account: checking,
          category: salary_cat, amount_cents: 7_500_000, date: Date.new(year, 3, 15),
          merchant_name: 'Employer Inc')
      end

      it 'classifies salary as W-2 income' do
        result = described_class.call(household: household, year: year)
        data = result.data

        expect(data[:income_summary][:total]).to eq(75_000.0)
        w2_bucket = data[:income_summary][:buckets].find { |b| b[:type] == 'w2_income' }
        expect(w2_bucket).to be_present
        expect(w2_bucket[:amount]).to eq(75_000.0)
        expect(w2_bucket[:label]).to eq('Wages & Salary (W-2)')
      end

      it 'calculates federal tax correctly for single filer' do
        result = described_class.call(household: household, year: year, filing_status: 'single')
        est = result.data[:tax_estimate]

        expect(est[:gross_income]).to eq(75_000.0)
        expect(est[:deduction_type]).to eq('standard')
        expect(est[:deduction_amount]).to eq(15_000.0)
        expect(est[:taxable_income]).to eq(60_000.0)
        expect(est[:federal_tax]).to be > 0
        expect(est[:self_employment_tax]).to eq(0.0)
        expect(est[:effective_rate]).to be > 0
        expect(est[:marginal_rate]).to eq(22.0) # $60k falls in 22% bracket
      end

      it 'calculates different tax for married filer' do
        single_result = described_class.call(household: household, year: year, filing_status: 'single')
        married_result = described_class.call(household: household, year: year, filing_status: 'married')

        single_tax = single_result.data[:tax_estimate][:federal_tax]
        married_tax = married_result.data[:tax_estimate][:federal_tax]

        expect(married_tax).to be < single_tax
      end
    end

    context 'with self-employment income' do
      before do
        create(:transaction, :income, household: household, account: checking,
          category: freelance_cat, amount_cents: 5_000_000, date: Date.new(year, 6, 15),
          merchant_name: 'Client Corp')
      end

      it 'classifies as self-employment income' do
        result = described_class.call(household: household, year: year)
        se_bucket = result.data[:income_summary][:buckets].find { |b| b[:type] == 'self_employment_income' }
        expect(se_bucket).to be_present
        expect(se_bucket[:amount]).to eq(50_000.0)
      end

      it 'calculates self-employment tax' do
        result = described_class.call(household: household, year: year)
        est = result.data[:tax_estimate]
        expect(est[:self_employment_tax]).to be > 0
        # SE tax = 50000 * 0.9235 * 0.153 = ~7064.78
        expect(est[:self_employment_tax]).to be_within(100).of(7064.78)
      end

      it 'includes SE income tip' do
        result = described_class.call(household: household, year: year)
        se_tip = result.data[:tips].find { |t| t[:title].include?('Self-Employment') }
        expect(se_tip).to be_present
      end
    end

    context 'with deductible expenses' do
      before do
        # Income to set AGI
        create(:transaction, :income, household: household, account: checking,
          category: salary_cat, amount_cents: 10_000_000, date: Date.new(year, 1, 15),
          merchant_name: 'Employer')

        # Deductible expenses
        create(:transaction, household: household, account: checking,
          category: medical_cat, amount_cents: -500_000, date: Date.new(year, 2, 10),
          merchant_name: 'City Hospital')
        create(:transaction, household: household, account: checking,
          category: charity_cat, amount_cents: -300_000, date: Date.new(year, 4, 20),
          merchant_name: 'Red Cross')
        create(:transaction, household: household, account: checking,
          category: mortgage_cat, amount_cents: -1_200_000, date: Date.new(year, 3, 1),
          merchant_name: 'Bank of America')
      end

      it 'identifies deductible categories' do
        result = described_class.call(household: household, year: year)
        deductions = result.data[:deduction_summary]

        medical = deductions[:buckets].find { |b| b[:type] == 'medical' }
        charitable = deductions[:buckets].find { |b| b[:type] == 'charitable' }
        mortgage = deductions[:buckets].find { |b| b[:type] == 'home_mortgage_interest' }

        expect(medical).to be_present
        expect(medical[:amount]).to eq(5_000.0)
        expect(charitable).to be_present
        expect(charitable[:amount]).to eq(3_000.0)
        expect(mortgage).to be_present
        expect(mortgage[:amount]).to eq(12_000.0)
      end

      it 'recommends itemizing when deductions exceed standard' do
        result = described_class.call(household: household, year: year, filing_status: 'single')
        deductions = result.data[:deduction_summary]

        # Total itemized: $5000 + $3000 + $12000 = $20,000 > $15,000 standard
        expect(deductions[:itemized_total]).to eq(20_000.0)
        expect(deductions[:should_itemize]).to be true
        expect(deductions[:recommended_deduction]).to eq(20_000.0)
      end

      it 'recommends standard when deductions are lower' do
        result = described_class.call(household: household, year: year, filing_status: 'married')
        deductions = result.data[:deduction_summary]

        # $20,000 < $30,000 married standard
        expect(deductions[:should_itemize]).to be false
        expect(deductions[:recommended_deduction]).to eq(30_000.0)
      end
    end

    context 'with non-deductible expenses' do
      before do
        create(:transaction, household: household, account: checking,
          category: groceries_cat, amount_cents: -20_000, date: Date.new(year, 5, 10),
          merchant_name: 'Whole Foods')
        create(:transaction, household: household, account: checking,
          category: entertainment_cat, amount_cents: -5_000, date: Date.new(year, 6, 15),
          merchant_name: 'Netflix')
      end

      it 'does not classify non-deductible expenses' do
        result = described_class.call(household: household, year: year)
        deductions = result.data[:deduction_summary]
        expect(deductions[:itemized_total]).to eq(0.0)
        expect(deductions[:buckets]).to be_empty
      end
    end

    context 'quarterly breakdown' do
      before do
        # Q1 income
        create(:transaction, :income, household: household, account: checking,
          category: salary_cat, amount_cents: 2_500_000, date: Date.new(year, 2, 15))
        # Q2 income
        create(:transaction, :income, household: household, account: checking,
          category: salary_cat, amount_cents: 2_500_000, date: Date.new(year, 5, 15))
        # Q1 deductible expense
        create(:transaction, household: household, account: checking,
          category: medical_cat, amount_cents: -100_000, date: Date.new(year, 1, 20))
      end

      it 'breaks down income and deductions by quarter' do
        result = described_class.call(household: household, year: year)
        quarters = result.data[:quarterly_breakdown]

        expect(quarters).to have_attributes(size: 4)
        q1 = quarters.find { |q| q[:quarter] == 'Q1' }
        q2 = quarters.find { |q| q[:quarter] == 'Q2' }
        q3 = quarters.find { |q| q[:quarter] == 'Q3' }

        expect(q1[:income]).to eq(25_000.0)
        expect(q1[:deductible_expenses]).to eq(1_000.0)
        expect(q2[:income]).to eq(25_000.0)
        expect(q3[:income]).to eq(0.0)
      end

      it 'includes estimated payment due dates' do
        result = described_class.call(household: household, year: year)
        q1 = result.data[:quarterly_breakdown].first
        expect(q1[:estimated_payment_due]).to include('Apr 15')
      end
    end

    context 'category details' do
      before do
        create(:transaction, :income, household: household, account: checking,
          category: salary_cat, amount_cents: 500_000, date: Date.new(year, 3, 15))
        create(:transaction, household: household, account: checking,
          category: groceries_cat, amount_cents: -10_000, date: Date.new(year, 3, 20))
      end

      it 'returns details for each category with tax classification' do
        result = described_class.call(household: household, year: year)
        details = result.data[:category_details]

        salary_detail = details.find { |d| d[:category_name] == 'Salary' }
        grocery_detail = details.find { |d| d[:category_name] == 'Groceries' }

        expect(salary_detail[:is_income]).to be true
        expect(salary_detail[:tax_classification]).to eq('w2_income')
        expect(salary_detail[:income_amount]).to eq(5_000.0)

        expect(grocery_detail[:is_income]).to be false
        expect(grocery_detail[:tax_classification]).to eq('none')
        expect(grocery_detail[:expense_amount]).to eq(100.0)
      end
    end

    context 'tax bracket breakdown' do
      before do
        # $120,000 income → taxable after $15k standard = $105k
        create(:transaction, :income, household: household, account: checking,
          category: salary_cat, amount_cents: 12_000_000, date: Date.new(year, 6, 15))
      end

      it 'shows progressive bracket breakdown' do
        result = described_class.call(household: household, year: year, filing_status: 'single')
        brackets = result.data[:tax_estimate][:bracket_breakdown]

        expect(brackets.size).to be >= 3
        expect(brackets.first[:rate]).to eq(10.0)
        expect(brackets.map { |b| b[:rate] }).to eq(brackets.map { |b| b[:rate] }.sort)

        # Total bracket taxes should equal federal_tax
        bracket_total = brackets.sum { |b| b[:tax] }
        expect(bracket_total).to be_within(0.01).of(result.data[:tax_estimate][:federal_tax])
      end
    end

    context 'with mixed income types' do
      before do
        create(:transaction, :income, household: household, account: checking,
          category: salary_cat, amount_cents: 6_000_000, date: Date.new(year, 3, 15),
          merchant_name: 'Employer Inc')
        create(:transaction, :income, household: household, account: checking,
          category: freelance_cat, amount_cents: 2_000_000, date: Date.new(year, 4, 20),
          merchant_name: 'Consulting Client')
        create(:transaction, :income, household: household, account: checking,
          category: interest_cat, amount_cents: 50_000, date: Date.new(year, 6, 30),
          merchant_name: 'Chase Bank')
      end

      it 'classifies all income types correctly' do
        result = described_class.call(household: household, year: year)
        buckets = result.data[:income_summary][:buckets]

        expect(result.data[:income_summary][:total]).to eq(80_500.0)
        expect(buckets.find { |b| b[:type] == 'w2_income' }[:amount]).to eq(60_000.0)
        expect(buckets.find { |b| b[:type] == 'self_employment_income' }[:amount]).to eq(20_000.0)
        expect(buckets.find { |b| b[:type] == 'interest_income' }[:amount]).to eq(500.0)
      end

      it 'shows income percentages that total 100' do
        result = described_class.call(household: household, year: year)
        buckets = result.data[:income_summary][:buckets]
        total_pct = buckets.sum { |b| b[:percentage] }
        expect(total_pct).to be_within(1.0).of(100.0)
      end
    end

    context 'tips generation' do
      it 'suggests tax-advantaged investing when no investment income exists' do
        create(:transaction, :income, household: household, account: checking,
          category: salary_cat, amount_cents: 500_000, date: Date.new(year, 3, 15))

        result = described_class.call(household: household, year: year)
        tip = result.data[:tips].find { |t| t[:title].include?('Tax-Advantaged') }
        expect(tip).to be_present
      end

      it 'warns about medical expense threshold' do
        create(:transaction, :income, household: household, account: checking,
          category: salary_cat, amount_cents: 10_000_000, date: Date.new(year, 1, 15))
        create(:transaction, household: household, account: checking,
          category: medical_cat, amount_cents: -200_000, date: Date.new(year, 2, 10))

        result = described_class.call(household: household, year: year)
        tip = result.data[:tips].find { |t| t[:title].include?('Medical Expenses') }
        # $2000 medical < 7.5% of $100k AGI ($7500), so should warn
        expect(tip).to be_present
        expect(tip[:type]).to eq('warning')
      end
    end
  end
end
