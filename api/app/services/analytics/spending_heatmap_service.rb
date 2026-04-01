# Generates daily spending data for a heatmap visualization,
# plus weekday and category breakdowns for a given year.
#
# Returns: daily_spending (date + amount), weekday_averages,
# category_heatmap (top categories by month), stats summary.

class Analytics::SpendingHeatmapService < ApplicationService
  attr_accessor :household, :year

  def call
    return failure('Household is required') unless household

    @year = (year || Date.current.year).to_i
    @start_date = Date.new(@year, 1, 1)
    @end_date = [@start_date.end_of_year, Date.current].min

    load_transactions!

    success(
      year: @year,
      daily_spending: compute_daily_spending,
      weekday_averages: compute_weekday_averages,
      monthly_totals: compute_monthly_totals,
      category_heatmap: compute_category_heatmap,
      stats: compute_stats,
      streaks: compute_streaks
    )
  end

  private

  def load_transactions!
    @expense_txns = household.transactions
      .where(date: @start_date..@end_date)
      .where('amount_cents < 0')
      .where(excluded: [false, nil])
      .where(is_transfer: [false, nil])

    @daily_amounts = @expense_txns
      .group(:date)
      .sum('ABS(amount_cents)')
      .transform_values { |v| v / 100.0 }
  end

  def compute_daily_spending
    (@start_date..@end_date).map do |date|
      {
        date: date.iso8601,
        amount: @daily_amounts[date] || 0.0,
        day_of_week: date.wday,
        week: date.cweek
      }
    end
  end

  def compute_weekday_averages
    by_wday = Hash.new { |h, k| h[k] = [] }

    (@start_date..@end_date).each do |date|
      by_wday[date.wday] << (@daily_amounts[date] || 0.0)
    end

    day_names = %w[Sunday Monday Tuesday Wednesday Thursday Friday Saturday]

    (0..6).map do |wday|
      amounts = by_wday[wday]
      total = amounts.sum
      count = amounts.size
      avg = count > 0 ? (total / count).round(2) : 0.0
      {
        day_of_week: wday,
        day_name: day_names[wday],
        average: avg,
        total: total.round(2),
        count: count
      }
    end
  end

  def compute_monthly_totals
    monthly = @expense_txns
      .group(Arel.sql("DATE_TRUNC('month', date)"))
      .sum('ABS(amount_cents)')

    monthly.map do |month_start, cents|
      {
        month: month_start.strftime('%Y-%m'),
        amount: cents / 100.0
      }
    end.sort_by { |m| m[:month] }
  end

  def compute_category_heatmap
    # Top 8 categories by total spend for the year
    top_cats = @expense_txns
      .group(:category_id)
      .sum('ABS(amount_cents)')
      .sort_by { |_, v| -v }
      .first(8)
      .map(&:first)
      .compact

    return [] if top_cats.empty?

    cats_by_id = household.categories.where(id: top_cats).index_by(&:id)

    # Monthly spending per category
    monthly_cat = @expense_txns
      .where(category_id: top_cats)
      .group(:category_id, Arel.sql("DATE_TRUNC('month', date)"))
      .sum('ABS(amount_cents)')

    top_cats.map do |cat_id|
      cat = cats_by_id[cat_id]
      next unless cat

      months = (1..12).map do |m|
        month_start = Date.new(@year, m, 1)
        key = [cat_id, month_start]
        cents = monthly_cat[key] || 0
        {
          month: month_start.strftime('%Y-%m'),
          amount: cents / 100.0
        }
      end

      {
        category_id: cat_id,
        category_name: cat.name,
        category_icon: cat.icon,
        category_color: cat.color.presence || cat.color_hex,
        months: months
      }
    end.compact
  end

  def compute_stats
    amounts = @daily_amounts.values
    spending_days = amounts.select { |a| a > 0 }

    {
      total_spent: amounts.sum.round(2),
      days_tracked: (@start_date..@end_date).count,
      spending_days: spending_days.size,
      no_spend_days: (@start_date..@end_date).count - spending_days.size,
      daily_average: amounts.any? ? (amounts.sum / (@start_date..@end_date).count).round(2) : 0.0,
      max_day_amount: spending_days.max || 0.0,
      max_day_date: @daily_amounts.max_by { |_, v| v }&.first&.iso8601,
      min_spending_day_amount: spending_days.min || 0.0
    }
  end

  def compute_streaks
    dates = (@start_date..@end_date).to_a

    # No-spend streaks
    current_no_spend = 0
    longest_no_spend = 0
    current_no_spend_start = nil
    longest_no_spend_start = nil
    longest_no_spend_end = nil

    dates.each do |date|
      if (@daily_amounts[date] || 0.0) == 0.0
        current_no_spend_start ||= date
        current_no_spend += 1
        if current_no_spend > longest_no_spend
          longest_no_spend = current_no_spend
          longest_no_spend_start = current_no_spend_start
          longest_no_spend_end = date
        end
      else
        current_no_spend = 0
        current_no_spend_start = nil
      end
    end

    # Current no-spend streak (ending today or most recent date)
    current_streak = 0
    dates.reverse_each do |date|
      if (@daily_amounts[date] || 0.0) == 0.0
        current_streak += 1
      else
        break
      end
    end

    {
      longest_no_spend_days: longest_no_spend,
      longest_no_spend_start: longest_no_spend_start&.iso8601,
      longest_no_spend_end: longest_no_spend_end&.iso8601,
      current_no_spend_streak: current_streak
    }
  end
end
