module Mutations
  class DeleteBudgetItem < BaseMutation
    argument :category_id, ID, required: true
    argument :month, String, required: true

    field :success, Boolean, null: false

    def resolve(category_id:, month:)
      household = context[:current_user]&.household
      raise GraphQL::ExecutionError, "Not authenticated" unless household

      date = Date.parse("#{month}-01").beginning_of_month rescue Date.current.beginning_of_month
      item = BudgetItem.joins(:budget)
        .where(budgets: { household_id: household.id })
        .where(category_id: category_id, month: date)
        .first

      raise GraphQL::ExecutionError, "Budget item not found" unless item

      item.destroy!
      { success: true }
    end
  end
end
