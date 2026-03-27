# Generates a comprehensive annual financial summary for a household.
#
# Computes: income, spending, savings, net worth change, top categories,
# top merchants, monthly trends, budget performance, and notable highlights.

class Analytics::AnnualSummaryService < ApplicationService
  attr_accessor :household, :year

  def call
    return failure('Household is required') unless household
    @year_val = year || Date.current.year
    @start_date = Date.new(@year_val, 1, 1)
    @end_date = Date.new(@year_val, 12, 31)
    @today = Date.current
    # Don't go past today for the current year
    @end_date = @today if @end_date > @today

    @transactions = household.transactions.where(date: @start_date..@end_date)

    success(
      year: @year_val,
      income: compute_income,
      spending: compute_spending,
      savings: compute_savings,
      net_worth_change: compute_net_worth_change,
      monthly_trends: compute_monthly_trends,
      top_categories: compute_top_categories,
      top_merchants: compute_top_merchants,
      budget_performance: compute_budget_performance,
      highlights: compute_highlights,
      transaction_count: @transactions.count,
      days_tracked: (@end_date - @start_date).to_i + 1
    )
  end

  private

  # ── Income ─────────────────────────────────────────────────
  def compute_income
    income_cents = @transactions.where('amount_cents > 0').sum(:amount_cents)
    months_elapsed = elapsed_months
    {
      total: income_cents / 100.0,
      monthly_average: months_elapsed > 0 ? (income_cents / 100.0 / months_elapsed).round(2) : 0.0
    }
  end

  # ── Spending ───────────────────────────────────────────────
  def compute_spending
    expense_cents = @transactions.where('amount_cents < 0').sum(:amount_cents).abs
    months_elapsed = elapsed_months
    days = (@end_date - @start_date).to_i + 1
    {
      total: expense_cents / 100.0,
      monthly_average: months_elapsed > 0 ? (expense_cents / 100.0 / months_elapsed).round(2) : 0.0,
      daily_average: days > 0 ? (expense_cents / 100.0 / days).round(2) : 0.0
    }
  end

  # ── Savings ────────────────────────────────────────────────
  def compute_savings
    income_cents = @transactions.where('amount_cents > 0').sum(:amount_cents)
    expense_cents = @transactions.where('amount_cents < 0').sum(:amount_cents).abs
    saved_cents = income_cents - expense_cents
    rate = income_cents > 0 ? (saved_cents.to_f / income_cents * 100).round(1) : 0.0
    {
      total: saved_cents / 100.0,
      rate: rate
    }
  end

  # ── Net worth change (Jan 1 vs Dec 31 / today) ────────────
  def compute_net_worth_change
    accounts = household.accounts.where(is_hidden: false)
    liability_types = %w[credit credit_card loan mortgage auto_loan student_loan personal_loan heloc other_liability]

    start_nw = net_worth_at(accounts, liability_types, @start_date)
    end_nw = net_worth_at(accounts, liability_types, @end_date)

    # Fall back to current balances if no history
    if end_nw.nil?
      asset_cents = accounts.reject { |a| liability_types.include?(a.account_type) }.sum(&:current_balance_cents)
      liability_cents = accounts.select { |a| liability_types.include?(a.account_type) }.sum(&:current_balance_cents)
      end_nw = (asset_cents - liability_cents) / 100.0
    end

    start_nw ||= end_nw

    {
      start_of_year: start_nw.round(2),
      end_of_period: end_nw.round(2),
      change: (end_nw - start_nw).round(2),
      change_percentage: start_nw != 0 ? ((end_nw - start_nw) / start_nw.abs * 100).round(1) : 0.0
    }
  end

  # ── Monthly trends ─────────────────────────────────────────
  def compute_monthly_trends
    trends = []
    current = @start_date.beginning_of_month
    while current <= @end_date
      month_end = [current.end_of_month, @end_date].min
      month_txns = @transactions.where(date: current..month_end)

      income_cents = month_txns.where('amount_cents > 0').sum(:amount_cents)
      expense_cents = month_txns.where('amount_cents < 0').sum(:amount_cents).abs

      trends << {
        month: current.strftime('%Y-%m'),
        label: current.strftime('%b'),
        income: income_cents / 100.0,
        expenses: expense_cents / 100.0,
        savings: (income_cents - expense_cents) / 100.0
      }
      current = current.next_month
    end
    trends
  end

  # ── Top spending categories ────────────────────────────────
  def compute_top_categories
    expense_txns = @transactions.where('amount_cents < 0')
    total_expense_cents = expense_txns.sum(:amount_cents).abs

    spent_by_cat = expense_txns.group(:category_id)
                               .pluck(:category_id, Arel.sql('SUM(ABS(amount_cents))'), Arel.sql('COUNT(*)'))
    cats = Category.where(id: spent_by_cat.map(&:first).compact).index_by(&:id)

    spent_by_cat.map do |cat_id, total_cents, count|
      cat = cats[cat_id]
      {
        category_id: cat_id,
        category_name: cat&.name || 'Uncategorized',
        category_icon: cat&.icon,
        category_color: cat&.color.presence || cat&.color_hex,
        amount: total_cents.to_i / 100.0,
        percentage: total_expense_cents > 0 ? (total_cents.to_i.to_f / total_expense_cents * 100).round(1) : 0.0,
        transaction_count: count.to_i
      }
    end.sort_by { |c| -c[:amount] }.first(10)
  end

  # ── Top merchants ──────────────────────────────────────────
  def compute_top_merchants
    @transactions.where('amount_cents < 0')
                 .where.not(merchant_name: [nil, ''])
                 .group(:merchant_name)
                 .select('merchant_name, SUM(ABS(amount_cents)) as total_cents, COUNT(*) as txn_count')
                 .order('total_cents DESC')
                 .limit(10)
                 .map do |row|
      {
        merchant_name: row.merchant_name,
        amount: row.total_cents.to_i / 100.0,
        transaction_count: row.txn_count.to_i
      }
    end
  end

  # ── Budget performance ─────────────────────────────────────
  def compute_budget_performance
    budget = household.budgets.first
    return { months_on_budget: 0, months_over_budget: 0, total_months: 0 } unless budget

    months_on = 0
    months_over = 0
    total = 0

    current = @start_date.beginning_of_month
    while current <= @end_date
      month_end = current.end_of_month
      items = BudgetItem.where(budget: budget, month: current)
      if items.any?
        total += 1
        budgeted_cents = items.sum(:amount_cents)
        spent_cents = household.transactions
          .where(date: current..month_end)
          .where('amount_cents < 0')
          .where(category_id: items.pluck(:category_id))
          .sum(:amount_cents).abs

        if spent_cents <= budgeted_cents
          months_on += 1
        else
          months_over += 1
        end
      end
      current = current.next_month
    end

    {
      months_on_budget: months_on,
      months_over_budget: months_over,
      total_months: total
    }
  end

  # ── Highlights / fun stats ─────────────────────────────────
  def compute_highlights
    expense_txns = @transactions.where('amount_cents < 0')

    # Biggest single expense
    biggest = expense_txns.order(Arel.sql('ABS(amount_cents) DESC')).first
    biggest_expense = biggest ? {
      amount: biggest.amount_cents.abs / 100.0,
      description: biggest.merchant_name.presence || biggest.name,
      date: biggest.date.iso8601
    } : nil

    # Biggest single income
    biggest_income_txn = @transactions.where('amount_cents > 0').order(amount_cents: :desc).first
    biggest_income = biggest_income_txn ? {
      amount: biggest_income_txn.amount_cents / 100.0,
      description: biggest_income_txn.merchant_name.presence || biggest_income_txn.name,
      date: biggest_income_txn.date.iso8601
    } : nil

    # Most frequent merchant
    most_freq = expense_txns.where.not(merchant_name: [nil, ''])
                            .group(:merchant_name)
                            .order(Arel.sql('COUNT(*) DESC'))
                            .limit(1)
                            .pluck(:merchant_name, Arel.sql('COUNT(*)'))
                            .first
    most_frequent_merchant = most_freq ? { name: most_freq[0], visit_count: most_freq[1].to_i } : nil

    # Biggest spending month
    monthly = compute_monthly_trends
    biggest_month = monthly.max_by { |m| m[:expenses] }
    most_frugal_month = monthly.min_by { |m| m[:expenses] }

    # Goals achieved this year
    goals_achieved = household.goals.where(is_achieved: true)
                              .where('achieved_at >= ? AND achieved_at < ?',
                                     @start_date.beginning_of_day,
                                     (@end_date + 1.day).beginning_of_day)
                              .count

    {
      biggest_expense: biggest_expense,
      biggest_income: biggest_income,
      most_frequent_merchant: most_frequent_merchant,
      biggest_spending_month: biggest_month,
      most_frugal_month: most_frugal_month,
      goals_achieved: goals_achieved
    }
  end

  # ── Helpers ────────────────────────────────────────────────
  def elapsed_months
    if @year_val == @today.year
      completed = @today.month - 1
      # Add partial current month as fraction
      days_in_month = @today.end_of_month.day
      completed + (@today.day.to_f / days_in_month)
    else
      12.0
    end
  end

  def net_worth_at(accounts, liability_types, date)
    histories = AccountBalanceHistory.where(account: accounts)
                                    .where('date <= ?', date)
                                    .order(date: :desc)

    return nil unless histories.exists?

    # Get latest balance per account on or before date
    latest_per_account = histories.group_by(&:account_id).transform_values(&:first)
    asset_cents = 0
    liability_cents = 0

    latest_per_account.each do |account_id, hist|
      acct = accounts.find { |a| a.id == account_id }
      next unless acct
      if liability_types.include?(acct.account_type)
        liability_cents += hist.balance_cents
      else
        asset_cents += hist.balance_cents
      end
    end

    (asset_cents - liability_cents) / 100.0
  end
end
