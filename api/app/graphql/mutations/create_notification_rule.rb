module Mutations
  class CreateNotificationRule < BaseMutation
    argument :name, String, required: true
    argument :rule_type, String, required: true
    argument :conditions, GraphQL::Types::JSON, required: true
    argument :settings, GraphQL::Types::JSON, required: false

    field :notification_rule, Types::NotificationRuleType, null: true
    field :errors, [String], null: false

    def resolve(name:, rule_type:, conditions:, settings: nil)
      user = context[:current_user]
      raise GraphQL::ExecutionError, "Authentication required" unless user

      rule = user.notification_rules.build(
        household: user.household,
        name: name,
        rule_type: rule_type,
        conditions: conditions,
        settings: settings || {}
      )

      if rule.save
        { notification_rule: rule, errors: [] }
      else
        { notification_rule: nil, errors: rule.errors.full_messages }
      end
    end
  end
end
