require 'rails_helper'

RSpec.describe 'GraphQL Reports Filters', type: :request do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:account1) { create(:account, household: household, name: 'Checking') }
  let(:account2) { create(:account, household: household, name: 'Savings') }
  let(:category1) { create(:category, household: household) }
  let(:category2) { create(:category, household: household) }

  let(:reports_query) do
    <<~GRAPHQL
      query($accountIds: [ID!], $categoryIds: [ID!], $excludeTransfers: Boolean) {
        reports(months: 6, accountIds: $accountIds, categoryIds: $categoryIds, excludeTransfers: $excludeTransfers) {
          spendingByCategory {
            categoryId
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
    # Create transactions in different accounts/categories
    create(:transaction, household: household, account: account1, category: category1,
           amount_cents: -5000, date: 1.month.ago, merchant_name: 'Store A')
    create(:transaction, household: household, account: account2, category: category2,
           amount_cents: -3000, date: 1.month.ago, merchant_name: 'Store B')
    create(:transaction, household: household, account: account1, category: category1,
           amount_cents: -2000, date: 1.month.ago, merchant_name: 'Store A', is_transfer: true)
  end

  it 'filters by account_ids' do
    result = graphql_query(reports_query, variables: { accountIds: [account1.id] }, user: user)
    data = result.dig('data', 'reports')
    # Should only include account1 transactions
    merchants = data['topMerchants'].map { |m| m['merchantName'] }
    expect(merchants).to include('Store A')
    expect(merchants).not_to include('Store B')
  end

  it 'filters by category_ids' do
    result = graphql_query(reports_query, variables: { categoryIds: [category2.id] }, user: user)
    data = result.dig('data', 'reports')
    categories = data['spendingByCategory'].map { |c| c['categoryId'] }
    expect(categories).to eq([category2.id.to_s])
  end

  it 'excludes transfers' do
    result = graphql_query(reports_query, variables: { excludeTransfers: true }, user: user)
    data = result.dig('data', 'reports')
    # Store A has 2 txns but one is a transfer, so total should be $50 not $70
    store_a = data['topMerchants'].find { |m| m['merchantName'] == 'Store A' }
    expect(store_a['amount']).to eq(50.0)
  end

  it 'returns all data without filters' do
    result = graphql_query(reports_query, user: user)
    data = result.dig('data', 'reports')
    total = data['topMerchants'].sum { |m| m['amount'] }
    expect(total).to eq(100.0) # 50 + 30 + 20
  end
end
