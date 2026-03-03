# frozen_string_literal: true

module Mutations
  class SendTestDigest < BaseMutation
    description 'Send a test weekly digest email to the current user'

    field :success, Boolean, null: false
    field :errors, [String], null: false

    def resolve
      user = context[:current_user]
      return { success: false, errors: ['Not authenticated'] } unless user
      return { success: false, errors: ['No household found'] } unless user.household

      service = WeeklyDigestService.new(user)
      digest_data = service.call

      if digest_data
        WeeklyDigestMailer.weekly_digest(user, digest_data).deliver_now
        { success: true, errors: [] }
      else
        { success: false, errors: ['Could not generate digest data'] }
      end
    rescue StandardError => e
      { success: false, errors: [e.message] }
    end
  end
end
