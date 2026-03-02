module Mutations
  class DeleteRecurringItem < BaseMutation
    argument :id, ID, required: true

    field :success, Boolean, null: false

    def resolve(id:)
      hh = require_auth!
      item = hh.recurring_items.find_by(id: id)
      raise GraphQL::ExecutionError, "Recurring item not found" unless item
      authorize(item, :destroy?)

      item.destroy!
      { success: true }
    end
  end
end
