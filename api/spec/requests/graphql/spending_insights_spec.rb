require 'rails_helper'

RSpec.describe 'GraphQL spendingInsights query', type: :request do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:checking) { create(:account, household: household, account_type: 'checking', current_balance_cents: 500_000) }
  let(:groceries) { create(:category, household: household, name: 'Groceries', group_name: 'Food & Drink') }
  let(:income_cat) { create(:category, :income, household: household, name: 'Salary') }

  let(:query) do
    <<~GRAPHQL
      query {
        spendingInsights {
          count
          generatedAt
          insights {
            type
            severity
            title
            message
            amount
            categoryId
            categoryName
            icon
            metadata
          }
        }
      }
    GRAPHQL
  end

  it 'returns spending insights for authenticated user' do
    result = graphql_query(query, user: user)
    data = result.dig('data', 'spendingInsights')

    expect(data['count']).to be_a(Integer)
    expect(data['generatedAt']).to be_present
    expect(data['insights']).to be_an(Array)
  end

  it 'returns empty insights for user without transactions' do
    result = graphql_query(query, user: user)
    data = result.dig('data', 'spendingInsights')

    expect(data['count']).to eq(0)
    expect(data['insights']).to be_empty
  end

  it 'detects spending anomalies' do
    # Historical: $200/month on groceries for 3 months
    3.times do |i|
      create(:transaction, household: household, account: checking,
        category: groceries, amount_cents: -20_000,
        date: (i + 1).months.ago.beginning_of_month + 5.days,
        merchant_name: 'Store')
    end
    # This month: $500 (2.5x average)
    create(:transaction, household: household, account: checking,
      category: groceries, amount_cents: -50_000,
      date: Date.current, merchant_name: 'Store')

    result = graphql_query(query, user: user)
    insights = result.dig('data', 'spendingInsights', 'insights')

    anomaly = insights.find { |i| i['type'] == 'spending_anomaly' }
    expect(anomaly).to be_present
    expect(anomaly['severity']).to be_in(%w[warning critical])
    expect(anomaly['categoryName']).to eq('Groceries')
    expect(anomaly['amount']).to be > 0
  end

  it 'detects uncategorized transaction alerts' do
    8.times do |i|
      create(:transaction, household: household, account: checking,
        category: nil, amount_cents: -3_000,
        date: Date.current - i.days)
    end

    result = graphql_query(query, user: user)
    insights = result.dig('data', 'spendingInsights', 'insights')

    alert = insights.find { |i| i['type'] == 'uncategorized_alert' }
    expect(alert).to be_present
    expect(alert['metadata']['count']).to eq(8)
  end

  it 'returns null for unauthenticated requests' do
    result = graphql_query(query)
    data = result.dig('data', 'spendingInsights')

    expect(data['count']).to eq(0)
    expect(data['insights']).to be_empty
  end
end
