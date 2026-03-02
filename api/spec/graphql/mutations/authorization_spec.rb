# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Mutation authorization' do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:other_household) { create(:household) }
  let(:other_user) { create(:user, household: other_household) }

  def execute_query(query, variables: {}, user: nil)
    OpenfinanceSchema.execute(
      query,
      variables: variables,
      context: { current_user: user }
    )
  end

  describe 'unauthenticated requests' do
    it 'rejects mutations without auth' do
      result = execute_query(
        'mutation { deleteCategory(id: "fake-id") }'
      )
      expect(result['errors']).to be_present
    end
  end

  describe 'cross-household access' do
    let!(:other_category) { create(:category, household: other_household) }
    let!(:other_goal) { create(:goal, household: other_household) }

    it 'cannot update category from another household' do
      # Scoped .find raises RecordNotFound — authorization at the query level
      expect {
        execute_query(
          'mutation($id: ID!, $input: CategoryInput!) { updateCategory(id: $id, input: $input) { id } }',
          variables: { id: other_category.id.to_s, input: { name: 'Hacked', icon: '💀', color: '#000', groupName: 'Hacked' } },
          user: user
        )
      }.to raise_error(ActiveRecord::RecordNotFound)
    end

    it 'cannot delete goal from another household' do
      expect {
        execute_query(
          'mutation($id: ID!) { deleteGoal(id: $id) { success } }',
          variables: { id: other_goal.id.to_s },
          user: user
        )
      }.to raise_error(ActiveRecord::RecordNotFound)
    end
  end

  describe 'own household access' do
    let!(:own_category) { create(:category, household: household) }

    it 'can delete own category' do
      result = execute_query(
        'mutation($id: ID!) { deleteCategory(id: $id) }',
        variables: { id: own_category.id.to_s },
        user: user
      )
      expect(result['errors']).to be_nil
      expect(result['data']['deleteCategory']).to eq(true)
    end
  end
end
