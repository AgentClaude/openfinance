module Mutations
  class SendTestDigest < BaseMutation
    field :success, Boolean, null: false
    field :errors, [String], null: false

    def resolve
      user = context[:current_user]
      raise GraphQL::ExecutionError, "Authentication required" unless user
      raise GraphQL::ExecutionError, "No household found" unless user.household

      week_end = Date.current
      week_start = week_end - 6.days
      digest_data = EmailNotificationService.send(:build_digest_data, user.household, week_start, week_end)

      NotificationMailer.weekly_digest(user, digest_data).deliver_later

      { success: true, errors: [] }
    rescue => e
      { success: false, errors: [e.message] }
    end
  end
end
