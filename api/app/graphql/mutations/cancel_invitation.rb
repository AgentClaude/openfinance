# frozen_string_literal: true

module Mutations
  class CancelInvitation < BaseMutation
    argument :id, ID, required: true

    field :success, Boolean, null: false
    field :errors, [String], null: false

    def resolve(id:)
      hh = require_auth!

      invitation = hh.invitations.find_by(id: id)
      return { success: false, errors: ['Invitation not found'] } unless invitation

      authorize(invitation, :cancel?)

      unless invitation.pending?
        return { success: false, errors: ['Only pending invitations can be cancelled'] }
      end

      invitation.update!(status: 'expired')
      { success: true, errors: [] }
    end
  end
end
