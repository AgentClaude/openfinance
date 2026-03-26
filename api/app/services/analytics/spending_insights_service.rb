# Analyzes transaction patterns and generates actionable spending insights.
#
# Insight types:
#   - spending_anomaly:    Category spending significantly above monthly average
#   - budget_on_track:     Projected to stay within budget
#   - budget_at_risk:      On pace to exceed budget this month
#   - subscription_change: Recurring charge amount changed
#   - merchant_spike:      Unusually high spending at a merchant
#   - savings_opportunity: Consistently high discretionary spending
#   - income_change:       Income significantly different from average
#   - uncategorized_alert: Many uncategorized transactions needing review

class Analytics::SpendingInsightsService < ApplicationService
  attr_accessor :household

  LOOKBACK_MONTHS = 3
  ANOMALY_THRESHOLD = 1.5  # 50% above average triggers anomaly
  MERCHANT_SPIKE_THRESHOLD = 2.0
  INCOME_CHANGE_THRESHOLD = 0.2  # 20% change
  UNCATEGORIZED_THRESHOLD = 5

  def call
    return failure('Household is required') unless household

    insights = []
    insights.concat(spending_anomalies)
    insights.concat(budget_projections)
    insights.concat(subscription_changes)
    insights.concat(merchant_spikes)
    insights.concat(savings_opportunities)
    insights.concat(income_insights)
    insights.concat(uncategorized_alerts)

    # Sort by severity (critical > warning > info > positive) then by impact amount
    severity_order = { 'critical' => 0, 'warning' => 1, 'info' => 2, 'positive' => 3 }
    sorted = insights.sort_by { |i| [severity_order[i[:severity]] || 99, -(i[:amount]&.abs || 0)] }

    success(insights: sorted, generated_at: Time.current.iso8601, count: sorted.size)
  end

  private

  # ── Category spending anomalies ───────────────────────────────
  # Compare this month's spending per category against the 3-month average.
  def spending_anomalies
    current_month_start = Date.current.beginning_of_month
    current_month_end = Date.current.end_of_month
    lookback_start = (current_month_start - LOOKBACK_MONTHS.months)

    # Average monthly spending by category over lookback period
    avg_by_category = household.transactions
      .where(date: lookback_start...current_month_start)
      .where('amount_cents < 0')
      .joins(:category)
      .where.not(category_id: nil)
      .group(:category_id)
      .sum('ABS(amount_cents)')
      .transform_values { |total| total.to_f / LOOKBACK_MONTHS }

    # Current month spending by category
    current_by_category = household.transactions
      .where(date: current_month_start..current_month_end)
      .where('amount_cents < 0')
      .where.not(category_id: nil)
      .group(:category_id)
      .sum('ABS(amount_cents)')

    categories = Category.where(id: (avg_by_category.keys + current_by_category.keys).uniq).index_by(&:id)
    insights = []

    current_by_category.each do |cat_id, current_cents|
      avg_cents = avg_by_category[cat_id]
      next unless avg_cents && avg_cents > 0
      next if avg_cents < 1000  # Ignore tiny categories (< $10 avg)

      ratio = current_cents.to_f / avg_cents
      next unless ratio >= ANOMALY_THRESHOLD

      cat = categories[cat_id]
      next unless cat
      # Skip transfer/income categories
      next if cat.is_income || cat.name.downcase == 'transfer'

      overage_cents = current_cents - avg_cents
      pct_over = ((ratio - 1) * 100).round(0)

      insights << {
        type: 'spending_anomaly',
        severity: pct_over >= 100 ? 'critical' : 'warning',
        title: "#{cat.name} spending is #{pct_over}% above average",
        message: "You've spent $#{'%.2f' % (current_cents / 100.0)} on #{cat.name} this month, " \
                 "compared to your #{LOOKBACK_MONTHS}-month average of $#{'%.2f' % (avg_cents / 100.0)}.",
        amount: overage_cents / 100.0,
        category_id: cat_id,
        category_name: cat.name,
        icon: cat.icon,
        metadata: { current: current_cents / 100.0, average: avg_cents / 100.0, ratio: ratio.round(2) }
      }
    end

    insights
  end

  # ── Budget projections ────────────────────────────────────────
  # Project current spending rate through end of month.
  def budget_projections
    current_month_start = Date.current.beginning_of_month
    current_month_end = current_month_start.end_of_month
    days_elapsed = [(Date.current - current_month_start).to_i, 1].max
    days_in_month = (current_month_end - current_month_start).to_i + 1
    projection_factor = days_in_month.to_f / days_elapsed

    budget = household.budgets.find_by(is_active: true)
    budget ||= household.budgets.order(created_at: :desc).first
    return [] unless budget

    items = BudgetItem.where(budget: budget, month: current_month_start).includes(:category)
    return [] if items.empty?

    category_ids = items.filter_map(&:category_id)
    spent_by_category = household.transactions
      .where(category_id: category_ids, date: current_month_start..Date.current)
      .where('amount_cents < 0')
      .group(:category_id)
      .sum('ABS(amount_cents)')

    insights = []

    items.each do |item|
      next unless item.category && item.amount_cents > 0
      next if item.category.is_income

      spent_cents = spent_by_category[item.category_id] || 0
      projected_cents = (spent_cents * projection_factor).round

      if projected_cents > item.amount_cents * 1.1  # Will exceed by >10%
        overage = (projected_cents - item.amount_cents) / 100.0
        severity = projected_cents > item.amount_cents * 1.5 ? 'critical' : 'warning'

        insights << {
          type: 'budget_at_risk',
          severity: severity,
          title: "#{item.category.name} budget at risk",
          message: "At your current pace, you'll spend ~$#{'%.0f' % (projected_cents / 100.0)} " \
                   "on #{item.category.name} this month, exceeding your $#{'%.0f' % (item.amount_cents / 100.0)} budget by $#{'%.0f' % overage}.",
          amount: overage,
          category_id: item.category_id,
          category_name: item.category.name,
          icon: item.category.icon,
          metadata: {
            budgeted: item.amount_cents / 100.0,
            spent_so_far: spent_cents / 100.0,
            projected: projected_cents / 100.0,
            days_remaining: days_in_month - days_elapsed
          }
        }
      elsif spent_cents > 0 && projected_cents <= item.amount_cents * 0.9
        insights << {
          type: 'budget_on_track',
          severity: 'positive',
          title: "#{item.category.name} is on track",
          message: "You've spent $#{'%.0f' % (spent_cents / 100.0)} of your $#{'%.0f' % (item.amount_cents / 100.0)} " \
                   "#{item.category.name} budget with #{days_in_month - days_elapsed} days remaining.",
          amount: (item.amount_cents - projected_cents) / 100.0,
          category_id: item.category_id,
          category_name: item.category.name,
          icon: item.category.icon,
          metadata: {
            budgeted: item.amount_cents / 100.0,
            spent_so_far: spent_cents / 100.0,
            projected: projected_cents / 100.0
          }
        }
      end
    end

    insights
  end

  # ── Subscription/recurring charge changes ─────────────────────
  # Detect recurring items where the latest charge differs from the expected amount.
  def subscription_changes
    recurring = household.recurring_items.where(is_active: true).where.not(amount_cents: nil)
    return [] if recurring.empty?

    merchant_names = recurring.filter_map(&:merchant_name).uniq
    return [] if merchant_names.empty?

    # Batch-fetch recent transactions for all recurring merchants in one query
    recent_by_merchant = household.transactions
      .where("LOWER(merchant_name) IN (?)", merchant_names.map(&:downcase))
      .where('amount_cents < 0')
      .order(date: :desc)
      .group_by { |t| t.merchant_name&.downcase }

    insights = []

    recurring.each do |item|
      next unless item.merchant_name.present?

      recent_txns = (recent_by_merchant[item.merchant_name.downcase] || []).first(2)

      next unless recent_txns.size == 2

      latest_cents = recent_txns.first.amount_cents.abs
      previous_cents = recent_txns.second.amount_cents.abs

      next if previous_cents == 0
      change_pct = ((latest_cents - previous_cents).to_f / previous_cents * 100).round(0)

      next if change_pct.abs < 5  # Ignore tiny changes

      if change_pct > 0
        insights << {
          type: 'subscription_change',
          severity: change_pct > 20 ? 'warning' : 'info',
          title: "#{item.merchant_name} charge increased",
          message: "Your #{item.merchant_name} charge went from $#{'%.2f' % (previous_cents / 100.0)} " \
                   "to $#{'%.2f' % (latest_cents / 100.0)} (#{change_pct > 0 ? '+' : ''}#{change_pct}%).",
          amount: (latest_cents - previous_cents) / 100.0,
          category_id: item.category_id,
          category_name: item.category&.name,
          icon: nil,
          metadata: { merchant: item.merchant_name, previous: previous_cents / 100.0, current: latest_cents / 100.0, change_pct: change_pct }
        }
      elsif change_pct < -10
        insights << {
          type: 'subscription_change',
          severity: 'positive',
          title: "#{item.merchant_name} charge decreased",
          message: "Your #{item.merchant_name} charge dropped from $#{'%.2f' % (previous_cents / 100.0)} " \
                   "to $#{'%.2f' % (latest_cents / 100.0)} (#{change_pct}%).",
          amount: (latest_cents - previous_cents) / 100.0,
          category_id: item.category_id,
          category_name: item.category&.name,
          icon: nil,
          metadata: { merchant: item.merchant_name, previous: previous_cents / 100.0, current: latest_cents / 100.0, change_pct: change_pct }
        }
      end
    end

    insights
  end

  # ── Merchant spending spikes ──────────────────────────────────
  # Individual merchants where this month's spending is 2x+ the average.
  def merchant_spikes
    current_month_start = Date.current.beginning_of_month
    lookback_start = current_month_start - LOOKBACK_MONTHS.months

    avg_by_merchant = household.transactions
      .where(date: lookback_start...current_month_start)
      .where('amount_cents < 0')
      .where.not(merchant_name: [nil, ''])
      .group(:merchant_name)
      .sum('ABS(amount_cents)')
      .transform_values { |t| t.to_f / LOOKBACK_MONTHS }

    current_by_merchant = household.transactions
      .where(date: current_month_start..Date.current)
      .where('amount_cents < 0')
      .where.not(merchant_name: [nil, ''])
      .group(:merchant_name)
      .sum('ABS(amount_cents)')

    insights = []

    current_by_merchant.each do |merchant, current_cents|
      avg_cents = avg_by_merchant[merchant]
      next unless avg_cents && avg_cents > 500  # Ignore merchants with < $5 avg
      ratio = current_cents.to_f / avg_cents
      next unless ratio >= MERCHANT_SPIKE_THRESHOLD

      pct_over = ((ratio - 1) * 100).round(0)
      insights << {
        type: 'merchant_spike',
        severity: 'info',
        title: "Unusual spending at #{merchant}",
        message: "You've spent $#{'%.2f' % (current_cents / 100.0)} at #{merchant} this month — " \
                 "#{pct_over}% more than your usual $#{'%.2f' % (avg_cents / 100.0)}/month.",
        amount: (current_cents - avg_cents) / 100.0,
        category_id: nil,
        category_name: nil,
        icon: nil,
        metadata: { merchant: merchant, current: current_cents / 100.0, average: avg_cents / 100.0, ratio: ratio.round(2) }
      }
    end

    # Only return top 3 merchant spikes to avoid noise
    insights.sort_by { |i| -(i[:amount] || 0) }.first(3)
  end

  # ── Savings opportunities ─────────────────────────────────────
  # Discretionary categories with consistently high spending where cuts could help.
  def savings_opportunities
    current_month_start = Date.current.beginning_of_month
    lookback_start = current_month_start - LOOKBACK_MONTHS.months

    discretionary = %w[entertainment food\ &\ dining shopping personal\ care subscriptions dining\ out].freeze

    avg_by_category = household.transactions
      .where(date: lookback_start...current_month_start)
      .where('amount_cents < 0')
      .joins(:category)
      .where('LOWER(categories.name) IN (?)', discretionary)
      .group(:category_id)
      .sum('ABS(amount_cents)')
      .transform_values { |t| t.to_f / LOOKBACK_MONTHS }

    categories = Category.where(id: avg_by_category.keys).index_by(&:id)
    total_expenses = household.transactions
      .where(date: lookback_start...current_month_start)
      .where('amount_cents < 0')
      .sum('ABS(amount_cents)')
      .to_f / LOOKBACK_MONTHS

    insights = []

    avg_by_category.each do |cat_id, avg_cents|
      next if total_expenses == 0
      pct_of_total = (avg_cents / total_expenses * 100).round(1)
      next unless pct_of_total >= 15  # Only flag if 15%+ of total spending

      cat = categories[cat_id]
      next unless cat

      potential_savings = (avg_cents * 0.2) / 100.0  # 20% reduction potential

      insights << {
        type: 'savings_opportunity',
        severity: 'info',
        title: "#{cat.name} is #{pct_of_total}% of your spending",
        message: "You spend an average of $#{'%.0f' % (avg_cents / 100.0)}/month on #{cat.name}. " \
                 "A 20% reduction would save ~$#{'%.0f' % potential_savings}/month ($#{'%.0f' % (potential_savings * 12)}/year).",
        amount: potential_savings,
        category_id: cat_id,
        category_name: cat.name,
        icon: cat.icon,
        metadata: { avg_monthly: avg_cents / 100.0, pct_of_total: pct_of_total, annual_savings: (potential_savings * 12).round(0) }
      }
    end

    insights
  end

  # ── Income changes ────────────────────────────────────────────
  def income_insights
    current_month_start = Date.current.beginning_of_month
    current_month_end = current_month_start.end_of_month
    lookback_start = current_month_start - LOOKBACK_MONTHS.months

    avg_income = household.transactions
      .where(date: lookback_start...current_month_start)
      .where('amount_cents > 0')
      .sum(:amount_cents)
      .to_f / LOOKBACK_MONTHS

    current_income = household.transactions
      .where(date: current_month_start..current_month_end)
      .where('amount_cents > 0')
      .sum(:amount_cents)

    return [] if avg_income <= 0

    # Project income to end of month to avoid false positives early in the month
    days_elapsed = [(Date.current - current_month_start).to_i + 1, 1].max
    days_in_month = (current_month_end - current_month_start).to_i + 1
    projected_income = (current_income.to_f / days_elapsed * days_in_month).round

    change_pct = ((projected_income - avg_income) / avg_income).round(2)

    return [] if change_pct.abs < INCOME_CHANGE_THRESHOLD

    if change_pct > 0
      [{
        type: 'income_change',
        severity: 'positive',
        title: "Income is up #{(change_pct * 100).round(0)}% this month",
        message: "You've received $#{'%.0f' % (current_income / 100.0)} in income so far " \
                 "(on pace for ~$#{'%.0f' % (projected_income / 100.0)}), " \
                 "compared to your #{LOOKBACK_MONTHS}-month average of $#{'%.0f' % (avg_income / 100.0)}.",
        amount: (projected_income - avg_income) / 100.0,
        category_id: nil,
        category_name: nil,
        icon: nil,
        metadata: { current: current_income / 100.0, projected: projected_income / 100.0, average: avg_income / 100.0, change_pct: (change_pct * 100).round(1) }
      }]
    else
      [{
        type: 'income_change',
        severity: 'warning',
        title: "Income is down #{(change_pct.abs * 100).round(0)}% this month",
        message: "You've received $#{'%.0f' % (current_income / 100.0)} in income so far " \
                 "(on pace for ~$#{'%.0f' % (projected_income / 100.0)}), " \
                 "compared to your #{LOOKBACK_MONTHS}-month average of $#{'%.0f' % (avg_income / 100.0)}.",
        amount: (projected_income - avg_income) / 100.0,
        category_id: nil,
        category_name: nil,
        icon: nil,
        metadata: { current: current_income / 100.0, projected: projected_income / 100.0, average: avg_income / 100.0, change_pct: (change_pct * 100).round(1) }
      }]
    end
  end

  # ── Uncategorized transaction alerts ──────────────────────────
  def uncategorized_alerts
    count = household.transactions
      .where(category_id: nil)
      .where(date: 30.days.ago..Date.current)
      .count

    return [] if count < UNCATEGORIZED_THRESHOLD

    [{
      type: 'uncategorized_alert',
      severity: count >= 20 ? 'warning' : 'info',
      title: "#{count} uncategorized transactions",
      message: "You have #{count} transactions from the last 30 days without a category. " \
               "Categorizing them improves your budget tracking and reports.",
      amount: nil,
      category_id: nil,
      category_name: nil,
      icon: nil,
      metadata: { count: count }
    }]
  end
end
