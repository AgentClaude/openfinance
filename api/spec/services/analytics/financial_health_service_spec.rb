require 'rails_helper'

RSpec.describe Analytics::FinancialHealthService do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:income_category) { create(:category, :income, household: household, name: 'Salary') }
  let(:expense_category) { create(:category, household: household, name: 'Groceries') }
  let(:checking_account) { create(:account, household: household, account_type: 'checking', current_balance_cents: 1_000_000) }
  let(:savings_account) { create(:account, household: household, account_type: 'savings', current_balance_cents: 2_000_000) }

  describe '.call' do
    context 'without household' do
      it 'returns failure' do
        result = described_class.call(household: nil)
        expect(result).to be_failure
        expect(result.errors).to include('Household is required')
      end
    end

    context 'with household but no data' do
      it 'returns a score with no_data components' do
        result = described_class.call(household: household)
        expect(result).to be_success
        expect(result.data[:score]).to be_between(0, 100)
        expect(result.data[:grade]).to be_present
        expect(result.data[:components]).to be_an(Array)
        expect(result.data[:components].length).to eq(5)
        expect(result.data[:recommendations]).to be_an(Array)
      end
    end

    context 'with full financial data' do
      before do
        # Create income transactions (last 3 months)
        3.times do |i|
          create(:transaction, :income,
            household: household,
            account: checking_account,
            category: income_category,
            amount_cents: 500_000,
            date: Date.current.beginning_of_month - i.months + 15.days)
        end

        # Create expense transactions (last 3 months)
        3.times do |i|
          create(:transaction,
            household: household,
            account: checking_account,
            category: expense_category,
            amount_cents: -300_000,
            date: Date.current.beginning_of_month - i.months + 10.days)
        end
      end

      it 'returns a valid score' do
        result = described_class.call(household: household)
        expect(result).to be_success
        expect(result.data[:score]).to be_between(0, 100)
        expect(result.data[:grade]).to match(/\A[A-F]\z/)
      end

      it 'calculates all five components' do
        result = described_class.call(household: household)
        component_names = result.data[:components].map { |c| c[:name] }
        expect(component_names).to contain_exactly(
          'savings_rate', 'budget_adherence', 'debt_ratio',
          'emergency_fund', 'net_worth_trend'
        )
      end

      it 'calculates correct savings rate' do
        result = described_class.call(household: household)
        savings = result.data[:components].find { |c| c[:name] == 'savings_rate' }
        expect(savings[:details][:rate]).to eq(40.0) # (500k - 300k) / 500k = 40%
        expect(savings[:status]).to eq('excellent')
        expect(savings[:raw_score]).to eq(100)
      end
    end
  end

  describe 'savings rate component' do
    context 'with 40% savings rate' do
      before do
        create(:transaction, :income, household: household, account: checking_account,
          category: income_category, amount_cents: 500_000, date: Date.current - 15.days)
        create(:transaction, household: household, account: checking_account,
          category: expense_category, amount_cents: -300_000, date: Date.current - 10.days)
      end

      it 'scores excellent' do
        result = described_class.call(household: household)
        comp = result.data[:components].find { |c| c[:name] == 'savings_rate' }
        expect(comp[:raw_score]).to eq(100)
        expect(comp[:status]).to eq('excellent')
      end
    end

    context 'with negative savings rate' do
      before do
        create(:transaction, :income, household: household, account: checking_account,
          category: income_category, amount_cents: 200_000, date: Date.current - 15.days)
        create(:transaction, household: household, account: checking_account,
          category: expense_category, amount_cents: -400_000, date: Date.current - 10.days)
      end

      it 'scores critical' do
        result = described_class.call(household: household)
        comp = result.data[:components].find { |c| c[:name] == 'savings_rate' }
        expect(comp[:status]).to eq('critical')
        expect(comp[:raw_score]).to be < 30
      end
    end
  end

  describe 'budget adherence component' do
    let(:budget) { create(:budget, household: household) }
    let(:category_a) { create(:category, household: household, name: 'Food') }
    let(:category_b) { create(:category, household: household, name: 'Transport') }

    context 'with all budgets on track' do
      before do
        current_month = Date.current.beginning_of_month
        create(:budget_item, budget: budget, category: category_a, month: current_month, amount_cents: 50_000)
        create(:budget_item, budget: budget, category: category_b, month: current_month, amount_cents: 30_000)

        create(:transaction, household: household, account: checking_account,
          category: category_a, amount_cents: -40_000, date: Date.current)
        create(:transaction, household: household, account: checking_account,
          category: category_b, amount_cents: -20_000, date: Date.current)
      end

      it 'scores 100' do
        result = described_class.call(household: household)
        comp = result.data[:components].find { |c| c[:name] == 'budget_adherence' }
        expect(comp[:raw_score]).to eq(100)
        expect(comp[:details][:on_track]).to eq(2)
        expect(comp[:details][:over_budget]).to eq(0)
      end
    end

    context 'with half over budget' do
      before do
        current_month = Date.current.beginning_of_month
        create(:budget_item, budget: budget, category: category_a, month: current_month, amount_cents: 50_000)
        create(:budget_item, budget: budget, category: category_b, month: current_month, amount_cents: 30_000)

        create(:transaction, household: household, account: checking_account,
          category: category_a, amount_cents: -40_000, date: Date.current)
        create(:transaction, household: household, account: checking_account,
          category: category_b, amount_cents: -50_000, date: Date.current) # Over budget
      end

      it 'scores 50' do
        result = described_class.call(household: household)
        comp = result.data[:components].find { |c| c[:name] == 'budget_adherence' }
        expect(comp[:raw_score]).to eq(50)
        expect(comp[:details][:on_track]).to eq(1)
        expect(comp[:details][:over_budget]).to eq(1)
      end
    end
  end

  describe 'debt ratio component' do
    context 'with no debt' do
      before do
        create(:account, household: household, account_type: 'checking', current_balance_cents: 500_000)
        create(:account, household: household, account_type: 'savings', current_balance_cents: 500_000)
      end

      it 'scores 100' do
        result = described_class.call(household: household)
        comp = result.data[:components].find { |c| c[:name] == 'debt_ratio' }
        expect(comp[:raw_score]).to eq(100)
        expect(comp[:status]).to eq('excellent')
      end
    end

    context 'with high debt' do
      before do
        create(:account, household: household, account_type: 'checking', current_balance_cents: 100_000)
        create(:account, household: household, account_type: 'credit_card', current_balance_cents: 200_000)
      end

      it 'scores poorly' do
        result = described_class.call(household: household)
        comp = result.data[:components].find { |c| c[:name] == 'debt_ratio' }
        expect(comp[:raw_score]).to be < 50
        expect(comp[:details][:ratio]).to be > 100
      end
    end
  end

  describe 'emergency fund component' do
    context 'with 6+ months of expenses covered' do
      before do
        create(:account, household: household, account_type: 'savings', current_balance_cents: 3_000_000) # $30k

        3.times do |i|
          create(:transaction, household: household, account: checking_account,
            category: expense_category, amount_cents: -300_000, # $3k/month
            date: Date.current.beginning_of_month - i.months + 5.days)
        end
      end

      it 'scores 100' do
        result = described_class.call(household: household)
        comp = result.data[:components].find { |c| c[:name] == 'emergency_fund' }
        expect(comp[:raw_score]).to eq(100)
        expect(comp[:details][:months_covered]).to be >= 6
      end
    end
  end

  describe 'recommendations' do
    it 'generates recommendations for critical components' do
      # Create a scenario with negative savings rate
      create(:transaction, :income, household: household, account: checking_account,
        category: income_category, amount_cents: 100_000, date: Date.current - 5.days)
      create(:transaction, household: household, account: checking_account,
        category: expense_category, amount_cents: -200_000, date: Date.current - 5.days)

      result = described_class.call(household: household)
      recs = result.data[:recommendations]
      critical_recs = recs.select { |r| r[:type] == 'critical' }
      expect(critical_recs).not_to be_empty
    end

    it 'generates positive reinforcement for excellent components' do
      # Create excellent savings rate
      create(:transaction, :income, household: household, account: checking_account,
        category: income_category, amount_cents: 500_000, date: Date.current - 5.days)
      create(:transaction, household: household, account: checking_account,
        category: expense_category, amount_cents: -100_000, date: Date.current - 5.days)

      result = described_class.call(household: household)
      positive = result.data[:recommendations].select { |r| r[:type] == 'positive' }
      expect(positive).not_to be_empty
    end
  end

  describe 'grade mapping' do
    it 'maps score ranges to letter grades' do
      result = described_class.call(household: household)
      expect(result.data[:grade]).to match(/\A[A-F]\z/)
    end
  end

  describe 'component weights' do
    it 'weights sum to 100' do
      expect(Analytics::FinancialHealthService::WEIGHTS.values.sum).to eq(100)
    end
  end
end
