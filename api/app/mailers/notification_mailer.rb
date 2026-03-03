# Handles all notification-related emails:
# - Individual alert emails (budget exceeded, bill due, large transaction)
# - Weekly financial digest

class NotificationMailer < ApplicationMailer
  default from: 'OpenFinance <notifications@openfinance.com>'
  helper_method :app_url

  def app_url
    ENV.fetch('APP_URL', 'http://localhost:3002')
  end

  # Send an individual notification as an email
  def alert_email(notification)
    @notification = notification
    @user = notification.user
    @data = notification.data || {}

    subject = case notification.notification_type
              when 'budget_alert' then "⚠️ #{notification.title}"
              when 'large_transaction' then "💰 #{notification.title}"
              when 'transaction_alert' then "📋 #{notification.title}"
              when 'sync_error' then "🔴 #{notification.title}"
              when 'low_balance' then "⚠️ #{notification.title}"
              when 'goal_progress' then "🎯 #{notification.title}"
              else notification.title
              end

    mail(to: @user.email, subject: subject)
  end

  # Weekly financial digest email
  def weekly_digest(user)
    @user = user
    @household = user.household
    return unless @household

    # Date range: last 7 days
    @start_date = 7.days.ago.beginning_of_day
    @end_date = Time.current.end_of_day
    @month = Date.current.strftime('%Y-%m')

    gather_digest_data

    mail(
      to: @user.email,
      subject: "📊 Your Weekly Financial Digest — #{Date.current.strftime('%b %d, %Y')}"
    )
  end

  private

  def gather_digest_data
    transactions = Transaction.where(household: @household)

    # Spending this week
    week_txns = transactions.where(date: @start_date..@end_date)
    @total_spent = week_txns.where('amount_cents > 0').sum(:amount_cents) / 100.0
    @total_income = week_txns.where('amount_cents < 0').sum(:amount_cents).abs / 100.0
    @transaction_count = week_txns.count

    # Top spending categories this week
    @top_categories = week_txns
      .where('amount_cents > 0')
      .joins(:category)
      .group('categories.name')
      .sum(:amount_cents)
      .sort_by { |_, v| -v }
      .first(5)
      .map { |name, cents| { name: name, amount: cents / 100.0 } }

    # Largest transactions this week
    @largest_transactions = week_txns
      .where('amount_cents > 0')
      .order(amount_cents: :desc)
      .limit(5)
      .map { |t| { name: t.name || t.merchant_name || 'Unknown', amount: t.amount_cents / 100.0, date: t.date } }

    # Budget status for current month
    @budget_items = gather_budget_status

    # Upcoming bills (next 7 days)
    @upcoming_bills = RecurringItem
      .where(household: @household, is_active: true)
      .where('next_occurrence BETWEEN ? AND ?', Date.current, 7.days.from_now.to_date)
      .order(:next_occurrence)
      .limit(5)
      .map { |r| { name: r.name, amount: r.amount_cents.to_i / 100.0, due: r.next_occurrence } }

    # Account balances
    @accounts = Account.where(household: @household)
      .order(:account_type, :name)
      .map { |a| { name: a.name, type: a.account_type, balance: a.current_balance_cents.to_i / 100.0 } }

    # Net worth
    @net_worth = @accounts.sum { |a| a[:balance] }

    # Unread notification count
    @unread_count = Notification.where(user: @user, is_read: false).count
  end

  def gather_budget_status
    budget = Budget.find_by(household: @household, is_active: true)
    return [] unless budget

    BudgetItem.where(budget: budget, month: @month)
      .joins(:category)
      .map do |item|
        spent = Transaction.where(household: @household, category: item.category)
          .where("date >= ? AND date <= ?", Date.parse("#{@month}-01"), Date.parse("#{@month}-01").end_of_month)
          .where('amount_cents > 0')
          .sum(:amount_cents)

        pct = item.amount_cents > 0 ? (spent.to_f / item.amount_cents * 100).round(0) : 0
        next if pct < 80 # Only show categories at 80%+ of budget

        { name: item.category.name, budgeted: item.amount_cents / 100.0, spent: spent / 100.0, percent: pct }
      end.compact
  end
end
