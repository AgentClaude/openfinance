module Mutations
  class DeleteBudgetItem < BaseMutation
    argument :category_id, ID, required: true
    argument :month, String, required: true

    field :success, Boolean, null: false

    def resolve(category_id:, month:)
      hh = require_auth!
      date = Date.parse("#{month}-01").beginning_of_month rescue Date.current.beginning_of_month
      item = BudgetItem.joins(:budget)
        .where(budgets: { household_id: hh.id })
        .where(category_id: category_id, month: date)
        .first

      raise GraphQL::ExecutionError, "Budget item not found" unless item
      authorize(item, :destroy?)

      item.destroy!
      { success: true }
    end
  end
end
