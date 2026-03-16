require 'rails_helper'

RSpec.describe 'GraphQL Categories', type: :request do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }

  describe 'categories query' do
    let!(:visible_cat) { create(:category, household: household, name: 'Groceries', is_hidden: false) }
    let!(:hidden_cat) { create(:category, household: household, name: 'Old Category', is_hidden: true) }

    let(:query) do
      <<~GRAPHQL
        query($includeHidden: Boolean) {
          categories(includeHidden: $includeHidden) {
            id
            name
            isHidden
            displayOrder
          }
        }
      GRAPHQL
    end

    it 'excludes hidden categories by default' do
      result = graphql_query(query, user: user)
      names = result.dig('data', 'categories').map { |c| c['name'] }
      expect(names).to include('Groceries')
      expect(names).not_to include('Old Category')
    end

    it 'includes hidden categories when requested' do
      result = graphql_query(query, variables: { includeHidden: true }, user: user)
      names = result.dig('data', 'categories').map { |c| c['name'] }
      expect(names).to include('Groceries')
      expect(names).to include('Old Category')
    end

    it 'marks hidden categories with isHidden true' do
      result = graphql_query(query, variables: { includeHidden: true }, user: user)
      hidden = result.dig('data', 'categories').find { |c| c['name'] == 'Old Category' }
      expect(hidden['isHidden']).to be true
    end
  end

  describe 'toggleCategoryHidden mutation' do
    let!(:category) { create(:category, household: household, name: 'Test Cat', is_hidden: false) }

    let(:query) do
      <<~GRAPHQL
        mutation($id: ID!, $hidden: Boolean!) {
          toggleCategoryHidden(id: $id, hidden: $hidden) {
            id
            name
            isHidden
          }
        }
      GRAPHQL
    end

    it 'hides a visible category' do
      result = graphql_query(query, variables: { id: category.id, hidden: true }, user: user)
      data = result.dig('data', 'toggleCategoryHidden')
      expect(data['isHidden']).to be true
      expect(category.reload.is_hidden).to be true
    end

    it 'shows a hidden category' do
      category.update!(is_hidden: true)
      result = graphql_query(query, variables: { id: category.id, hidden: false }, user: user)
      data = result.dig('data', 'toggleCategoryHidden')
      expect(data['isHidden']).to be false
      expect(category.reload.is_hidden).to be false
    end

    it 'returns error when not authenticated' do
      result = graphql_query(query, variables: { id: category.id, hidden: true })
      expect(result['errors']).to be_present
    end

    it 'prevents hiding categories from another household' do
      other_household = create(:household)
      other_cat = create(:category, household: other_household, name: 'Other')
      result = graphql_query(query, variables: { id: other_cat.id, hidden: true }, user: user)
      # Should either error or not update the category
      if result['errors'].present?
        expect(result['errors'].first['message']).to be_present
      else
        # If no error, verify the category was NOT actually hidden
        expect(other_cat.reload.is_hidden).to be false
      end
    end
  end
end
