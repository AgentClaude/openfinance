module Mutations
  class SendTestDigest < BaseMutation
    description "Send a test weekly digest email to the current user"

    field :success, Boolean, null: false
    field :message, String, null: false

    def resolve
      user = context[:current_user]
      raise GraphQL::ExecutionError, "Authentication required" unless user
      raise GraphQL::ExecutionError, "No household found" unless user.household

      NotificationMailer.weekly_digest(user).deliver_later

      { success: true, message: "Weekly digest queued for #{user.email}" }
    rescue => e
      { success: false, message: "Failed to send: #{e.message}" }
    end
  end
end
