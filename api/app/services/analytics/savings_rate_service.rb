# Savings Rate & Income Allocation Analysis
#
# Analyzes:
#   - Monthly savings rate trends (income - expenses / income)
#   - 50/30/20 rule breakdown (needs/wants/savings)
#   - Income source breakdown (salary, freelance, investment, etc.)
#   - Expense allocation by category group
#   - Pay-yourself-first score
#   - Savings rate percentile ranking
#   - Actionable recommendations

class Analytics::SavingsRateService < ApplicationService
  attr_accessor :household, :months

  DEFAULT_MONTHS = 12

  # 50/30/20 category classification
  NEEDS_GROUPS = %w[Housing Transportation Healthcare Bills\ &\ Utilities].freeze
  WANTS_GROUPS = %w[Food\ &\ Drink Shopping Entertainment Personal\ Care].freeze
  # Savings = Income - Needs - Wants (everything not classified above)

  # National savings rate percentile benchmarks (approximate)
  PERCENTILE_BENCHMARKS = [
    { percentile: 90, rate: 30 },
    { percentile: 75, rate: 20 },
    { percentile: 50, rate: 10 },
    { percentile: 25, rate: 5 },
    { percentile: 10, rate: 0 },
  ].freeze

  def call
    return failure('Household is required') unless household

    num_months = (months || DEFAULT_MONTHS).to_i.clamp(3, 36)

    monthly_data = calculate_monthly_data(num_months)
    current_month = monthly_data.last
    allocation = calculate_503020(monthly_data)
    income_sources = calculate_income_sources(num_months)
    expense_allocation = calculate_expense_allocation(num_months)
    percentile = calculate_percentile(current_month&.dig(:savings_rate) || 0)
    streaks = calculate_streaks(monthly_data)
    recommendations = generate_recommendations(current_month, allocation, monthly_data)

    success(
      summary: build_summary(monthly_data, current_month, percentile),
      monthly_trends: monthly_data,
      allocation: allocation,
      income_sources: income_sources,
      expense_allocation: expense_allocation,
      streaks: streaks,
      recommendations: recommendations
    )
  end

  private

  def build_summary(monthly_data, current, percentile)
    rates = monthly_data.map { |m| m[:savings_rate] }
    avg_rate = rates.any? ? (rates.sum.to_f / rates.size).round(1) : 0

    {
      current_savings_rate: current&.dig(:savings_rate) || 0,
      average_savings_rate: avg_rate,
      best_month: monthly_data.max_by { |m| m[:savings_rate] }&.slice(:month, :savings_rate),
      worst_month: monthly_data.min_by { |m| m[:savings_rate] }&.slice(:month, :savings_rate),
      trend_direction: calculate_trend(rates),
      percentile: percentile,
      months_analyzed: monthly_data.size,
      total_saved: monthly_data.sum { |m| m[:savings_amount] }.round(2),
      average_monthly_savings: monthly_data.any? ? (monthly_data.sum { |m| m[:savings_amount] }.to_f / monthly_data.size).round(2) : 0
    }
  end

  def calculate_monthly_data(num_months)
    end_date = Date.current.end_of_month
    start_date = (Date.current - num_months.months).beginning_of_month

    transactions = household.transactions
      .where(date: start_date..end_date)
      .where(excluded: [false, nil])
      .includes(:category)

    # Group by month
    months_data = []
    current = start_date

    while current <= end_date
      month_end = current.end_of_month
      month_txns = transactions.select { |t| t.date >= current && t.date <= month_end }

      income = month_txns
        .select { |t| t.category&.is_income }
        .sum { |t| t.amount_cents.abs }
        .to_f / 100

      # Exclude transfer categories from expenses
      expenses = month_txns
        .reject { |t| t.category&.is_income || t.category&.group_name == 'Transfer' }
        .sum { |t| t.amount_cents.abs }
        .to_f / 100

      savings = income - expenses
      rate = income > 0 ? ((savings / income) * 100).round(1) : 0

      months_data << {
        month: current.strftime('%Y-%m'),
        income: income.round(2),
        expenses: expenses.round(2),
        savings_amount: savings.round(2),
        savings_rate: rate
      }

      current = current.next_month
    end

    months_data
  end

  def calculate_503020(monthly_data)
    return default_allocation if monthly_data.empty?

    # Use most recent 3 months for allocation analysis
    recent = monthly_data.last(3)
    avg_income = recent.sum { |m| m[:income] } / recent.size.to_f

    return default_allocation if avg_income <= 0

    end_date = Date.current.end_of_month
    start_date = (Date.current - 3.months).beginning_of_month

    transactions = household.transactions
      .where(date: start_date..end_date)
      .where(excluded: [false, nil])
      .includes(:category)
      .reject { |t| t.category&.is_income || t.category&.group_name == 'Transfer' }

    needs_total = 0
    wants_total = 0
    other_total = 0

    transactions.each do |txn|
      group = txn.category&.group_name
      amount = txn.amount_cents.abs.to_f / 100

      if NEEDS_GROUPS.include?(group)
        needs_total += amount
      elsif WANTS_GROUPS.include?(group)
        wants_total += amount
      else
        other_total += amount
      end
    end

    total_months = 3.0
    needs_monthly = needs_total / total_months
    wants_monthly = wants_total / total_months
    other_monthly = other_total / total_months
    total_expenses_monthly = needs_monthly + wants_monthly + other_monthly
    savings_monthly = avg_income - total_expenses_monthly

    {
      needs: {
        amount: needs_monthly.round(2),
        percent: (needs_monthly / avg_income * 100).round(1),
        target_percent: 50,
        status: needs_monthly / avg_income <= 0.50 ? 'good' : 'over'
      },
      wants: {
        amount: wants_monthly.round(2),
        percent: (wants_monthly / avg_income * 100).round(1),
        target_percent: 30,
        status: wants_monthly / avg_income <= 0.30 ? 'good' : 'over'
      },
      savings: {
        amount: [savings_monthly, 0].max.round(2),
        percent: (savings_monthly > 0 ? savings_monthly / avg_income * 100 : 0).round(1),
        target_percent: 20,
        status: savings_monthly / avg_income >= 0.20 ? 'good' : 'under'
      },
      other_expenses: {
        amount: other_monthly.round(2),
        percent: (other_monthly / avg_income * 100).round(1)
      },
      avg_monthly_income: avg_income.round(2)
    }
  end

  def calculate_income_sources(num_months)
    end_date = Date.current.end_of_month
    start_date = (Date.current - num_months.months).beginning_of_month

    income_txns = household.transactions
      .joins(:category)
      .where(categories: { is_income: true })
      .where(date: start_date..end_date)
      .where(excluded: [false, nil])
      .group('categories.name', 'categories.icon', 'categories.color')
      .sum(:amount_cents)

    total = income_txns.values.sum(&:abs).to_f
    return [] if total == 0

    income_txns.map do |(name, icon, color), cents|
      amount = cents.abs.to_f / 100
      {
        name: name,
        icon: icon,
        color: color,
        total: amount.round(2),
        monthly_average: (amount / num_months).round(2),
        percent: (cents.abs / total * 100).round(1)
      }
    end.sort_by { |s| -s[:total] }
  end

  def calculate_expense_allocation(num_months)
    end_date = Date.current.end_of_month
    start_date = (Date.current - num_months.months).beginning_of_month

    expense_txns = household.transactions
      .joins(:category)
      .where(categories: { is_income: false })
      .where.not(categories: { group_name: 'Transfer' })
      .where(date: start_date..end_date)
      .where(excluded: [false, nil])
      .group('categories.group_name')
      .sum(:amount_cents)

    total = expense_txns.values.sum(&:abs).to_f
    return [] if total == 0

    expense_txns.map do |group, cents|
      amount = cents.abs.to_f / 100
      category_type = if NEEDS_GROUPS.include?(group)
                        'needs'
                      elsif WANTS_GROUPS.include?(group)
                        'wants'
                      else
                        'other'
                      end
      {
        group: group || 'Uncategorized',
        total: amount.round(2),
        monthly_average: (amount / num_months).round(2),
        percent: (cents.abs / total * 100).round(1),
        category_type: category_type
      }
    end.sort_by { |e| -e[:total] }
  end

  def calculate_percentile(rate)
    match = PERCENTILE_BENCHMARKS.find { |b| rate >= b[:rate] }
    match ? match[:percentile] : 5
  end

  def calculate_trend(rates)
    return 'stable' if rates.size < 3

    recent = rates.last(3)
    older = rates.first([rates.size - 3, 3].max)
    recent_avg = recent.sum / recent.size.to_f
    older_avg = older.sum / older.size.to_f

    diff = recent_avg - older_avg
    if diff > 2
      'improving'
    elsif diff < -2
      'declining'
    else
      'stable'
    end
  end

  def calculate_streaks(monthly_data)
    positive_streak = 0
    above_20_streak = 0

    monthly_data.reverse_each do |m|
      break unless m[:savings_rate] > 0
      positive_streak += 1
    end

    monthly_data.reverse_each do |m|
      break unless m[:savings_rate] >= 20
      above_20_streak += 1
    end

    {
      positive_savings_months: positive_streak,
      above_20_percent_months: above_20_streak,
      total_months: monthly_data.size
    }
  end

  def generate_recommendations(current, allocation, monthly_data)
    recs = []

    if current
      rate = current[:savings_rate]
      if rate < 0
        recs << {
          type: 'critical',
          icon: '🚨',
          title: 'Spending exceeds income',
          description: "You spent more than you earned this month. Review expenses to find areas to cut back.",
          impact: "Potential monthly savings: #{format_money(current[:expenses] - current[:income])}"
        }
      elsif rate < 10
        recs << {
          type: 'warning',
          icon: '⚠️',
          title: 'Below recommended savings rate',
          description: "Your savings rate of #{rate}% is below the recommended 20%. Try to identify discretionary spending to reduce.",
          impact: "Save #{format_money(current[:income] * 0.20 - current[:savings_amount])} more to hit 20%"
        }
      elsif rate >= 30
        recs << {
          type: 'positive',
          icon: '🌟',
          title: 'Excellent savings rate!',
          description: "Your #{rate}% savings rate puts you well ahead of most households. Consider optimizing your investment strategy.",
          impact: nil
        }
      end
    end

    if allocation && allocation[:needs][:status] == 'over'
      over_by = allocation[:needs][:percent] - 50
      recs << {
        type: 'info',
        icon: '🏠',
        title: 'Needs spending above 50% target',
        description: "Essential expenses are #{over_by.round(1)}% above the 50/30/20 target. Consider ways to reduce housing or transportation costs.",
        impact: "Reduce by #{format_money(allocation[:needs][:amount] - allocation[:avg_monthly_income] * 0.5)}/mo to hit target"
      }
    end

    if allocation && allocation[:wants][:status] == 'over'
      over_by = allocation[:wants][:percent] - 30
      recs << {
        type: 'info',
        icon: '🛍️',
        title: 'Wants spending above 30% target',
        description: "Discretionary spending is #{over_by.round(1)}% above the 50/30/20 target. Review dining, shopping, and entertainment spending.",
        impact: "Reduce by #{format_money(allocation[:wants][:amount] - allocation[:avg_monthly_income] * 0.3)}/mo to hit target"
      }
    end

    # Trend-based recommendation
    rates = monthly_data.map { |m| m[:savings_rate] }
    trend = calculate_trend(rates)
    if trend == 'declining' && rates.size >= 6
      recs << {
        type: 'warning',
        icon: '📉',
        title: 'Savings rate trending down',
        description: "Your savings rate has been declining over the past few months. Review recent spending changes.",
        impact: nil
      }
    end

    recs
  end

  def format_money(amount)
    "$#{amount.abs.round(0).to_s.reverse.gsub(/(\d{3})(?=\d)/, '\\1,').reverse}"
  end

  def default_allocation
    {
      needs: { amount: 0, percent: 0, target_percent: 50, status: 'good' },
      wants: { amount: 0, percent: 0, target_percent: 30, status: 'good' },
      savings: { amount: 0, percent: 0, target_percent: 20, status: 'good' },
      other_expenses: { amount: 0, percent: 0 },
      avg_monthly_income: 0
    }
  end
end
