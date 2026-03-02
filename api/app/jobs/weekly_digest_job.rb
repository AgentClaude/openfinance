# Sends weekly financial digest emails to all users who have email digest enabled
class WeeklyDigestJob < ApplicationJob
  queue_as :default

  def perform
    User.includes(:household, notification_preferences: []).find_each do |user|
      next unless email_digest_enabled?(user)
      next unless user.household.present?

      summary = build_summary(user)
      next if summary[:total_transactions].zero? && summary[:total_spending].zero?

      WeeklyDigestMailer.digest(user, summary).deliver_later
      Rails.logger.info "Weekly digest queued for user #{user.id} (#{user.email})"
    rescue => e
      Rails.logger.error "Failed to build weekly digest for user #{user.id}: #{e.message}"
    end
  end

  private

  def email_digest_enabled?(user)
    pref = user.notification_preferences.find_by(notification_type: 'weekly_digest', channel: 'email')
    pref.nil? || pref.enabled? # Default to enabled if no preference set
  end

  def build_summary(user)
    household = user.household
    week_start = 1.week.ago.beginning_of_day
    week_end = Time.current

    transactions = Transaction.joins(:account)
                              .where(accounts: { household_id: household.id })
                              .where(date: week_start..week_end)

    expenses = transactions.where('amount_cents < 0')
    income = transactions.where('amount_cents > 0')

    # Top spending categories
    top_categories = expenses.joins(:category)
                             .group('categories.name')
                             .order('SUM(amount_cents) ASC')
                             .limit(5)
                             .pluck('categories.name', Arel.sql('SUM(amount_cents)'))
                             .map { |name, cents| { name: name, amount: cents.abs / 100.0 } }

    # Account balances
    accounts = Account.where(household_id: household.id)
                      .order(:account_type, :name)
                      .map { |a| { name: a.name, type: a.account_type, balance: a.current_balance_cents / 100.0 } }

    net_worth = accounts.sum { |a| a[:balance] }

    # Budget status (current month)
    month_start = Date.current.beginning_of_month
    budget = Budget.find_by(household_id: household.id, is_active: true)
    budget_items = budget ? budget.budget_items.where(month: month_start).includes(:category) : []
    budget_summary = budget_items.map do |item|
      spent = expenses.where(category_id: item.category_id)
                      .where(date: Date.current.beginning_of_month..Date.current)
                      .sum(:amount_cents).abs / 100.0
      budgeted = item.amount_cents / 100.0
      { category: item.category&.name || 'Unknown', budgeted: budgeted, spent: spent, pct: budgeted > 0 ? (spent / budgeted * 100).round(0) : 0 }
    end.select { |b| b[:pct] > 50 }.sort_by { |b| -b[:pct] }.first(5)

    # Upcoming bills (next 7 days)
    upcoming_bills = RecurringItem.where(household_id: household.id, is_active: true)
                                  .where('next_occurrence BETWEEN ? AND ?', Date.current, 7.days.from_now)
                                  .order(:next_occurrence)
                                  .limit(5)
                                  .map { |r| { name: r.name, amount: r.amount_cents.abs / 100.0, due: r.next_occurrence } }

    {
      week_start: week_start,
      week_end: week_end,
      total_transactions: transactions.count,
      total_spending: expenses.sum(:amount_cents).abs / 100.0,
      total_income: income.sum(:amount_cents) / 100.0,
      net_change: (income.sum(:amount_cents) + expenses.sum(:amount_cents)) / 100.0,
      top_categories: top_categories,
      accounts: accounts,
      net_worth: net_worth,
      budget_alerts: budget_summary,
      upcoming_bills: upcoming_bills
    }
  end
end
