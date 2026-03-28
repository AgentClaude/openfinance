# Calculates debt payoff plans using snowball and avalanche strategies.
#
# Snowball: pay minimums on all debts, throw extra at the smallest balance first.
# Avalanche: pay minimums on all debts, throw extra at the highest interest rate first.
#
# Returns month-by-month projections for each strategy, total interest paid,
# payoff dates, and interest savings comparison.

class Debt::PayoffPlannerService < ApplicationService
  attr_accessor :household, :extra_payment_cents, :strategy

  validates :household, presence: true

  MAX_MONTHS = 360 # 30-year cap to prevent infinite loops

  def call
    return validation_failure(self) unless valid?

    debts = load_debts
    return failure('No debt accounts found') if debts.empty?

    snowball_plan = calculate_plan(debts, :snowball)
    avalanche_plan = calculate_plan(debts, :avalanche)
    minimum_plan = calculate_plan(debts, :minimum_only)

    extra = extra_payment_cents || 0
    total_debt = debts.sum { |d| d[:balance_cents] }

    success(
      debts: debts.map { |d| debt_summary(d) },
      total_debt_cents: total_debt,
      total_minimum_cents: debts.sum { |d| d[:minimum_cents] },
      extra_payment_cents: extra,
      snowball: plan_summary(snowball_plan, 'snowball', total_debt),
      avalanche: plan_summary(avalanche_plan, 'avalanche', total_debt),
      minimum_only: plan_summary(minimum_plan, 'minimum_only', total_debt),
      interest_saved_snowball_cents: minimum_plan[:total_interest] - snowball_plan[:total_interest],
      interest_saved_avalanche_cents: minimum_plan[:total_interest] - avalanche_plan[:total_interest],
      months_saved_snowball: minimum_plan[:months] - snowball_plan[:months],
      months_saved_avalanche: minimum_plan[:months] - avalanche_plan[:months]
    )
  end

  private

  def load_debts
    household.accounts
      .where(account_type: %w[credit_card loan mortgage other_liability])
      .where('current_balance_cents > 0')
      .map do |account|
        {
          id: account.id,
          name: account.name,
          account_type: account.account_type,
          balance_cents: account.current_balance_cents,
          interest_rate: account.interest_rate || 0,
          minimum_cents: account.minimum_payment_cents || 0
        }
      end
  end

  def calculate_plan(debts, strategy_type)
    # Deep copy balances
    balances = debts.map { |d| d[:balance_cents].to_f }
    total_interest = 0
    month = 0
    timeline = []
    extra = (strategy_type == :minimum_only) ? 0 : (extra_payment_cents || 0).to_f

    loop do
      break if balances.all?(&:zero?) || month >= MAX_MONTHS
      month += 1

      month_interest = 0
      month_principal = 0

      # 1) Accrue interest on each debt
      debts.each_with_index do |debt, i|
        next if balances[i] <= 0
        monthly_rate = debt[:interest_rate].to_f / 100.0 / 12.0
        interest = (balances[i] * monthly_rate).round
        month_interest += interest
        balances[i] += interest
      end

      total_interest += month_interest

      # 2) Pay minimums
      freed_extra = 0.0
      debts.each_with_index do |debt, i|
        next if balances[i] <= 0
        payment = [debt[:minimum_cents].to_f, balances[i]].min
        balances[i] -= payment
        month_principal += payment.round
        if balances[i] <= 0
          balances[i] = 0
          freed_extra += (debt[:minimum_cents].to_f - payment)
        end
      end

      # 3) Apply extra payment to target debt
      remaining_extra = extra + freed_extra
      target_order = priority_order(debts, balances, strategy_type)

      target_order.each do |i|
        next if balances[i] <= 0 || remaining_extra <= 0
        payment = [remaining_extra, balances[i]].min
        balances[i] -= payment
        remaining_extra -= payment
        month_principal += payment.round
        balances[i] = 0 if balances[i] < 1 # cleanup rounding
      end

      timeline << {
        month: month,
        total_remaining_cents: balances.sum.round,
        interest_paid_cents: month_interest.round,
        principal_paid_cents: month_principal,
        balances: balances.map(&:round)
      }
    end

    {
      months: month,
      total_interest: total_interest.round,
      timeline: timeline
    }
  end

  def priority_order(debts, balances, strategy_type)
    indices = debts.each_index.select { |i| balances[i] > 0 }

    case strategy_type
    when :snowball
      # Smallest balance first
      indices.sort_by { |i| balances[i] }
    when :avalanche
      # Highest interest rate first
      indices.sort_by { |i| -debts[i][:interest_rate].to_f }
    else
      indices
    end
  end

  def debt_summary(debt)
    {
      id: debt[:id],
      name: debt[:name],
      account_type: debt[:account_type],
      balance_cents: debt[:balance_cents],
      interest_rate: debt[:interest_rate],
      minimum_payment_cents: debt[:minimum_cents]
    }
  end

  def plan_summary(plan, strategy_name, total_debt)
    {
      strategy: strategy_name,
      months_to_payoff: plan[:months],
      total_interest_cents: plan[:total_interest],
      total_cost_cents: plan[:total_interest] + total_debt,
      payoff_date: Date.current + plan[:months].months,
      timeline: plan[:timeline]
    }
  end
end
