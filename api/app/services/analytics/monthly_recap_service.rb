# Generates a comprehensive monthly financial recap for a household.
#
# Aggregates: income & expenses, savings rate, budget performance,
# category breakdown, net worth change, top merchants, recurring bill summary,
# notable transactions, and month-over-month comparisons.

class Analytics::MonthlyRecapService < ApplicationService
  attr_accessor :household, :month

  LIABILITY_TYPES = %w[credit credit_card loan mortgage auto_loan student_loan personal_loan heloc other_liability].freeze

  def call
    return failure('Household is required') unless household

    parse_month!
    load_transactions!

    success(
      month: @month_str,
      income: compute_income,
      expenses: compute_expenses,
      savings: compute_savings,
      net_worth: compute_net_worth,
      budget_performance: compute_budget_performance,
      category_breakdown: compute_category_breakdown,
      top_merchants: compute_top_merchants,
      recurring_summary: compute_recurring_summary,
      notable_transactions: compute_notable_transactions,
      comparison: compute_month_over_month,
      daily_spending: compute_daily_spending
    )
  end

  private

  def parse_month!
    @start_date = if month.present?
                    Date.parse("#{month}-01")
                  else
                    Date.current.beginning_of_month
                  end
    @end_date = @start_date.end_of_month
    @month_str = @start_date.strftime('%Y-%m')

    # Previous month for comparisons
    @prev_start = @start_date - 1.month
    @prev_end = @prev_start.end_of_month
  end

  def load_transactions!
    @txns = household.transactions.where(date: @start_date..@end_date)
    @prev_txns = household.transactions.where(date: @prev_start..@prev_end)
  end

  def compute_income
    income_cents = @txns.where('amount_cents > 0').sum(:amount_cents)
    prev_income_cents = @prev_txns.where('amount_cents > 0').sum(:amount_cents)

    # Top income sources
    top_sources = @txns.where('amount_cents > 0')
      .group(:merchant_name)
      .order(Arel.sql('SUM(amount_cents) DESC'))
      .limit(5)
      .pluck(:merchant_name, Arel.sql('SUM(amount_cents)'), Arel.sql('COUNT(*)'))
      .map do |name, cents, count|
        {
          name: name.presence || 'Unknown',
          amount: cents / 100.0,
          count: count
        }
      end

    {
      total: income_cents / 100.0,
      previous_month: prev_income_cents / 100.0,
      change: (income_cents - prev_income_cents) / 100.0,
      change_percentage: prev_income_cents > 0 ? ((income_cents - prev_income_cents).to_f / prev_income_cents * 100).round(1) : 0.0,
      top_sources: top_sources
    }
  end

  def compute_expenses
    expense_cents = @txns.where('amount_cents < 0').sum(:amount_cents).abs
    prev_expense_cents = @prev_txns.where('amount_cents < 0').sum(:amount_cents).abs
    days_in_month = (@end_date - @start_date + 1).to_i
    days_elapsed = [Date.current, @end_date].min - @start_date + 1

    {
      total: expense_cents / 100.0,
      previous_month: prev_expense_cents / 100.0,
      change: (expense_cents.to_i - prev_expense_cents.to_i) / 100.0,
      change_percentage: prev_expense_cents > 0 ? ((expense_cents - prev_expense_cents).to_f / prev_expense_cents * 100).round(1) : 0.0,
      daily_average: days_elapsed > 0 ? (expense_cents / 100.0 / days_elapsed).round(2) : 0.0,
      transaction_count: @txns.where('amount_cents < 0').count
    }
  end

  def compute_savings
    income_cents = @txns.where('amount_cents > 0').sum(:amount_cents)
    expense_cents = @txns.where('amount_cents < 0').sum(:amount_cents).abs
    saved_cents = income_cents - expense_cents

    prev_income = @prev_txns.where('amount_cents > 0').sum(:amount_cents)
    prev_expense = @prev_txns.where('amount_cents < 0').sum(:amount_cents).abs
    prev_saved = prev_income - prev_expense

    {
      amount: saved_cents / 100.0,
      rate: income_cents > 0 ? (saved_cents.to_f / income_cents * 100).round(1) : 0.0,
      previous_amount: prev_saved / 100.0,
      previous_rate: prev_income > 0 ? (prev_saved.to_f / prev_income * 100).round(1) : 0.0
    }
  end

  def compute_net_worth
    accounts = household.accounts.where(is_hidden: false)
    asset_cents = accounts.reject { |a| LIABILITY_TYPES.include?(a.account_type) }.sum(&:current_balance_cents)
    liability_cents = accounts.select { |a| LIABILITY_TYPES.include?(a.account_type) }.sum(&:current_balance_cents)
    current_nw = asset_cents - liability_cents

    # Try to get start-of-month net worth from balance history
    start_histories = AccountBalanceHistory.where(account: accounts)
      .where(date: @start_date)
    prev_nw = if start_histories.exists?
                prev_asset = 0
                prev_liab = 0
                start_histories.includes(:account).each do |h|
                  if LIABILITY_TYPES.include?(h.account.account_type)
                    prev_liab += h.balance_cents
                  else
                    prev_asset += h.balance_cents
                  end
                end
                prev_asset - prev_liab
              else
                current_nw # fallback
              end

    change = current_nw - prev_nw

    {
      current: current_nw / 100.0,
      start_of_month: prev_nw / 100.0,
      change: change / 100.0,
      change_percentage: prev_nw != 0 ? (change.to_f / prev_nw.abs * 100).round(1) : 0.0,
      assets: asset_cents / 100.0,
      liabilities: liability_cents / 100.0
    }
  end

  def compute_budget_performance
    budget = household.budgets.first
    return { has_budget: false, total_budgeted: 0.0, total_spent: 0.0, remaining: 0.0, on_track: true, categories: [] } unless budget

    items = BudgetItem.where(budget: budget, month: @start_date).includes(:category)
    return { has_budget: false, total_budgeted: 0.0, total_spent: 0.0, remaining: 0.0, on_track: true, categories: [] } if items.empty?

    expense_items = items.reject { |i| i.category&.group_name == 'Income' }
    category_ids = expense_items.filter_map(&:category_id)

    spent_by_cat = household.transactions
      .where(category_id: category_ids, date: @start_date..@end_date)
      .where('amount_cents < 0')
      .group(:category_id)
      .sum(:amount_cents)
      .transform_values { |v| v.abs }

    total_budgeted_cents = expense_items.sum(&:amount_cents)
    total_spent_cents = spent_by_cat.values.sum

    # Per-category performance (top 5 over/under budget)
    cat_performance = expense_items.filter_map do |item|
      next unless item.category
      spent = spent_by_cat[item.category_id] || 0
      budgeted = item.amount_cents
      next if budgeted == 0

      {
        category_name: item.category.name,
        category_icon: item.category.icon,
        budgeted: budgeted / 100.0,
        spent: spent / 100.0,
        remaining: (budgeted - spent) / 100.0,
        percent_used: (spent.to_f / budgeted * 100).round(1),
        over_budget: spent > budgeted
      }
    end.sort_by { |c| -(c[:percent_used]) }

    {
      has_budget: true,
      total_budgeted: total_budgeted_cents / 100.0,
      total_spent: total_spent_cents / 100.0,
      remaining: (total_budgeted_cents - total_spent_cents) / 100.0,
      percent_used: total_budgeted_cents > 0 ? (total_spent_cents.to_f / total_budgeted_cents * 100).round(1) : 0.0,
      on_track: total_spent_cents <= total_budgeted_cents,
      categories_over_budget: cat_performance.count { |c| c[:over_budget] },
      categories: cat_performance.first(10)
    }
  end

  def compute_category_breakdown
    expense_txns = @txns.where('amount_cents < 0')
    total_cents = expense_txns.sum(:amount_cents).abs

    by_cat = expense_txns.group(:category_id)
      .pluck(:category_id, Arel.sql('SUM(ABS(amount_cents))'), Arel.sql('COUNT(*)'))
    cat_ids = by_cat.map(&:first).compact
    cats = Category.where(id: cat_ids).index_by(&:id)

    # Previous month for comparison
    prev_by_cat = @prev_txns.where('amount_cents < 0')
      .group(:category_id)
      .pluck(:category_id, Arel.sql('SUM(ABS(amount_cents))'))
      .to_h

    by_cat.map do |cat_id, cents, count|
      cat = cats[cat_id]
      prev_cents = prev_by_cat[cat_id] || 0
      change = cents.to_i - prev_cents.to_i

      {
        category_id: cat_id,
        category_name: cat&.name || 'Uncategorized',
        category_icon: cat&.icon,
        category_color: cat&.color.presence || cat&.color_hex,
        amount: cents.to_i / 100.0,
        percentage: total_cents > 0 ? (cents.to_i.to_f / total_cents * 100).round(1) : 0.0,
        transaction_count: count.to_i,
        previous_amount: prev_cents.to_i / 100.0,
        change: change / 100.0,
        change_percentage: prev_cents > 0 ? (change.to_f / prev_cents * 100).round(1) : 0.0
      }
    end.sort_by { |c| -c[:amount] }
  end

  def compute_top_merchants
    @txns.where('amount_cents < 0')
      .where.not(merchant_name: [nil, ''])
      .group(:merchant_name)
      .order(Arel.sql('SUM(ABS(amount_cents)) DESC'))
      .limit(10)
      .pluck(:merchant_name, Arel.sql('SUM(ABS(amount_cents))'), Arel.sql('COUNT(*)'))
      .map do |name, cents, count|
        {
          merchant_name: name,
          amount: cents.to_i / 100.0,
          transaction_count: count.to_i
        }
      end
  end

  def compute_recurring_summary
    items = household.recurring_items.where(is_active: true)
    expense_items = items.where(is_income: false)
    income_items = items.where(is_income: true)

    # Bills due this month
    due_this_month = expense_items.where(next_occurrence: @start_date..@end_date)

    # Check if bills are "paid" by looking for matching transactions
    paid_count = 0
    due_items = due_this_month.order(:next_occurrence).limit(10).to_a
    due_items.each do |item|
      has_match = household.transactions
        .where(date: @start_date..@end_date)
        .where('amount_cents < 0')
        .where('ABS(amount_cents) BETWEEN ? AND ?', (item.amount_cents * 0.8).to_i, (item.amount_cents * 1.2).to_i)
        .where('merchant_name ILIKE ? OR name ILIKE ?', "%#{item.merchant_name}%", "%#{item.name}%")
        .exists?
      paid_count += 1 if has_match
    end

    {
      total_recurring_expenses: expense_items.sum(:amount_cents) / 100.0,
      total_recurring_income: income_items.sum(:amount_cents) / 100.0,
      bills_due_count: due_this_month.count,
      bills_paid_count: paid_count,
      upcoming: due_items.first(5).map do |item|
        {
          name: item.name,
          amount: item.amount_cents / 100.0,
          due_date: item.next_occurrence&.iso8601,
          is_paid: false
        }
      end
    }
  end

  def compute_notable_transactions
    expenses = @txns.where('amount_cents < 0').includes(:category, :account)
    income = @txns.where('amount_cents > 0').includes(:category, :account)

    largest_expense = expenses.order(Arel.sql('ABS(amount_cents) DESC')).first
    largest_income = income.order(Arel.sql('amount_cents DESC')).first

    # Unusual transactions (> 2x daily average for that category)
    unusual = find_unusual_transactions(expenses)

    {
      largest_expense: transaction_summary(largest_expense),
      largest_income: transaction_summary(largest_income),
      unusual_transactions: unusual.first(5)
    }
  end

  def find_unusual_transactions(expenses)
    # Get 3-month averages by category
    three_months_ago = @start_date - 3.months
    historical = household.transactions
      .where(date: three_months_ago..@prev_end)
      .where('amount_cents < 0')

    days_in_history = (@prev_end - three_months_ago + 1).to_i
    avg_by_cat = historical.group(:category_id)
      .pluck(:category_id, Arel.sql('SUM(ABS(amount_cents))'))
      .to_h
      .transform_values { |v| v / [days_in_history, 1].max }

    expenses.select do |txn|
      daily_avg = avg_by_cat[txn.category_id]
      next false unless daily_avg && daily_avg > 0
      txn.amount_cents.abs > (daily_avg * 60) # ~2 months worth in one transaction
    end.map { |t| transaction_summary(t) }
  end

  def compute_month_over_month
    income = @txns.where('amount_cents > 0').sum(:amount_cents)
    expenses = @txns.where('amount_cents < 0').sum(:amount_cents).abs
    prev_income = @prev_txns.where('amount_cents > 0').sum(:amount_cents)
    prev_expenses = @prev_txns.where('amount_cents < 0').sum(:amount_cents).abs

    {
      income_change: prev_income > 0 ? ((income - prev_income).to_f / prev_income * 100).round(1) : 0.0,
      expense_change: prev_expenses > 0 ? ((expenses - prev_expenses).to_f / prev_expenses * 100).round(1) : 0.0,
      savings_change: compute_savings_change(income, expenses, prev_income, prev_expenses),
      transaction_count: @txns.count,
      previous_transaction_count: @prev_txns.count
    }
  end

  def compute_savings_change(income, expenses, prev_income, prev_expenses)
    rate = income > 0 ? ((income - expenses).to_f / income * 100) : 0.0
    prev_rate = prev_income > 0 ? ((prev_income - prev_expenses).to_f / prev_income * 100) : 0.0
    (rate - prev_rate).round(1)
  end

  def compute_daily_spending
    @txns.where('amount_cents < 0')
      .group(:date)
      .order(:date)
      .pluck(:date, Arel.sql('SUM(ABS(amount_cents))'))
      .map do |date, cents|
        {
          date: date.iso8601,
          amount: cents.to_i / 100.0
        }
      end
  end

  def transaction_summary(txn)
    return nil unless txn
    {
      id: txn.id,
      name: txn.merchant_name.presence || txn.name,
      amount: txn.amount_cents / 100.0,
      date: txn.date.iso8601,
      category_name: txn.category&.name,
      account_name: txn.account&.name
    }
  end
end
