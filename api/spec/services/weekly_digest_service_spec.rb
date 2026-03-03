require 'rails_helper'

RSpec.describe WeeklyDigestService do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:account) { create(:account, household: household, account_type: 'checking', current_balance_cents: 500_000) }
  let(:category) { create(:category, household: household, name: 'Groceries') }
  let(:week_start) { 1.week.ago.to_date }

  subject { described_class.new(user, week_start: week_start) }

  before do
    # Create transactions this week
    create(:transaction, household: household, account: account, category: category,
           date: week_start + 1, amount_cents: -5000, name: 'Walmart', merchant_name: 'Walmart')
    create(:transaction, household: household, account: account, category: category,
           date: week_start + 2, amount_cents: -3000, name: 'Trader Joes', merchant_name: 'Trader Joes')
    create(:transaction, :income, household: household, account: account,
           date: week_start + 3, amount_cents: 200_000, name: 'Payroll')
  end

  describe '#generate' do
    let(:result) { subject.generate }

    it 'returns a hash with all sections' do
      expect(result).to include(
        :user, :period, :spending_summary, :income_summary,
        :top_categories, :top_merchants, :large_transactions,
        :budget_status, :account_balances, :net_worth, :needs_review_count
      )
    end

    it 'calculates spending correctly' do
      expect(result[:spending_summary][:total_cents]).to eq(8000)
      expect(result[:spending_summary][:count]).to eq(2)
    end

    it 'calculates income correctly' do
      expect(result[:income_summary][:total_cents]).to eq(200_000)
      expect(result[:income_summary][:count]).to eq(1)
    end

    it 'returns top categories' do
      expect(result[:top_categories].length).to eq(1)
      expect(result[:top_categories].first[:category].name).to eq('Groceries')
      expect(result[:top_categories].first[:amount_cents]).to eq(8000)
    end

    it 'returns top merchants' do
      expect(result[:top_merchants].length).to eq(2)
      expect(result[:top_merchants].first[:name]).to eq('Walmart')
    end

    it 'calculates net worth' do
      expect(result[:net_worth][:assets_cents]).to eq(500_000)
      expect(result[:net_worth][:net_worth_cents]).to eq(500_000)
    end

    it 'returns account balances' do
      expect(result[:account_balances].length).to eq(1)
      expect(result[:account_balances].first[:name]).to eq(account.name)
    end

    it 'returns nil for user without household' do
      orphan = create(:user)
      orphan.update_column(:household_id, nil)
      orphan.reload
      result = described_class.new(orphan).generate
      expect(result).to be_nil
    end

    context 'with previous week data for comparison' do
      before do
        create(:transaction, household: household, account: account, category: category,
               date: week_start - 3, amount_cents: -10_000, merchant_name: 'Costco')
      end

      it 'calculates week-over-week change' do
        expect(result[:spending_summary][:prev_week_cents]).to eq(10_000)
        expect(result[:spending_summary][:change_pct]).to eq(-20.0)
      end
    end

    context 'with large transactions' do
      before do
        create(:transaction, household: household, account: account, category: category,
               date: week_start + 1, amount_cents: -50_000, name: 'Big Purchase', merchant_name: 'Big Store')
      end

      it 'includes transactions over $100' do
        expect(result[:large_transactions].length).to eq(1)
        expect(result[:large_transactions].first.name).to eq('Big Purchase')
      end
    end

    context 'with transactions needing review' do
      before do
        create(:transaction, :needs_review, household: household, account: account, category: category,
               date: Date.current, amount_cents: -1000)
      end

      it 'counts transactions needing review' do
        expect(result[:needs_review_count]).to eq(1)
      end
    end
  end
end
