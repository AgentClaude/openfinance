require 'rails_helper'

RSpec.describe 'GraphQL Investment Queries', type: :request do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:account) { create(:account, household: household, account_type: 'investment') }
  let(:security1) { create(:security, symbol: 'AAPL', name: 'Apple Inc') }
  let(:security2) { create(:security, symbol: 'GOOGL', name: 'Alphabet Inc') }

  before do
    create(:holding,
      account: account, security: security1,
      quantity: 10, current_price_cents: 15000, cost_basis_cents: 12000,
      as_of_date: Date.current
    )
    create(:holding,
      account: account, security: security2,
      quantity: 5, current_price_cents: 14000, cost_basis_cents: 13000,
      as_of_date: Date.current
    )
  end

  describe 'holdings' do
    let(:query) do
      <<~GRAPHQL
        query($accountId: ID) {
          holdings(accountId: $accountId) {
            id
            quantity
            currentPrice
            currentValue
            costBasisTotal
            unrealizedGainLoss
            unrealizedGainLossPercentage
            weightInAccount
            security {
              id
              symbol
              name
              securityType
            }
          }
        }
      GRAPHQL
    end

    it 'returns holdings for the household' do
      result = graphql_query(query, user: user)
      data = result.dig('data', 'holdings')
      expect(data.length).to eq(2)
      symbols = data.map { |h| h.dig('security', 'symbol') }
      expect(symbols).to include('AAPL', 'GOOGL')
    end

    it 'filters by account_id' do
      other_account = create(:account, household: household, account_type: 'investment')
      create(:holding, account: other_account, security: security1, quantity: 3, current_price_cents: 15000, cost_basis_cents: 12000, as_of_date: Date.current)

      result = graphql_query(query, variables: { accountId: account.id }, user: user)
      data = result.dig('data', 'holdings')
      expect(data.length).to eq(2)
    end

    it 'returns empty for unauthenticated user' do
      result = graphql_query(query)
      data = result.dig('data', 'holdings')
      expect(data).to eq([])
    end

    it 'computes gain/loss correctly' do
      result = graphql_query(query, user: user)
      apple = result.dig('data', 'holdings').find { |h| h.dig('security', 'symbol') == 'AAPL' }
      # 10 shares * $150 = $1500 value, 10 * $120 = $1200 cost
      expect(apple['currentValue']).to eq(1500.0)
      expect(apple['costBasisTotal']).to eq(1200.0)
      expect(apple['unrealizedGainLoss']).to eq(300.0)
      expect(apple['unrealizedGainLossPercentage']).to eq(25.0)
    end
  end

  describe 'portfolioSummary' do
    let(:query) do
      <<~GRAPHQL
        query($accountId: ID) {
          portfolioSummary(accountId: $accountId) {
            totalValue
            totalCostBasis
            totalGainLoss
            totalGainLossPercentage
            totalHoldingsCount
            allocations {
              securityName
              symbol
              securityType
              value
              percentage
            }
          }
        }
      GRAPHQL
    end

    it 'returns portfolio summary' do
      result = graphql_query(query, user: user)
      data = result.dig('data', 'portfolioSummary')
      # AAPL: 10*150=1500, GOOGL: 5*140=700 => total 2200
      expect(data['totalValue']).to eq(2200.0)
      # AAPL cost: 10*120=1200, GOOGL cost: 5*130=650 => total 1850
      expect(data['totalCostBasis']).to eq(1850.0)
      expect(data['totalGainLoss']).to eq(350.0)
      expect(data['totalHoldingsCount']).to eq(2)
    end

    it 'returns allocations sorted by percentage' do
      result = graphql_query(query, user: user)
      allocs = result.dig('data', 'portfolioSummary', 'allocations')
      expect(allocs.first['symbol']).to eq('AAPL') # 1500/2200 = 68.18%
      expect(allocs.last['symbol']).to eq('GOOGL')  # 700/2200 = 31.82%
    end

    it 'returns empty portfolio for unauthenticated user' do
      result = graphql_query(query)
      data = result.dig('data', 'portfolioSummary')
      expect(data['totalValue']).to eq(0.0)
      expect(data['allocations']).to eq([])
    end
  end
end
