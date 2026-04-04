# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Mutations::UpdateAccount do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:account) { create(:account, household: household, name: 'Test Checking', account_type: 'checking') }

  let(:query) do
    <<~GQL
      mutation UpdateAccount($id: ID!, $name: String, $isHidden: Boolean, $displayOrder: Int, $interestRate: Float, $creditLimit: Float, $minimumPayment: Float) {
        updateAccount(id: $id, name: $name, isHidden: $isHidden, displayOrder: $displayOrder, interestRate: $interestRate, creditLimit: $creditLimit, minimumPayment: $minimumPayment) {
          account {
            id
            name
            isHidden
            displayOrder
            interestRate
            creditLimit
            minimumPayment
          }
          errors
        }
      }
    GQL
  end

  def execute(variables = {})
    OpenfinanceSchema.execute(query, variables: variables, context: { current_user: user })
  end

  context 'updating name' do
    it 'renames the account' do
      result = execute(id: account.id, name: 'Primary Checking')
      data = result.dig('data', 'updateAccount')
      expect(data['errors']).to be_empty
      expect(data['account']['name']).to eq('Primary Checking')
    end
  end

  context 'hiding account' do
    it 'hides the account' do
      result = execute(id: account.id, isHidden: true)
      data = result.dig('data', 'updateAccount')
      expect(data['errors']).to be_empty
      expect(data['account']['isHidden']).to be true
    end

    it 'unhides the account' do
      account.update!(is_hidden: true)
      result = execute(id: account.id, isHidden: false)
      data = result.dig('data', 'updateAccount')
      expect(data['account']['isHidden']).to be false
    end
  end

  context 'updating display order' do
    it 'changes display order' do
      result = execute(id: account.id, displayOrder: 3)
      data = result.dig('data', 'updateAccount')
      expect(data['account']['displayOrder']).to eq(3)
    end
  end

  context 'updating financial details' do
    let(:credit_account) { create(:account, :credit, household: household) }

    it 'updates interest rate' do
      result = execute(id: credit_account.id, interestRate: 24.99)
      data = result.dig('data', 'updateAccount')
      expect(data['account']['interestRate']).to eq(24.99)
    end

    it 'updates credit limit' do
      result = execute(id: credit_account.id, creditLimit: 10000.0)
      data = result.dig('data', 'updateAccount')
      expect(data['account']['creditLimit']).to eq(10000.0)
    end

    it 'updates minimum payment' do
      result = execute(id: credit_account.id, minimumPayment: 50.0)
      data = result.dig('data', 'updateAccount')
      expect(data['account']['minimumPayment']).to eq(50.0)
    end
  end

  context 'with nonexistent account' do
    it 'returns error' do
      result = execute(id: 'nonexistent')
      data = result.dig('data', 'updateAccount')
      expect(data['errors']).to include('Account not found')
    end
  end

  context 'without authentication' do
    it 'raises error' do
      result = OpenfinanceSchema.execute(query, variables: { id: account.id, name: 'Test' }, context: { current_user: nil })
      expect(result['errors']).to be_present
    end
  end
end
