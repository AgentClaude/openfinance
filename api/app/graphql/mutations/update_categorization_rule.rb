module Mutations
  class UpdateCategorizationRule < BaseMutation
    argument :id, ID, required: true
    argument :match_field, String, required: false
    argument :match_type, String, required: false
    argument :match_value, String, required: false
    argument :category_id, ID, required: false
    argument :rename_to, String, required: false
    argument :priority, Integer, required: false
    argument :is_active, Boolean, required: false

    type Types::CategorizationRuleType

    def resolve(id:, **attrs)
      household = context[:current_user]&.household
      raise GraphQL::ExecutionError, "Not authenticated" unless household

      rule = household.categorization_rules.find(id)
      if rule.update(attrs.compact)
        rule
      else
        raise GraphQL::ExecutionError, rule.errors.full_messages.join(', ')
      end
    end
  end
end
