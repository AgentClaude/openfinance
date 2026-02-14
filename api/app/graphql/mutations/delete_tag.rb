module Mutations
  class DeleteTag < BaseMutation
    argument :id, ID, required: true

    field :success, Boolean, null: false

    def resolve(id:)
      user = context[:current_user]
      raise GraphQL::ExecutionError, "Authentication required" unless user

      tag = user.household.tags.find(id)
      tag.destroy!
      { success: true }
    end
  end
end
