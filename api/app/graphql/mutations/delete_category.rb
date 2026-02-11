module Mutations
  class DeleteCategory < BaseMutation
    argument :id, ID, required: true

    type Boolean

    def resolve(id:)
      household = context[:current_user]&.household
      raise GraphQL::ExecutionError, "Not authenticated" unless household

      cat = household.categories.find(id)
      raise GraphQL::ExecutionError, "Cannot delete system category" if cat.is_system?
      cat.destroy!
      true
    end
  end
end
