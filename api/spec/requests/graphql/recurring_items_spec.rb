require 'rails_helper'

RSpec.describe 'GraphQL Recurring Items', type: :request do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:category) { create(:category, household: household) }
  let(:account) { create(:account, household: household) }

  describe 'recurringItems query' do
    let(:query) do
      <<~GRAPHQL
        query($activeOnly: Boolean) {
          recurringItems(activeOnly: $activeOnly) {
            id
            name
            amount
            frequency
            isActive
            isIncome
            estimatedMonthlyAmount
            dueSoon
            overdue
          }
        }
      GRAPHQL
    end

    it 'returns recurring items for the household' do
      create(:recurring_item, household: household, name: 'Netflix')
      create(:recurring_item, household: household, name: 'Spotify')

      result = graphql_query(query, user: user)
      items = result.dig('data', 'recurringItems')

      expect(items.length).to eq(2)
      expect(items.map { |i| i['name'] }).to contain_exactly('Netflix', 'Spotify')
    end

    it 'filters by active only' do
      create(:recurring_item, household: household, name: 'Active')
      create(:recurring_item, :inactive, household: household, name: 'Inactive')

      result = graphql_query(query, variables: { activeOnly: true }, user: user)
      items = result.dig('data', 'recurringItems')

      expect(items.length).to eq(1)
      expect(items.first['name']).to eq('Active')
    end
  end

  describe 'createRecurringItem mutation' do
    let(:query) do
      <<~GRAPHQL
        mutation($name: String!, $amount: Float!, $frequency: String!, $isIncome: Boolean, $categoryId: ID) {
          createRecurringItem(name: $name, amount: $amount, frequency: $frequency, isIncome: $isIncome, categoryId: $categoryId) {
            id
            name
            amount
            frequency
            isIncome
            isActive
          }
        }
      GRAPHQL
    end

    it 'creates a recurring item' do
      result = graphql_query(query, variables: {
        name: 'Netflix', amount: 15.99, frequency: 'monthly', isIncome: false
      }, user: user)

      data = result.dig('data', 'createRecurringItem')
      expect(data['name']).to eq('Netflix')
      expect(data['amount']).to eq(15.99)
      expect(data['frequency']).to eq('monthly')
      expect(data['isIncome']).to eq(false)
      expect(data['isActive']).to eq(true)
      expect(RecurringItem.count).to eq(1)
    end

    it 'creates an income recurring item' do
      result = graphql_query(query, variables: {
        name: 'Salary', amount: 5000.0, frequency: 'monthly', isIncome: true
      }, user: user)

      data = result.dig('data', 'createRecurringItem')
      expect(data['isIncome']).to eq(true)
    end

    it 'creates with category' do
      result = graphql_query(query, variables: {
        name: 'Gym', amount: 50.0, frequency: 'monthly', categoryId: category.id
      }, user: user)

      item = RecurringItem.last
      expect(item.category_id).to eq(category.id)
    end

    it 'rejects invalid frequency' do
      result = graphql_query(query, variables: {
        name: 'Test', amount: 10.0, frequency: 'daily'
      }, user: user)

      expect(result['errors']).to be_present
      expect(RecurringItem.count).to eq(0)
    end
  end

  describe 'updateRecurringItem mutation' do
    let!(:item) { create(:recurring_item, household: household, name: 'Old Name', amount_cents: 1000) }
    let(:query) do
      <<~GRAPHQL
        mutation($id: ID!, $name: String, $amount: Float, $isActive: Boolean) {
          updateRecurringItem(id: $id, name: $name, amount: $amount, isActive: $isActive) {
            id
            name
            amount
            isActive
          }
        }
      GRAPHQL
    end

    it 'updates the recurring item' do
      result = graphql_query(query, variables: {
        id: item.id, name: 'New Name', amount: 25.0
      }, user: user)

      data = result.dig('data', 'updateRecurringItem')
      expect(data['name']).to eq('New Name')
      expect(data['amount']).to eq(25.0)
    end

    it 'can deactivate an item' do
      result = graphql_query(query, variables: {
        id: item.id, isActive: false
      }, user: user)

      data = result.dig('data', 'updateRecurringItem')
      expect(data['isActive']).to eq(false)
    end

    it 'returns error for non-existent item' do
      result = graphql_query(query, variables: {
        id: SecureRandom.uuid, name: 'Nope'
      }, user: user)

      expect(result['errors']).to be_present
    end
  end

  describe 'deleteRecurringItem mutation' do
    let!(:item) { create(:recurring_item, household: household) }
    let(:query) do
      <<~GRAPHQL
        mutation($id: ID!) {
          deleteRecurringItem(id: $id) {
            success
          }
        }
      GRAPHQL
    end

    it 'deletes the recurring item' do
      expect {
        graphql_query(query, variables: { id: item.id }, user: user)
      }.to change(RecurringItem, :count).by(-1)
    end

    it 'returns error for non-existent item' do
      result = graphql_query(query, variables: { id: SecureRandom.uuid }, user: user)
      expect(result['errors']).to be_present
    end
  end

  describe 'markRecurringItemPaid mutation' do
    let!(:item) do
      create(:recurring_item, :overdue, household: household, frequency: 'monthly', occurrence_count: 3)
    end
    let(:query) do
      <<~GRAPHQL
        mutation($id: ID!) {
          markRecurringItemPaid(id: $id) {
            id
            nextOccurrence
            lastOccurrence
            dueSoon
            overdue
          }
        }
      GRAPHQL
    end

    it 'advances the next occurrence' do
      result = graphql_query(query, variables: { id: item.id }, user: user)

      data = result.dig('data', 'markRecurringItemPaid')
      expect(data['overdue']).to eq(false)

      item.reload
      expect(item.occurrence_count).to eq(4)
      expect(item.last_occurrence).to eq(Date.current)
      expect(item.next_occurrence).to eq(Date.current + 1.month)
    end
  end
end
