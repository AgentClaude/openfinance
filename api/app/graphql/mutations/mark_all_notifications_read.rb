module Mutations
  class MarkAllNotificationsRead < BaseMutation
    field :count, Integer, null: false
    field :errors, [String], null: false

    def resolve
      user = context[:current_user]
      raise GraphQL::ExecutionError, "Authentication required" unless user

      count = Notification.mark_all_read_for_user(user)

      { count: count, errors: [] }
    end
  end
end
