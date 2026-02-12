module Mutations
  class DeleteCategorizationRule < BaseMutation
    argument :id, ID, required: true

    field :success, Boolean, null: false

    def resolve(id:)
      household = context[:current_user]&.household
      raise GraphQL::ExecutionError, "Not authenticated" unless household

      rule = household.categorization_rules.find(id)
      rule.destroy!
      { success: true }
    end
  end
end
