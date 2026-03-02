# Checks all users' budgets and creates alerts when spending exceeds thresholds
# Schedule: Run daily via Sidekiq-Cron

class BudgetAlertJob < ApplicationJob
  queue_as :notifications

  ALERT_THRESHOLDS = [80, 100].freeze # Alert at 80% and 100%

  def perform
    Rails.logger.info "[BudgetAlert] Checking budgets for alerts"

    Household.joins(:budgets).distinct.find_each do |household|
      check_household_budgets(household)
    rescue StandardError => e
      Rails.logger.error "[BudgetAlert] Failed for household #{household.id}: #{e.message}"
    end

    Rails.logger.info "[BudgetAlert] Complete"
  end

  private

  def check_household_budgets(household)
    budget = household.budgets.active.first
    return unless budget

    current_month = Date.current.beginning_of_month
    items = budget.budget_items.for_month(current_month).includes(:category)

    items.each do |item|
      next if item.amount_cents.zero?

      spent = household.transactions
                       .where(category: item.category)
                       .where(date: current_month..current_month.end_of_month)
                       .where('amount_cents < 0')
                       .sum(:amount_cents).abs

      percentage = (spent.to_f / item.amount_cents * 100).round(1)

      ALERT_THRESHOLDS.each do |threshold|
        next if percentage < threshold
        next if already_alerted?(household, item.category, current_month, threshold)

        create_budget_alert(household, item, spent, percentage, threshold)
      end
    end
  end

  def already_alerted?(household, category, month, threshold)
    # Prevent duplicate alerts for same category+month+threshold
    Notification.where(
      household: household,
      notification_type: 'budget_alert'
    ).where(
      "data->>'category_id' = ? AND data->>'month' = ? AND data->>'threshold' = ?",
      category.id.to_s, month.to_s, threshold.to_s
    ).exists?
  end

  def create_budget_alert(household, budget_item, spent_cents, percentage, threshold)
    household.users.each do |user|
      Notification.create!(
        user: user,
        household: household,
        title: "Budget Alert: #{budget_item.category.name}",
        body: "You've used #{percentage.round(0)}% of your #{budget_item.category.name} budget.",
        notification_type: 'budget_alert',
        priority: percentage >= 100 ? 'high' : 'normal',
        data: {
          category_id: budget_item.category.id,
          category_name: budget_item.category.name,
          amount_spent: spent_cents,
          budget_amount: budget_item.amount_cents,
          percentage: percentage,
          month: budget_item.month.to_s,
          threshold: threshold
        }
      )
    end
  end
end
