# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Mutations::CancelInvitation do
  let(:household) { create(:household) }
  let(:owner) { create(:user, household: household, role: 'owner') }
  let(:member) { create(:user, :member, household: household) }
  let!(:invitation) { create(:invitation, household: household, invited_by: owner) }

  let(:mutation) do
    <<~GRAPHQL
      mutation($id: ID!) {
        cancelInvitation(id: $id) {
          success
          errors
        }
      }
    GRAPHQL
  end

  def execute(user:, id: invitation.id.to_s)
    OpenfinanceSchema.execute(
      mutation,
      variables: { id: id },
      context: { current_user: user }
    )
  end

  context 'as owner' do
    it 'cancels a pending invitation' do
      result = execute(user: owner)
      data = result['data']['cancelInvitation']
      expect(data['success']).to be true
      expect(data['errors']).to be_empty
      expect(invitation.reload.status).to eq('expired')
    end

    it 'rejects cancelling a non-pending invitation' do
      invitation.update!(status: 'accepted', accepted_at: Time.current)
      result = execute(user: owner)
      data = result['data']['cancelInvitation']
      expect(data['success']).to be false
      expect(data['errors']).to include('Only pending invitations can be cancelled')
    end

    it 'returns error for non-existent invitation' do
      result = execute(user: owner, id: SecureRandom.uuid)
      data = result['data']['cancelInvitation']
      expect(data['success']).to be false
      expect(data['errors']).to include('Invitation not found')
    end
  end

  context 'as member' do
    it 'returns authorization error' do
      result = execute(user: member)
      errors = result['errors']
      expect(errors).to be_present
      expect(errors.first['message']).to match(/Not authorized/)
    end
  end

  context 'unauthenticated' do
    it 'returns authentication error' do
      result = execute(user: nil)
      errors = result['errors']
      expect(errors).to be_present
      expect(errors.first['message']).to match(/Not authenticated/)
    end
  end
end
