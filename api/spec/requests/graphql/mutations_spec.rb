require 'rails_helper'

RSpec.describe 'GraphQL Mutations', type: :request do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }

  describe 'login' do
    let(:query) do
      <<~GRAPHQL
        mutation($email: String!, $password: String!) {
          login(email: $email, password: $password) {
            token
            user { id email name }
            errors
          }
        }
      GRAPHQL
    end

    it 'returns token for valid credentials' do
      result = graphql_query(query, variables: { email: user.email, password: 'password123' })
      data = result.dig('data', 'login')
      expect(data['token']).to be_present
      expect(data['user']['email']).to eq(user.email)
      expect(data['errors']).to be_empty
    end

    it 'returns error for invalid credentials' do
      result = graphql_query(query, variables: { email: user.email, password: 'wrong' })
      data = result.dig('data', 'login')
      expect(data['token']).to be_nil
      expect(data['errors']).to include('Invalid email or password')
    end
  end

  describe 'createManualAccount' do
    let(:query) do
      <<~GRAPHQL
        mutation($input: ManualAccountInput!) {
          createManualAccount(input: $input) {
            id
            name
            balance
            errors
          }
        }
      GRAPHQL
    end

    it 'creates a manual account' do
      result = graphql_query(query, variables: {
        input: { name: 'My Savings', type: 'DEPOSITORY', balance: 5000.0 }
      }, user: user)
      data = result.dig('data', 'createManualAccount')
      expect(data['errors']).to be_empty
      expect(data['name']).to eq('My Savings')
      expect(data['balance']).to eq(5000.0)
    end

    it 'returns error when not authenticated' do
      result = graphql_query(query, variables: {
        input: { name: 'Test', type: 'DEPOSITORY', balance: 100.0 }
      })
      errors = result['errors']
      expect(errors).to be_present
      expect(errors.first['message']).to include('Not authenticated')
    end
  end

  describe 'createTransaction' do
    let(:account) { create(:account, household: household) }
    let(:category) { create(:category, household: household) }

    let(:query) do
      <<~GRAPHQL
        mutation($input: TransactionInput!) {
          createTransaction(input: $input) {
            id
            description
            amount
            date
            merchantName
          }
        }
      GRAPHQL
    end

    it 'creates a transaction' do
      result = graphql_query(query, variables: {
        input: {
          accountId: account.id.to_s,
          description: 'Coffee Shop',
          amount: -4.50,
          date: Date.current.iso8601,
          categoryId: category.id.to_s,
          merchantName: 'Starbucks'
        }
      }, user: user)
      data = result.dig('data', 'createTransaction')
      expect(data['description']).to eq('Coffee Shop')
      expect(data['merchantName']).to eq('Starbucks')
      expect(data['amount']).to eq(-4.5)
    end

    it 'raises error when not authenticated' do
      result = graphql_query(query, variables: {
        input: {
          accountId: account.id.to_s,
          description: 'Test',
          amount: -10.0,
          date: Date.current.iso8601
        }
      })
      expect(result['errors']).to be_present
    end
  end

  describe 'updateTransaction' do
    let(:account) { create(:account, household: household) }
    let(:txn) { create(:transaction, household: household, account: account, name: 'Original') }

    let(:query) do
      <<~GRAPHQL
        mutation($id: ID!, $input: TransactionInput!) {
          updateTransaction(id: $id, input: $input) {
            id
            description
            merchantName
          }
        }
      GRAPHQL
    end

    it 'updates a transaction' do
      result = graphql_query(query, variables: {
        id: txn.id.to_s,
        input: {
          description: 'Updated Name',
          merchantName: 'New Merchant'
        }
      }, user: user)
      data = result.dig('data', 'updateTransaction')
      expect(data['description']).to eq('Updated Name')
      expect(data['merchantName']).to eq('New Merchant')
    end
  end

  describe 'createCategory' do
    let(:query) do
      <<~GRAPHQL
        mutation($input: CategoryInput!) {
          createCategory(input: $input) {
            id
            name
            icon
            groupName
          }
        }
      GRAPHQL
    end

    it 'creates a category' do
      result = graphql_query(query, variables: {
        input: { name: 'Pet Supplies', icon: '🐾', groupName: 'Shopping' }
      }, user: user)
      data = result.dig('data', 'createCategory')
      expect(data['name']).to eq('Pet Supplies')
      expect(data['icon']).to eq('🐾')
      expect(data['groupName']).to eq('Shopping')
    end
  end

  describe 'deleteCategory' do
    let(:category) { create(:category, household: household, name: 'To Delete', is_system: false) }

    let(:query) do
      <<~GRAPHQL
        mutation($id: ID!) {
          deleteCategory(id: $id)
        }
      GRAPHQL
    end

    it 'deletes a custom category' do
      cat_id = category.id
      result = graphql_query(query, variables: { id: cat_id.to_s }, user: user)
      expect(result.dig('data', 'deleteCategory')).to be true
      expect(Category.find_by(id: cat_id)).to be_nil
    end
  end
end
