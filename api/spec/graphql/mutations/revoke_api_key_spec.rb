# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Mutations::RevokeApiKey do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let!(:api_key) { create(:api_key, user: user) }

  let(:mutation) do
    <<~GRAPHQL
      mutation($id: ID!) {
        revokeApiKey(id: $id) {
          apiKey {
            id
            revoked
            revokedAt
          }
          errors
        }
      }
    GRAPHQL
  end

  def execute(current_user:, id: api_key.id.to_s)
    OpenfinanceSchema.execute(
      mutation,
      variables: { id: id },
      context: { current_user: current_user }
    )
  end

  context 'authenticated' do
    it 'revokes the API key' do
      result = execute(current_user: user)
      data = result['data']['revokeApiKey']
      expect(data['errors']).to be_empty
      expect(data['apiKey']['revoked']).to be true
      expect(data['apiKey']['revokedAt']).to be_present
    end

    it 'returns error for non-existent key' do
      result = execute(current_user: user, id: SecureRandom.uuid)
      data = result['data']['revokeApiKey']
      expect(data['apiKey']).to be_nil
      expect(data['errors']).to include('API key not found')
    end

    it 'returns error for another user key' do
      other_user = create(:user, household: create(:household))
      other_key = create(:api_key, user: other_user)
      result = execute(current_user: user, id: other_key.id.to_s)
      data = result['data']['revokeApiKey']
      expect(data['apiKey']).to be_nil
      expect(data['errors']).to include('API key not found')
    end
  end

  context 'unauthenticated' do
    it 'returns authentication error' do
      result = execute(current_user: nil)
      data = result['data']['revokeApiKey']
      expect(data['apiKey']).to be_nil
      expect(data['errors']).to include('Not authenticated')
    end
  end
end
