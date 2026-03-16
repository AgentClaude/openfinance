module Mutations
  class ToggleCategoryHidden < BaseMutation
    argument :id, ID, required: true
    argument :hidden, Boolean, required: true

    type Types::CategoryType

    def resolve(id:, hidden:)
      hh = require_auth!
      authorize(hh.categories.find(id), :update?)
      result = Categories::ToggleHiddenService.call(household: hh, category_id: id, hidden: hidden)
      raise GraphQL::ExecutionError, result.error_message unless result.success?
      log_activity(action: hidden ? 'category_hidden' : 'category_shown', resource: result.data, metadata: { category_name: result.data.name })
      result.data
    end
  end
end
