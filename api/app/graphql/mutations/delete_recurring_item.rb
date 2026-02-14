module Mutations
  class DeleteRecurringItem < BaseMutation
    argument :id, ID, required: true

    field :success, Boolean, null: false

    def resolve(id:)
      household = context[:current_user]&.household
      raise GraphQL::ExecutionError, "Not authenticated" unless household

      item = household.recurring_items.find_by(id: id)
      raise GraphQL::ExecutionError, "Recurring item not found" unless item

      item.destroy!
      { success: true }
    end
  end
end
