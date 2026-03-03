# Checks all household budgets and creates notifications when spending
# exceeds thresholds (80% warning, 100% exceeded).
# Designed to run daily via Sidekiq-cron or scheduler.
class BudgetAlertJob < ApplicationJob
  queue_as :notifications

  WARN_THRESHOLD = 0.8   # 80%
  EXCEED_THRESHOLD = 1.0 # 100%

  def perform
    Household.find_each do |household|
      check_budget_for(household)
    end
  end

  private

  def check_budget_for(household)
    month = Date.current.beginning_of_month
    budget = household.budgets.find_by(is_active: true)
    return unless budget

    items = budget.budget_items.where(month: month).includes(:category)
    return if items.empty?

    items.each do |item|
      next if item.amount_cents <= 0

      spent = calculate_spent(household, item.category, month)
      ratio = spent.to_f / item.amount_cents

      if ratio >= EXCEED_THRESHOLD
        create_alert(household, item, spent, :exceeded)
      elsif ratio >= WARN_THRESHOLD
        create_alert(household, item, spent, :warning)
      end
    end
  end

  def calculate_spent(household, category, month)
    household.transactions
      .where(category: category)
      .where(date: month..month.end_of_month)
      .where("amount_cents < 0") # expenses are negative
      .sum(:amount_cents)
      .abs
  end

  def create_alert(household, item, spent_cents, level)
    percentage = (spent_cents.to_f / item.amount_cents * 100).round(0)
    category_name = item.category.name

    # Deduplicate: don't re-alert for the same category+month+level
    alert_key = "budget_#{level}_#{item.category_id}_#{item.month}"

    household.users.each do |user|
      next unless notification_enabled?(user, "budget_exceeded")
      next if already_notified?(user, alert_key)

      title = level == :exceeded ?
        "Budget exceeded: #{category_name}" :
        "Budget warning: #{category_name}"

      body = "You've spent #{format_currency(spent_cents)} of your " \
             "#{format_currency(item.amount_cents)} budget for #{category_name} " \
             "(#{percentage}%)."

      Notification.create!(
        user: user,
        household: household,
        title: title,
        body: body,
        notification_type: "budget_alert",
        priority: level == :exceeded ? "high" : "normal",
        data: {
          alert_key: alert_key,
          category_id: item.category_id,
          category_name: category_name,
          amount_spent: spent_cents,
          budget_amount: item.amount_cents,
          percentage: percentage,
          level: level.to_s
        }
      )
    end
  end

  def already_notified?(user, alert_key)
    user.notifications
      .where(notification_type: "budget_alert")
      .where("data->>'alert_key' = ?", alert_key)
      .exists?
  end

  def notification_enabled?(user, type)
    pref = user.notification_preferences.find_by(notification_type: type, channel: "in_app")
    pref.nil? || pref.enabled # enabled by default if no preference set
  end

  def format_currency(cents)
    "$#{'%.2f' % (cents / 100.0)}"
  end
end
