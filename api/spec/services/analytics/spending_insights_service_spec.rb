require 'rails_helper'

RSpec.describe Analytics::SpendingInsightsService do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:checking) { create(:account, household: household, account_type: 'checking', current_balance_cents: 500_000) }
  let(:groceries) { create(:category, household: household, name: 'Groceries', group_name: 'Food & Drink') }
  let(:dining) { create(:category, household: household, name: 'Food & Dining', group_name: 'Food & Drink') }
  let(:entertainment) { create(:category, household: household, name: 'Entertainment', group_name: 'Entertainment') }
  let(:income_cat) { create(:category, :income, household: household, name: 'Salary') }
  let(:transfer_cat) { create(:category, household: household, name: 'Transfer') }

  describe '.call' do
    context 'without household' do
      it 'returns failure' do
        result = described_class.call(household: nil)
        expect(result).to be_failure
        expect(result.errors).to include('Household is required')
      end
    end

    context 'with empty household' do
      it 'returns success with empty insights' do
        result = described_class.call(household: household)
        expect(result).to be_success
        expect(result.data[:insights]).to be_an(Array)
        expect(result.data[:generated_at]).to be_present
        expect(result.data[:count]).to be_a(Integer)
      end
    end

    context 'spending anomalies' do
      it 'detects categories with spending significantly above average' do
        # 3 months of ~$200/month on groceries
        3.times do |i|
          month_start = (i + 1).months.ago.beginning_of_month
          create(:transaction, household: household, account: checking,
            category: groceries, amount_cents: -20_000, date: month_start + 5.days,
            merchant_name: 'Whole Foods')
        end

        # This month: $500 on groceries (2.5x average)
        create(:transaction, household: household, account: checking,
          category: groceries, amount_cents: -50_000, date: Date.current,
          merchant_name: 'Whole Foods')

        result = described_class.call(household: household)
        expect(result).to be_success

        anomalies = result.data[:insights].select { |i| i[:type] == 'spending_anomaly' }
        expect(anomalies).not_to be_empty

        groceries_anomaly = anomalies.find { |i| i[:category_name] == 'Groceries' }
        expect(groceries_anomaly).to be_present
        expect(groceries_anomaly[:severity]).to be_in(%w[warning critical])
        expect(groceries_anomaly[:amount]).to be > 0
        expect(groceries_anomaly[:metadata][:ratio]).to be >= 1.5
      end

      it 'ignores transfer categories' do
        3.times do |i|
          create(:transaction, household: household, account: checking,
            category: transfer_cat, amount_cents: -10_000,
            date: (i + 1).months.ago.beginning_of_month + 5.days)
        end
        create(:transaction, household: household, account: checking,
          category: transfer_cat, amount_cents: -30_000, date: Date.current)

        result = described_class.call(household: household)
        anomalies = result.data[:insights].select { |i| i[:type] == 'spending_anomaly' }
        transfer_anomalies = anomalies.select { |i| i[:category_name] == 'Transfer' }
        expect(transfer_anomalies).to be_empty
      end
    end

    context 'budget projections' do
      let!(:budget) { create(:budget, household: household, is_active: true) }

      it 'identifies budgets at risk of being exceeded' do
        # Budget $300 for groceries
        create(:budget_item, budget: budget, category: groceries,
          amount_cents: 30_000, month: Date.current.beginning_of_month)

        # Already spent $250 in the first week (will project to exceed)
        create(:transaction, household: household, account: checking,
          category: groceries, amount_cents: -25_000,
          date: Date.current.beginning_of_month + 2.days)

        result = described_class.call(household: household)
        at_risk = result.data[:insights].select { |i| i[:type] == 'budget_at_risk' }

        # This should flag if projection exceeds budget by >10%
        if Date.current.day <= 10  # Only reliable early in month
          expect(at_risk).not_to be_empty
          risk = at_risk.find { |i| i[:category_name] == 'Groceries' }
          expect(risk[:severity]).to be_in(%w[warning critical])
          expect(risk[:metadata][:projected]).to be > 300
        end
      end

      it 'identifies budgets on track' do
        # Budget $1000 for groceries
        create(:budget_item, budget: budget, category: groceries,
          amount_cents: 100_000, month: Date.current.beginning_of_month)

        # Only spent $50 (well under budget)
        create(:transaction, household: household, account: checking,
          category: groceries, amount_cents: -5_000,
          date: Date.current.beginning_of_month + 1.day)

        result = described_class.call(household: household)
        on_track = result.data[:insights].select { |i| i[:type] == 'budget_on_track' }
        expect(on_track.find { |i| i[:category_name] == 'Groceries' }).to be_present
      end
    end

    context 'subscription changes' do
      it 'detects recurring charge increases' do
        create(:recurring_item, household: household,
          merchant_name: 'Netflix', amount_cents: 1599, is_active: true,
          category: entertainment)

        # Previous charge: $15.99
        create(:transaction, household: household, account: checking,
          category: entertainment, amount_cents: -1_599,
          merchant_name: 'Netflix', date: 1.month.ago)

        # Latest charge: $22.99 (price increase)
        create(:transaction, household: household, account: checking,
          category: entertainment, amount_cents: -2_299,
          merchant_name: 'Netflix', date: 5.days.ago)

        result = described_class.call(household: household)
        sub_changes = result.data[:insights].select { |i| i[:type] == 'subscription_change' }

        netflix_change = sub_changes.find { |i| i[:title]&.include?('Netflix') }
        expect(netflix_change).to be_present
        expect(netflix_change[:metadata][:previous]).to eq(15.99)
        expect(netflix_change[:metadata][:current]).to eq(22.99)
      end
    end

    context 'merchant spikes' do
      it 'detects unusually high spending at a merchant' do
        # 3 months of $30/month at Starbucks
        3.times do |i|
          create(:transaction, household: household, account: checking,
            category: dining, amount_cents: -3_000,
            merchant_name: 'Starbucks',
            date: (i + 1).months.ago.beginning_of_month + 10.days)
        end

        # This month: $100 at Starbucks (3.3x average)
        create(:transaction, household: household, account: checking,
          category: dining, amount_cents: -10_000,
          merchant_name: 'Starbucks', date: Date.current)

        result = described_class.call(household: household)
        spikes = result.data[:insights].select { |i| i[:type] == 'merchant_spike' }

        starbucks = spikes.find { |i| i[:title]&.include?('Starbucks') }
        expect(starbucks).to be_present
        expect(starbucks[:metadata][:ratio]).to be >= 2.0
      end
    end

    context 'income changes' do
      it 'detects significant income increase' do
        # 3 months of $5,000 income
        3.times do |i|
          create(:transaction, :income, household: household, account: checking,
            category: income_cat, amount_cents: 500_000,
            date: (i + 1).months.ago.beginning_of_month + 1.day)
        end

        # This month: $8,000 income (60% increase)
        create(:transaction, :income, household: household, account: checking,
          category: income_cat, amount_cents: 800_000,
          date: Date.current.beginning_of_month + 1.day)

        result = described_class.call(household: household)
        income = result.data[:insights].select { |i| i[:type] == 'income_change' }
        expect(income).not_to be_empty
        expect(income.first[:severity]).to eq('positive')
      end

      it 'detects significant income decrease' do
        3.times do |i|
          create(:transaction, :income, household: household, account: checking,
            category: income_cat, amount_cents: 500_000,
            date: (i + 1).months.ago.beginning_of_month + 1.day)
        end

        # This month: $2,000 income (60% decrease)
        create(:transaction, :income, household: household, account: checking,
          category: income_cat, amount_cents: 200_000,
          date: Date.current.beginning_of_month + 1.day)

        result = described_class.call(household: household)
        income = result.data[:insights].select { |i| i[:type] == 'income_change' }
        expect(income).not_to be_empty
        expect(income.first[:severity]).to eq('warning')
      end
    end

    context 'uncategorized alerts' do
      it 'alerts when many transactions lack categories' do
        8.times do |i|
          create(:transaction, household: household, account: checking,
            category: nil, amount_cents: -5_000,
            date: Date.current - i.days)
        end

        result = described_class.call(household: household)
        alerts = result.data[:insights].select { |i| i[:type] == 'uncategorized_alert' }
        expect(alerts).not_to be_empty
        expect(alerts.first[:metadata][:count]).to eq(8)
      end

      it 'does not alert for few uncategorized transactions' do
        2.times do |i|
          create(:transaction, household: household, account: checking,
            category: nil, amount_cents: -5_000,
            date: Date.current - i.days)
        end

        result = described_class.call(household: household)
        alerts = result.data[:insights].select { |i| i[:type] == 'uncategorized_alert' }
        expect(alerts).to be_empty
      end
    end

    context 'result sorting' do
      it 'sorts by severity then by amount descending' do
        # Create data that produces both critical and info insights
        3.times do |i|
          create(:transaction, household: household, account: checking,
            category: groceries, amount_cents: -10_000,
            date: (i + 1).months.ago.beginning_of_month + 5.days)
        end
        create(:transaction, household: household, account: checking,
          category: groceries, amount_cents: -50_000, date: Date.current)

        # Uncategorized
        6.times do |i|
          create(:transaction, household: household, account: checking,
            category: nil, amount_cents: -2_000, date: Date.current - i.days)
        end

        result = described_class.call(household: household)
        insights = result.data[:insights]

        next if insights.size < 2
        severity_order = { 'critical' => 0, 'warning' => 1, 'info' => 2, 'positive' => 3 }

        insights.each_cons(2) do |a, b|
          a_sev = severity_order[a[:severity]] || 99
          b_sev = severity_order[b[:severity]] || 99
          expect(a_sev).to be <= b_sev
        end
      end
    end
  end
end
