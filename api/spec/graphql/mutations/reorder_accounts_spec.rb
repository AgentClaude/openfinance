# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Mutations::ReorderAccounts do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let!(:account1) { create(:account, household: household, name: 'Checking', display_order: 1) }
  let!(:account2) { create(:account, household: household, name: 'Savings', display_order: 2) }
  let!(:account3) { create(:account, household: household, name: 'Credit Card', account_type: 'credit_card', display_order: 3) }

  let(:query) do
    <<~GQL
      mutation ReorderAccounts($accountIds: [ID!]!) {
        reorderAccounts(accountIds: $accountIds) {
          accounts {
            id
            name
            displayOrder
          }
          errors
        }
      }
    GQL
  end

  def execute(variables = {})
    OpenfinanceSchema.execute(query, variables: variables, context: { current_user: user })
  end

  it 'reorders accounts' do
    result = execute(accountIds: [account3.id, account1.id, account2.id])
    data = result.dig('data', 'reorderAccounts')
    expect(data['errors']).to be_empty

    accounts = data['accounts']
    expect(accounts.map { |a| a['name'] }).to eq(['Credit Card', 'Checking', 'Savings'])
    expect(accounts.map { |a| a['displayOrder'] }).to eq([1, 2, 3])
  end

  it 'rejects invalid account ids' do
    result = execute(accountIds: [account1.id, 'fake-id'])
    data = result.dig('data', 'reorderAccounts')
    expect(data['errors']).to include('Some accounts not found or not accessible')
  end

  context 'cross-household' do
    let(:other_household) { create(:household) }
    let(:other_account) { create(:account, household: other_household) }

    it 'rejects accounts from another household' do
      result = execute(accountIds: [account1.id, other_account.id])
      data = result.dig('data', 'reorderAccounts')
      expect(data['errors']).to include('Some accounts not found or not accessible')
    end
  end
end
