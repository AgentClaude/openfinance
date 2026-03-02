# Generates weekly financial digest data for a household
# Used by WeeklyDigestMailer to build the email

class Reports::WeeklyDigestService < ApplicationService
  attr_accessor :household, :end_date

  validates :household, presence: true

  def call
    return validation_failure(self) unless valid?

    @end_date ||= Date.current
    @start_date = @end_date - 7.days

    success(digest: build_digest)
  end

  private

  def build_digest
    {
      period: { start_date: @start_date, end_date: @end_date },
      spending_summary: spending_summary,
      income_summary: income_summary,
      net_cash_flow: net_cash_flow,
      top_categories: top_categories,
      top_merchants: top_merchants,
      account_balances: account_balances,
      net_worth: calculate_net_worth,
      budget_alerts: budget_alerts,
      upcoming_bills: upcoming_bills,
      transaction_count: week_transactions.count
    }
  end

  def week_transactions
    @week_transactions ||= household.transactions
      .where(date: @start_date..@end_date)
      .where(excluded: [false, nil])
  end

  def spending_transactions
    @spending_transactions ||= week_transactions.where('amount_cents < 0')
  end

  def income_transactions
    @income_transactions ||= week_transactions.where('amount_cents > 0')
  end

  def spending_summary
    total = spending_transactions.sum(:amount_cents).abs
    prev_start = @start_date - 7.days
    prev_total = household.transactions
      .where(date: prev_start...@start_date)
      .where('amount_cents < 0')
      .where(excluded: [false, nil])
      .sum(:amount_cents).abs

    change_pct = prev_total > 0 ? ((total - prev_total).to_f / prev_total * 100).round(1) : nil

    { total_cents: total, previous_week_cents: prev_total, change_percentage: change_pct }
  end

  def income_summary
    { total_cents: income_transactions.sum(:amount_cents) }
  end

  def net_cash_flow
    income_transactions.sum(:amount_cents) + spending_transactions.sum(:amount_cents)
  end

  def top_categories
    spending_transactions
      .joins(:category)
      .group('categories.name')
      .sum(:amount_cents)
      .sort_by { |_, v| v }
      .first(5)
      .map { |name, cents| { name: name, amount_cents: cents.abs } }
  end

  def top_merchants
    spending_transactions
      .where.not(merchant_name: [nil, ''])
      .group(:merchant_name)
      .sum(:amount_cents)
      .sort_by { |_, v| v }
      .first(5)
      .map { |name, cents| { name: name, amount_cents: cents.abs } }
  end

  def account_balances
    household.accounts.where(is_hidden: false).order(:account_type, :name).map do |account|
      { name: account.name, type: account.account_type, balance_cents: account.current_balance_cents }
    end
  end

  def budget_alerts
    current_month = @end_date.strftime('%Y-%m')
    budget = household.budgets.find_by(is_active: true)
    return [] unless budget

    budget.budget_items.includes(:category).where(month: current_month).filter_map do |item|
      spent = household.transactions
        .where(category: item.category)
        .where('date >= ? AND date <= ?', @end_date.beginning_of_month, @end_date)
        .where('amount_cents < 0')
        .sum(:amount_cents).abs

      pct = item.amount_cents > 0 ? (spent.to_f / item.amount_cents * 100).round(1) : 0
      next unless pct >= 80

      { category: item.category.name, budgeted_cents: item.amount_cents, spent_cents: spent, percentage: pct }
    end
  end

  def calculate_net_worth
    assets = household.accounts.where(account_type: %w[checking savings investment]).sum(:current_balance_cents)
    liabilities = household.accounts.where(account_type: %w[credit_card loan]).sum(:current_balance_cents).abs
    (assets - liabilities) / 100.0
  end

  def upcoming_bills
    household.recurring_items
      .where(is_active: true)
      .where('next_occurrence BETWEEN ? AND ?', @end_date, @end_date + 7.days)
      .order(:next_occurrence)
      .limit(10)
      .map { |item| { name: item.name, amount_cents: item.amount_cents, due_date: item.next_occurrence } }
  end
end
