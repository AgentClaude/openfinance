require 'rails_helper'

RSpec.describe 'GraphQL Category Trends', type: :request do
  include AuthHelper

  let(:user) { create_authenticated_user }
  let(:household) { user.household }
  let(:account) { create(:account, household: household) }
  let(:groceries) { create(:category, household: household, name: 'Groceries', group_name: 'Food & Drink') }
  let(:restaurants) { create(:category, household: household, name: 'Restaurants', group_name: 'Food & Drink') }

  let(:query) do
    <<~GRAPHQL
      query($categoryIds: [ID!]!, $months: Int) {
        categoryTrends(categoryIds: $categoryIds, months: $months) {
          month
          categoryId
          categoryName
          amount
        }
      }
    GRAPHQL
  end

  before do
    # Create expense transactions across 3 months
    3.times do |i|
      date = (i + 1).months.ago
      create(:transaction, account: account, category: groceries, household: household, amount_cents: -10000 * (i + 1), date: date)
      create(:transaction, account: account, category: restaurants, household: household, amount_cents: -5000 * (i + 1), date: date)
    end
  end

  it 'returns category trends for selected categories' do
    result = graphql_query(query, variables: { categoryIds: [groceries.id, restaurants.id], months: 6 }, user: user)
    trends = result.dig('data', 'categoryTrends')

    expect(trends).to be_an(Array)
    expect(trends.length).to be > 0

    groceries_trends = trends.select { |t| t['categoryName'] == 'Groceries' }
    expect(groceries_trends).not_to be_empty
    expect(groceries_trends.first).to have_key('month')
    expect(groceries_trends.first).to have_key('amount')
  end

  it 'returns empty array for unauthenticated user' do
    result = graphql_query(query, variables: { categoryIds: [groceries.id], months: 3 })
    trends = result.dig('data', 'categoryTrends')
    expect(trends).to eq([])
  end
end
