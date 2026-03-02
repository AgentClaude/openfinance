# Sends weekly financial digest emails to users who have the preference enabled.
# Schedule: every Monday morning via Sidekiq-Cron or similar.
class WeeklyDigestJob < ApplicationJob
  queue_as :mailers

  def perform
    User.joins(:notification_preferences)
        .where(notification_preferences: { notification_type: 'weekly_digest', channel: 'email', enabled: true })
        .distinct
        .find_each do |user|
      next unless user.household

      digest_data = compile_digest(user)
      NotificationMailer.weekly_digest(user, digest_data).deliver_later
    rescue => e
      Rails.logger.error "WeeklyDigestJob failed for user #{user.id}: #{e.message}"
    end
  end

  private

  def compile_digest(user)
    household = user.household
    week_end = Date.current
    week_start = week_end - 7.days

    transactions = household.transactions.where(date: week_start..week_end)
    expenses = transactions.where('amount_cents < 0')
    income = transactions.where('amount_cents > 0')

    # Top spending categories
    top_categories = expenses
      .joins(:category)
      .group('categories.name')
      .order(Arel.sql('SUM(ABS(amount_cents)) DESC'))
      .limit(5)
      .pluck('categories.name', Arel.sql('SUM(ABS(amount_cents))'))
      .map { |name, amount| { name: name, amount: amount.to_i } }

    # Budget status for current month
    month_date = Date.current.beginning_of_month
    budget = household.budgets.find_by(is_active: true)
    budget_status = []

    if budget
      budget.budget_items.where(month: month_date).includes(:category).each do |item|
        next if item.amount_cents.zero?
        
        month_start = Date.current.beginning_of_month
        month_end = Date.current.end_of_month
        spent = household.transactions
          .where(category: item.category, date: month_start..month_end)
          .where('amount_cents < 0')
          .sum('ABS(amount_cents)')
          .to_i

        pct = (spent.to_f / item.amount_cents * 100).round(0)
        next if pct < 50 # only show categories with significant spending

        budget_status << {
          category: item.category.name,
          spent: spent,
          budgeted: item.amount_cents,
          pct: pct
        }
      end
      budget_status.sort_by! { |b| -b[:pct] }
      budget_status = budget_status.first(5)
    end

    # Upcoming bills
    upcoming_bills = household.recurring_items
      .where(is_active: true)
      .where('next_occurrence BETWEEN ? AND ?', Date.current, Date.current + 7.days)
      .order(:next_occurrence)
      .limit(5)
      .map { |item| { name: item.name, amount: item.amount_cents.abs, due_date: item.next_occurrence } }

    # Net worth
    net_worth = household.accounts.where(is_active: true).sum(:current_balance_cents)

    {
      week_start: week_start,
      week_end: week_end,
      total_spent: expenses.sum('ABS(amount_cents)').to_i,
      total_income: income.sum(:amount_cents).to_i,
      net_worth: net_worth,
      transaction_count: transactions.count,
      top_categories: top_categories,
      budget_status: budget_status,
      upcoming_bills: upcoming_bills
    }
  end
end
