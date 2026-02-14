require 'rails_helper'

RSpec.describe 'GraphQL Goals', type: :request do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }

  describe 'goals query' do
    let(:query) do
      <<~GRAPHQL
        query($activeOnly: Boolean) {
          goals(activeOnly: $activeOnly) {
            id
            name
            goalType
            targetAmount
            currentAmount
            progressPercentage
            amountRemaining
            daysRemaining
            isOverdue
            isOnTrack
            monthlyTarget
            isAchieved
          }
        }
      GRAPHQL
    end

    it 'returns goals for authenticated user' do
      create(:goal, household: household, name: 'Emergency Fund', target_amount_cents: 1000000, current_amount_cents: 250000)
      result = graphql_query(query, user: user)
      data = result.dig('data', 'goals')
      expect(data.length).to eq(1)
      expect(data.first['name']).to eq('Emergency Fund')
      expect(data.first['targetAmount']).to eq(10000.0)
      expect(data.first['currentAmount']).to eq(2500.0)
      expect(data.first['progressPercentage']).to eq(25.0)
    end

    it 'filters to active only' do
      create(:goal, household: household, name: 'Active Goal')
      create(:goal, :achieved, household: household, name: 'Done Goal')
      result = graphql_query(query, variables: { activeOnly: true }, user: user)
      data = result.dig('data', 'goals')
      expect(data.length).to eq(1)
      expect(data.first['name']).to eq('Active Goal')
    end

    it 'returns empty when not authenticated' do
      result = graphql_query(query)
      data = result.dig('data', 'goals')
      expect(data).to eq([])
    end
  end

  describe 'createGoal mutation' do
    let(:query) do
      <<~GRAPHQL
        mutation($name: String!, $targetAmount: Float!, $targetDate: String, $goalType: String) {
          createGoal(name: $name, targetAmount: $targetAmount, targetDate: $targetDate, goalType: $goalType) {
            id
            name
            targetAmount
            goalType
          }
        }
      GRAPHQL
    end

    it 'creates a goal' do
      result = graphql_query(query, variables: {
        name: 'Vacation Fund',
        targetAmount: 5000.0,
        targetDate: 6.months.from_now.to_date.iso8601,
        goalType: 'savings'
      }, user: user)
      data = result.dig('data', 'createGoal')
      expect(data['name']).to eq('Vacation Fund')
      expect(data['targetAmount']).to eq(5000.0)
      expect(data['goalType']).to eq('savings')
    end
  end

  describe 'updateGoal mutation' do
    let(:query) do
      <<~GRAPHQL
        mutation($id: ID!, $name: String, $currentAmount: Float) {
          updateGoal(id: $id, name: $name, currentAmount: $currentAmount) {
            id
            name
            currentAmount
          }
        }
      GRAPHQL
    end

    it 'updates a goal' do
      goal = create(:goal, household: household, name: 'Old Name', current_amount_cents: 0)
      result = graphql_query(query, variables: {
        id: goal.id,
        name: 'New Name',
        currentAmount: 1500.0
      }, user: user)
      data = result.dig('data', 'updateGoal')
      expect(data['name']).to eq('New Name')
      expect(data['currentAmount']).to eq(1500.0)
    end
  end

  describe 'deleteGoal mutation' do
    let(:query) do
      <<~GRAPHQL
        mutation($id: ID!) {
          deleteGoal(id: $id) {
            success
          }
        }
      GRAPHQL
    end

    it 'deletes a goal' do
      goal = create(:goal, household: household)
      result = graphql_query(query, variables: { id: goal.id }, user: user)
      data = result.dig('data', 'deleteGoal')
      expect(data['success']).to be true
      expect(Goal.find_by(id: goal.id)).to be_nil
    end
  end

  describe 'dashboard goals summary' do
    let(:query) do
      <<~GRAPHQL
        query {
          dashboardSummary {
            goalsSummary {
              id
              name
              progressPercentage
              targetAmount
              currentAmount
            }
          }
        }
      GRAPHQL
    end

    it 'includes active goals in dashboard' do
      create(:goal, household: household, name: 'My Goal', target_amount_cents: 100000, current_amount_cents: 50000)
      result = graphql_query(query, user: user)
      goals = result.dig('data', 'dashboardSummary', 'goalsSummary')
      expect(goals.length).to eq(1)
      expect(goals.first['name']).to eq('My Goal')
      expect(goals.first['progressPercentage']).to eq(50.0)
    end
  end
end
