module Mutations
  class UpdateBudgetItem < BaseMutation
    argument :category_id, ID, required: true
    argument :month, String, required: true
    argument :budgeted, Float, required: true

    type Types::BudgetItemType

    def resolve(category_id:, month:, budgeted:)
      hh = require_auth!
      date = Date.parse("#{month}-01").beginning_of_month rescue Date.current.beginning_of_month
      budget = hh.budgets.first || Budget.create!(household: hh, name: "Monthly Budget", start_date: date, period_type: 'monthly')
      item = BudgetItem.find_or_initialize_by(budget: budget, category_id: category_id, month: date)
      authorize(item, item.new_record? ? :create? : :update?)
      item.update!(amount_cents: (budgeted * 100).to_i)
      cat = Category.find_by(id: category_id)
      log_activity(action: 'budget_set', resource: item, metadata: {
        category_name: cat&.name,
        amount: budgeted,
        month: month
      })
      item
    end
  end
end
