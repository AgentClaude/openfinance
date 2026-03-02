module Mutations
  class DeleteNotificationRule < BaseMutation
    argument :id, ID, required: true

    field :success, Boolean, null: false
    field :errors, [String], null: false

    def resolve(id:)
      user = context[:current_user]
      raise GraphQL::ExecutionError, "Authentication required" unless user

      rule = user.notification_rules.find_by(id: id)
      raise GraphQL::ExecutionError, "Notification rule not found" unless rule

      rule.destroy!
      { success: true, errors: [] }
    end
  end
end
