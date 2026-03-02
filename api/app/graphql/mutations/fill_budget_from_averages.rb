module Mutations
  class FillBudgetFromAverages < BaseMutation
    argument :month, String, required: true

    field :budget_items, [Types::BudgetItemType], null: false

    def resolve(month:)
      hh = require_auth!

      target_date = Date.parse("#{month}-01").beginning_of_month rescue nil
      raise GraphQL::ExecutionError, "Invalid month format" unless target_date

      budget = hh.budgets.first || Budget.create!(
        hh: hh,
        name: "Monthly Budget",
        period_type: "monthly",
        start_date: target_date
      )

      # Calculate 3-month average spending per category
      three_months_ago = target_date - 3.months
      end_of_last_month = target_date - 1.day

      spending = hh.transactions
        .where(date: three_months_ago..end_of_last_month)
        .where("amount_cents < 0")
        .where.not(category_id: nil)
        .group(:category_id)
        .sum(:amount_cents)

      created = []
      spending.each do |category_id, total_cents|
        avg_cents = (total_cents.abs / 3.0).round
        next if avg_cents == 0

        item = BudgetItem.find_or_initialize_by(
          budget: budget,
          category_id: category_id,
          month: target_date
        )
        item.update!(amount_cents: avg_cents, currency: 'USD')
        created << item
      end

      { budget_items: created }
    end
  end
end
