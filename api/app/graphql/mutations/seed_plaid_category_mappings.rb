module Mutations
  class SeedPlaidCategoryMappings < BaseMutation
    field :created, Integer, null: false
    field :skipped, Integer, null: false

    def resolve
      hh = require_auth!
      result = Plaid::SeedCategoryMappingsService.call(household: hh)

      if result.success?
        { created: result.data[:created], skipped: result.data[:skipped] }
      else
        raise GraphQL::ExecutionError, result.errors.join(', ')
      end
    end
  end
end
