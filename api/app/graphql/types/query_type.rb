module Types
  class QueryType < Types::BaseObject
    field :me, Types::UserType, null: true
    def me
      context[:current_user]
    end

    field :accounts, [Types::AccountType], null: false
    def accounts
      return [] unless context[:current_user]&.household
      context[:current_user].household.accounts.where(is_hidden: false).order(:display_order, :name)
    end

    field :transactions, Types::TransactionPageType, null: false do
      argument :search, String, required: false
      argument :category_id, String, required: false
      argument :account_id, String, required: false
      argument :min_amount, Float, required: false
      argument :max_amount, Float, required: false
      argument :date_from, String, required: false
      argument :date_to, String, required: false
      argument :needs_review, Boolean, required: false
      argument :page, Integer, required: false, default_value: 1
      argument :limit, Integer, required: false, default_value: 50
    end
    def transactions(search: nil, category_id: nil, account_id: nil, min_amount: nil, max_amount: nil, date_from: nil, date_to: nil, needs_review: nil, page: 1, limit: 50)
      return { transactions: [], total_count: 0, has_more: false } unless context[:current_user]&.household

      scope = context[:current_user].household.transactions.includes(:account, :category, :tags)

      scope = scope.where("name ILIKE :q OR merchant_name ILIKE :q", q: "%#{search}%") if search.present?
      scope = scope.where(category_id: category_id) if category_id.present?
      scope = scope.where(account_id: account_id) if account_id.present?
      scope = scope.where(needs_review: true) if needs_review == true
      if min_amount
        scope = scope.where("amount_cents >= ?", (min_amount * 100).to_i)
      end
      if max_amount
        scope = scope.where("amount_cents <= ?", (max_amount * 100).to_i)
      end
      scope = scope.where("date >= ?", date_from) if date_from.present?
      scope = scope.where("date <= ?", date_to) if date_to.present?

      total = scope.count
      offset = ([page, 1].max - 1) * limit
      txns = scope.order(date: :desc, created_at: :desc).offset(offset).limit(limit)

      { transactions: txns, total_count: total, has_more: (offset + limit) < total }
    end

    field :categories, [Types::CategoryType], null: false
    def categories
      return [] unless context[:current_user]&.household
      context[:current_user].household.categories.where(parent_id: nil).order(:display_order, :name)
    end

    field :tags, [Types::TagType], null: false
    def tags
      return [] unless context[:current_user]&.household
      context[:current_user].household.tags.order(:name)
    end

    field :dashboard_summary, Types::DashboardSummaryType, null: false
    def dashboard_summary
      return empty_dashboard unless context[:current_user]&.household

      household = context[:current_user].household
      accounts = household.accounts.where(is_hidden: false)

      asset_cents = accounts.select { |a| %w[checking savings investment retirement crypto real_estate vehicle other_asset cash].include?(a.account_type) }.sum(&:current_balance_cents)
      liability_cents = accounts.select { |a| %w[credit_card loan mortgage other_liability].include?(a.account_type) }.sum(&:current_balance_cents)
      net_worth = (asset_cents - liability_cents) / 100.0

      month_start = Date.current.beginning_of_month
      month_end = Date.current.end_of_month
      month_txns = household.transactions.where(date: month_start..month_end)

      income_cents = month_txns.where("amount_cents > 0").sum(:amount_cents)
      expense_cents = month_txns.where("amount_cents < 0").sum(:amount_cents).abs

      # Spending by category
      spending = month_txns.where("amount_cents < 0")
        .joins("LEFT JOIN categories ON categories.id = transactions.category_id")
        .group("categories.id, categories.name, categories.color, categories.color_hex")
        .sum(:amount_cents)
        .map do |(cat_id, cat_name, cat_color, cat_color_hex), cents|
          {
            category_id: cat_id,
            category_name: cat_name || "Uncategorized",
            amount: cents.abs / 100.0,
            percentage: expense_cents > 0 ? (cents.abs.to_f / expense_cents * 100).round(1) : 0,
            color: cat_color.presence || cat_color_hex
          }
        end
        .sort_by { |s| -s[:amount] }

      recent = household.transactions.includes(:account, :category).order(date: :desc).limit(5)

      balances = accounts.map do |a|
        { account_id: a.id, account_name: a.name, account_type: a.account_type, balance: a.current_balance_cents / 100.0 }
      end

      {
        net_worth: net_worth,
        net_worth_change: 0.0,
        monthly_income: income_cents / 100.0,
        monthly_expenses: expense_cents / 100.0,
        cash_flow: (income_cents - expense_cents) / 100.0,
        spending_by_category: spending,
        recent_transactions: recent,
        account_balances: balances,
        needs_review_count: household.transactions.where(needs_review: true).count
      }
    end

    field :holdings, [Types::HoldingType], null: false do
      argument :account_id, ID, required: false
    end
    def holdings(account_id: nil)
      return [] unless context[:current_user]&.household

      latest_holdings(account_id: account_id).order(market_value_cents: :desc)
    end

    field :portfolio_summary, Types::PortfolioSummaryType, null: false do
      argument :account_id, ID, required: false
    end
    def portfolio_summary(account_id: nil)
      return empty_portfolio unless context[:current_user]&.household

      latest = latest_holdings(account_id: account_id)

      total_value_cents = 0
      total_cost_cents = 0
      alloc_map = {}

      latest.each do |h|
        val = h.current_value.cents
        cost = h.cost_basis_total.cents
        total_value_cents += val
        total_cost_cents += cost

        key = h.security_id
        alloc_map[key] ||= { security_name: h.security.name, symbol: h.security.symbol, security_type: h.security.security_type, value_cents: 0 }
        alloc_map[key][:value_cents] += val
      end

      gain_loss = total_value_cents - total_cost_cents
      gain_pct = total_cost_cents > 0 ? (gain_loss.to_f / total_cost_cents * 100).round(2) : 0.0

      allocations = alloc_map.values.map do |a|
        pct = total_value_cents > 0 ? (a[:value_cents].to_f / total_value_cents * 100).round(2) : 0.0
        { security_name: a[:security_name], symbol: a[:symbol], security_type: a[:security_type], value: a[:value_cents] / 100.0, percentage: pct }
      end.sort_by { |a| -a[:percentage] }

      {
        total_value: total_value_cents / 100.0,
        total_cost_basis: total_cost_cents / 100.0,
        total_gain_loss: gain_loss / 100.0,
        total_gain_loss_percentage: gain_pct,
        total_holdings_count: latest.size,
        allocations: allocations
      }
    end

    field :categorization_rules, [Types::CategorizationRuleType], null: false
    def categorization_rules
      return [] unless context[:current_user]&.household
      context[:current_user].household.categorization_rules.by_priority.includes(:category)
    end

    field :recurring_items, [Types::RecurringItemType], null: false do
      argument :active_only, Boolean, required: false, default_value: false
    end
    def recurring_items(active_only: false)
      return [] unless context[:current_user]&.household
      scope = context[:current_user].household.recurring_items.includes(:category, :account).order(:next_occurrence)
      scope = scope.active if active_only
      scope
    end

    field :budget, [Types::BudgetItemType], null: false do
      argument :month, String, required: true
    end
    def budget(month:)
      return [] unless context[:current_user]&.household
      date = Date.parse("#{month}-01") rescue Date.current.beginning_of_month
      start_date = date.beginning_of_month
      household = context[:current_user].household
      items = BudgetItem.joins(:budget)
        .where(budgets: { household_id: household.id })
        .where(month: start_date)
        .includes(:category)

      # Precompute spent amounts to avoid N+1 in BudgetItemType#spent
      category_ids = items.map(&:category_id).compact.uniq
      if category_ids.any?
        end_date = date.end_of_month
        spent_by_category = household.transactions
          .where(category_id: category_ids, date: start_date..end_date)
          .where('amount_cents < 0')
          .group(:category_id)
          .sum(:amount_cents)
          .transform_values { |v| v.abs / 100.0 }
        context[:budget_spent_by_category] ||= {}
        context[:budget_spent_by_category][start_date.to_s] = spent_by_category
      end

      items
    end

    field :budget_summary, Types::BudgetSummaryType, null: true do
      argument :month, String, required: true
    end
    def budget_summary(month:)
      household = context[:current_user]&.household
      return nil unless household

      date = Date.parse("#{month}-01") rescue Date.current.beginning_of_month
      start_date = date.beginning_of_month
      end_date = date.end_of_month

      # Auto-create budget if none exists
      budget = household.budgets.first || Budget.create!(
        household: household,
        name: "Monthly Budget",
        period_type: "monthly",
        start_date: start_date
      )

      items = BudgetItem.where(budget: budget, month: start_date).includes(:category)

      # Calculate income from transactions
      income_actual_cents = household.transactions
        .where(date: start_date..end_date)
        .where('amount_cents > 0')
        .sum(:amount_cents)

      # Batch-load spent amounts to avoid N+1 queries
      category_ids = items.filter_map { |i| i.category_id }
      spent_by_category = household.transactions
        .where(category_id: category_ids, date: start_date..end_date)
        .where('amount_cents < 0')
        .group(:category_id)
        .sum(:amount_cents)
        .transform_values { |v| v.abs / 100.0 }

      # Store in context so BudgetItemType#spent can use precomputed values
      context[:budget_spent_by_category] ||= {}
      context[:budget_spent_by_category][start_date.to_s] = spent_by_category

      # Income budget items (categories with group_name 'Income')
      income_items = items.select { |i| i.category&.group_name == 'Income' }
      expense_items = items.reject { |i| i.category&.group_name == 'Income' }

      total_income = income_items.sum(&:amount_cents) / 100.0
      total_budgeted = expense_items.sum(&:amount_cents) / 100.0

      # Group items by category group
      groups = expense_items.group_by { |i| i.category&.group_name || 'Other' }
      category_groups = groups.map do |name, group_items|
        budgeted_sum = group_items.sum(&:amount_cents) / 100.0
        group_spent = group_items.sum { |i| spent_by_category[i.category_id] || 0.0 }
        {
          name: name,
          budgeted: budgeted_sum,
          spent: group_spent,
          items: group_items
        }
      end.sort_by { |g| g[:name] }

      total_spent = category_groups.sum { |g| g[:spent] }

      {
        month: month,
        total_budgeted: total_budgeted,
        total_spent: total_spent,
        total_income: total_income,
        income_actual: income_actual_cents / 100.0,
        # left_to_budget: budgeted income minus total expense budget allocations.
        # Represents how much income hasn't been assigned to expense categories yet.
        # Positive = unallocated funds available; Negative = over-budgeted.
        left_to_budget: total_income - total_budgeted,
        category_groups: category_groups
      }
    end

    field :reports, Types::ReportsType, null: false do
      argument :months, Integer, required: false, default_value: 6
      argument :date_from, String, required: false
      argument :date_to, String, required: false
    end
    def reports(months: 6, date_from: nil, date_to: nil)
      return empty_reports unless context[:current_user]&.household

      household = context[:current_user].household
      end_date = date_to ? Date.parse(date_to) : Date.current.end_of_month
      start_date = date_from ? Date.parse(date_from) : (end_date - months.months).beginning_of_month

      txns = household.transactions.where(date: start_date..end_date)

      # Monthly summary (income vs expenses)
      monthly_summary = []
      current = start_date.beginning_of_month
      while current <= end_date
        month_end = current.end_of_month
        month_txns = txns.where(date: current..month_end)
        income_cents = month_txns.where("amount_cents > 0").sum(:amount_cents)
        expense_cents = month_txns.where("amount_cents < 0").sum(:amount_cents).abs
        monthly_summary << {
          month: current.strftime("%Y-%m"),
          income: income_cents / 100.0,
          expenses: expense_cents / 100.0,
          cash_flow: (income_cents - expense_cents) / 100.0
        }
        current = current.next_month
      end

      # Spending by category (total for period)
      expense_txns = txns.where("amount_cents < 0")
      total_expense_cents = expense_txns.sum(:amount_cents).abs
      spending_by_cat = expense_txns
        .joins("LEFT JOIN categories ON categories.id = transactions.category_id")
        .group("categories.id, categories.name, categories.icon, categories.color, categories.color_hex")
        .select("categories.id as cat_id, categories.name as cat_name, categories.icon as cat_icon, categories.color as cat_color, categories.color_hex as cat_color_hex, SUM(ABS(amount_cents)) as total_cents, COUNT(*) as txn_count")
        .map do |row|
          {
            category_id: row.cat_id,
            category_name: row.cat_name || "Uncategorized",
            category_icon: row.cat_icon,
            category_color: row.cat_color.presence || row.cat_color_hex,
            amount: row.total_cents.to_i / 100.0,
            percentage: total_expense_cents > 0 ? (row.total_cents.to_i.to_f / total_expense_cents * 100).round(1) : 0,
            transaction_count: row.txn_count.to_i
          }
        end
        .sort_by { |s| -s[:amount] }

      # Monthly spending by category (for stacked chart)
      monthly_by_cat = []
      current = start_date.beginning_of_month
      while current <= end_date
        month_end = current.end_of_month
        month_expenses = expense_txns.where(date: current..month_end)
        cats = month_expenses
          .joins("LEFT JOIN categories ON categories.id = transactions.category_id")
          .group("categories.id, categories.name, categories.icon, categories.color, categories.color_hex")
          .select("categories.id as cat_id, categories.name as cat_name, categories.icon as cat_icon, categories.color as cat_color, categories.color_hex as cat_color_hex, SUM(ABS(amount_cents)) as total_cents, COUNT(*) as txn_count")
          .map do |row|
            {
              category_id: row.cat_id,
              category_name: row.cat_name || "Uncategorized",
              category_icon: row.cat_icon,
              category_color: row.cat_color.presence || row.cat_color_hex,
              amount: row.total_cents.to_i / 100.0,
              percentage: 0,
              transaction_count: row.txn_count.to_i
            }
          end
        monthly_by_cat << { month: current.strftime("%Y-%m"), categories: cats }
        current = current.next_month
      end

      # Top merchants
      top_merchants = expense_txns
        .where.not(merchant_name: [nil, ""])
        .group(:merchant_name)
        .select("merchant_name, SUM(ABS(amount_cents)) as total_cents, COUNT(*) as txn_count")
        .order("total_cents DESC")
        .limit(10)
        .map do |row|
          {
            merchant_name: row.merchant_name,
            amount: row.total_cents.to_i / 100.0,
            transaction_count: row.txn_count.to_i
          }
        end

      {
        monthly_summary: monthly_summary,
        spending_by_category: spending_by_cat,
        monthly_spending_by_category: monthly_by_cat,
        top_merchants: top_merchants
      }
    end

    private

    def latest_holdings(account_id: nil)
      household = context[:current_user].household
      scope = Holding.joins(:account)
                     .where(accounts: { household_id: household.id })
                     .where('quantity > 0')
      scope = scope.where(account_id: account_id) if account_id.present?

      latest_ids = scope.select('DISTINCT ON (holdings.account_id, holdings.security_id) holdings.id')
                        .order('holdings.account_id, holdings.security_id, holdings.as_of_date DESC')

      Holding.where(id: latest_ids).includes(:security, :account)
    end

    def empty_portfolio
      { total_value: 0.0, total_cost_basis: 0.0, total_gain_loss: 0.0, total_gain_loss_percentage: 0.0, total_holdings_count: 0, allocations: [] }
    end

    def empty_reports
      { monthly_summary: [], spending_by_category: [], monthly_spending_by_category: [], top_merchants: [] }
    end

    def empty_dashboard
      { net_worth: 0.0, net_worth_change: 0.0, monthly_income: 0.0, monthly_expenses: 0.0, cash_flow: 0.0, spending_by_category: [], recent_transactions: [], account_balances: [], needs_review_count: 0 }
    end
  end
end
