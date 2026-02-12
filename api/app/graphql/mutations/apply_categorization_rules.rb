module Mutations
  class ApplyCategorizationRules < BaseMutation
    field :updated_count, Integer, null: false

    def resolve
      household = context[:current_user]&.household
      raise GraphQL::ExecutionError, "Not authenticated" unless household

      service = Rules::ApplyRulesService.new(household: household)
      result = service.call

      if result.success?
        { updated_count: result.data[:updated_count] }
      else
        raise GraphQL::ExecutionError, result.error
      end
    end
  end
end
