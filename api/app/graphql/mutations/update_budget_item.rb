module Mutations
  class UpdateBudgetItem < BaseMutation
    argument :category_id, ID, required: true
    argument :month, String, required: true
    argument :budgeted, Float, required: true

    type Types::BudgetItemType

    def resolve(category_id:, month:, budgeted:)
      household = context[:current_user]&.household
      raise GraphQL::ExecutionError, "Not authenticated" unless household

      date = Date.parse("#{month}-01").beginning_of_month rescue Date.current.beginning_of_month
      budget = household.budgets.first || Budget.create!(household: household, name: "Monthly Budget", start_date: date, period_type: 'monthly')
      item = BudgetItem.find_or_initialize_by(budget: budget, category_id: category_id, month: date)
      item.update!(amount_cents: (budgeted * 100).to_i)
      item
    end
  end
end
