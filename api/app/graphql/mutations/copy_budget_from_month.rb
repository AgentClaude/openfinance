module Mutations
  class CopyBudgetFromMonth < BaseMutation
    argument :source_month, String, required: true
    argument :target_month, String, required: true

    field :budget_items, [Types::BudgetItemType], null: false

    def resolve(source_month:, target_month:)
      hh = require_auth!

      source_date = Date.parse("#{source_month}-01").beginning_of_month rescue nil
      target_date = Date.parse("#{target_month}-01").beginning_of_month rescue nil
      raise GraphQL::ExecutionError, "Invalid month format" unless source_date && target_date

      budget = hh.budgets.first
      raise GraphQL::ExecutionError, "No budget found" unless budget

      source_items = BudgetItem.where(budget: budget, month: source_date)
      raise GraphQL::ExecutionError, "No budget items found for #{source_month}" if source_items.empty?

      copied = []
      source_items.each do |item|
        target_item = BudgetItem.find_or_initialize_by(
          budget: budget,
          category_id: item.category_id,
          month: target_date
        )
        target_item.update!(
          amount_cents: item.amount_cents,
          currency: item.currency
        )
        copied << target_item
      end

      { budget_items: copied }
    end
  end
end
