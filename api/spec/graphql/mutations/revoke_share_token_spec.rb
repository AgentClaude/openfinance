# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Mutations::RevokeShareToken do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let!(:share_token) { create(:share_token, user: user) }

  let(:mutation) do
    <<~GRAPHQL
      mutation($id: ID!) {
        revokeShareToken(id: $id) {
          success
          errors
        }
      }
    GRAPHQL
  end

  def execute(current_user:, id: share_token.id.to_s)
    OpenfinanceSchema.execute(
      mutation,
      variables: { id: id },
      context: { current_user: current_user }
    )
  end

  context 'authenticated' do
    it 'revokes the share token' do
      result = execute(current_user: user)
      data = result['data']['revokeShareToken']
      expect(data['success']).to be true
      expect(data['errors']).to be_empty
      expect { share_token.reload }.to raise_error(ActiveRecord::RecordNotFound)
    end

    it 'returns error for non-existent token' do
      result = execute(current_user: user, id: SecureRandom.uuid)
      data = result['data']['revokeShareToken']
      expect(data['success']).to be false
      expect(data['errors']).to include('Share token not found')
    end

    it 'returns error for another user token' do
      other_user = create(:user, household: create(:household))
      other_token = create(:share_token, user: other_user)
      result = execute(current_user: user, id: other_token.id.to_s)
      data = result['data']['revokeShareToken']
      expect(data['success']).to be false
      expect(data['errors']).to include('Share token not found')
    end
  end

  context 'unauthenticated' do
    it 'returns authentication error' do
      result = execute(current_user: nil)
      data = result['data']['revokeShareToken']
      expect(data['success']).to be false
      expect(data['errors']).to include('Not authenticated')
    end
  end
end
