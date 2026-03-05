# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Mutations::CreateApiKey do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }

  let(:mutation) do
    <<~GRAPHQL
      mutation($name: String!) {
        createApiKey(name: $name) {
          apiKey {
            id
            name
            key
            createdAt
            revoked
          }
          errors
        }
      }
    GRAPHQL
  end

  def execute(current_user:, name: 'My Dashboard')
    OpenfinanceSchema.execute(
      mutation,
      variables: { name: name },
      context: { current_user: current_user }
    )
  end

  context 'authenticated' do
    it 'creates an API key' do
      result = execute(current_user: user)
      data = result['data']['createApiKey']
      expect(data['errors']).to be_empty
      expect(data['apiKey']['name']).to eq('My Dashboard')
      expect(data['apiKey']['key']).to be_present
      expect(data['apiKey']['revoked']).to be false
    end

    it 'creates a key associated with the current user' do
      expect {
        execute(current_user: user)
      }.to change { user.api_keys.count }.by(1)
    end
  end

  context 'unauthenticated' do
    it 'returns authentication error' do
      result = execute(current_user: nil)
      data = result['data']['createApiKey']
      expect(data['apiKey']).to be_nil
      expect(data['errors']).to include('Not authenticated')
    end
  end
end
