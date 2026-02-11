# Service for creating a default budget for a household
# Sets up initial category-based budget with zero amounts

class Budgets::CreateDefaultBudgetService < ApplicationService
  attr_accessor :household, :current_user

  validates :household, presence: true

  def call
    return validation_failure(self) unless valid?

    authorize!(current_user, :manage_household, household) if current_user

    ActiveRecord::Base.transaction do
      create_budget!
      create_budget_items!
    end

    success(budget: @budget, budget_items_count: @budget.budget_items.count)
  rescue StandardError => e
    Rails.logger.error "Failed to create default budget: #{e.message}"
    failure(['Failed to create default budget'])
  end

  private

  def initialize(household:, current_user: nil)
    @household = household
    @current_user = current_user
  end

  def create_budget!
    @budget = household.budgets.create!(
      name: 'Monthly Budget',
      budget_type: 'category',
      is_active: true,
      start_day: 1,
      rollover_enabled: false
    )
  end

  def create_budget_items!
    current_month = Date.current.beginning_of_month

    household.categories.expense_categories.find_each do |category|
      @budget.budget_items.create!(
        category: category,
        month: current_month,
        amount: 0,
        rollover_amount: 0
      )
    end
  end
end