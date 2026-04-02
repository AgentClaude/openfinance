# Compares spending between two time periods for a household.
#
# Returns: category-by-category comparison, merchant comparison,
# income/expense totals with percentage changes, and day-by-day
# normalized spending curves for visual overlay.

class Analytics::SpendingComparisonService < ApplicationService
  attr_accessor :household, :period_a_start, :period_a_end, :period_b_start, :period_b_end

  def call
    return failure('Household is required') unless household
    return failure('Period dates are required') unless period_a_start && period_a_end && period_b_start && period_b_end

    parse_dates!

    success(
      period_a: period_label(@a_start, @a_end),
      period_b: period_label(@b_start, @b_end),
      period_a_start: @a_start.iso8601,
      period_a_end: @a_end.iso8601,
      period_b_start: @b_start.iso8601,
      period_b_end: @b_end.iso8601,
      totals: compute_totals,
      category_comparison: compute_category_comparison,
      merchant_comparison: compute_merchant_comparison,
      daily_curves: compute_daily_curves
    )
  end

  private

  def parse_dates!
    @a_start = Date.parse(period_a_start.to_s)
    @a_end   = Date.parse(period_a_end.to_s)
    @b_start = Date.parse(period_b_start.to_s)
    @b_end   = Date.parse(period_b_end.to_s)
  end

  def period_label(start_date, end_date)
    if start_date == start_date.beginning_of_month && end_date == start_date.end_of_month
      start_date.strftime('%b %Y')
    else
      "#{start_date.strftime('%b %d')} – #{end_date.strftime('%b %d, %Y')}"
    end
  end

  def txns_a
    @txns_a ||= household.transactions.where(date: @a_start..@a_end)
  end

  def txns_b
    @txns_b ||= household.transactions.where(date: @b_start..@b_end)
  end

  def compute_totals
    a_income   = txns_a.where('amount_cents > 0').sum(:amount_cents) / 100.0
    a_expenses = txns_a.where('amount_cents < 0').sum(:amount_cents).abs / 100.0
    b_income   = txns_b.where('amount_cents > 0').sum(:amount_cents) / 100.0
    b_expenses = txns_b.where('amount_cents < 0').sum(:amount_cents).abs / 100.0

    {
      period_a_income: a_income,
      period_b_income: b_income,
      income_change: b_income - a_income,
      income_change_percent: pct_change(a_income, b_income),
      period_a_expenses: a_expenses,
      period_b_expenses: b_expenses,
      expenses_change: b_expenses - a_expenses,
      expenses_change_percent: pct_change(a_expenses, b_expenses),
      period_a_net: a_income - a_expenses,
      period_b_net: b_income - b_expenses,
      net_change: (b_income - b_expenses) - (a_income - a_expenses),
      period_a_transaction_count: txns_a.count,
      period_b_transaction_count: txns_b.count
    }
  end

  def compute_category_comparison
    a_by_cat = expense_by_category(txns_a)
    b_by_cat = expense_by_category(txns_b)

    all_cat_ids = (a_by_cat.keys + b_by_cat.keys).uniq
    categories = Category.where(id: all_cat_ids).index_by(&:id)

    comparisons = all_cat_ids.map do |cat_id|
      cat = categories[cat_id]
      a_amount = a_by_cat[cat_id] || 0.0
      b_amount = b_by_cat[cat_id] || 0.0

      {
        category_id: cat_id,
        category_name: cat&.name || 'Uncategorized',
        category_icon: cat&.icon,
        category_color: cat&.color.presence || cat&.color_hex,
        period_a_amount: a_amount,
        period_b_amount: b_amount,
        change: b_amount - a_amount,
        change_percent: pct_change(a_amount, b_amount)
      }
    end

    # Sort by largest absolute change
    comparisons.sort_by { |c| -(c[:period_b_amount] + c[:period_a_amount]) }
  end

  def compute_merchant_comparison
    a_by_merchant = expense_by_merchant(txns_a)
    b_by_merchant = expense_by_merchant(txns_b)

    all_merchants = (a_by_merchant.keys + b_by_merchant.keys).uniq

    comparisons = all_merchants.map do |merchant|
      a_amount = a_by_merchant[merchant] || 0.0
      b_amount = b_by_merchant[merchant] || 0.0

      {
        merchant_name: merchant,
        period_a_amount: a_amount,
        period_b_amount: b_amount,
        change: b_amount - a_amount,
        change_percent: pct_change(a_amount, b_amount)
      }
    end

    comparisons.sort_by { |c| -(c[:period_b_amount] + c[:period_a_amount]) }.first(15)
  end

  def compute_daily_curves
    a_days = (@a_end - @a_start).to_i + 1
    b_days = (@b_end - @b_start).to_i + 1

    a_daily = daily_cumulative(txns_a, @a_start, @a_end)
    b_daily = daily_cumulative(txns_b, @b_start, @b_end)

    # Normalize to day index (0-based) for overlay
    max_days = [a_days, b_days].max
    (0...max_days).map do |i|
      {
        day: i + 1,
        period_a_cumulative: i < a_days ? a_daily[i] : nil,
        period_b_cumulative: i < b_days ? b_daily[i] : nil
      }
    end
  end

  def expense_by_category(scope)
    scope
      .where('amount_cents < 0')
      .group(:category_id)
      .sum(:amount_cents)
      .transform_values { |v| v.abs / 100.0 }
  end

  def expense_by_merchant(scope)
    scope
      .where('amount_cents < 0')
      .where.not(merchant_name: [nil, ''])
      .group(:merchant_name)
      .sum(:amount_cents)
      .transform_values { |v| v.abs / 100.0 }
  end

  def daily_cumulative(scope, start_date, end_date)
    daily = scope
      .where('amount_cents < 0')
      .group(:date)
      .sum(:amount_cents)
      .transform_values { |v| v.abs / 100.0 }

    cumulative = []
    running = 0.0
    (start_date..end_date).each do |date|
      running += (daily[date] || 0.0)
      cumulative << running.round(2)
    end
    cumulative
  end

  def pct_change(old_val, new_val)
    return 0.0 if old_val == 0 && new_val == 0
    return 100.0 if old_val == 0
    ((new_val - old_val) / old_val * 100).round(1)
  end
end
