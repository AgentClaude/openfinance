# frozen_string_literal: true

# Computes weekly financial digest data for a user's household
class WeeklyDigestService
  attr_reader :user, :household, :week_start, :week_end

  def initialize(user, week_start: nil)
    @user = user
    @household = user.household
    @week_start = week_start || 1.week.ago.beginning_of_day
    @week_end = @week_start + 7.days
  end

  def call
    return nil unless household

    {
      user: user,
      household: household,
      week_start: week_start,
      week_end: week_end,
      summary: build_summary,
      top_expenses: top_expenses,
      budget_status: budget_status,
      upcoming_bills: upcoming_bills,
      accounts_overview: accounts_overview,
      net_worth: net_worth_data,
      alerts: build_alerts
    }
  end

  private

  def transactions_this_week
    @transactions_this_week ||= household.transactions
      .where(date: week_start..week_end)
      .includes(:category, :account)
  end

  def build_summary
    income = transactions_this_week.select { |t| t.amount_cents.positive? }.sum(&:amount_cents) / 100.0
    expenses = transactions_this_week.select { |t| t.amount_cents.negative? }.sum(&:amount_cents).abs / 100.0

    {
      total_income: income,
      total_expenses: expenses,
      net: income - expenses,
      transaction_count: transactions_this_week.size
    }
  end

  def top_expenses
    transactions_this_week
      .select { |t| t.amount_cents.negative? }
      .group_by { |t| t.category&.name || 'Uncategorized' }
      .transform_values { |txns| txns.sum { |t| t.amount_cents.abs } / 100.0 }
      .sort_by { |_, amount| -amount }
      .first(5)
      .map { |name, amount| { category: name, amount: amount } }
  end

  def budget_status
    budget = household.current_budget
    return [] unless budget

    month = Date.current.beginning_of_month
    items = budget.budget_items.where(month: month).includes(:category)

    items.filter_map do |item|
      next unless item.category

      spent_cents = household.transactions
        .where(category: item.category, date: month..month.end_of_month)
        .where('amount_cents < 0')
        .sum(:amount_cents).abs

      budgeted_cents = item.respond_to?(:amount_cents) ? item.amount_cents : (item.amount.to_f * 100).to_i
      spent = spent_cents / 100.0
      budgeted = budgeted_cents / 100.0
      pct = budgeted > 0 ? (spent / budgeted * 100).round(0) : 0

      next if pct < 50 # Only show categories at 50%+ budget usage

      {
        category: item.category.name,
        budgeted: budgeted,
        spent: spent,
        remaining: budgeted - spent,
        percentage: pct
      }
    end.sort_by { |b| -b[:percentage] }.first(5)
  end

  def upcoming_bills
    household.recurring_items
      .where(is_active: true)
      .where('next_occurrence BETWEEN ? AND ?', Date.current, 2.weeks.from_now)
      .order(:next_occurrence)
      .limit(5)
      .map do |item|
        {
          name: item.name,
          amount: item.amount.abs,
          due_date: item.next_occurrence,
          days_until: (item.next_occurrence - Date.current).to_i
        }
      end
  rescue StandardError
    [] # RecurringItem may not have next_occurrence column
  end

  def accounts_overview
    household.accounts.order(:account_type, :name).map do |account|
      {
        name: account.name,
        type: account.account_type,
        balance: account.current_balance_cents / 100.0
      }
    end
  end

  def net_worth_data
    assets = household.accounts.select { |a| !a.liability? }.sum(&:current_balance).to_f
    liabilities = household.accounts.select { |a| a.liability? }.sum(&:current_balance).to_f.abs
    {
      current: assets - liabilities,
      assets: assets,
      liabilities: liabilities
    }
  rescue StandardError
    { current: 0, assets: 0, liabilities: 0 }
  end

  def build_alerts
    alerts = []

    # Over-budget categories
    budget_status.each do |b|
      if b[:percentage] >= 100
        alerts << { type: :over_budget, message: "#{b[:category]} is #{b[:percentage]}% of budget" }
      elsif b[:percentage] >= 90
        alerts << { type: :near_budget, message: "#{b[:category]} is at #{b[:percentage]}% of budget" }
      end
    end

    # Large transactions this week (> $500)
    transactions_this_week.select { |t| t.amount_cents.abs > 50000 }.each do |t|
      alerts << {
        type: :large_transaction,
        message: "#{t.merchant_name || t.name}: $#{'%.2f' % (t.amount_cents.abs / 100.0)} on #{t.date.strftime('%b %d')}"
      }
    end

    alerts.first(5)
  end
end
