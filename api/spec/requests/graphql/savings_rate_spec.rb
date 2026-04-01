require 'rails_helper'

RSpec.describe 'GraphQL savingsRate query', type: :request do
  let(:user) { create(:user) }
  let(:household) { user.household }
  let(:headers) { auth_headers(user).merge('Content-Type' => 'application/json') }
  let(:salary_category) { create(:category, :income, household: household, name: 'Salary', group_name: 'Income') }
  let(:rent_category) { create(:category, household: household, name: 'Rent', group_name: 'Housing') }
  let(:checking) { create(:account, household: household, account_type: 'checking') }

  let(:query) do
    <<~GQL
      query SavingsRate($months: Int) {
        savingsRate(months: $months) {
          summary {
            currentSavingsRate
            averageSavingsRate
            trendDirection
            percentile
            monthsAnalyzed
            totalSaved
            averageMonthlySavings
          }
          monthlyTrends {
            month
            income
            expenses
            savingsAmount
            savingsRate
          }
          allocation {
            needs { amount percent targetPercent status }
            wants { amount percent targetPercent status }
            savings { amount percent targetPercent status }
            otherExpenses { amount percent }
            avgMonthlyIncome
          }
          incomeSources {
            name
            icon
            total
            monthlyAverage
            percent
          }
          expenseAllocation {
            group
            total
            monthlyAverage
            percent
            categoryType
          }
          streaks {
            positiveSavingsMonths
            above20PercentMonths
            totalMonths
          }
          recommendations {
            type
            icon
            title
            description
            impact
          }
        }
      }
    GQL
  end

  context 'when unauthenticated' do
    it 'returns empty data' do
      post '/graphql', params: { query: query }.to_json, headers: { 'Content-Type' => 'application/json' }
      data = JSON.parse(response.body).dig('data', 'savingsRate')
      expect(data['summary']['monthsAnalyzed']).to eq(0)
    end
  end

  context 'when authenticated with no data' do
    it 'returns zeroed summary' do
      post '/graphql', params: { query: query, variables: { months: 6 } }.to_json, headers: headers
      expect(response).to have_http_status(:ok)

      data = JSON.parse(response.body).dig('data', 'savingsRate')
      expect(data['summary']['currentSavingsRate']).to eq(0)
      expect(data['summary']['averageSavingsRate']).to eq(0)
      expect(data['monthlyTrends']).to be_an(Array)
      expect(data['incomeSources']).to eq([])
      expect(data['expenseAllocation']).to eq([])
    end
  end

  context 'when authenticated with transaction data' do
    before do
      3.times do |i|
        create(:transaction, :income,
          household: household,
          account: checking,
          category: salary_category,
          amount_cents: 500_000,
          date: (i + 1).months.ago.beginning_of_month + 1.day
        )
        create(:transaction,
          household: household,
          account: checking,
          category: rent_category,
          amount_cents: -200_000,
          date: (i + 1).months.ago.beginning_of_month + 2.days
        )
      end
    end

    it 'returns complete savings rate analysis' do
      post '/graphql', params: { query: query, variables: { months: 6 } }.to_json, headers: headers
      expect(response).to have_http_status(:ok)

      data = JSON.parse(response.body).dig('data', 'savingsRate')
      summary = data['summary']

      expect(summary['trendDirection']).to be_a(String)
      expect(summary['percentile']).to be_a(Integer)
      expect(summary['totalSaved']).to be >= 0

      # Verify monthly trends structure
      trends = data['monthlyTrends']
      expect(trends).to be_an(Array)
      trend_with_data = trends.find { |t| t['income'] > 0 }
      if trend_with_data
        expect(trend_with_data['savingsRate']).to eq(60.0) # (5000-2000)/5000 * 100
      end

      # Verify allocation structure
      allocation = data['allocation']
      expect(allocation['needs']).to be_present
      expect(allocation['wants']).to be_present
      expect(allocation['savings']).to be_present

      # Verify income sources
      sources = data['incomeSources']
      expect(sources).to be_an(Array)

      # Verify expense allocation
      expenses = data['expenseAllocation']
      expect(expenses).to be_an(Array)

      # Verify streaks
      streaks = data['streaks']
      expect(streaks['totalMonths']).to be > 0
    end
  end
end
