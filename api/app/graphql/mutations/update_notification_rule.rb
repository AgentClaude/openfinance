module Mutations
  class UpdateNotificationRule < BaseMutation
    argument :id, ID, required: true
    argument :name, String, required: false
    argument :is_active, Boolean, required: false
    argument :conditions, GraphQL::Types::JSON, required: false
    argument :settings, GraphQL::Types::JSON, required: false

    field :notification_rule, Types::NotificationRuleType, null: true
    field :errors, [String], null: false

    def resolve(id:, **attrs)
      user = context[:current_user]
      raise GraphQL::ExecutionError, "Authentication required" unless user

      rule = user.notification_rules.find_by(id: id)
      raise GraphQL::ExecutionError, "Notification rule not found" unless rule

      attrs.compact!
      if rule.update(attrs)
        { notification_rule: rule, errors: [] }
      else
        { notification_rule: nil, errors: rule.errors.full_messages }
      end
    end
  end
end
