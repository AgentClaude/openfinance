# FIRE (Financial Independence, Retire Early) Calculator
# Uses real household data to project:
# - Current savings rate
# - Time to financial independence
# - FIRE number (25x annual expenses — the 4% rule)
# - Coast FIRE number (investments that will grow to FIRE number by traditional retirement)
# - Projected portfolio growth over time
# - Scenario comparisons (different savings rates, return rates)

class Analytics::FireCalculatorService < ApplicationService
  attr_accessor :household, :annual_return_rate, :withdrawal_rate,
                :retirement_age, :inflation_rate, :current_age

  DEFAULT_ANNUAL_RETURN = 7.0    # historical S&P 500 real return
  DEFAULT_WITHDRAWAL_RATE = 4.0  # the 4% rule
  DEFAULT_INFLATION_RATE = 3.0   # long-term average
  DEFAULT_RETIREMENT_AGE = 65
  DEFAULT_CURRENT_AGE = 30

  def call
    unless household
      return failure('Household is required')
    end

    annual_return = (annual_return_rate || DEFAULT_ANNUAL_RETURN).to_f / 100
    withdrawal = (withdrawal_rate || DEFAULT_WITHDRAWAL_RATE).to_f / 100
    inflation = (inflation_rate || DEFAULT_INFLATION_RATE).to_f / 100
    ret_age = (retirement_age || DEFAULT_RETIREMENT_AGE).to_i
    cur_age = (current_age || DEFAULT_CURRENT_AGE).to_i
    real_return = annual_return - inflation

    financials = calculate_financials
    fire_number = calculate_fire_number(financials[:annual_expenses], withdrawal)
    coast_fire = calculate_coast_fire(fire_number, financials[:invested_assets], real_return, ret_age, cur_age)
    years_to_fire = calculate_years_to_fire(
      financials[:invested_assets], financials[:annual_savings], real_return, fire_number
    )
    projections = build_projections(
      financials[:invested_assets], financials[:annual_savings], real_return, fire_number, cur_age
    )
    scenarios = build_scenarios(financials, real_return, fire_number)
    milestones = build_milestones(financials, fire_number, coast_fire[:amount], cur_age)

    success(
      summary: {
        fire_number: fire_number.round(0),
        coast_fire_number: coast_fire[:amount].round(0),
        coast_fire_age: coast_fire[:age],
        years_to_fire: years_to_fire,
        fire_age: years_to_fire ? (cur_age + years_to_fire).clamp(cur_age, 150) : nil,
        savings_rate: financials[:savings_rate],
        monthly_savings: financials[:monthly_savings].round(0),
        progress_percent: calculate_progress(financials[:invested_assets], fire_number),
        current_age: cur_age,
        retirement_age: ret_age,
        withdrawal_rate: (withdrawal * 100).round(1),
        annual_return_rate: (annual_return * 100).round(1),
        inflation_rate: (inflation * 100).round(1)
      },
      financials: {
        monthly_income: financials[:monthly_income].round(0),
        monthly_expenses: financials[:monthly_expenses].round(0),
        monthly_savings: financials[:monthly_savings].round(0),
        annual_income: financials[:annual_income].round(0),
        annual_expenses: financials[:annual_expenses].round(0),
        annual_savings: financials[:annual_savings].round(0),
        invested_assets: financials[:invested_assets].round(0),
        total_net_worth: financials[:total_net_worth].round(0)
      },
      projections: projections,
      scenarios: scenarios,
      milestones: milestones,
      tips: generate_tips(financials, fire_number, years_to_fire)
    )
  end

  private

  def calculate_financials
    months = 6
    start_date = months.months.ago.beginning_of_month
    end_date = Date.current.end_of_month

    transactions = household.transactions
      .where(date: start_date..end_date)
      .where(excluded: [false, nil])
      .where(is_transfer: [false, nil])

    income_total = transactions.joins(:category)
      .where(categories: { is_income: true })
      .sum(:amount_cents).abs

    transfer_category_ids = household.categories.where("LOWER(name) = 'transfer'").pluck(:id)
    expense_total = transactions.joins(:category)
      .where(categories: { is_income: false })
      .where.not(category_id: transfer_category_ids)
      .sum(:amount_cents).abs

    month_count = [months, ((Date.current - start_date.to_date) / 30.0).ceil].min
    month_count = [month_count, 1].max

    monthly_income = income_total.to_f / month_count / 100
    monthly_expenses = expense_total.to_f / month_count / 100
    monthly_savings = monthly_income - monthly_expenses

    savings_rate = if monthly_income > 0
                    ((monthly_savings / monthly_income) * 100).round(1)
                  else
                    0.0
                  end

    # Investment assets (brokerage, retirement accounts)
    investment_accounts = household.accounts.where(
      account_type: %w[investment brokerage retirement 401k ira roth_ira]
    ).where(is_hidden: [false, nil])
    invested_assets = investment_accounts.sum(:current_balance_cents).to_f / 100

    # Total net worth
    all_accounts = household.accounts.where(is_hidden: [false, nil])
    assets = all_accounts.where("current_balance_cents >= 0").sum(:current_balance_cents).to_f / 100
    liabilities = all_accounts.where("current_balance_cents < 0").sum(:current_balance_cents).abs.to_f / 100
    total_net_worth = assets - liabilities

    {
      monthly_income: monthly_income,
      monthly_expenses: monthly_expenses,
      monthly_savings: monthly_savings,
      annual_income: monthly_income * 12,
      annual_expenses: monthly_expenses * 12,
      annual_savings: monthly_savings * 12,
      savings_rate: savings_rate,
      invested_assets: invested_assets,
      total_net_worth: total_net_worth
    }
  end

  # FIRE number = annual expenses / withdrawal rate
  def calculate_fire_number(annual_expenses, withdrawal_rate)
    return 0 if withdrawal_rate <= 0 || annual_expenses <= 0
    annual_expenses / withdrawal_rate
  end

  # Coast FIRE = amount needed now that will grow to FIRE number by retirement age
  def calculate_coast_fire(fire_number, current_investments, real_return, retirement_age, current_age)
    years_to_retirement = [retirement_age - current_age, 0].max
    return { amount: fire_number, age: current_age } if years_to_retirement <= 0
    return { amount: 0, age: current_age } if real_return <= 0

    coast_amount = fire_number / ((1 + real_return) ** years_to_retirement)

    # Calculate coast FIRE age (when current investments will have grown enough)
    coast_age = if current_investments >= coast_amount
                  current_age
                elsif current_investments > 0 && real_return > 0
                  years_needed = Math.log(fire_number / current_investments) / Math.log(1 + real_return)
                  retirement_age - years_needed.ceil
                else
                  nil
                end

    { amount: coast_amount.round(0), age: coast_age&.round(0)&.clamp(current_age, retirement_age) }
  end

  # Years to reach FIRE number given current savings + investment growth
  def calculate_years_to_fire(current_investments, annual_savings, real_return, fire_number)
    return nil if fire_number <= 0
    return 0 if current_investments >= fire_number
    return nil if annual_savings <= 0 && real_return <= 0

    # FV = PV(1+r)^n + PMT * ((1+r)^n - 1) / r
    # Solve for n iteratively
    balance = current_investments.to_f
    (1..100).each do |year|
      balance = balance * (1 + real_return) + annual_savings
      return year if balance >= fire_number
    end

    nil # More than 100 years
  end

  def calculate_progress(invested_assets, fire_number)
    return 0.0 if fire_number <= 0
    [(invested_assets / fire_number * 100).round(1), 100.0].min
  end

  # Build year-by-year portfolio projections
  def build_projections(current_investments, annual_savings, real_return, fire_number, current_age)
    projections = []
    balance = current_investments.to_f
    fire_reached = false

    (0..50).each do |year|
      age = current_age + year

      projections << {
        year: year,
        age: age,
        portfolio_value: balance.round(0),
        fire_number: fire_number.round(0),
        is_fire_reached: balance >= fire_number && !fire_reached.tap { fire_reached = balance >= fire_number }
      }

      balance = balance * (1 + real_return) + annual_savings
      break if year > 5 && balance >= fire_number * 2
    end

    projections
  end

  # Compare different savings rate scenarios
  def build_scenarios(financials, real_return, fire_number)
    return [] if financials[:monthly_income] <= 0

    [10, 20, 30, 40, 50, 60, 70].map do |rate|
      annual_savings = financials[:annual_income] * rate / 100.0
      years = calculate_years_to_fire(
        financials[:invested_assets], annual_savings, real_return, fire_number
      )

      {
        savings_rate: rate,
        monthly_savings: (annual_savings / 12).round(0),
        years_to_fire: years,
        is_current: rate == financials[:savings_rate].round(-1).to_i
      }
    end
  end

  def build_milestones(financials, fire_number, coast_fire_number, current_age)
    milestones = []
    invested = financials[:invested_assets]

    [
      { name: 'Emergency Fund (6 months)', target: financials[:monthly_expenses] * 6 },
      { name: 'Coast FIRE', target: coast_fire_number },
      { name: '25% to FIRE', target: fire_number * 0.25 },
      { name: '50% to FIRE (Halfway)', target: fire_number * 0.50 },
      { name: '75% to FIRE', target: fire_number * 0.75 },
      { name: '100% FIRE 🔥', target: fire_number }
    ].each do |m|
      next if m[:target] <= 0

      milestones << {
        name: m[:name],
        target: m[:target].round(0),
        current: invested.round(0),
        reached: invested >= m[:target],
        percent: [(invested / m[:target] * 100).round(1), 100.0].min
      }
    end

    milestones
  end

  def generate_tips(financials, fire_number, years_to_fire)
    tips = []

    if financials[:savings_rate] < 15
      tips << {
        category: 'savings',
        title: 'Boost your savings rate',
        description: "Your savings rate is #{financials[:savings_rate]}%. Increasing to 20% could significantly reduce your time to FIRE. Even small increases compound dramatically over time."
      }
    end

    if financials[:savings_rate] >= 50
      tips << {
        category: 'savings',
        title: 'Impressive savings rate!',
        description: "At #{financials[:savings_rate]}% savings rate, you're on an accelerated path to FIRE. Consider optimizing your investment allocation for maximum growth."
      }
    end

    if years_to_fire && years_to_fire > 30
      tips << {
        category: 'strategy',
        title: 'Focus on income growth',
        description: "With #{years_to_fire}+ years to FIRE, increasing income will have the biggest impact. Side hustles, skill development, or career changes can accelerate your timeline."
      }
    end

    if financials[:invested_assets] < financials[:monthly_expenses] * 6
      tips << {
        category: 'foundation',
        title: 'Build your emergency fund first',
        description: "Before aggressive investing, ensure you have 3-6 months of expenses in a liquid savings account. You have #{(financials[:invested_assets] / [financials[:monthly_expenses], 1].max).round(1)} months covered."
      }
    end

    if financials[:monthly_income] > 0 && financials[:savings_rate] > 0
      extra_500_savings = financials[:annual_savings] + 6000
      faster_years = calculate_years_to_fire(
        financials[:invested_assets], extra_500_savings, 0.04, fire_number
      )
      if faster_years && years_to_fire && faster_years < years_to_fire
        tips << {
          category: 'actionable',
          title: 'Save $500 more per month',
          description: "Adding $500/month to investments could reduce your FIRE timeline by #{years_to_fire - faster_years} years (from #{years_to_fire} to #{faster_years} years)."
        }
      end
    end

    tips << {
      category: 'education',
      title: 'The 4% Rule',
      description: "The FIRE number uses the 4% rule: you can safely withdraw 4% of your portfolio annually in retirement. A $1M portfolio provides ~$40,000/year. Adjust the withdrawal rate to see how it affects your number."
    }

    tips
  end
end
