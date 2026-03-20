require 'rails_helper'

RSpec.describe Mutations::UpdateBudgetSettings, type: :request do
  include GraphQLHelper

  let(:user) { create(:user) }
  let(:household) { user.household }
  let!(:budget) { create(:budget, household: household) }

  let(:mutation) do
    <<~GRAPHQL
      mutation UpdateBudgetSettings($budgetMode: String, $spendingTarget: Float) {
        updateBudgetSettings(budgetMode: $budgetMode, spendingTarget: $spendingTarget) {
          budgetMode
          spendingTarget
          errors
        }
      }
    GRAPHQL
  end

  context 'when switching to flex mode' do
    it 'updates the budget mode to flex' do
      result = execute_graphql(mutation,
        variables: { budgetMode: 'flex', spendingTarget: 3000.0 },
        context: { current_user: user }
      )

      data = graphql_response_data(result)['updateBudgetSettings']
      expect(data['budgetMode']).to eq('flex')
      expect(data['spendingTarget']).to eq(3000.0)
      expect(data['errors']).to be_empty

      budget.reload
      expect(budget.budget_mode).to eq('flex')
      expect(budget.spending_target_cents).to eq(300_000)
    end
  end

  context 'when switching back to per_category mode' do
    before { budget.update!(budget_mode: 'flex', spending_target_cents: 300_000) }

    it 'updates the budget mode to per_category' do
      result = execute_graphql(mutation,
        variables: { budgetMode: 'per_category' },
        context: { current_user: user }
      )

      data = graphql_response_data(result)['updateBudgetSettings']
      expect(data['budgetMode']).to eq('per_category')
      expect(data['errors']).to be_empty
    end
  end

  context 'when updating only the spending target' do
    before { budget.update!(budget_mode: 'flex') }

    it 'updates the spending target without changing mode' do
      result = execute_graphql(mutation,
        variables: { spendingTarget: 5000.0 },
        context: { current_user: user }
      )

      data = graphql_response_data(result)['updateBudgetSettings']
      expect(data['spendingTarget']).to eq(5000.0)
      expect(data['budgetMode']).to eq('flex')
    end
  end

  context 'when no budget exists' do
    before { Budget.where(household: household).delete_all }

    it 'creates a budget and sets settings' do
      result = execute_graphql(mutation,
        variables: { budgetMode: 'flex', spendingTarget: 2500.0 },
        context: { current_user: user }
      )

      data = graphql_response_data(result)['updateBudgetSettings']
      expect(data['budgetMode']).to eq('flex')
      expect(data['spendingTarget']).to eq(2500.0)
      expect(data['errors']).to be_empty
      expect(household.budgets.count).to eq(1)
    end
  end

  context 'when unauthenticated' do
    it 'returns an error' do
      result = execute_graphql(mutation,
        variables: { budgetMode: 'flex' },
        context: {}
      )

      errors = graphql_response_errors(result)
      expect(errors).not_to be_nil
    end
  end
end
