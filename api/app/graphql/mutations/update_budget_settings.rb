module Mutations
  class UpdateBudgetSettings < BaseMutation
    argument :budget_mode, String, required: false
    argument :spending_target, Float, required: false

    field :budget_mode, String, null: false
    field :spending_target, Float, null: false
    field :errors, [String], null: false

    def resolve(budget_mode: nil, spending_target: nil)
      hh = require_auth!
      budget = hh.budgets.first || Budget.create!(
        household: hh,
        name: "Monthly Budget",
        start_date: Date.current.beginning_of_month,
        period_type: 'monthly'
      )
      authorize(budget, :update?)

      attrs = {}
      attrs[:budget_mode] = budget_mode if budget_mode.present?
      attrs[:spending_target_cents] = (spending_target * 100).to_i if spending_target

      if attrs.any?
        budget.update!(attrs)
        log_activity(action: 'budget_settings_updated', resource: budget, metadata: attrs.transform_keys(&:to_s))
      end

      {
        budget_mode: budget.budget_mode,
        spending_target: budget.spending_target_cents / 100.0,
        errors: []
      }
    rescue ActiveRecord::RecordInvalid => e
      { budget_mode: budget&.budget_mode || 'per_category', spending_target: 0.0, errors: e.record.errors.full_messages }
    end
  end
end
