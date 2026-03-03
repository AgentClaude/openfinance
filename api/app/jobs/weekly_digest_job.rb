class WeeklyDigestJob < ApplicationJob
  queue_as :default

  def perform
    User.find_each do |user|
      next unless digest_enabled?(user)

      digest_data = compile_digest(user)
      next if digest_data[:total_transactions] == 0 && digest_data[:upcoming_bills].empty?

      UserMailer.weekly_digest(user.id, digest_data).deliver_later
      Rails.logger.info "Weekly digest sent to user #{user.id}"
    rescue StandardError => e
      Rails.logger.error "Failed to send weekly digest to user #{user.id}: #{e.message}"
    end
  end

  private

  def digest_enabled?(user)
    pref = user.notification_preferences.find_by(notification_type: 'weekly_digest', channel: 'email')
    pref.nil? || pref.enabled  # default to enabled if no preference set
  end

  def compile_digest(user)
    household = user.household
    week_start = 1.week.ago.beginning_of_day
    week_end = Time.current

    transactions = household.transactions
                            .where(date: week_start..week_end)
                            .includes(:category, :account)

    expenses = transactions.where('amount_cents < 0')
    income = transactions.where('amount_cents > 0')

    # Spending by category (top 8)
    spending_by_category = expenses
      .group_by(&:category)
      .map { |cat, txns| { name: cat&.name || 'Uncategorized', amount_cents: txns.sum { |t| t.amount_cents.abs } } }
      .sort_by { |c| -c[:amount_cents] }
      .first(8)

    # Budget status for current month
    budget_status = compile_budget_status(household)

    # Upcoming bills (next 7 days)
    upcoming_bills = household.recurring_items
                              .where(is_active: true)
                              .where('next_occurrence BETWEEN ? AND ?', Date.current, 7.days.from_now)
                              .order(:next_occurrence)
                              .limit(10)
                              .map { |ri| { name: ri.name, amount_cents: ri.amount_cents.abs, due_date: ri.next_occurrence.to_s } }

    # Account balances
    account_balances = household.accounts
                                .where(is_hidden: false)
                                .order(:account_type, :name)
                                .map { |a| { name: a.name, type: a.account_type, balance_cents: a.current_balance_cents } }

    # Net worth
    assets = account_balances.select { |a| %w[checking savings investment property other].include?(a[:type]) }.sum { |a| a[:balance_cents] }
    liabilities = account_balances.select { |a| %w[credit_card loan mortgage].include?(a[:type]) }.sum { |a| a[:balance_cents].abs }

    {
      week_start: week_start.strftime('%b %d'),
      week_end: week_end.strftime('%b %d, %Y'),
      total_transactions: transactions.count,
      total_spent_cents: expenses.sum { |t| t.amount_cents.abs },
      total_income_cents: income.sum(&:amount_cents),
      spending_by_category: spending_by_category,
      budget_status: budget_status,
      upcoming_bills: upcoming_bills,
      account_balances: account_balances,
      net_worth_cents: assets - liabilities,
      assets_cents: assets,
      liabilities_cents: liabilities
    }
  end

  def compile_budget_status(household)
    current_month = Date.current.strftime('%Y-%m')
    budget = household.budgets.find_by(is_active: true)
    return [] unless budget

    budget.budget_items
          .where(month: current_month)
          .includes(:category)
          .map do |item|
            spent = household.transactions
                             .where(category: item.category)
                             .where("to_char(date, 'YYYY-MM') = ?", current_month)
                             .where('amount_cents < 0')
                             .sum('ABS(amount_cents)')

            pct = item.amount_cents > 0 ? (spent.to_f / item.amount_cents * 100).round(0) : 0
            next if pct < 80  # only show categories near/over budget

            { name: item.category&.name, budgeted_cents: item.amount_cents, spent_cents: spent, percentage: pct }
          end
          .compact
          .sort_by { |b| -b[:percentage] }
          .first(5)
  end
end
