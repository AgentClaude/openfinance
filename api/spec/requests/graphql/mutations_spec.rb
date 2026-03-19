require 'rails_helper'

RSpec.describe 'GraphQL Mutations', type: :request do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }

  describe 'register' do
    let(:register_query) do
      <<~GRAPHQL
        mutation($email: String!, $password: String!, $name: String!) {
          register(email: $email, password: $password, name: $name) {
            token
            user { id email name }
            errors
          }
        }
      GRAPHQL
    end

    it 'creates a new user with household' do
      result = graphql_query(register_query, variables: {
        email: "new-user-#{SecureRandom.hex(4)}@test.dev",
        password: 'securepass123',
        name: "Test User #{SecureRandom.hex(4)}"
      })
      data = result.dig('data', 'register')
      expect(data['token']).to be_present
      expect(data['user']['email']).to include('@test.dev')
      expect(data['errors']).to be_empty
    end

    it 'returns errors for duplicate email' do
      result = graphql_query(register_query, variables: {
        email: user.email,
        password: 'securepass123',
        name: "Duplicate User #{SecureRandom.hex(4)}"
      })
      data = result.dig('data', 'register')
      expect(data['token']).to be_nil
      expect(data['errors']).to include(match(/email/i))
    end

    it 'sequential registrations succeed without duplicate category errors' do
      # Regression test: register mutation previously called
      # Category.create_system_categories_for_household which conflicted
      # with the Household after_create callback
      3.times do |i|
        result = graphql_query(register_query, variables: {
          email: "race-test-#{SecureRandom.hex(6)}@test.dev",
          password: 'securepass123',
          name: "Race Test #{SecureRandom.hex(6)}"
        })
        data = result.dig('data', 'register')
        expect(data['token']).to be_present, "Registration #{i + 1} should succeed"
        expect(data['errors']).to be_empty
      end
    end
  end

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

  describe 'updateHousehold' do
    let(:query) do
      <<~GRAPHQL
        mutation($name: String, $currency: String, $timezone: String, $preferences: JSON) {
          updateHousehold(name: $name, currency: $currency, timezone: $timezone, preferences: $preferences) {
            household {
              id
              name
              currency
              timezone
              preferences
            }
            errors
          }
        }
      GRAPHQL
    end

    it 'updates household name and currency' do
      result = graphql_query(query, variables: { name: 'Smith Family', currency: 'EUR' }, user: user)
      data = result.dig('data', 'updateHousehold')
      expect(data['errors']).to be_empty
      expect(data['household']['name']).to eq('Smith Family')
      expect(data['household']['currency']).to eq('EUR')
    end

    it 'updates household timezone' do
      result = graphql_query(query, variables: { timezone: 'America/Denver' }, user: user)
      data = result.dig('data', 'updateHousehold')
      expect(data['errors']).to be_empty
      expect(data['household']['timezone']).to eq('America/Denver')
    end

    it 'rejects invalid timezone' do
      result = graphql_query(query, variables: { timezone: 'Invalid/Zone' }, user: user)
      expect(result['errors']).to be_present
      expect(result['errors'].first['message']).to include('Invalid timezone')
    end

    it 'updates preferences (merge)' do
      household.update!(preferences: { 'dateFormat' => 'MM/DD/YYYY' })
      result = graphql_query(query, variables: { preferences: { 'numberFormat' => 'dot-comma' } }, user: user)
      data = result.dig('data', 'updateHousehold')
      expect(data['errors']).to be_empty
      prefs = data['household']['preferences']
      expect(prefs['dateFormat']).to eq('MM/DD/YYYY')
      expect(prefs['numberFormat']).to eq('dot-comma')
    end

    it 'strips unknown preference keys' do
      result = graphql_query(query, variables: { preferences: { 'dateFormat' => 'YYYY-MM-DD', 'evil' => 'hacked' } }, user: user)
      data = result.dig('data', 'updateHousehold')
      expect(data['errors']).to be_empty
      prefs = data['household']['preferences']
      expect(prefs['dateFormat']).to eq('YYYY-MM-DD')
      expect(prefs).not_to have_key('evil')
    end

    it 'returns error when not authenticated' do
      result = graphql_query(query, variables: { name: 'Hacked' })
      expect(result['errors']).to be_present
    end
  end
end
