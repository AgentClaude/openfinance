module Mutations
  class ApplyCategorizationRules < BaseMutation
    field :updated_count, Integer, null: false

    def resolve
      hh = require_auth!

      service = Rules::ApplyRulesService.new(household: hh)
      result = service.call

      if result.success?
        { updated_count: result.data[:updated_count] }
      else
        raise GraphQL::ExecutionError, result.errors.join(", ")
      end
    end
  end
end
