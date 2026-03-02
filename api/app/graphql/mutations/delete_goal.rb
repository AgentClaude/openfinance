module Mutations
  class DeleteGoal < BaseMutation
    argument :id, ID, required: true

    field :success, Boolean, null: false

    def resolve(id:)
      hh = require_auth!
      goal = authorize(hh.goals.find(id), :destroy?)
      goal.destroy!

      { success: true }
    end
  end
end
