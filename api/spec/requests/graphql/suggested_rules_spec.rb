require 'rails_helper'

RSpec.describe 'GraphQL suggestedRules query', type: :request do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:account) { create(:account, household: household) }
  let(:category) { create(:category, household: household, name: 'Groceries', icon: '🛒', color_hex: '#10b981') }

  let(:query) do
    <<~GRAPHQL
      query {
        suggestedRules {
          merchantName
          categoryId
          categoryName
          transactionCount
          matchField
          matchType
          matchValue
        }
      }
    GRAPHQL
  end

  it 'returns empty when not authenticated' do
    result = graphql_query(query)
    data = result.dig('data', 'suggestedRules')
    expect(data).to eq([])
  end

  it 'suggests rules for merchants with 2+ consistently categorized transactions' do
    # Create 3 transactions for same merchant + category
    3.times do
      create(:transaction,
        household: household,
        account: account,
        category: category,
        merchant_name: 'Whole Foods'
      )
    end

    result = graphql_query(query, user: user)
    suggestions = result.dig('data', 'suggestedRules')
    expect(suggestions.length).to eq(1)
    expect(suggestions[0]['merchantName']).to eq('Whole Foods')
    expect(suggestions[0]['categoryName']).to eq('Groceries')
    expect(suggestions[0]['transactionCount']).to eq(3)
    expect(suggestions[0]['matchField']).to eq('merchant_name')
    expect(suggestions[0]['matchType']).to eq('exact')
  end

  it 'does not suggest merchants with existing rules' do
    3.times do
      create(:transaction,
        household: household,
        account: account,
        category: category,
        merchant_name: 'Whole Foods'
      )
    end

    # Create an existing rule for this merchant
    create(:categorization_rule,
      household: household,
      category: category,
      match_field: 'merchant_name',
      match_type: 'exact',
      match_value: 'Whole Foods'
    )

    result = graphql_query(query, user: user)
    suggestions = result.dig('data', 'suggestedRules')
    expect(suggestions.length).to eq(0)
  end

  it 'does not suggest merchants with fewer than 2 transactions' do
    create(:transaction,
      household: household,
      account: account,
      category: category,
      merchant_name: 'One-Time Store'
    )

    result = graphql_query(query, user: user)
    suggestions = result.dig('data', 'suggestedRules')
    expect(suggestions.length).to eq(0)
  end
end
