require 'rails_helper'

RSpec.describe 'GraphQL GlobalSearch', type: :request do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:account) { create(:account, household: household, name: 'Chase Checking') }
  let(:category) { create(:category, household: household, name: 'Groceries') }

  let(:query) do
    <<~GRAPHQL
      query GlobalSearch($query: String!, $limit: Int) {
        globalSearch(query: $query, limit: $limit) {
          transactions {
            id
            description
            merchantName
            date
            amount
          }
          accounts {
            id
            name
          }
          categories {
            id
            name
          }
          merchants {
            name
            transactionCount
            totalAmount
          }
          tags {
            id
            name
          }
        }
      }
    GRAPHQL
  end

  before do
    create(:transaction, account: account, household: household, name: 'Whole Foods Market', merchant_name: 'Whole Foods', category: category, amount_cents: -5000, date: Date.current)
    create(:transaction, account: account, household: household, name: 'Whole Foods Market', merchant_name: 'Whole Foods', category: category, amount_cents: -7500, date: 1.week.ago)
    create(:transaction, account: account, household: household, name: 'Netflix Subscription', merchant_name: 'Netflix', amount_cents: -1599, date: Date.current)
    create(:tag, household: household, name: 'Food')
  end

  it 'returns matching transactions' do
    result = graphql_query(query, variables: { query: 'Whole Foods' }, user: user)
    txns = result.dig('data', 'globalSearch', 'transactions')
    expect(txns.length).to eq(2)
    expect(txns.first['merchantName']).to eq('Whole Foods')
  end

  it 'returns matching accounts' do
    result = graphql_query(query, variables: { query: 'Chase' }, user: user)
    accounts = result.dig('data', 'globalSearch', 'accounts')
    expect(accounts.length).to eq(1)
    expect(accounts.first['name']).to eq('Chase Checking')
  end

  it 'returns matching categories' do
    result = graphql_query(query, variables: { query: 'Grocer' }, user: user)
    cats = result.dig('data', 'globalSearch', 'categories')
    expect(cats.length).to eq(1)
    expect(cats.first['name']).to eq('Groceries')
  end

  it 'returns merchant aggregations' do
    result = graphql_query(query, variables: { query: 'Whole' }, user: user)
    merchants = result.dig('data', 'globalSearch', 'merchants')
    expect(merchants.length).to eq(1)
    expect(merchants.first['name']).to eq('Whole Foods')
    expect(merchants.first['transactionCount']).to eq(2)
    expect(merchants.first['totalAmount']).to eq(125.0)
  end

  it 'returns matching tags' do
    result = graphql_query(query, variables: { query: 'Food' }, user: user)
    tags = result.dig('data', 'globalSearch', 'tags')
    expect(tags.length).to eq(1)
    expect(tags.first['name'].downcase).to eq('food')
  end

  it 'returns empty results for short queries' do
    result = graphql_query(query, variables: { query: 'a' }, user: user)
    search = result.dig('data', 'globalSearch')
    expect(search['transactions']).to be_empty
    expect(search['accounts']).to be_empty
  end

  it 'returns empty when unauthenticated' do
    result = graphql_query(query, variables: { query: 'Whole Foods' })
    search = result.dig('data', 'globalSearch')
    expect(search['transactions']).to be_empty
  end

  it 'respects limit parameter' do
    result = graphql_query(query, variables: { query: 'Whole Foods', limit: 1 }, user: user)
    txns = result.dig('data', 'globalSearch', 'transactions')
    expect(txns.length).to eq(1)
  end
end
