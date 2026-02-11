class CreateDefaultBudgetJob < ApplicationJob
  queue_as :default

  def perform(household)
    return if household.budgets.any?

    # Create a default monthly budget
    budget = household.budgets.create!(
      name: 'Monthly Budget',
      start_date: Date.current.beginning_of_month,
      period_type: 'monthly',
      is_active: true
    )

    # Default budget amounts for common categories
    default_amounts = {
      'Groceries' => 400.00,
      'Dining Out' => 150.00,
      'Gas & Fuel' => 120.00,
      'Transportation' => 100.00,
      'Entertainment' => 100.00,
      'Shopping' => 200.00,
      'Utilities' => 200.00,
      'Healthcare' => 100.00,
      'Insurance' => 250.00,
      'Personal Care' => 75.00,
      'Home' => 150.00,
      'Travel' => 100.00
    }

    # Create budget items for categories that exist
    household.categories.where(name: default_amounts.keys).each do |category|
      amount = default_amounts[category.name]
      next unless amount

      budget.budget_items.create!(
        category: category,
        month: Date.current.beginning_of_month,
        amount_cents: (amount * 100).to_i,
        currency: household.currency || 'USD'
      )
    end

    Rails.logger.info "Created default budget with #{budget.budget_items.count} items for household #{household.id}"
  end
end