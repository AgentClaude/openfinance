require 'rails_helper'

RSpec.describe 'Plaid Category Mappings GraphQL', type: :request do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }

  describe 'plaidCategoryMappings query' do
    it 'returns empty array when no mappings exist' do
      result = graphql_query('{ plaidCategoryMappings { id plaidPrimary } }', user: user)
      expect(result.dig('data', 'plaidCategoryMappings')).to eq([])
    end

    it 'returns mappings with category details' do
      category = create(:category, household: household, name: 'Restaurants')
      PlaidCategoryMapping.create!(
        household: household,
        category: category,
        plaid_primary: 'FOOD_AND_DRINK',
        is_default: true
      )

      result = graphql_query(
        '{ plaidCategoryMappings { id plaidPrimary plaidDetailed isDefault category { name } } }',
        user: user
      )
      mappings = result.dig('data', 'plaidCategoryMappings')
      expect(mappings.length).to eq(1)
      expect(mappings.first['plaidPrimary']).to eq('FOOD_AND_DRINK')
      expect(mappings.first['category']['name']).to eq('Restaurants')
    end
  end

  describe 'plaidPrimaryCategories query' do
    it 'returns list of primary categories' do
      result = graphql_query('{ plaidPrimaryCategories }', user: user)
      categories = result.dig('data', 'plaidPrimaryCategories')
      expect(categories).to include('INCOME', 'FOOD_AND_DRINK', 'TRANSPORTATION')
      expect(categories.length).to eq(16)
    end
  end

  describe 'seedPlaidCategoryMappings mutation' do
    before do
      create(:category, household: household, name: 'Income', group_name: 'Income')
      create(:category, household: household, name: 'Entertainment', group_name: 'Entertainment')
      create(:category, household: household, name: 'Restaurants', group_name: 'Food & Drink')
    end

    it 'creates default mappings' do
      result = graphql_query('mutation { seedPlaidCategoryMappings { created skipped } }', user: user)
      data = result.dig('data', 'seedPlaidCategoryMappings')
      expect(data['created']).to be > 0
      expect(data['skipped']).to eq(0)
    end

    it 'skips existing mappings on second call' do
      graphql_query('mutation { seedPlaidCategoryMappings { created } }', user: user)
      result = graphql_query('mutation { seedPlaidCategoryMappings { created skipped } }', user: user)
      data = result.dig('data', 'seedPlaidCategoryMappings')
      expect(data['created']).to eq(0)
      expect(data['skipped']).to be > 0
    end
  end

  describe 'updatePlaidCategoryMapping mutation' do
    it 'updates a mapping to a new category' do
      old_cat = create(:category, household: household, name: 'Restaurants')
      new_cat = create(:category, household: household, name: 'Fast Food')
      mapping = PlaidCategoryMapping.create!(
        household: household, category: old_cat,
        plaid_primary: 'FOOD_AND_DRINK', is_default: true
      )

      query = <<~GQL
        mutation($id: ID!, $categoryId: ID!) {
          updatePlaidCategoryMapping(id: $id, categoryId: $categoryId) {
            id category { name } isDefault
          }
        }
      GQL

      result = graphql_query(query, variables: { id: mapping.id, categoryId: new_cat.id }, user: user)
      updated = result.dig('data', 'updatePlaidCategoryMapping')
      expect(updated['category']['name']).to eq('Fast Food')
      expect(updated['isDefault']).to eq(false)
    end
  end

  describe 'resetPlaidCategoryMappings mutation' do
    it 'deletes all mappings and re-seeds defaults' do
      create(:category, household: household, name: 'Income', group_name: 'Income')
      custom_cat = create(:category, household: household, name: 'My Custom')
      PlaidCategoryMapping.create!(
        household: household, category: custom_cat,
        plaid_primary: 'FOOD_AND_DRINK', is_default: false
      )

      result = graphql_query('mutation { resetPlaidCategoryMappings { created } }', user: user)
      data = result.dig('data', 'resetPlaidCategoryMappings')
      expect(data['created']).to be > 0
      expect(PlaidCategoryMapping.where(household: household, is_default: false).count).to eq(0)
    end
  end
end
