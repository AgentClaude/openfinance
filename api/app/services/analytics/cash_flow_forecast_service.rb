# Generates a cash flow forecast by projecting future balances based on:
# 1. Current account balances (starting point)
# 2. Recurring items (known future income/expenses)
# 3. Historical spending averages by category (variable expenses)
#
# Returns daily projected balances and a list of forecast events.

class Analytics::CashFlowForecastService < ApplicationService
  attr_accessor :household, :days, :include_variable_spending

  validates :household, presence: true

  def initialize(household:, days: 90, include_variable_spending: true)
    super(household: household, days: days, include_variable_spending: include_variable_spending)
  end

  def call
    return failure('Household is required') unless household

    days_to_forecast = [days || 90, 365].min
    today = Date.current
    end_date = today + days_to_forecast.days

    # 1. Calculate starting balance from liquid accounts
    starting_balance = calculate_starting_balance

    # 2. Collect recurring events projected into the forecast window
    recurring_events = project_recurring_items(today, end_date)

    # 3. Estimate variable spending from historical averages
    variable_events = include_variable_spending ? estimate_variable_spending(today, end_date) : []

    # 4. Merge and sort all events
    all_events = (recurring_events + variable_events).sort_by { |e| e[:date] }

    # 5. Build daily balance projection
    daily_projections = build_daily_projections(today, end_date, starting_balance, all_events)

    # 6. Calculate summary stats
    min_balance_day = daily_projections.min_by { |d| d[:balance] }
    max_balance_day = daily_projections.max_by { |d| d[:balance] }
    total_projected_income = all_events.select { |e| e[:amount] > 0 }.sum { |e| e[:amount] }
    total_projected_expenses = all_events.select { |e| e[:amount] < 0 }.sum { |e| e[:amount].abs }

    # 7. Identify low balance warnings (below 10% of starting balance or negative)
    low_balance_threshold = [starting_balance * 0.1, 500].max
    warnings = daily_projections
      .select { |d| d[:balance] < low_balance_threshold }
      .first(5)
      .map do |d|
        {
          date: d[:date].iso8601,
          projected_balance: d[:balance].round(2),
          message: d[:balance] < 0 ? "Projected negative balance of $#{'%.2f' % d[:balance]}" : "Balance may drop below $#{'%.2f' % low_balance_threshold}"
        }
      end

    success(
      starting_balance: starting_balance.round(2),
      ending_balance: daily_projections.last&.dig(:balance)&.round(2) || starting_balance.round(2),
      forecast_days: days_to_forecast,
      total_projected_income: total_projected_income.round(2),
      total_projected_expenses: total_projected_expenses.round(2),
      net_cash_flow: (total_projected_income - total_projected_expenses).round(2),
      min_balance: min_balance_day&.dig(:balance)&.round(2) || starting_balance.round(2),
      min_balance_date: min_balance_day&.dig(:date)&.iso8601,
      max_balance: max_balance_day&.dig(:balance)&.round(2) || starting_balance.round(2),
      max_balance_date: max_balance_day&.dig(:date)&.iso8601,
      daily_projections: daily_projections.map { |d| serialize_day(d) },
      events: all_events.map { |e| serialize_event(e) },
      warnings: warnings
    )
  rescue StandardError => e
    Rails.logger.error "CashFlowForecastService error: #{e.message}\n#{e.backtrace&.first(5)&.join("\n")}"
    failure("Failed to generate forecast: #{e.message}")
  end

  private

  def calculate_starting_balance
    liquid_types = %w[checking savings money_market depository]
    accounts = household.accounts.where(is_hidden: false)

    # Liquid accounts (checking/savings) provide the baseline
    liquid = accounts.where(account_type: liquid_types)
    liquid_balance = liquid.sum(:current_balance_cents) / 100.0

    # If no liquid accounts, use all non-investment, non-liability accounts
    if liquid_balance == 0 && liquid.empty?
      non_investment_types = %w[checking savings money_market depository other_asset]
      liquid_balance = accounts.where(account_type: non_investment_types).sum(:current_balance_cents) / 100.0
    end

    liquid_balance
  end

  def project_recurring_items(start_date, end_date)
    events = []
    items = household.recurring_items.active.where.not(next_occurrence: nil)

    items.find_each do |item|
      occurrences = project_occurrences(item, start_date, end_date)
      occurrences.each do |date|
        amount = item.is_income? ? item.amount.abs : -item.amount.abs
        events << {
          date: date,
          amount: amount,
          name: item.name,
          category_name: item.category&.name,
          source: 'recurring',
          recurring_item_id: item.id,
          confidence: 0.9
        }
      end
    end

    events
  end

  def project_occurrences(item, start_date, end_date)
    dates = []
    current = item.next_occurrence

    # If next_occurrence is before start_date, advance it
    while current < start_date
      current = advance_date(current, item.frequency, item.frequency_interval || 1)
    end

    # Generate occurrences up to end_date (cap at 100 to prevent runaway)
    count = 0
    while current <= end_date && count < 100
      dates << current
      current = advance_date(current, item.frequency, item.frequency_interval || 1)
      count += 1
    end

    dates
  end

  def advance_date(date, frequency, interval)
    case frequency
    when 'weekly'
      date + (7 * interval).days
    when 'biweekly'
      date + (14 * interval).days
    when 'monthly'
      date + interval.months
    when 'quarterly'
      date + (3 * interval).months
    when 'yearly'
      date + interval.years
    else
      date + interval.months
    end
  end

  def estimate_variable_spending(start_date, end_date)
    events = []

    # Get 3-month historical averages by category (excluding recurring-linked transactions)
    lookback_start = 3.months.ago.to_date.beginning_of_month
    lookback_end = Date.current.prev_month.end_of_month

    # Only estimate if we have at least 1 month of history
    return events if lookback_end < lookback_start

    months_of_history = ((lookback_end.year * 12 + lookback_end.month) -
                         (lookback_start.year * 12 + lookback_start.month)) + 1

    # Get expense transactions grouped by category
    expense_txns = household.transactions
      .where(date: lookback_start..lookback_end)
      .where('amount_cents < 0')
      .where(is_recurring: [false, nil])
      .where(is_transfer: [false, nil])

    # Sum by category
    category_totals = expense_txns
      .group(:category_id)
      .sum(:amount_cents)
      .transform_values { |v| (v.abs / 100.0) / months_of_history }

    # Get category names
    categories = Category.where(id: category_totals.keys).index_by(&:id)

    # Skip categories that are already covered by recurring items
    recurring_category_ids = household.recurring_items.active.where.not(category_id: nil).pluck(:category_id).uniq

    # Generate monthly variable spending events (distributed mid-month)
    current_month = start_date.beginning_of_month
    while current_month <= end_date
      category_totals.each do |cat_id, monthly_avg|
        next if monthly_avg < 5 # Skip negligible categories
        next if recurring_category_ids.include?(cat_id)

        cat = categories[cat_id]
        # Place variable spending at the 15th of each month (approximate)
        event_date = [current_month + 14.days, end_date].min
        next if event_date < start_date

        events << {
          date: event_date,
          amount: -monthly_avg.round(2),
          name: "Est. #{cat&.name || 'Uncategorized'} spending",
          category_name: cat&.name,
          source: 'estimated',
          recurring_item_id: nil,
          confidence: 0.6
        }
      end
      current_month = current_month.next_month
    end

    events
  end

  def build_daily_projections(start_date, end_date, starting_balance, events)
    # Group events by date
    events_by_date = events.group_by { |e| e[:date] }

    projections = []
    balance = starting_balance
    current = start_date

    while current <= end_date
      day_events = events_by_date[current] || []
      day_income = day_events.select { |e| e[:amount] > 0 }.sum { |e| e[:amount] }
      day_expenses = day_events.select { |e| e[:amount] < 0 }.sum { |e| e[:amount].abs }
      day_net = day_income - day_expenses
      balance += day_net

      projections << {
        date: current,
        balance: balance.round(2),
        income: day_income.round(2),
        expenses: day_expenses.round(2),
        net: day_net.round(2),
        event_count: day_events.size
      }

      current += 1.day
    end

    projections
  end

  def serialize_day(day)
    {
      date: day[:date].iso8601,
      balance: day[:balance],
      income: day[:income],
      expenses: day[:expenses],
      net: day[:net],
      event_count: day[:event_count]
    }
  end

  def serialize_event(event)
    {
      date: event[:date].iso8601,
      amount: event[:amount],
      name: event[:name],
      category_name: event[:category_name],
      source: event[:source],
      recurring_item_id: event[:recurring_item_id],
      confidence: event[:confidence]
    }
  end
end
