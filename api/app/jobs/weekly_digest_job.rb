# Sends weekly financial digest emails to all users who have it enabled
# Schedule: Run every Monday morning via Sidekiq-Cron or similar

class WeeklyDigestJob < ApplicationJob
  queue_as :notifications

  def perform
    Rails.logger.info "[WeeklyDigest] Starting weekly digest generation"

    users_with_digest_enabled.find_each do |user|
      generate_and_send_digest(user)
    rescue StandardError => e
      Rails.logger.error "[WeeklyDigest] Failed for user #{user.id}: #{e.message}"
    end

    Rails.logger.info "[WeeklyDigest] Complete"
  end

  private

  def users_with_digest_enabled
    User.joins(:notification_preferences)
        .where(notification_preferences: {
          notification_type: 'weekly_digest',
          channel: 'email',
          enabled: true
        })
        .distinct
  end

  def generate_and_send_digest(user)
    household = user.household
    return unless household

    week_end = Date.current
    week_start = week_end - 7.days

    transactions = household.transactions
                            .where(date: week_start..week_end)
                            .includes(:category, :account)

    expenses = transactions.where('amount_cents < 0')
    income = transactions.where('amount_cents > 0')

    total_spent = expenses.sum(:amount_cents).abs / 100.0
    total_income = income.sum(:amount_cents) / 100.0

    # Top spending categories
    top_categories = expenses
      .group_by(&:category)
      .map { |cat, txns| { name: cat&.name || 'Uncategorized', amount: txns.sum { |t| t.amount_cents.abs } / 100.0 } }
      .sort_by { |c| -c[:amount] }
      .first(5)

    # Budget alerts (categories over 80%)
    budget_alerts = compute_budget_alerts(household)

    # Upcoming bills
    upcoming_bills = household.recurring_items
                              .active
                              .where('next_occurrence BETWEEN ? AND ?', Date.current, 7.days.from_now)
                              .order(:next_occurrence)
                              .map { |item| { name: item.name, amount: item.amount, due_date: item.next_occurrence } }

    # Net worth
    net_worth = household.accounts.sum(:balance_cents) / 100.0

    digest_data = {
      week_start: week_start,
      week_end: week_end,
      total_spent: total_spent,
      total_income: total_income,
      net: total_income - total_spent,
      top_categories: top_categories,
      budget_alerts: budget_alerts,
      upcoming_bills: upcoming_bills,
      account_count: household.accounts.count,
      net_worth: net_worth
    }

    NotificationMailer.weekly_digest(user, digest_data).deliver_later
    Rails.logger.info "[WeeklyDigest] Sent digest to user #{user.id}"
  end

  def compute_budget_alerts(household)
    budget = household.budgets.active.first
    return [] unless budget

    current_month = Date.current.beginning_of_month
    items = budget.budget_items.for_month(current_month).includes(:category)

    items.filter_map do |item|
      next if item.amount_cents.zero?

      spent = household.transactions
                       .where(category: item.category)
                       .where(date: current_month..current_month.end_of_month)
                       .where('amount_cents < 0')
                       .sum(:amount_cents).abs

      percentage = (spent.to_f / item.amount_cents * 100)
      next if percentage < 80

      {
        category: item.category.name,
        spent: spent / 100.0,
        budgeted: item.amount_cents / 100.0,
        percentage: percentage
      }
    end
  end
end
