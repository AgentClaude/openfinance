# Checks all active budgets and creates alerts for exceeded categories
class BudgetAlertJob < ApplicationJob
  queue_as :default

  ALERT_THRESHOLDS = [80, 100].freeze # Alert at 80% and 100%

  def perform
    Household.find_each do |household|
      budget = Budget.find_by(household_id: household.id, is_active: true)
      next unless budget

      month_start = Date.current.beginning_of_month
      items = budget.budget_items.where(month: month_start).includes(:category)

      items.each do |item|
        next if item.amount_cents.zero?

        spent = Transaction.joins(:account)
                           .where(accounts: { household_id: household.id })
                           .where(category_id: item.category_id)
                           .where(date: Date.current.beginning_of_month..Date.current)
                           .where('amount_cents < 0')
                           .sum(:amount_cents).abs

        pct = (spent.to_f / item.amount_cents * 100).round(0)

        ALERT_THRESHOLDS.each do |threshold|
          next if pct < threshold
          next if alert_already_sent?(household, item, threshold)

          create_budget_alerts(household, item, spent, pct, threshold)
        end
      end
    rescue => e
      Rails.logger.error "Budget alert check failed for household #{household.id}: #{e.message}"
    end
  end

  private

  def alert_already_sent?(household, item, threshold)
    month_start = Date.current.beginning_of_month
    Notification.where(household: household, notification_type: 'budget_alert')
                .where('created_at >= ?', month_start)
                .where("data->>'category_id' = ? AND data->>'threshold' = ?", item.category_id.to_s, threshold.to_s)
                .exists?
  end

  def create_budget_alerts(household, item, spent, pct, threshold)
    category_name = item.category&.name || 'Unknown'
    budgeted = item.amount_cents / 100.0
    spent_dollars = spent / 100.0

    title = if threshold >= 100
              "🔴 Over budget: #{category_name}"
            else
              "⚠️ Budget warning: #{category_name}"
            end

    body = "$#{'%.2f' % spent_dollars} of $#{'%.2f' % budgeted} spent (#{pct}%)"

    household.users.each do |user|
      Notification.create!(
        user: user,
        household: household,
        title: title,
        body: body,
        notification_type: 'budget_alert',
        priority: threshold >= 100 ? 'high' : 'normal',
        data: {
          category_id: item.category_id,
          category_name: category_name,
          amount_spent: spent,
          budget_amount: item.amount_cents,
          percentage: pct,
          threshold: threshold
        }
      )

      # Send email if enabled
      if budget_email_enabled?(user)
        BudgetAlertMailer.budget_exceeded(user, category_name, spent_dollars, budgeted, pct).deliver_later
      end
    end
  end

  def budget_email_enabled?(user)
    pref = user.notification_preferences.find_by(notification_type: 'budget_exceeded', channel: 'email')
    pref.nil? || pref.enabled?
  end
end
