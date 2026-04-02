require 'rails_helper'

RSpec.describe Analytics::SpendingComparisonService do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:checking) { create(:account, household: household, name: 'Checking', account_type: 'checking') }
  let(:groceries) { create(:category, household: household, name: 'Groceries', group_name: 'Food & Drink') }
  let(:dining) { create(:category, household: household, name: 'Dining', group_name: 'Food & Drink') }
  let(:utilities) { create(:category, household: household, name: 'Utilities', group_name: 'Housing') }

  # Period A: Feb 2026
  let(:period_a_start) { '2026-02-01' }
  let(:period_a_end) { '2026-02-28' }
  # Period B: Mar 2026
  let(:period_b_start) { '2026-03-01' }
  let(:period_b_end) { '2026-03-31' }

  before do
    # Period A transactions
    create(:transaction, household: household, account: checking, category: groceries,
           amount_cents: -15000, date: Date.parse('2026-02-05'), merchant_name: 'Whole Foods')
    create(:transaction, household: household, account: checking, category: groceries,
           amount_cents: -8000, date: Date.parse('2026-02-15'), merchant_name: 'Trader Joes')
    create(:transaction, household: household, account: checking, category: dining,
           amount_cents: -5000, date: Date.parse('2026-02-20'), merchant_name: 'Chipotle')
    create(:transaction, household: household, account: checking, category: utilities,
           amount_cents: -12000, date: Date.parse('2026-02-10'), merchant_name: 'Electric Co')
    # Income in period A
    create(:transaction, household: household, account: checking, category: nil,
           amount_cents: 500000, date: Date.parse('2026-02-01'), name: 'Salary')

    # Period B transactions
    create(:transaction, household: household, account: checking, category: groceries,
           amount_cents: -20000, date: Date.parse('2026-03-05'), merchant_name: 'Whole Foods')
    create(:transaction, household: household, account: checking, category: dining,
           amount_cents: -3000, date: Date.parse('2026-03-20'), merchant_name: 'Chipotle')
    create(:transaction, household: household, account: checking, category: utilities,
           amount_cents: -15000, date: Date.parse('2026-03-10'), merchant_name: 'Electric Co')
    # Income in period B
    create(:transaction, household: household, account: checking, category: nil,
           amount_cents: 550000, date: Date.parse('2026-03-01'), name: 'Salary')
  end

  subject do
    described_class.call(
      household: household,
      period_a_start: period_a_start,
      period_a_end: period_a_end,
      period_b_start: period_b_start,
      period_b_end: period_b_end
    )
  end

  it 'returns a successful result' do
    expect(subject).to be_success
  end

  it 'returns period labels' do
    data = subject.data
    expect(data[:period_a]).to eq('Feb 2026')
    expect(data[:period_b]).to eq('Mar 2026')
  end

  describe 'totals' do
    it 'calculates expense totals correctly' do
      totals = subject.data[:totals]
      # A: 150+80+50+120 = 400
      expect(totals[:period_a_expenses]).to eq(400.0)
      # B: 200+30+150 = 380
      expect(totals[:period_b_expenses]).to eq(380.0)
      expect(totals[:expenses_change]).to eq(-20.0)
    end

    it 'calculates income totals correctly' do
      totals = subject.data[:totals]
      expect(totals[:period_a_income]).to eq(5000.0)
      expect(totals[:period_b_income]).to eq(5500.0)
      expect(totals[:income_change]).to eq(500.0)
    end

    it 'calculates net correctly' do
      totals = subject.data[:totals]
      expect(totals[:period_a_net]).to eq(4600.0)
      expect(totals[:period_b_net]).to eq(5120.0)
    end

    it 'counts transactions' do
      totals = subject.data[:totals]
      expect(totals[:period_a_transaction_count]).to eq(5)
      expect(totals[:period_b_transaction_count]).to eq(4)
    end
  end

  describe 'category_comparison' do
    it 'returns comparison for all categories with transactions' do
      cats = subject.data[:category_comparison]
      names = cats.map { |c| c[:category_name] }
      expect(names).to include('Groceries', 'Dining', 'Utilities')
    end

    it 'calculates category changes correctly' do
      cats = subject.data[:category_comparison]
      groceries_comp = cats.find { |c| c[:category_name] == 'Groceries' }
      expect(groceries_comp[:period_a_amount]).to eq(230.0)
      expect(groceries_comp[:period_b_amount]).to eq(200.0)
      expect(groceries_comp[:change]).to eq(-30.0)
    end

    it 'handles categories only in one period' do
      # Dining: period A has $50, period B has $30
      cats = subject.data[:category_comparison]
      dining_comp = cats.find { |c| c[:category_name] == 'Dining' }
      expect(dining_comp[:period_a_amount]).to eq(50.0)
      expect(dining_comp[:period_b_amount]).to eq(30.0)
    end
  end

  describe 'merchant_comparison' do
    it 'returns merchant comparisons' do
      merchants = subject.data[:merchant_comparison]
      names = merchants.map { |m| m[:merchant_name] }
      expect(names).to include('Whole Foods', 'Chipotle', 'Electric Co')
    end

    it 'calculates merchant changes' do
      merchants = subject.data[:merchant_comparison]
      wf = merchants.find { |m| m[:merchant_name] == 'Whole Foods' }
      expect(wf[:period_a_amount]).to eq(150.0)
      expect(wf[:period_b_amount]).to eq(200.0)
      expect(wf[:change]).to eq(50.0)
    end

    it 'handles merchants only in period A' do
      merchants = subject.data[:merchant_comparison]
      tj = merchants.find { |m| m[:merchant_name] == 'Trader Joes' }
      expect(tj[:period_a_amount]).to eq(80.0)
      expect(tj[:period_b_amount]).to eq(0.0)
    end
  end

  describe 'daily_curves' do
    it 'returns daily cumulative spending data' do
      curves = subject.data[:daily_curves]
      # Period A is 28 days, B is 31 days → max 31 points
      expect(curves.length).to eq(31)
    end

    it 'has increasing cumulative values' do
      curves = subject.data[:daily_curves]
      a_values = curves.map { |c| c[:period_a_cumulative] }.compact
      expect(a_values).to eq(a_values.sort)
    end

    it 'nils period A after its length' do
      curves = subject.data[:daily_curves]
      # Period A is 28 days, so day 29-31 should be nil
      expect(curves[28][:period_a_cumulative]).to be_nil
      expect(curves[28][:period_b_cumulative]).not_to be_nil
    end
  end

  context 'with missing household' do
    it 'returns a failure' do
      result = described_class.call(
        household: nil,
        period_a_start: period_a_start,
        period_a_end: period_a_end,
        period_b_start: period_b_start,
        period_b_end: period_b_end
      )
      expect(result).to be_failure
    end
  end

  context 'with no transactions in range' do
    it 'returns zeroed totals' do
      result = described_class.call(
        household: household,
        period_a_start: '2020-01-01',
        period_a_end: '2020-01-31',
        period_b_start: '2020-02-01',
        period_b_end: '2020-02-29'
      )
      expect(result).to be_success
      expect(result.data[:totals][:period_a_expenses]).to eq(0.0)
      expect(result.data[:totals][:period_b_expenses]).to eq(0.0)
    end
  end

  describe 'percentage calculations' do
    it 'handles zero base values without division by zero' do
      # Create a category only in period B
      new_cat = create(:category, household: household, name: 'New Category')
      create(:transaction, household: household, account: checking, category: new_cat,
             amount_cents: -10000, date: Date.parse('2026-03-15'))

      cats = subject.data[:category_comparison]
      new_comp = cats.find { |c| c[:category_name] == 'New Category' }
      expect(new_comp[:change_percent]).to eq(100.0)
    end
  end
end
