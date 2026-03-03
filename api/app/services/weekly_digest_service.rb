# Generates weekly financial digest data for a user's household
class WeeklyDigestService
  attr_reader :user, :household, :week_start, :week_end

  def initialize(user, week_start: nil)
    @user = user
    @household = user.household
    @week_start = week_start || 1.week.ago.beginning_of_day.to_date
    @week_end = @week_start + 6.days
  end

  def generate
    return nil unless household

    {
      user: user,
      period: { start: week_start, end: week_end },
      spending_summary: spending_summary,
      income_summary: income_summary,
      top_categories: top_categories,
      top_merchants: top_merchants,
      large_transactions: large_transactions,
      budget_status: budget_status,
      account_balances: account_balances,
      net_worth: net_worth,
      upcoming_bills: upcoming_bills,
      needs_review_count: needs_review_count
    }
  end

  private

  def week_transactions
    @week_transactions ||= household.transactions
      .where(date: week_start..week_end)
      .where(excluded: false, is_transfer: false)
      .includes(:category, :account)
  end

  def spending_summary
    expenses = week_transactions.expenses
    total = expenses.sum(:amount_cents).abs
    count = expenses.count

    # Compare to previous week
    prev_start = week_start - 7.days
    prev_end = week_end - 7.days
    prev_total = household.transactions
      .where(date: prev_start..prev_end, excluded: false, is_transfer: false)
      .expenses.sum(:amount_cents).abs

    change_pct = prev_total.zero? ? 0 : ((total - prev_total).to_f / prev_total * 100).round(1)

    { total_cents: total, count: count, prev_week_cents: prev_total, change_pct: change_pct }
  end

  def income_summary
    income = week_transactions.income
    total = income.sum(:amount_cents)
    count = income.count
    { total_cents: total, count: count }
  end

  def top_categories
    week_transactions.expenses
      .group(:category_id)
      .sum(:amount_cents)
      .map { |cat_id, amount| { category: Category.find_by(id: cat_id), amount_cents: amount.abs } }
      .select { |c| c[:category].present? }
      .sort_by { |c| -c[:amount_cents] }
      .first(5)
  end

  def top_merchants
    week_transactions.expenses
      .where.not(merchant_name: [nil, ''])
      .group(:merchant_name)
      .sum(:amount_cents)
      .map { |name, amount| { name: name, amount_cents: amount.abs } }
      .sort_by { |m| -m[:amount_cents] }
      .first(5)
  end

  def large_transactions
    threshold = 10_000 # $100 in cents
    week_transactions.expenses
      .where('ABS(amount_cents) >= ?', threshold)
      .order(Arel.sql('ABS(amount_cents) DESC'))
      .limit(5)
  end

  def budget_status
    month = week_end.beginning_of_month
    budget = household.budgets.find_by(is_active: true)
    return nil unless budget

    items = budget.budget_items.where(month: month).includes(:category)
    return nil if items.empty?

    month_transactions = household.transactions
      .where(date: month..month.end_of_month, excluded: false, is_transfer: false)
      .expenses

    items.map do |item|
      spent = month_transactions.where(category_id: item.category_id).sum(:amount_cents).abs
      {
        category_name: item.category&.name || 'Unknown',
        budgeted_cents: item.amount_cents,
        spent_cents: spent,
        pct: item.amount_cents.zero? ? 0 : (spent.to_f / item.amount_cents * 100).round(0)
      }
    end
      .select { |b| b[:budgeted_cents] > 0 }
      .sort_by { |b| -b[:pct] }
      .first(5)
  end

  def account_balances
    household.accounts.where(is_hidden: false).order(:display_order).map do |account|
      { name: account.name, type: account.account_type, balance_cents: account.current_balance_cents }
    end
  end

  def net_worth
    accounts = household.accounts.where(is_hidden: false)
    assets = accounts.where(account_type: %w[checking savings investment retirement crypto real_estate vehicle other_asset cash]).sum(:current_balance_cents)
    liabilities = accounts.where(account_type: %w[credit_card loan mortgage other_liability]).sum(:current_balance_cents).abs
    { assets_cents: assets, liabilities_cents: liabilities, net_worth_cents: assets - liabilities }
  end

  def upcoming_bills
    household.recurring_items
      .where(is_active: true)
      .where('next_occurrence BETWEEN ? AND ?', Date.current, Date.current + 7.days)
      .order(:next_occurrence)
      .limit(5)
  rescue
    [] # RecurringItem may not have next_occurrence column
  end

  def needs_review_count
    household.transactions.needs_review.count
  end
end
