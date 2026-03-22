# Calculates a financial health score (0-100) based on multiple factors:
# - Savings rate (income - expenses / income)
# - Budget adherence (% of budget items within limit)
# - Debt-to-asset ratio
# - Emergency fund coverage (liquid assets / monthly expenses)
# - Net worth trend (positive growth over time)

class Analytics::FinancialHealthService < ApplicationService
  attr_accessor :household

  WEIGHTS = {
    savings_rate: 25,
    budget_adherence: 20,
    debt_ratio: 20,
    emergency_fund: 20,
    net_worth_trend: 15
  }.freeze

  def call
    return failure(['Household is required']) unless household

    components = calculate_components
    overall_score = components.sum { |c| c[:weighted_score] }.round

    success(
      score: [[overall_score, 0].max, 100].min,
      grade: score_to_grade(overall_score),
      components: components,
      recommendations: generate_recommendations(components)
    )
  end

  private

  def calculate_components
    [
      savings_rate_component,
      budget_adherence_component,
      debt_ratio_component,
      emergency_fund_component,
      net_worth_trend_component
    ]
  end

  # Savings rate: (income - expenses) / income
  # 20%+ = 100, 10-20% = 70-100, 0-10% = 30-70, negative = 0-30
  def savings_rate_component
    now = Date.current
    start_date = now.beginning_of_month - 2.months
    end_date = now.end_of_month

    transactions = household.transactions
      .where(date: start_date..end_date)
      .where(excluded: [false, nil])

    income = transactions.joins(:category).where(categories: { is_income: true }).sum(:amount_cents).abs
    transfer_category_ids = household.categories.where("LOWER(name) = 'transfer'").pluck(:id)
    expenses = transactions.joins(:category)
      .where(categories: { is_income: false })
      .where.not(category_id: transfer_category_ids)
      .sum(:amount_cents).abs

    if income <= 0
      raw_score = 50 # Can't calculate without income data
      rate = 0.0
      status = 'no_data'
    else
      rate = ((income - expenses).to_f / income * 100).round(1)
      raw_score = if rate >= 20
                    100
                  elsif rate >= 10
                    70 + ((rate - 10) / 10.0 * 30).round
                  elsif rate >= 0
                    30 + ((rate / 10.0) * 40).round
                  else
                    [0, 30 + (rate / 10.0 * 30)].max.round
                  end
      status = rate >= 20 ? 'excellent' : rate >= 10 ? 'good' : rate >= 0 ? 'needs_work' : 'critical'
    end

    {
      name: 'savings_rate',
      label: 'Savings Rate',
      raw_score: raw_score,
      weight: WEIGHTS[:savings_rate],
      weighted_score: (raw_score * WEIGHTS[:savings_rate] / 100.0).round(1),
      details: { rate: rate, monthly_income: income / 100.0, monthly_expenses: expenses / 100.0 },
      status: status
    }
  end

  # Budget adherence: % of budget categories where spending <= budgeted
  def budget_adherence_component
    month_start = Date.current.beginning_of_month
    month_end = month_start.end_of_month
    budget_items = BudgetItem.joins(:budget)
      .where(budgets: { household_id: household.id })
      .where(month: month_start)
      .includes(:category)

    if budget_items.empty?
      return {
        name: 'budget_adherence',
        label: 'Budget Adherence',
        raw_score: 50,
        weight: WEIGHTS[:budget_adherence],
        weighted_score: (50 * WEIGHTS[:budget_adherence] / 100.0).round(1),
        details: { on_track: 0, over_budget: 0, total: 0 },
        status: 'no_data'
      }
    end

    on_track = 0
    over_budget = 0

    budget_items.each do |item|
      next if item.amount_cents <= 0

      spent = household.transactions
        .where(category_id: item.category_id, date: month_start..month_end)
        .where(excluded: [false, nil])
        .sum(:amount_cents).abs

      if spent <= item.amount_cents
        on_track += 1
      else
        over_budget += 1
      end
    end

    total = on_track + over_budget
    adherence_pct = total > 0 ? (on_track.to_f / total * 100).round(1) : 0
    raw_score = adherence_pct.round

    {
      name: 'budget_adherence',
      label: 'Budget Adherence',
      raw_score: raw_score,
      weight: WEIGHTS[:budget_adherence],
      weighted_score: (raw_score * WEIGHTS[:budget_adherence] / 100.0).round(1),
      details: { on_track: on_track, over_budget: over_budget, total: total, adherence_pct: adherence_pct },
      status: adherence_pct >= 80 ? 'excellent' : adherence_pct >= 60 ? 'good' : adherence_pct >= 40 ? 'needs_work' : 'critical'
    }
  end

  # Debt-to-asset ratio: lower is better
  # 0% = 100, <25% = 80-100, 25-50% = 50-80, 50-75% = 25-50, >75% = 0-25
  def debt_ratio_component
    accounts = household.accounts.where(is_hidden: [false, nil])
    assets = accounts.where(account_type: %w[checking savings investment other_asset]).sum(:current_balance_cents).abs
    liabilities = accounts.where(account_type: %w[credit_card loan other_liability]).sum(:current_balance_cents).abs

    if assets <= 0 && liabilities <= 0
      return {
        name: 'debt_ratio',
        label: 'Debt-to-Asset Ratio',
        raw_score: 50,
        weight: WEIGHTS[:debt_ratio],
        weighted_score: (50 * WEIGHTS[:debt_ratio] / 100.0).round(1),
        details: { assets: 0, liabilities: 0, ratio: 0 },
        status: 'no_data'
      }
    end

    ratio = assets > 0 ? (liabilities.to_f / assets * 100).round(1) : 100.0
    raw_score = if ratio <= 0
                  100
                elsif ratio <= 25
                  80 + ((25 - ratio) / 25.0 * 20).round
                elsif ratio <= 50
                  50 + ((50 - ratio) / 25.0 * 30).round
                elsif ratio <= 75
                  25 + ((75 - ratio) / 25.0 * 25).round
                else
                  [0, (25 - (ratio - 75) / 4.0)].max.round
                end

    {
      name: 'debt_ratio',
      label: 'Debt-to-Asset Ratio',
      raw_score: [[raw_score, 0].max, 100].min,
      weight: WEIGHTS[:debt_ratio],
      weighted_score: ([[raw_score, 0].max, 100].min * WEIGHTS[:debt_ratio] / 100.0).round(1),
      details: { assets: assets / 100.0, liabilities: liabilities / 100.0, ratio: ratio },
      status: ratio <= 25 ? 'excellent' : ratio <= 50 ? 'good' : ratio <= 75 ? 'needs_work' : 'critical'
    }
  end

  # Emergency fund: months of expenses covered by liquid assets
  # 6+ months = 100, 3-6 = 60-100, 1-3 = 30-60, <1 = 0-30
  def emergency_fund_component
    liquid_accounts = household.accounts.where(is_hidden: [false, nil], account_type: %w[checking savings])
    liquid_balance = liquid_accounts.sum(:current_balance_cents).abs

    # Calculate average monthly expenses (last 3 months)
    now = Date.current
    start_date = now.beginning_of_month - 2.months
    end_date = now.end_of_month
    months_count = 3.0

    transfer_cat_ids = household.categories.where("LOWER(name) = 'transfer'").pluck(:id)
    total_expenses = household.transactions
      .where(date: start_date..end_date)
      .where(excluded: [false, nil])
      .joins(:category)
      .where(categories: { is_income: false })
      .where.not(category_id: transfer_cat_ids)
      .sum(:amount_cents).abs

    monthly_expenses = total_expenses / months_count

    if monthly_expenses <= 0
      return {
        name: 'emergency_fund',
        label: 'Emergency Fund',
        raw_score: 50,
        weight: WEIGHTS[:emergency_fund],
        weighted_score: (50 * WEIGHTS[:emergency_fund] / 100.0).round(1),
        details: { liquid_balance: liquid_balance / 100.0, monthly_expenses: 0, months_covered: 0 },
        status: 'no_data'
      }
    end

    months_covered = (liquid_balance.to_f / monthly_expenses).round(1)
    raw_score = if months_covered >= 6
                  100
                elsif months_covered >= 3
                  60 + ((months_covered - 3) / 3.0 * 40).round
                elsif months_covered >= 1
                  30 + ((months_covered - 1) / 2.0 * 30).round
                else
                  (months_covered * 30).round
                end

    {
      name: 'emergency_fund',
      label: 'Emergency Fund',
      raw_score: [[raw_score, 0].max, 100].min,
      weight: WEIGHTS[:emergency_fund],
      weighted_score: ([[raw_score, 0].max, 100].min * WEIGHTS[:emergency_fund] / 100.0).round(1),
      details: { liquid_balance: liquid_balance / 100.0, monthly_expenses: monthly_expenses / 100.0, months_covered: months_covered },
      status: months_covered >= 6 ? 'excellent' : months_covered >= 3 ? 'good' : months_covered >= 1 ? 'needs_work' : 'critical'
    }
  end

  # Net worth trend: positive growth over last 3 months
  def net_worth_trend_component
    snapshots = AccountBalanceHistory
      .where(account: household.accounts)
      .where('date >= ?', 3.months.ago)
      .order(:date)

    if snapshots.count < 2
      return {
        name: 'net_worth_trend',
        label: 'Net Worth Trend',
        raw_score: 50,
        weight: WEIGHTS[:net_worth_trend],
        weighted_score: (50 * WEIGHTS[:net_worth_trend] / 100.0).round(1),
        details: { change_amount: 0, change_pct: 0, trend: 'insufficient_data' },
        status: 'no_data'
      }
    end

    # Calculate net worth at earliest and latest snapshots
    earliest_date = snapshots.first.date
    latest_date = snapshots.last.date

    earliest_nw = net_worth_at_date(snapshots, earliest_date)
    latest_nw = net_worth_at_date(snapshots, latest_date)

    change = latest_nw - earliest_nw
    change_pct = earliest_nw != 0 ? (change.to_f / earliest_nw.abs * 100).round(1) : 0

    # Score: strong growth = 100, moderate = 70, flat = 50, decline = 0-30
    raw_score = if change_pct >= 5
                  100
                elsif change_pct >= 2
                  70 + ((change_pct - 2) / 3.0 * 30).round
                elsif change_pct >= 0
                  50 + ((change_pct / 2.0) * 20).round
                elsif change_pct >= -5
                  20 + ((change_pct + 5) / 5.0 * 30).round
                else
                  [0, (20 + change_pct).round].max
                end

    trend = change_pct >= 2 ? 'growing' : change_pct >= -2 ? 'stable' : 'declining'

    {
      name: 'net_worth_trend',
      label: 'Net Worth Trend',
      raw_score: [[raw_score, 0].max, 100].min,
      weight: WEIGHTS[:net_worth_trend],
      weighted_score: ([[raw_score, 0].max, 100].min * WEIGHTS[:net_worth_trend] / 100.0).round(1),
      details: { change_amount: change / 100.0, change_pct: change_pct, trend: trend },
      status: trend == 'growing' ? 'excellent' : trend == 'stable' ? 'good' : 'needs_work'
    }
  end

  def net_worth_at_date(snapshots, date)
    snapshots
      .select { |s| s.date == date }
      .sum { |s| s.current_balance_cents || 0 }
  end

  def score_to_grade(score)
    case score
    when 90..100 then 'A'
    when 80..89 then 'B'
    when 70..79 then 'C'
    when 60..69 then 'D'
    else 'F'
    end
  end

  def generate_recommendations(components)
    recs = []

    components.each do |comp|
      case comp[:status]
      when 'critical'
        recs << recommendation_for(comp[:name], :critical, comp[:details])
      when 'needs_work'
        recs << recommendation_for(comp[:name], :needs_work, comp[:details])
      end
    end

    # Add positive reinforcement for excellent areas
    excellent = components.select { |c| c[:status] == 'excellent' }
    if excellent.any?
      recs << {
        type: 'positive',
        message: "Great job on #{excellent.map { |c| c[:label].downcase }.join(' and ')}! Keep it up."
      }
    end

    recs.compact
  end

  def recommendation_for(name, severity, details)
    messages = {
      savings_rate: {
        critical: "Your expenses exceed your income. Review spending categories to find areas to cut back.",
        needs_work: "Aim to save at least 20% of your income. You're currently at #{details[:rate]}%."
      },
      budget_adherence: {
        critical: "Most budget categories are over budget. Consider adjusting your budget to be more realistic, or reduce spending.",
        needs_work: "#{details[:over_budget]} of #{details[:total]} budget categories are over limit. Focus on the biggest overages first."
      },
      debt_ratio: {
        critical: "Your debt-to-asset ratio is #{details[:ratio]}%. Focus on paying down high-interest debt first.",
        needs_work: "Your debt-to-asset ratio is #{details[:ratio]}%. Consider accelerating debt payments."
      },
      emergency_fund: {
        critical: "You have less than 1 month of expenses saved. Prioritize building an emergency fund.",
        needs_work: "You have #{details[:months_covered]} months of expenses covered. Aim for 3-6 months."
      },
      net_worth_trend: {
        critical: "Your net worth has been declining. Review your spending and saving habits.",
        needs_work: "Your net worth growth is flat. Look for ways to increase savings or reduce debt."
      }
    }

    msg = messages[name.to_sym]&.dig(severity)
    return nil unless msg

    { type: severity.to_s, category: name, message: msg }
  end
end
