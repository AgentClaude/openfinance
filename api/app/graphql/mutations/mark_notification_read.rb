module Mutations
  class MarkNotificationRead < BaseMutation
    argument :id, ID, required: true
    argument :read, Boolean, required: false, default_value: true

    field :notification, Types::NotificationType, null: true
    field :errors, [String], null: false

    def resolve(id:, read: true)
      user = context[:current_user]
      raise GraphQL::ExecutionError, "Authentication required" unless user

      notification = user.notifications.find_by(id: id)
      raise GraphQL::ExecutionError, "Notification not found" unless notification

      if read
        notification.mark_as_read!
      else
        notification.mark_as_unread!
      end

      { notification: notification, errors: [] }
    end
  end
end
