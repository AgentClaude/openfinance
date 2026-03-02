# Checks all active budgets and sends email alerts for categories approaching/exceeding limits.
# Schedule: daily via Sidekiq-Cron.
class BudgetAlertJob < ApplicationJob
  queue_as :mailers

  THRESHOLD_PERCENTAGE = 90

  def perform
    User.joins(:notification_preferences)
        .where(notification_preferences: { notification_type: 'budget_exceeded', channel: 'email', enabled: true })
        .distinct
        .find_each do |user|
      next unless user.household

      alerts = check_budgets(user)
      next if alerts.empty?

      NotificationMailer.budget_alert(user, alerts).deliver_later
    rescue => e
      Rails.logger.error "BudgetAlertJob failed for user #{user.id}: #{e.message}"
    end
  end

  private

  def check_budgets(user)
    household = user.household
    month_date = Date.current.beginning_of_month
    month_start = month_date
    month_end = Date.current.end_of_month

    budget = household.budgets.find_by(is_active: true)
    return [] unless budget

    alerts = []

    budget.budget_items.where(month: month_date).includes(:category).each do |item|
      next if item.amount_cents.zero?

      spent = household.transactions
        .where(category: item.category, date: month_start..month_end)
        .where('amount_cents < 0')
        .sum('ABS(amount_cents)')
        .to_i

      pct = (spent.to_f / item.amount_cents * 100).round(0)
      next if pct < THRESHOLD_PERCENTAGE

      alerts << {
        category: item.category.name,
        spent: spent,
        budgeted: item.amount_cents,
        pct: pct
      }

      # Create in-app notification too
      NotificationService.budget_exceeded(
        user: user,
        category: item.category,
        spent_cents: spent,
        budget_cents: item.amount_cents
      )
    end

    alerts.sort_by { |a| -a[:pct] }
  end
end
