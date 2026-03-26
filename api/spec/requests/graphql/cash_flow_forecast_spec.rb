require 'rails_helper'

RSpec.describe 'GraphQL cashFlowForecast query', type: :request do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let!(:checking) { create(:account, household: household, account_type: 'checking', current_balance_cents: 500_000) }

  let(:query) do
    <<~GRAPHQL
      query($days: Int, $includeVariableSpending: Boolean) {
        cashFlowForecast(days: $days, includeVariableSpending: $includeVariableSpending) {
          startingBalance
          endingBalance
          forecastDays
          totalProjectedIncome
          totalProjectedExpenses
          netCashFlow
          minBalance
          minBalanceDate
          maxBalance
          maxBalanceDate
          dailyProjections {
            date
            balance
            income
            expenses
            net
            eventCount
          }
          events {
            date
            amount
            name
            categoryName
            source
            recurringItemId
            confidence
          }
          warnings {
            date
            projectedBalance
            message
          }
        }
      }
    GRAPHQL
  end

  it 'returns a valid forecast structure' do
    result = graphql_query(query, variables: { days: 30, includeVariableSpending: false }, user: user)

    forecast = result.dig('data', 'cashFlowForecast')
    expect(forecast).not_to be_nil
    expect(forecast['startingBalance']).to eq(5000.0)
    expect(forecast['forecastDays']).to eq(30)
    expect(forecast['dailyProjections'].length).to eq(31)
    expect(forecast['events']).to be_an(Array)
    expect(forecast['warnings']).to be_an(Array)
  end

  it 'includes recurring item projections' do
    create(:recurring_item, household: household, name: 'Netflix',
           amount_cents: 1599, frequency: 'monthly', is_income: false,
           next_occurrence: Date.current + 5.days)

    result = graphql_query(query, variables: { days: 60, includeVariableSpending: false }, user: user)
    events = result.dig('data', 'cashFlowForecast', 'events')
    netflix_events = events.select { |e| e['name'] == 'Netflix' }

    expect(netflix_events).not_to be_empty
    expect(netflix_events.first['amount']).to eq(-15.99)
    expect(netflix_events.first['source']).to eq('recurring')
    expect(netflix_events.first['confidence']).to eq(0.9)
  end

  it 'projects recurring income' do
    create(:recurring_item, :income, household: household, name: 'Salary',
           amount_cents: 350_000, frequency: 'monthly',
           next_occurrence: Date.current + 10.days)

    result = graphql_query(query, variables: { days: 60, includeVariableSpending: false }, user: user)
    events = result.dig('data', 'cashFlowForecast', 'events')
    salary_events = events.select { |e| e['name'] == 'Salary' }

    expect(salary_events).not_to be_empty
    expect(salary_events.first['amount']).to eq(3500.0)
  end

  it 'calculates correct ending balance with recurring items' do
    create(:recurring_item, household: household, name: 'Rent',
           amount_cents: 200_000, frequency: 'monthly', is_income: false,
           next_occurrence: Date.current + 3.days)

    result = graphql_query(query, variables: { days: 10, includeVariableSpending: false }, user: user)
    forecast = result.dig('data', 'cashFlowForecast')

    expect(forecast['endingBalance']).to eq(3000.0)
    expect(forecast['totalProjectedExpenses']).to eq(2000.0)
  end

  it 'returns empty forecast when unauthenticated' do
    result = graphql_query(query, variables: { days: 30, includeVariableSpending: false })
    forecast = result.dig('data', 'cashFlowForecast')
    expect(forecast['startingBalance']).to eq(0.0)
    expect(forecast['dailyProjections']).to eq([])
  end

  it 'defaults to 90 days if not specified' do
    result = graphql_query(query, user: user)
    forecast = result.dig('data', 'cashFlowForecast')
    expect(forecast['forecastDays']).to eq(90)
  end
end
