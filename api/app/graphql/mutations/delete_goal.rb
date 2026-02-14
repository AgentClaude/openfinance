module Mutations
  class DeleteGoal < BaseMutation
    argument :id, ID, required: true

    field :success, Boolean, null: false

    def resolve(id:)
      household = context[:current_user]&.household
      raise GraphQL::ExecutionError, "Not authenticated" unless household

      goal = household.goals.find(id)
      goal.destroy!

      { success: true }
    end
  end
end
