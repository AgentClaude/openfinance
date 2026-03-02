module Mutations
  class SendTestDigest < BaseMutation
    description 'Send a test weekly digest email to the current user'

    field :success, Boolean, null: false
    field :message, String, null: true

    def resolve
      user = context[:current_user]
      return { success: false, message: 'Not authenticated' } unless user
      return { success: false, message: 'No household' } unless user.household

      service = WeeklyDigestService.new(user)
      data = service.call
      return { success: false, message: 'Could not generate digest data' } unless data

      DigestMailer.weekly_digest(user, data).deliver_now
      { success: true, message: "Test digest sent to #{user.email}" }
    rescue StandardError => e
      { success: false, message: e.message }
    end
  end
end
