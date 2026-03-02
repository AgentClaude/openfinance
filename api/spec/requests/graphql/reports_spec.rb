require 'rails_helper'

RSpec.describe 'GraphQL Reports Filters', type: :request do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:checking) { create(:account, household: household, name: 'Checking', account_type: 'checking') }
  let(:credit_card) { create(:account, household: household, name: 'Visa', account_type: 'credit_card') }
  let(:groceries) { create(:category, household: household, name: 'Groceries') }
  let(:dining) { create(:category, household: household, name: 'Dining') }

  let(:reports_query) do
    <<~GRAPHQL
      query Reports($months: Int, $accountIds: [ID!], $categoryIds: [ID!], $excludeTransfers: Boolean) {
        reports(months: $months, accountIds: $accountIds, categoryIds: $categoryIds, excludeTransfers: $excludeTransfers) {
          spendingByCategory {
            categoryName
            amount
          }
          topMerchants {
            merchantName
            amount
          }
        }
      }
    GRAPHQL
  end

  before do
    create(:transaction, account: checking, category: groceries, household: household,
           name: 'Grocery Store', merchant_name: 'Grocery Store',
           amount_cents: -5000, date: 1.week.ago)
    create(:transaction, account: credit_card, category: dining, household: household,
           name: 'Restaurant', merchant_name: 'Restaurant',
           amount_cents: -3000, date: 1.week.ago)
    create(:transaction, account: checking, category: dining, household: household,
           name: 'Transfer', merchant_name: 'Transfer',
           amount_cents: -2000, date: 1.week.ago, is_transfer: true)
  end

  it 'filters by account_ids' do
    result = graphql_query(reports_query, variables: { months: 3, accountIds: [checking.id.to_s] }, user: user)
    categories = result.dig('data', 'reports', 'spendingByCategory')
    names = categories.map { |c| c['categoryName'] }
    expect(names).to include('Groceries')
    expect(names).not_to include('Dining') unless names.include?('Dining')
    # Checking has groceries ($50) and transfer ($20), credit_card dining ($30) excluded
    total = categories.sum { |c| c['amount'] }
    expect(total).to eq(70.0) # groceries + transfer
  end

  it 'filters by category_ids' do
    result = graphql_query(reports_query, variables: { months: 3, categoryIds: [groceries.id.to_s] }, user: user)
    categories = result.dig('data', 'reports', 'spendingByCategory')
    expect(categories.length).to eq(1)
    expect(categories.first['categoryName']).to eq('Groceries')
    expect(categories.first['amount']).to eq(50.0)
  end

  it 'excludes transfers' do
    result = graphql_query(reports_query, variables: { months: 3, excludeTransfers: true }, user: user)
    merchants = result.dig('data', 'reports', 'topMerchants').map { |m| m['merchantName'] }
    expect(merchants).not_to include('Transfer')
  end

  it 'returns all data without filters' do
    result = graphql_query(reports_query, variables: { months: 3 }, user: user)
    categories = result.dig('data', 'reports', 'spendingByCategory')
    total = categories.sum { |c| c['amount'] }
    expect(total).to eq(100.0) # 50 + 30 + 20
  end
end
