module Mutations
  class ResetPlaidCategoryMappings < BaseMutation
    field :created, Integer, null: false

    def resolve
      hh = require_auth!

      # Delete all existing mappings and re-seed defaults
      hh.plaid_category_mappings.destroy_all
      result = Plaid::SeedCategoryMappingsService.call(household: hh)

      if result.success?
        log_activity(action: 'plaid_mappings_reset', resource: hh)
        { created: result.data[:created] }
      else
        raise GraphQL::ExecutionError, result.errors.join(', ')
      end
    end
  end
end
