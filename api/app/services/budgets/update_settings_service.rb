class Budgets::UpdateSettingsService < ApplicationService
  attr_accessor :household, :budget_mode, :spending_target

  validates :household, presence: true

  def call
    return validation_failure(self) unless valid?

    budget = household.budgets.first || Budget.create!(
      household: household,
      name: "Monthly Budget",
      start_date: Date.current.beginning_of_month,
      period_type: "monthly"
    )

    attrs = {}
    attrs[:budget_mode] = budget_mode if budget_mode.present?
    attrs[:spending_target_cents] = spending_target.to_d.*(100).round if spending_target

    budget.update!(attrs) if attrs.any?

    success(budget: budget)
  rescue ActiveRecord::RecordInvalid => e
    failure(e.record.errors.full_messages)
  end

  private

  def initialize(household:, budget_mode: nil, spending_target: nil)
    @household = household
    @budget_mode = budget_mode
    @spending_target = spending_target
  end
end
