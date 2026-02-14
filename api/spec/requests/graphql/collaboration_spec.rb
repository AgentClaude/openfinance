require 'rails_helper'

RSpec.describe 'Collaboration (Household Invites)', type: :request do
  let(:household) { create(:household) }
  let(:owner) { create(:user, household: household, role: 'owner') }
  let(:member_user) { create(:user, household: household, role: 'member') }
  let(:headers) { auth_headers(owner) }

  def auth_headers(user)
    post '/users/sign_in', params: { user: { email: user.email, password: 'password123' } }, as: :json
    token = JSON.parse(response.body).dig('token') || response.headers['Authorization']&.sub('Bearer ', '')
    { 'Authorization' => "Bearer #{token}", 'Content-Type' => 'application/json' }
  end

  def graphql(query, variables: {}, user_headers: headers)
    post '/graphql', params: { query: query, variables: variables }.to_json, headers: user_headers
    JSON.parse(response.body)
  end

  describe 'inviteToHousehold mutation' do
    let(:mutation) do
      <<~GQL
        mutation InviteToHousehold($email: String!, $role: String) {
          inviteToHousehold(email: $email, role: $role) {
            invitation { id email role status }
            errors
          }
        }
      GQL
    end

    it 'creates an invitation as owner' do
      result = graphql(mutation, variables: { email: 'newuser@example.com', role: 'member' })
      data = result.dig('data', 'inviteToHousehold')
      expect(data['errors']).to be_empty
      expect(data['invitation']['email']).to eq('newuser@example.com')
      expect(data['invitation']['role']).to eq('member')
      expect(data['invitation']['status']).to eq('pending')
    end

    it 'creates advisor invitation' do
      result = graphql(mutation, variables: { email: 'advisor@example.com', role: 'advisor' })
      data = result.dig('data', 'inviteToHousehold')
      expect(data['errors']).to be_empty
      expect(data['invitation']['role']).to eq('advisor')
    end

    it 'rejects non-owner invitations' do
      result = graphql(mutation, variables: { email: 'test@example.com' }, user_headers: auth_headers(member_user))
      data = result.dig('data', 'inviteToHousehold')
      expect(data['errors']).to include('Only owners can invite members')
    end

    it 'rejects duplicate pending invitations' do
      graphql(mutation, variables: { email: 'dup@example.com', role: 'member' })
      result = graphql(mutation, variables: { email: 'dup@example.com', role: 'member' })
      data = result.dig('data', 'inviteToHousehold')
      expect(data['errors']).to include('An active invitation already exists for this email')
    end

    it 'rejects inviting existing members' do
      other = create(:user, household: create(:household))
      household.add_member(other, 'member')
      result = graphql(mutation, variables: { email: other.email })
      data = result.dig('data', 'inviteToHousehold')
      expect(data['errors']).to include('User is already a member of this household')
    end
  end

  describe 'acceptInvitation mutation' do
    let(:accept_mutation) do
      <<~GQL
        mutation AcceptInvitation($token: String!) {
          acceptInvitation(token: $token) {
            success
            errors
          }
        }
      GQL
    end

    it 'accepts a valid invitation' do
      invitee = create(:user, household: create(:household))
      invitation = create(:invitation, household: household, email: invitee.email, invited_by: owner)

      result = graphql(accept_mutation, variables: { token: invitation.token }, user_headers: auth_headers(invitee))
      data = result.dig('data', 'acceptInvitation')
      expect(data['success']).to be true
      expect(data['errors']).to be_empty
      expect(invitation.reload.status).to eq('accepted')
    end

    it 'rejects expired invitations' do
      invitee = create(:user, household: create(:household))
      invitation = create(:invitation, household: household, email: invitee.email, invited_by: owner, expires_at: 1.day.ago)

      result = graphql(accept_mutation, variables: { token: invitation.token }, user_headers: auth_headers(invitee))
      data = result.dig('data', 'acceptInvitation')
      expect(data['success']).to be false
      expect(data['errors']).to include('Invitation has expired')
    end

    it 'rejects wrong email' do
      invitee = create(:user, household: create(:household))
      invitation = create(:invitation, household: household, email: 'wrong@example.com', invited_by: owner)

      result = graphql(accept_mutation, variables: { token: invitation.token }, user_headers: auth_headers(invitee))
      data = result.dig('data', 'acceptInvitation')
      expect(data['success']).to be false
      expect(data['errors']).to include('This invitation was sent to a different email address')
    end
  end

  describe 'householdMembers query' do
    let(:query) do
      <<~GQL
        query HouseholdMembers {
          householdMembers {
            id
            user { id name email }
            role
            isPrimary
          }
        }
      GQL
    end

    it 'returns household members' do
      result = graphql(query)
      members = result.dig('data', 'householdMembers')
      expect(members).to be_an(Array)
      expect(members.length).to be >= 1
      expect(members.first['user']['email']).to eq(owner.email)
    end
  end

  describe 'removeHouseholdMember mutation' do
    let(:remove_mutation) do
      <<~GQL
        mutation RemoveHouseholdMember($userId: ID!) {
          removeHouseholdMember(userId: $userId) {
            success
            errors
          }
        }
      GQL
    end

    it 'removes a member as owner' do
      other = create(:user, household: create(:household))
      household.add_member(other, 'member')

      result = graphql(remove_mutation, variables: { userId: other.id })
      data = result.dig('data', 'removeHouseholdMember')
      expect(data['success']).to be true
    end

    it 'prevents non-owner from removing' do
      other = create(:user, household: create(:household))
      household.add_member(other, 'member')

      result = graphql(remove_mutation, variables: { userId: other.id }, user_headers: auth_headers(member_user))
      data = result.dig('data', 'removeHouseholdMember')
      expect(data['errors']).to include('Only owners can remove members')
    end

    it 'prevents self-removal' do
      result = graphql(remove_mutation, variables: { userId: owner.id })
      data = result.dig('data', 'removeHouseholdMember')
      expect(data['errors']).to include('Cannot remove yourself')
    end
  end

  describe 'householdInvitations query' do
    let(:query) do
      <<~GQL
        query HouseholdInvitations {
          householdInvitations {
            id
            email
            role
            status
          }
        }
      GQL
    end

    it 'returns pending invitations' do
      create(:invitation, household: household, invited_by: owner, email: 'pending@example.com')
      result = graphql(query)
      invitations = result.dig('data', 'householdInvitations')
      expect(invitations.length).to eq(1)
      expect(invitations.first['email']).to eq('pending@example.com')
    end
  end
end
