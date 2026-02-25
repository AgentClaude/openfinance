require 'rails_helper'

RSpec.describe 'GraphQL Net Worth History', type: :request do
  include AuthHelper

  let(:user) { create_authenticated_user }
  let(:household) { user.household }

  let(:checking) { create(:account, household: household, account_type: 'checking', current_balance_cents: 500_000) }
  let(:credit_card) { create(:account, household: household, account_type: 'credit_card', current_balance_cents: 200_000) }

  let(:query) do
    <<~GRAPHQL
      query($months: Int) {
        netWorthHistory(months: $months) {
          date
          assets
          liabilities
          netWorth
        }
      }
    GRAPHQL
  end

  before do
    # Create balance history for the last 2 months (deterministic values)
    (60.days.ago.to_date..Date.current).each_with_index do |date, i|
      AccountBalanceHistory.create!(account: checking, date: date, current_balance_cents: 500_000 + (i * 100))
      AccountBalanceHistory.create!(account: credit_card, date: date, current_balance_cents: 200_000 + (i * 50))
    end
  end

  it 'returns net worth history for authenticated user' do
    result = graphql_query(query, variables: { months: 3 }, user: user)
    history = result.dig('data', 'netWorthHistory')

    expect(history).to be_an(Array)
    expect(history.length).to be > 0

    first = history.first
    expect(first).to have_key('date')
    expect(first).to have_key('assets')
    expect(first).to have_key('liabilities')
    expect(first).to have_key('netWorth')
    expect(first['assets']).to be > 0
    expect(first['liabilities']).to be > 0
    expect(first['netWorth']).to eq(first['assets'] - first['liabilities'])
  end

  it 'returns empty array for unauthenticated user' do
    result = graphql_query(query, variables: { months: 3 })
    history = result.dig('data', 'netWorthHistory')
    expect(history).to eq([])
  end
end
