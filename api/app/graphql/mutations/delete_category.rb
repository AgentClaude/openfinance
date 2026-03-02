module Mutations
  class DeleteCategory < BaseMutation
    argument :id, ID, required: true

    type Boolean

    def resolve(id:)
      hh = require_auth!
      cat = authorize(hh.categories.find(id), :destroy?)
      raise GraphQL::ExecutionError, "Cannot delete system category" if cat.is_system?
      cat.destroy!
      true
    end
  end
end
