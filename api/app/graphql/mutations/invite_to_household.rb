module Mutations
  class InviteToHousehold < BaseMutation
    argument :email, String, required: true
    argument :role, String, required: false, default_value: 'member'

    field :invitation, Types::InvitationType, null: true
    field :errors, [String], null: false

    def resolve(email:, role:)
      user = context[:current_user]
      return { invitation: nil, errors: ['Not authenticated'] } unless user

      household = user.household
      return { invitation: nil, errors: ['No household found'] } unless household

      # Check permission
      unless user.role == 'owner'
        return { invitation: nil, errors: ['Only owners can invite members'] }
      end

      # Check if already a member
      existing_user = User.find_by(email: email)
      if existing_user && household.member?(existing_user)
        return { invitation: nil, errors: ['User is already a member of this household'] }
      end

      # Check for existing pending invitation
      existing = household.invitations.active.find_by(email: email)
      if existing
        return { invitation: nil, errors: ['An active invitation already exists for this email'] }
      end

      invitation = household.invitations.new(
        email: email,
        role: role,
        invited_by: user
      )

      if invitation.save
        # Send invitation email
        InvitationMailer.invite(invitation).deliver_later
        { invitation: invitation, errors: [] }
      else
        { invitation: nil, errors: invitation.errors.full_messages }
      end
    end
  end
end
