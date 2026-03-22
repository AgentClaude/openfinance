require 'rails_helper'

RSpec.describe 'GraphQL financialHealth query', type: :request do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:checking) { create(:account, household: household, account_type: 'checking', current_balance_cents: 1_000_000) }
  let(:income_cat) { create(:category, :income, household: household, name: 'Salary') }
  let(:expense_cat) { create(:category, household: household, name: 'Groceries') }

  let(:query) do
    <<~GRAPHQL
      query {
        financialHealth {
          score
          grade
          components {
            name
            label
            rawScore
            weight
            weightedScore
            status
            details
          }
          recommendations {
            type
            category
            message
          }
        }
      }
    GRAPHQL
  end

  it 'returns financial health data for authenticated user' do
    result = graphql_query(query, user: user)
    health = result.dig('data', 'financialHealth')

    expect(health['score']).to be_between(0, 100)
    expect(health['grade']).to match(/\A[A-F]\z/)
    expect(health['components'].length).to eq(5)
    expect(health['recommendations']).to be_an(Array)
  end

  it 'returns all five component names' do
    result = graphql_query(query, user: user)
    names = result.dig('data', 'financialHealth', 'components').map { |c| c['name'] }
    expect(names).to contain_exactly(
      'savings_rate', 'budget_adherence', 'debt_ratio',
      'emergency_fund', 'net_worth_trend'
    )
  end

  context 'with financial data' do
    before do
      create(:transaction, :income, household: household, account: checking,
        category: income_cat, amount_cents: 500_000, date: Date.current - 5.days)
      create(:transaction, household: household, account: checking,
        category: expense_cat, amount_cents: -200_000, date: Date.current - 5.days)
    end

    it 'returns a higher score with good finances' do
      result = graphql_query(query, user: user)
      health = result.dig('data', 'financialHealth')
      expect(health['score']).to be > 40
    end

    it 'includes component details as JSON' do
      result = graphql_query(query, user: user)
      savings = result.dig('data', 'financialHealth', 'components').find { |c| c['name'] == 'savings_rate' }
      expect(savings['details']).to include('rate', 'monthly_income', 'monthly_expenses')
    end
  end

  it 'returns empty data when not authenticated' do
    result = graphql_query(query)
    health = result.dig('data', 'financialHealth')
    expect(health['score']).to eq(0)
  end
end
