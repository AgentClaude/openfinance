require 'rails_helper'

RSpec.describe 'GraphQL Reports', type: :request do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:checking) { create(:account, household: household, name: 'Checking', account_type: 'checking') }
  let(:savings) { create(:account, household: household, name: 'Savings', account_type: 'savings') }
  let(:food_cat) { create(:category, household: household, name: 'Food') }
  let(:transport_cat) { create(:category, household: household, name: 'Transport') }

  let(:reports_query) do
    <<~GRAPHQL
      query GetReports($months: Int, $accountIds: [ID!], $categoryIds: [ID!], $excludeTransfers: Boolean) {
        reports(months: $months, accountIds: $accountIds, categoryIds: $categoryIds, excludeTransfers: $excludeTransfers) {
          monthlySummary { month income expenses cashFlow }
          spendingByCategory { categoryName amount }
          topMerchants { merchantName amount }
        }
      }
    GRAPHQL
  end

  before do
    # Create transactions across accounts and categories
    create(:transaction, household: household, account: checking, category: food_cat,
           amount_cents: -5000, name: 'Grocery Store', merchant_name: 'Grocery Store', date: 1.week.ago)
    create(:transaction, household: household, account: savings, category: transport_cat,
           amount_cents: -3000, name: 'Gas Station', merchant_name: 'Gas Station', date: 1.week.ago)
    create(:transaction, household: household, account: checking, category: transport_cat,
           amount_cents: -2000, name: 'Transfer', merchant_name: 'Transfer', date: 1.week.ago, is_transfer: true)
  end

  it 'returns all transactions without filters' do
    result = graphql_query(reports_query, variables: { months: 3 }, user: user)
    spending = result.dig('data', 'reports', 'spendingByCategory')
    total = spending.sum { |s| s['amount'] }
    expect(total).to eq(100.0) # 50 + 30 + 20
  end

  it 'filters by accountIds' do
    result = graphql_query(reports_query, variables: { months: 3, accountIds: [checking.id.to_s] }, user: user)
    spending = result.dig('data', 'reports', 'spendingByCategory')
    total = spending.sum { |s| s['amount'] }
    expect(total).to eq(70.0) # 50 + 20 (only checking)
  end

  it 'filters by categoryIds' do
    result = graphql_query(reports_query, variables: { months: 3, categoryIds: [food_cat.id.to_s] }, user: user)
    spending = result.dig('data', 'reports', 'spendingByCategory')
    expect(spending.length).to eq(1)
    expect(spending.first['categoryName']).to eq('Food')
    expect(spending.first['amount']).to eq(50.0)
  end

  it 'excludes transfers when excludeTransfers is true' do
    result = graphql_query(reports_query, variables: { months: 3, excludeTransfers: true }, user: user)
    spending = result.dig('data', 'reports', 'spendingByCategory')
    total = spending.sum { |s| s['amount'] }
    expect(total).to eq(80.0) # 50 + 30 (transfer excluded)
  end

  it 'combines account and category filters' do
    result = graphql_query(reports_query, variables: { months: 3, accountIds: [checking.id.to_s], categoryIds: [food_cat.id.to_s] }, user: user)
    spending = result.dig('data', 'reports', 'spendingByCategory')
    expect(spending.length).to eq(1)
    expect(spending.first['amount']).to eq(50.0)
  end
end
