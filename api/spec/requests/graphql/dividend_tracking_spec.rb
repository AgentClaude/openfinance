require 'rails_helper'

RSpec.describe 'GraphQL Dividend Tracking', type: :request do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:account) { create(:account, household: household, account_type: 'investment') }
  let(:security1) { create(:security, symbol: 'AAPL', name: 'Apple Inc') }
  let(:security2) { create(:security, symbol: 'MSFT', name: 'Microsoft Corp') }

  before do
    # AAPL dividends
    InvestmentTransaction.create!(account: account, security: security1, transaction_type: 'dividend', amount_cents: 5000, date: Date.new(2026, 3, 15), description: 'Apple Dividend')
    InvestmentTransaction.create!(account: account, security: security1, transaction_type: 'dividend', amount_cents: 5000, date: Date.new(2026, 6, 15), description: 'Apple Dividend')
    # MSFT dividend
    InvestmentTransaction.create!(account: account, security: security2, transaction_type: 'dividend', amount_cents: 7500, date: Date.new(2026, 3, 15), description: 'Microsoft Dividend')
    # Interest
    InvestmentTransaction.create!(account: account, security: security1, transaction_type: 'interest', amount_cents: 1500, date: Date.new(2026, 3, 28))
  end

  describe 'investmentTransactions' do
    let(:query) do
      <<~GRAPHQL
        query($accountId: ID, $transactionType: String, $year: Int, $limit: Int) {
          investmentTransactions(accountId: $accountId, transactionType: $transactionType, year: $year, limit: $limit) {
            id
            transactionType
            amount
            date
            description
            security {
              symbol
              name
            }
          }
        }
      GRAPHQL
    end

    it 'returns all investment transactions' do
      result = graphql_query(query, user: user)
      data = result.dig('data', 'investmentTransactions')
      expect(data.length).to eq(4)
    end

    it 'filters by transaction type' do
      result = graphql_query(query, variables: { transactionType: 'dividend' }, user: user)
      data = result.dig('data', 'investmentTransactions')
      expect(data.length).to eq(3)
      expect(data.all? { |t| t['transactionType'] == 'dividend' }).to be true
    end

    it 'filters by year' do
      result = graphql_query(query, variables: { year: 2025 }, user: user)
      data = result.dig('data', 'investmentTransactions')
      expect(data.length).to eq(0)
    end

    it 'returns empty for unauthenticated user' do
      result = graphql_query(query)
      data = result.dig('data', 'investmentTransactions')
      expect(data).to eq([])
    end

    it 'respects limit' do
      result = graphql_query(query, variables: { limit: 2 }, user: user)
      data = result.dig('data', 'investmentTransactions')
      expect(data.length).to eq(2)
    end
  end

  describe 'dividendSummary' do
    let(:query) do
      <<~GRAPHQL
        query($year: Int, $accountId: ID) {
          dividendSummary(year: $year, accountId: $accountId) {
            totalDividends
            bySecurity {
              symbol
              name
              amount
            }
            byMonth {
              month
              amount
            }
            transactionCount
          }
        }
      GRAPHQL
    end

    it 'returns total dividends' do
      result = graphql_query(query, variables: { year: 2026 }, user: user)
      data = result.dig('data', 'dividendSummary')
      expect(data['totalDividends']).to eq(175.0) # (5000 + 5000 + 7500) / 100
      expect(data['transactionCount']).to eq(3)
    end

    it 'breaks down by security' do
      result = graphql_query(query, variables: { year: 2026 }, user: user)
      by_sec = result.dig('data', 'dividendSummary', 'bySecurity')
      msft = by_sec.find { |s| s['symbol'] == 'MSFT' }
      expect(msft['amount']).to eq(75.0)
    end

    it 'breaks down by month' do
      result = graphql_query(query, variables: { year: 2026 }, user: user)
      by_month = result.dig('data', 'dividendSummary', 'byMonth')
      march = by_month.find { |m| m['month'] == '2026-03' }
      expect(march['amount']).to eq(125.0) # (5000 + 7500) / 100
    end

    it 'returns empty for unauthenticated user' do
      result = graphql_query(query, variables: { year: 2026 })
      data = result.dig('data', 'dividendSummary')
      expect(data['totalDividends']).to eq(0.0)
    end
  end

  describe 'investmentIncomeSummary' do
    let(:query) do
      <<~GRAPHQL
        query($year: Int, $accountId: ID) {
          investmentIncomeSummary(year: $year, accountId: $accountId) {
            totalIncome
            dividends
            interest
            capitalGains
          }
        }
      GRAPHQL
    end

    it 'returns income broken down by type' do
      result = graphql_query(query, variables: { year: 2026 }, user: user)
      data = result.dig('data', 'investmentIncomeSummary')
      expect(data['totalIncome']).to eq(190.0) # (5000 + 5000 + 7500 + 1500) / 100
      expect(data['dividends']).to eq(175.0)
      expect(data['interest']).to eq(15.0)
      expect(data['capitalGains']).to eq(0.0)
    end
  end

  describe 'createInvestmentTransaction mutation' do
    let(:mutation) do
      <<~GRAPHQL
        mutation($accountId: ID!, $securityId: ID!, $transactionType: String!, $amount: Float!, $date: String!, $description: String) {
          createInvestmentTransaction(
            accountId: $accountId
            securityId: $securityId
            transactionType: $transactionType
            amount: $amount
            date: $date
            description: $description
          ) {
            id
            transactionType
            amount
            date
            description
            security {
              symbol
            }
          }
        }
      GRAPHQL
    end

    it 'creates an investment transaction' do
      result = graphql_query(mutation, variables: {
        accountId: account.id,
        securityId: security1.id,
        transactionType: 'dividend',
        amount: 25.50,
        date: '2026-03-18',
        description: 'Q1 Dividend'
      }, user: user)

      data = result.dig('data', 'createInvestmentTransaction')
      expect(data['transactionType']).to eq('dividend')
      expect(data['amount']).to eq(25.5)
      expect(data['description']).to eq('Q1 Dividend')
      expect(data.dig('security', 'symbol')).to eq('AAPL')
    end

    it 'fails for unauthenticated user' do
      result = graphql_query(mutation, variables: {
        accountId: account.id,
        securityId: security1.id,
        transactionType: 'dividend',
        amount: 25.50,
        date: '2026-03-18'
      })

      expect(result['errors']).to be_present
    end
  end

  describe 'deleteInvestmentTransaction mutation' do
    let(:mutation) do
      <<~GRAPHQL
        mutation($id: ID!) {
          deleteInvestmentTransaction(id: $id) {
            success
          }
        }
      GRAPHQL
    end

    it 'deletes an investment transaction' do
      txn = InvestmentTransaction.create!(
        account: account, security: security1,
        transaction_type: 'dividend', amount_cents: 1000, date: Date.current
      )

      result = graphql_query(mutation, variables: { id: txn.id }, user: user)
      expect(result.dig('data', 'deleteInvestmentTransaction', 'success')).to be true
      expect(InvestmentTransaction.find_by(id: txn.id)).to be_nil
    end
  end
end
