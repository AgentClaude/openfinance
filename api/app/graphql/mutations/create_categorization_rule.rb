module Mutations
  class CreateCategorizationRule < BaseMutation
    argument :match_field, String, required: true
    argument :match_type, String, required: true
    argument :match_value, String, required: true
    argument :category_id, ID, required: true
    argument :rename_to, String, required: false
    argument :priority, Integer, required: false

    type Types::CategorizationRuleType

    def resolve(match_field:, match_type:, match_value:, category_id:, rename_to: nil, priority: nil)
      household = context[:current_user]&.household
      raise GraphQL::ExecutionError, "Not authenticated" unless household

      rule = household.categorization_rules.build(
        match_field: match_field,
        match_type: match_type,
        match_value: match_value,
        category_id: category_id,
        rename_to: rename_to,
        priority: priority || 0
      )

      if rule.save
        rule
      else
        raise GraphQL::ExecutionError, rule.errors.full_messages.join(', ')
      end
    end
  end
end
