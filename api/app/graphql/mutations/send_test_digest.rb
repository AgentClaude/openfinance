module Mutations
  class SendTestDigest < BaseMutation
    description "Send a test weekly digest email to the current user"

    field :success, Boolean, null: false
    field :message, String, null: true

    def resolve
      user = context[:current_user]
      raise GraphQL::ExecutionError, "Authentication required" unless user

      # Check if user has email preference enabled for weekly_digest
      pref = user.notification_preferences.find_by(notification_type: 'weekly_digest', channel: 'email')
      unless pref&.enabled
        return { success: false, message: "Enable weekly digest email in notification preferences first." }
      end

      WeeklyDigestJob.perform_later
      { success: true, message: "Test digest email queued for #{user.email}" }
    end
  end
end
