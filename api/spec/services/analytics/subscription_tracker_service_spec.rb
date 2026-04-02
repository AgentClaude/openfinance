require 'rails_helper'

RSpec.describe Analytics::SubscriptionTrackerService do
  let(:household) { create(:household) }
  let(:category) { create(:category, household: household, name: 'Entertainment') }
  let(:account) { create(:account, household: household, name: 'Checking') }

  describe '.call' do
    context 'without household' do
      it 'returns failure' do
        result = described_class.call(household: nil)
        expect(result).to be_failure
      end
    end

    context 'with no recurring items' do
      it 'returns success with empty data' do
        result = described_class.call(household: household)
        expect(result).to be_success
        expect(result.data[:subscriptions]).to eq([])
        expect(result.data[:summary][:total_monthly]).to eq(0)
        expect(result.data[:summary][:total_annual]).to eq(0)
        expect(result.data[:summary][:subscription_count]).to eq(0)
      end
    end

    context 'with active subscriptions' do
      let!(:netflix) do
        create(:recurring_item,
          household: household,
          name: 'Netflix',
          merchant_name: 'Netflix',
          amount_cents: 1599,
          frequency: 'monthly',
          category: category,
          account: account,
          next_occurrence: 2.weeks.from_now.to_date,
          is_auto_detected: true)
      end

      let!(:spotify) do
        create(:recurring_item,
          household: household,
          name: 'Spotify Premium',
          merchant_name: 'Spotify',
          amount_cents: 1099,
          frequency: 'monthly',
          category: category,
          account: account,
          next_occurrence: 1.week.from_now.to_date)
      end

      let!(:gym) do
        create(:recurring_item,
          household: household,
          name: 'Planet Fitness',
          merchant_name: 'Planet Fitness',
          amount_cents: 2500,
          frequency: 'monthly',
          category: category,
          account: account,
          next_occurrence: 5.days.from_now.to_date)
      end

      # Income should be excluded
      let!(:salary) do
        create(:recurring_item, :income,
          household: household,
          name: 'Salary',
          amount_cents: 500_000,
          frequency: 'monthly')
      end

      # Inactive should be excluded
      let!(:inactive) do
        create(:recurring_item,
          household: household,
          name: 'Old Service',
          amount_cents: 999,
          frequency: 'monthly',
          is_active: false)
      end

      it 'returns all active expense subscriptions' do
        result = described_class.call(household: household)
        expect(result).to be_success
        expect(result.data[:subscriptions].size).to eq(3)
      end

      it 'excludes income recurring items' do
        result = described_class.call(household: household)
        names = result.data[:subscriptions].map { |s| s[:name] }
        expect(names).not_to include('Salary')
      end

      it 'excludes inactive items' do
        result = described_class.call(household: household)
        names = result.data[:subscriptions].map { |s| s[:name] }
        expect(names).not_to include('Old Service')
      end

      it 'calculates correct monthly total' do
        result = described_class.call(household: household)
        # 15.99 + 10.99 + 25.00 = 51.98
        expect(result.data[:summary][:total_monthly]).to eq(51.98)
      end

      it 'calculates correct annual total' do
        result = described_class.call(household: household)
        expect(result.data[:summary][:total_annual]).to eq((51.98 * 12).round(2))
      end

      it 'calculates daily cost' do
        result = described_class.call(household: household)
        annual = (51.98 * 12).round(2)
        expect(result.data[:cost_per_day]).to eq((annual / 365.0).round(2))
      end

      it 'identifies most expensive subscription' do
        result = described_class.call(household: household)
        expect(result.data[:summary][:most_expensive][:name]).to eq('Planet Fitness')
      end

      it 'identifies cheapest subscription' do
        result = described_class.call(household: household)
        expect(result.data[:summary][:cheapest][:name]).to eq('Spotify Premium')
      end

      it 'sorts subscriptions by monthly cost descending' do
        result = described_class.call(household: household)
        costs = result.data[:subscriptions].map { |s| s[:monthly_cost] }
        expect(costs).to eq(costs.sort.reverse)
      end

      it 'classifies subscription categories' do
        result = described_class.call(household: household)
        netflix_sub = result.data[:subscriptions].find { |s| s[:name] == 'Netflix' }
        spotify_sub = result.data[:subscriptions].find { |s| s[:name] == 'Spotify Premium' }
        expect(netflix_sub[:sub_category]).to eq('streaming')
        expect(spotify_sub[:sub_category]).to eq('music')
      end

      it 'includes category breakdown' do
        result = described_class.call(household: household)
        expect(result.data[:category_breakdown]).to be_an(Array)
        expect(result.data[:category_breakdown].size).to be >= 1
        categories = result.data[:category_breakdown].map { |c| c[:category] }
        expect(categories).to include('streaming')
      end

      it 'includes generated_at timestamp' do
        result = described_class.call(household: household)
        expect(result.data[:generated_at]).to be_present
      end

      it 'includes subscription details' do
        result = described_class.call(household: household)
        netflix_sub = result.data[:subscriptions].find { |s| s[:name] == 'Netflix' }
        expect(netflix_sub[:frequency]).to eq('monthly')
        expect(netflix_sub[:category_name]).to eq('Entertainment')
        expect(netflix_sub[:account_name]).to eq('Checking')
        expect(netflix_sub[:is_auto_detected]).to be(true)
      end
    end

    context 'with price changes' do
      let!(:sub_with_variance) do
        create(:recurring_item,
          household: household,
          name: 'Netflix',
          merchant_name: 'Netflix',
          amount_cents: 1799,
          average_amount_cents: 1599,
          amount_variance_cents: 200,
          frequency: 'monthly',
          next_occurrence: 1.week.from_now.to_date)
      end

      it 'detects price increases' do
        result = described_class.call(household: household)
        expect(result.data[:price_changes].size).to eq(1)
        change = result.data[:price_changes].first
        expect(change[:name]).to eq('Netflix')
        expect(change[:direction]).to eq('increased')
        expect(change[:current_amount]).to eq(17.99)
        expect(change[:previous_amount]).to eq(15.99)
      end
    end

    context 'with savings opportunities' do
      before do
        # Create 3 streaming services to trigger overlap warning
        %w[Netflix Hulu Disney+].each do |name|
          create(:recurring_item,
            household: household,
            name: name,
            merchant_name: name,
            amount_cents: 1500,
            frequency: 'monthly',
            next_occurrence: 1.week.from_now.to_date)
        end
      end

      it 'identifies overlapping streaming services' do
        result = described_class.call(household: household)
        overlap = result.data[:savings_opportunities].find { |o| o[:type] == 'overlapping_services' }
        expect(overlap).to be_present
        expect(overlap[:affected_subscriptions].size).to eq(3)
      end

      it 'calculates potential savings' do
        result = described_class.call(household: household)
        overlap = result.data[:savings_opportunities].find { |o| o[:type] == 'overlapping_services' }
        expect(overlap[:potential_savings_monthly]).to be > 0
      end
    end

    context 'with duplicate music services' do
      before do
        create(:recurring_item,
          household: household,
          name: 'Spotify',
          merchant_name: 'Spotify',
          amount_cents: 1099,
          frequency: 'monthly',
          next_occurrence: 1.week.from_now.to_date)
        create(:recurring_item,
          household: household,
          name: 'Apple Music',
          merchant_name: 'Apple Music',
          amount_cents: 1099,
          frequency: 'monthly',
          next_occurrence: 2.weeks.from_now.to_date)
      end

      it 'flags duplicate music subscriptions' do
        result = described_class.call(household: household)
        dup = result.data[:savings_opportunities].find { |o| o[:type] == 'duplicate_category' }
        expect(dup).to be_present
        expect(dup[:title]).to include('music')
      end
    end

    context 'with annual billing opportunity' do
      before do
        3.times do |i|
          create(:recurring_item,
            household: household,
            name: "Service #{i}",
            amount_cents: 1500,
            frequency: 'monthly',
            next_occurrence: 1.week.from_now.to_date)
        end
      end

      it 'suggests annual billing for monthly subscriptions' do
        result = described_class.call(household: household)
        annual = result.data[:savings_opportunities].find { |o| o[:type] == 'annual_pricing' }
        expect(annual).to be_present
        expect(annual[:potential_savings_monthly]).to be > 0
      end
    end

    context 'with different frequencies' do
      let!(:weekly) do
        create(:recurring_item,
          household: household,
          name: 'Weekly Service',
          amount_cents: 500,
          frequency: 'weekly',
          next_occurrence: 3.days.from_now.to_date)
      end

      let!(:yearly) do
        create(:recurring_item,
          household: household,
          name: 'Annual Service',
          amount_cents: 12000,
          frequency: 'yearly',
          next_occurrence: 6.months.from_now.to_date)
      end

      it 'normalizes costs to monthly' do
        result = described_class.call(household: household)
        weekly_sub = result.data[:subscriptions].find { |s| s[:name] == 'Weekly Service' }
        yearly_sub = result.data[:subscriptions].find { |s| s[:name] == 'Annual Service' }

        # Weekly: $5.00 * 4.33 ≈ $21.65
        expect(weekly_sub[:monthly_cost]).to be_within(0.1).of(21.65)
        # Yearly: $120.00 / 12 = $10.00
        expect(yearly_sub[:monthly_cost]).to eq(10.0)
      end
    end
  end
end
