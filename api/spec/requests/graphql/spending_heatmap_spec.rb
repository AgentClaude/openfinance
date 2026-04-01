require 'rails_helper'

RSpec.describe 'spendingHeatmap query', type: :request do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:checking) { create(:account, household: household, account_type: 'checking', current_balance_cents: 500_000) }
  let(:groceries) { create(:category, household: household, name: 'Groceries', group_name: 'Food & Drink') }
  let(:rent) { create(:category, household: household, name: 'Rent', group_name: 'Housing') }

  let(:query) do
    <<~GQL
      query SpendingHeatmap($year: Int) {
        spendingHeatmap(year: $year) {
          year
          dailySpending { date amount dayOfWeek week }
          weekdayAverages { dayOfWeek dayName average total count }
          monthlyTotals { month amount }
          categoryHeatmap { categoryId categoryName categoryIcon categoryColor months { month amount } }
          stats { totalSpent daysTracked spendingDays noSpendDays dailyAverage maxDayAmount maxDayDate minSpendingDayAmount }
          streaks { longestNoSpendDays longestNoSpendStart longestNoSpendEnd currentNoSpendStreak }
        }
      }
    GQL
  end

  let(:headers) { auth_headers(user) }

  def execute_query(variables: {})
    post '/graphql',
      params: { query: query, variables: variables }.to_json,
      headers: headers.merge('Content-Type' => 'application/json')
    JSON.parse(response.body)
  end

  context 'with transactions' do
    before do
      create(:transaction, household: household, account: checking,
        category: groceries, amount_cents: -5_000, date: Date.new(Date.current.year, 1, 15),
        name: 'Grocery Store', merchant_name: 'Kroger')
      create(:transaction, household: household, account: checking,
        category: rent, amount_cents: -150_000, date: Date.new(Date.current.year, 1, 1),
        name: 'Rent', merchant_name: 'Landlord')
    end

    it 'returns heatmap data' do
      skip 'Test dates in future' if Date.new(Date.current.year, 1, 15) > Date.current

      result = execute_query(variables: { year: Date.current.year })
      data = result.dig('data', 'spendingHeatmap')

      expect(data['year']).to eq(Date.current.year)
      expect(data['dailySpending']).not_to be_empty
      expect(data['weekdayAverages'].size).to eq(7)
      expect(data['stats']['totalSpent']).to be >= 1550.0
      expect(data['stats']['spendingDays']).to be >= 2
      expect(data['streaks']['longestNoSpendDays']).to be >= 1
      expect(data['categoryHeatmap']).not_to be_empty
    end
  end

  context 'without auth' do
    it 'returns empty data' do
      post '/graphql',
        params: { query: query, variables: {} }.to_json,
        headers: { 'Content-Type' => 'application/json' }
      result = JSON.parse(response.body)
      data = result.dig('data', 'spendingHeatmap')

      expect(data['year']).to eq(Date.current.year)
      expect(data['dailySpending']).to be_empty
      expect(data['stats']['totalSpent']).to eq(0.0)
    end
  end

  context 'with specific year' do
    it 'returns data for the requested year' do
      result = execute_query(variables: { year: 2025 })
      data = result.dig('data', 'spendingHeatmap')

      expect(data['year']).to eq(2025)
    end
  end
end
