module Mutations
  class AcceptInvitation < BaseMutation
    argument :token, String, required: true

    field :success, Boolean, null: false
    field :errors, [String], null: false

    def resolve(token:)
      user = context[:current_user]
      return { success: false, errors: ['Not authenticated'] } unless user

      invitation = Invitation.find_by(token: token)
      return { success: false, errors: ['Invitation not found'] } unless invitation

      if invitation.expired?
        invitation.update(status: 'expired')
        return { success: false, errors: ['Invitation has expired'] }
      end

      unless invitation.pending?
        return { success: false, errors: ['Invitation has already been used'] }
      end

      # Check email matches
      unless user.email.downcase == invitation.email.downcase
        return { success: false, errors: ['This invitation was sent to a different email address'] }
      end

      if invitation.accept!(user)
        ActivityEvent.log(user: user, action: 'joined', resource: invitation, metadata: {
          household_name: invitation.household.name,
          role: invitation.role
        })
        { success: true, errors: [] }
      else
        { success: false, errors: ['Failed to accept invitation'] }
      end
    end
  end
end
