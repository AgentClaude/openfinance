# Gathers weekly financial summary data for digest emails
class WeeklyDigestService
  attr_reader :user, :household, :week_start, :week_end

  def initialize(user, week_start: 1.week.ago.beginning_of_day, week_end: Time.current)
    @user = user
    @household = user.household
    @week_start = week_start
    @week_end = week_end
  end

  def call
    return nil unless household

    {
      user: user,
      period: { start: week_start, end: week_end },
      spending: spending_summary,
      income: income_summary,
      top_categories: top_spending_categories,
      top_merchants: top_spending_merchants,
      accounts: account_balances,
      net_worth: net_worth_summary,
      budget_alerts: budget_alerts,
      upcoming_bills: upcoming_bills,
      transaction_count: week_transactions.count,
      needs_review_count: household.transactions.needs_review.count
    }
  end

  private

  def week_transactions
    @week_transactions ||= household.transactions
      .where(date: week_start.to_date..week_end.to_date)
      .where(excluded: [false, nil])
  end

  def spending_summary
    expenses = week_transactions.expenses
    {
      total_cents: expenses.sum(:amount_cents).abs,
      count: expenses.count,
      avg_per_day: expenses.any? ? (expenses.sum(:amount_cents).abs / 7.0).round : 0
    }
  end

  def income_summary
    income = week_transactions.income
    {
      total_cents: income.sum(:amount_cents),
      count: income.count
    }
  end

  def top_spending_categories(limit: 5)
    week_transactions.expenses
      .joins(:category)
      .group('categories.name')
      .order(Arel.sql('ABS(SUM(amount_cents)) DESC'))
      .limit(limit)
      .pluck('categories.name', Arel.sql('ABS(SUM(amount_cents))'))
      .map { |name, cents| { name: name, amount_cents: cents } }
  end

  def top_spending_merchants(limit: 5)
    week_transactions.expenses
      .where.not(merchant_name: [nil, ''])
      .group(:merchant_name)
      .order(Arel.sql('ABS(SUM(amount_cents)) DESC'))
      .limit(limit)
      .pluck(:merchant_name, Arel.sql('ABS(SUM(amount_cents))'))
      .map { |name, cents| { name: name, amount_cents: cents } }
  end

  def account_balances
    household.accounts
      .where(is_hidden: [false, nil])
      .order(:account_type, :name)
      .map do |account|
        {
          name: account.name,
          type: account.account_type,
          balance_cents: account.current_balance_cents
        }
      end
  end

  def net_worth_summary
    accounts = household.accounts.where(is_hidden: [false, nil])
    asset_types = %w[checking savings investment retirement crypto real_estate other_asset cash manual]
    liability_types = %w[credit_card loan mortgage other_liability]

    assets = accounts.where(account_type: asset_types).sum(:current_balance_cents)
    liabilities = accounts.where(account_type: liability_types).sum(:current_balance_cents).abs

    { assets_cents: assets, liabilities_cents: liabilities, net_worth_cents: assets - liabilities }
  end

  def budget_alerts
    current_month = Date.current.beginning_of_month
    budget = household.budgets.find_by(is_active: true)
    return [] unless budget

    budget.budget_items.for_month(current_month).includes(:category).filter_map do |item|
      next if item.amount_cents.zero?

      spent = household.transactions.expenses
        .where(category: item.category, date: current_month..current_month.end_of_month)
        .sum(:amount_cents).abs

      pct = (spent.to_f / item.amount_cents * 100).round(0)
      next if pct < 80

      { category: item.category.name, budgeted_cents: item.amount_cents, spent_cents: spent, percentage: pct }
    end
  end

  def upcoming_bills
    household.recurring_items
      .where(is_active: true)
      .where('next_occurrence <= ?', 7.days.from_now)
      .order(:next_occurrence)
      .limit(5)
      .map do |item|
        {
          name: item.name,
          amount_cents: item.estimated_amount_cents&.abs || 0,
          due_date: item.next_occurrence
        }
      end
  rescue StandardError
    [] # RecurringItem may not have all columns
  end
end
