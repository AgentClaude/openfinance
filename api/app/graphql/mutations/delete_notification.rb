module Mutations
  class DeleteNotification < BaseMutation
    argument :id, ID, required: true

    field :success, Boolean, null: false
    field :errors, [String], null: false

    def resolve(id:)
      user = context[:current_user]
      raise GraphQL::ExecutionError, "Authentication required" unless user

      notification = user.notifications.find_by(id: id)
      raise GraphQL::ExecutionError, "Notification not found" unless notification

      notification.destroy!
      { success: true, errors: [] }
    end
  end
end
