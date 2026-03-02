require 'rails_helper'

RSpec.describe 'GraphQL Queries', type: :request do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }

  describe 'me' do
    let(:query) do
      <<~GRAPHQL
        query {
          me {
            id
            email
            name
            role
          }
        }
      GRAPHQL
    end

    it 'returns current user when authenticated' do
      result = graphql_query(query, user: user)
      data = result.dig('data', 'me')
      expect(data['email']).to eq(user.email)
      expect(data['name']).to eq(user.name)
      expect(data['role']).to eq('owner')
    end

    it 'returns null when not authenticated' do
      result = graphql_query(query)
      expect(result.dig('data', 'me')).to be_nil
    end
  end

  describe 'accounts' do
    let(:query) do
      <<~GRAPHQL
        query {
          accounts {
            id
            name
            type
            balance
          }
        }
      GRAPHQL
    end

    it 'returns accounts for authenticated user' do
      create(:account, household: household, name: 'Checking', account_type: 'checking')
      result = graphql_query(query, user: user)
      data = result.dig('data', 'accounts')
      expect(data.length).to eq(1)
      expect(data.first['name']).to eq('Checking')
      expect(data.first['type']).to eq('DEPOSITORY')
    end

    it 'excludes hidden accounts' do
      create(:account, household: household, is_hidden: false, name: 'Visible')
      create(:account, household: household, is_hidden: true, name: 'Hidden')
      result = graphql_query(query, user: user)
      names = result.dig('data', 'accounts').map { |a| a['name'] }
      expect(names).to include('Visible')
      expect(names).not_to include('Hidden')
    end

    it 'returns empty array when not authenticated' do
      result = graphql_query(query)
      expect(result.dig('data', 'accounts')).to eq([])
    end
  end

  describe 'transactions' do
    let(:query) do
      <<~GRAPHQL
        query($search: String, $needsReview: Boolean, $page: Int, $limit: Int) {
          transactions(search: $search, needsReview: $needsReview, page: $page, limit: $limit) {
            transactions {
              id
              description
              amount
              date
              merchantName
            }
            totalCount
            hasMore
          }
        }
      GRAPHQL
    end

    let(:account) { create(:account, household: household) }
    let(:category) { create(:category, household: household) }

    before do
      create(:transaction, household: household, account: account, category: category,
             name: 'Starbucks', merchant_name: 'Starbucks', date: Date.current, amount_cents: -500)
      create(:transaction, household: household, account: account, category: category,
             name: 'Target', merchant_name: 'Target', date: Date.current, amount_cents: -2500)
    end

    it 'returns transactions for authenticated user' do
      result = graphql_query(query, user: user)
      data = result.dig('data', 'transactions')
      expect(data['totalCount']).to eq(2)
      expect(data['transactions'].length).to eq(2)
    end

    it 'filters by search term' do
      result = graphql_query(query, variables: { search: 'Starbucks' }, user: user)
      data = result.dig('data', 'transactions')
      expect(data['totalCount']).to eq(1)
    end

    it 'filters by needs_review' do
      create(:transaction, :needs_review, household: household, account: account, name: 'Review Me')
      result = graphql_query(query, variables: { needsReview: true }, user: user)
      data = result.dig('data', 'transactions')
      expect(data['totalCount']).to eq(1)
    end

    it 'paginates results' do
      result = graphql_query(query, variables: { limit: 1, page: 1 }, user: user)
      data = result.dig('data', 'transactions')
      expect(data['transactions'].length).to eq(1)
      expect(data['hasMore']).to be true
    end
  end

  describe 'categories' do
    let(:query) do
      <<~GRAPHQL
        query {
          categories {
            id
            name
          }
        }
      GRAPHQL
    end

    it 'returns categories for authenticated user' do
      create(:category, household: household, name: 'Food')
      result = graphql_query(query, user: user)
      data = result.dig('data', 'categories')
      expect(data.length).to eq(1)
      expect(data.first['name']).to eq('Food')
    end
  end

  describe 'dashboardSummary' do
    let(:query) do
      <<~GRAPHQL
        query {
          dashboardSummary {
            netWorth
            monthlyIncome
            monthlyExpenses
            cashFlow
            needsReviewCount
          }
        }
      GRAPHQL
    end

    it 'returns dashboard data for authenticated user' do
      create(:account, household: household, account_type: 'checking', current_balance_cents: 500000)
      result = graphql_query(query, user: user)
      data = result.dig('data', 'dashboardSummary')
      expect(data['netWorth']).to eq(5000.0)
      expect(data['needsReviewCount']).to eq(0)
    end

    it 'returns zeros when not authenticated' do
      result = graphql_query(query)
      data = result.dig('data', 'dashboardSummary')
      expect(data['netWorth']).to eq(0.0)
    end
  end

  describe 'reports with filters' do
    let(:account1) { create(:account, household: household, name: 'Checking') }
    let(:account2) { create(:account, household: household, name: 'Savings') }
    let(:category) { create(:category, household: household) }

    let(:query) do
      <<~GRAPHQL
        query($accountIds: [ID!], $excludeTransfers: Boolean) {
          reports(months: 3, accountIds: $accountIds, excludeTransfers: $excludeTransfers) {
            monthlySummary { month income expenses cashFlow }
            spendingByCategory { categoryName amount }
            topMerchants { merchantName amount }
          }
        }
      GRAPHQL
    end

    before do
      create(:transaction, account: account1, category: category, amount_cents: -5000, merchant_name: 'Store A', date: Date.current, household: household, is_transfer: false)
      create(:transaction, account: account2, category: category, amount_cents: -3000, merchant_name: 'Store B', date: Date.current, household: household, is_transfer: false)
      create(:transaction, account: account1, category: category, amount_cents: -2000, merchant_name: 'Transfer', date: Date.current, household: household, is_transfer: true)
    end

    it 'filters by account_ids' do
      result = graphql_query(query, user: user, variables: { accountIds: [account1.id.to_s] })
      merchants = result.dig('data', 'reports', 'topMerchants')
      names = merchants.map { |m| m['merchantName'] }
      expect(names).to include('Store A')
      expect(names).not_to include('Store B')
    end

    it 'excludes transfers when excludeTransfers is true' do
      result = graphql_query(query, user: user, variables: { excludeTransfers: true })
      merchants = result.dig('data', 'reports', 'topMerchants')
      names = merchants.map { |m| m['merchantName'] }
      expect(names).to include('Store A', 'Store B')
      expect(names).not_to include('Transfer')
    end

    it 'returns all transactions when no filters applied' do
      result = graphql_query(query, user: user)
      merchants = result.dig('data', 'reports', 'topMerchants')
      names = merchants.map { |m| m['merchantName'] }
      expect(names).to include('Store A', 'Store B', 'Transfer')
    end
  end
end
