module Mutations
  class UpdateBudgetSettings < BaseMutation
    argument :budget_mode, String, required: false
    argument :spending_target, Float, required: false

    field :budget_mode, String, null: false
    field :spending_target, Float, null: false
    field :errors, [String], null: false

    def resolve(budget_mode: nil, spending_target: nil)
      hh = require_auth!

      result = Budgets::UpdateSettingsService.call(
        household: hh,
        budget_mode: budget_mode,
        spending_target: spending_target
      )

      if result.success?
        budget = result.data[:budget]
        authorize(budget, :update?)
        log_activity(action: 'budget_settings_updated', resource: budget, metadata: { budget_mode: budget.budget_mode, spending_target_cents: budget.spending_target_cents }.transform_keys(&:to_s))

        {
          budget_mode: budget.budget_mode,
          spending_target: budget.spending_target_cents / 100.0,
          errors: []
        }
      else
        { budget_mode: 'per_category', spending_target: 0.0, errors: result.errors }
      end
    end
  end
end
