# Computes weekly financial digest data for a user's household
class WeeklyDigestService
  attr_reader :user, :household, :week_start, :week_end

  def initialize(user, week_start: nil)
    @user = user
    @household = user.household
    @week_end = (week_start || Date.current).end_of_week
    @week_start = @week_end.beginning_of_week
  end

  def generate
    return nil unless household

    {
      user: user,
      household: household,
      period: { start: week_start, end: week_end },
      spending: spending_summary,
      income: income_summary,
      net: net_cash_flow,
      top_categories: top_spending_categories,
      top_merchants: top_merchants,
      large_transactions: large_transactions,
      budget_status: budget_status,
      upcoming_bills: upcoming_bills,
      account_balances: account_balances,
      net_worth: net_worth
    }
  end

  private

  def transactions_this_week
    @transactions_this_week ||= household.transactions
      .where(date: week_start..week_end)
      .where(excluded: false)
      .includes(:category, :account)
  end

  def spending_transactions
    @spending_transactions ||= transactions_this_week.where('amount_cents < 0')
  end

  def income_transactions
    @income_transactions ||= transactions_this_week.where('amount_cents > 0')
  end

  def spending_summary
    total = spending_transactions.sum(:amount_cents).abs
    count = spending_transactions.count

    # Compare to last week
    last_week_total = household.transactions
      .where(date: (week_start - 7.days)..(week_end - 7.days))
      .where(excluded: false)
      .where('amount_cents < 0')
      .sum(:amount_cents).abs

    {
      total_cents: total,
      count: count,
      last_week_cents: last_week_total,
      change_pct: last_week_total > 0 ? ((total - last_week_total).to_f / last_week_total * 100).round(1) : nil
    }
  end

  def income_summary
    total = income_transactions.sum(:amount_cents)
    { total_cents: total, count: income_transactions.count }
  end

  def net_cash_flow
    income = income_transactions.sum(:amount_cents)
    spending = spending_transactions.sum(:amount_cents).abs
    { cents: income - spending, positive: income >= spending }
  end

  def top_spending_categories
    spending_transactions
      .group(:category_id)
      .sum(:amount_cents)
      .transform_values(&:abs)
      .sort_by { |_, v| -v }
      .first(5)
      .map do |cat_id, total|
        category = Category.find_by(id: cat_id)
        { name: category&.name || 'Uncategorized', total_cents: total }
      end
  end

  def top_merchants
    spending_transactions
      .where.not(merchant_name: [nil, ''])
      .group(:merchant_name)
      .sum(:amount_cents)
      .transform_values(&:abs)
      .sort_by { |_, v| -v }
      .first(5)
      .map { |name, total| { name: name, total_cents: total } }
  end

  def large_transactions
    threshold = -10_000 # -$100 (negative = expense)
    spending_transactions
      .where('amount_cents <= ?', threshold)
      .order(amount_cents: :asc)
      .limit(5)
      .map do |txn|
        {
          description: txn.merchant_name.presence || txn.name,
          amount_cents: txn.amount_cents.abs,
          date: txn.date,
          category: txn.category&.name
        }
      end
  end

  def budget_status
    current_month = Date.current.beginning_of_month
    budget = household.budgets.find_by(is_active: true)
    return [] unless budget

    items = BudgetItem.where(budget: budget, month: current_month).includes(:category)
    items.map do |item|
      spent = household.transactions
        .where(category_id: item.category_id)
        .where(date: current_month..current_month.end_of_month)
        .where(excluded: false)
        .where('amount_cents < 0')
        .sum(:amount_cents).abs

      pct = item.amount_cents > 0 ? (spent.to_f / item.amount_cents * 100).round(0) : 0
      next if pct < 80 # only show categories at 80%+

      {
        category: item.category&.name,
        budgeted_cents: item.amount_cents,
        spent_cents: spent,
        percentage: pct,
        status: pct >= 100 ? :over : :warning
      }
    end.compact
  end

  def upcoming_bills
    household.recurring_items
      .where(is_active: true)
      .where('next_occurrence <= ?', Date.current + 7.days)
      .where('next_occurrence >= ?', Date.current)
      .order(:next_occurrence)
      .limit(5)
      .map do |item|
        {
          name: item.name,
          amount_cents: item.amount_cents,
          due_date: item.next_occurrence
        }
      end
  end

  def account_balances
    household.accounts
      .where(is_hidden: false)
      .order(:account_type, :name)
      .map do |acct|
        { name: acct.name, type: acct.account_type, current_balance_cents: acct.current_balance_cents }
      end
  end

  def net_worth
    accounts = household.accounts.where(is_hidden: false)
    assets = accounts.where(account_type: %w[checking savings investment retirement crypto real_estate vehicle]).sum(:current_balance_cents).abs
    liabilities = accounts.where(account_type: %w[credit_card loan mortgage]).sum(:current_balance_cents).abs
    { assets_cents: assets, liabilities_cents: liabilities, net_cents: assets - liabilities }
  end
end
