module Types
  class QueryType < Types::BaseObject
    field :me, Types::UserType, null: true
    def me
      context[:current_user]
    end

    field :my_referral_code, String, null: true
    def my_referral_code
      return nil unless context[:current_user]
      user = context[:current_user]
      user.referral_code || Referrals::GenerateReferralCode.new(user).call
    end

    field :referrals, [Types::ReferralType], null: false
    def referrals
      return [] unless context[:current_user]
      context[:current_user].referrals_given.includes(:referred_user).order(created_at: :desc)
    end

    field :household_members, [Types::HouseholdMemberType], null: false
    def household_members
      return [] unless context[:current_user]&.household

      household = context[:current_user].household
      members = []

      # Primary users (users table household_id)
      household.users.each do |u|
        members << OpenStruct.new(id: "primary-#{u.id}", user: u, role: u.role, joined_at: u.created_at, is_primary: true)
      end

      # Membership users
      household.household_memberships.includes(:user).each do |m|
        members << OpenStruct.new(id: m.id, user: m.user, role: m.role, joined_at: m.joined_at, is_primary: false)
      end

      members
    end

    field :household_invitations, [Types::InvitationType], null: false
    def household_invitations
      return [] unless context[:current_user]&.household
      context[:current_user].household.invitations.pending.where('expires_at > ?', Time.current).order(created_at: :desc)
    end

    field :invitation_by_token, Types::InvitationType, null: true do
      argument :token, String, required: true
      description "Look up an invitation by token (no auth required)"
    end
    def invitation_by_token(token:)
      Invitation.find_by(token: token)
    end

    field :goals, [Types::GoalType], null: false do
      argument :active_only, Boolean, required: false, default_value: false
    end
    def goals(active_only: false)
      return [] unless context[:current_user]&.household
      scope = GoalPolicy::Scope.new(context[:current_user], Goal).resolve.order(:target_date)
      scope = scope.where(is_active: true, is_achieved: false) if active_only
      scope
    end

    field :accounts, [Types::AccountType], null: false
    def accounts
      return [] unless context[:current_user]&.household
      AccountPolicy::Scope.new(context[:current_user], Account).resolve
        .where(is_hidden: false).order(:display_order, :name)
    end

    field :account, Types::AccountType, null: true do
      argument :id, ID, required: true
    end
    def account(id:)
      return nil unless context[:current_user]&.household
      AccountPolicy::Scope.new(context[:current_user], Account).resolve.find_by(id: id)
    end

    field :account_balance_history, [Types::AccountBalanceHistoryType], null: false do
      argument :account_id, ID, required: true
      argument :months, Integer, required: false, default_value: 12
    end
    def account_balance_history(account_id:, months: 12)
      return [] unless context[:current_user]&.household
      account = AccountPolicy::Scope.new(context[:current_user], Account).resolve.find_by(id: account_id)
      return [] unless account
      account.balance_histories
        .where('date >= ?', months.months.ago.to_date)
        .order(:date)
    end

    field :account_connections, [Types::AccountConnectionType], null: false
    def account_connections
      return [] unless context[:current_user]&.household
      context[:current_user].household.account_connections
        .includes(:institution, :accounts)
        .order(created_at: :desc)
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

      scope = TransactionPolicy::Scope.new(context[:current_user], Transaction).resolve.includes(:account, :category, :tags)

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
      CategoryPolicy::Scope.new(context[:current_user], Category).resolve
        .where(parent_id: nil).order(:display_order, :name)
    end

    field :tags, [Types::TagType], null: false
    def tags
      return [] unless context[:current_user]&.household
      TagPolicy::Scope.new(context[:current_user], Tag).resolve.order(:name)
    end

    field :dashboard_summary, Types::DashboardSummaryType, null: false
    def dashboard_summary
      return empty_dashboard unless context[:current_user]&.household

      household = context[:current_user].household
      accounts = household.accounts.where(is_hidden: false)

      liability_types = %w[credit credit_card loan mortgage auto_loan student_loan personal_loan heloc other_liability]
      asset_cents = accounts.reject { |a| liability_types.include?(a.account_type) }.sum(&:current_balance_cents)
      liability_cents = accounts.select { |a| liability_types.include?(a.account_type) }.sum(&:current_balance_cents)
      net_worth = (asset_cents - liability_cents) / 100.0

      month_start = Date.current.beginning_of_month
      month_end = Date.current.end_of_month
      month_txns = household.transactions.where(date: month_start..month_end)

      income_cents = month_txns.where("amount_cents > 0").sum(:amount_cents)
      expense_cents = month_txns.where("amount_cents < 0").sum(:amount_cents).abs

      # Spending by category
      expense_txns = month_txns.where("amount_cents < 0")
      spent_by_cat = expense_txns.group(:category_id).sum(:amount_cents)
      cat_ids = spent_by_cat.keys.compact
      cats_by_id = Category.where(id: cat_ids).index_by(&:id)

      spending = spent_by_cat.map do |cat_id, cents|
        cat = cats_by_id[cat_id]
        {
          category_id: cat_id,
          category_name: cat&.name || "Uncategorized",
          amount: cents.abs / 100.0,
          percentage: expense_cents > 0 ? (cents.abs.to_f / expense_cents * 100).round(1) : 0,
          color: cat&.color.presence || cat&.color_hex
        }
      end.sort_by { |s| -s[:amount] }

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
        needs_review_count: household.transactions.where(needs_review: true).count,
        goals_summary: household.goals.where(is_active: true, is_achieved: false).order(:target_date).limit(5)
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

    field :notifications, [Types::NotificationType], null: false do
      argument :unread_only, Boolean, required: false, default_value: false
      argument :limit, Integer, required: false, default_value: 50
    end
    def notifications(unread_only: false, limit: 50)
      return [] unless context[:current_user]
      scope = context[:current_user].notifications.recent
      scope = scope.unread if unread_only
      scope.limit(limit)
    end

    field :unread_notification_count, Integer, null: false
    def unread_notification_count
      return 0 unless context[:current_user]
      context[:current_user].notifications.unread.count
    end

    field :notification_preferences, [Types::NotificationPreferenceType], null: false
    def notification_preferences
      return [] unless context[:current_user]
      NotificationPreference.defaults_for(context[:current_user])
    end

    field :balance_adjustments, [Types::BalanceAdjustmentType], null: false do
      argument :account_id, ID, required: true
    end
    def balance_adjustments(account_id:)
      return [] unless context[:current_user]&.household
      account = AccountPolicy::Scope.new(context[:current_user], Account).resolve.find_by(id: account_id)
      return [] unless account
      account.balance_adjustments.ordered
    end

    field :categorization_rules, [Types::CategorizationRuleType], null: false
    def categorization_rules
      return [] unless context[:current_user]&.household
      CategorizationRulePolicy::Scope.new(context[:current_user], CategorizationRule).resolve
        .by_priority.includes(:category)
    end

    field :suggested_categorization_rules, [Types::SuggestedRuleType], null: false,
      description: "Suggest categorization rules based on manual categorization patterns"
    def suggested_categorization_rules
      return [] unless context[:current_user]&.household
      household = context[:current_user].household

      # Find merchants that have been manually categorized consistently
      # but don't have an existing rule
      existing_rule_values = household.categorization_rules.active.pluck(:match_value).map(&:downcase)

      # Group transactions by merchant_name where category was manually set
      patterns = household.transactions
        .where.not(merchant_name: [nil, ''])
        .where.not(category_id: nil)
        .where(needs_review: false)
        .group(:merchant_name, :category_id)
        .having('COUNT(*) >= 2')
        .count

      # Build suggestions: merchants consistently mapped to one category
      merchant_categories = {}
      patterns.each do |(merchant, category_id), count|
        merchant_categories[merchant] ||= []
        merchant_categories[merchant] << { category_id: category_id, count: count }
      end

      categories_cache = household.categories.index_by(&:id)

      suggestions = []
      merchant_categories.each do |merchant, entries|
        # Only suggest if 80%+ of transactions go to the same category
        total = entries.sum { |e| e[:count] }
        top = entries.max_by { |e| e[:count] }
        next unless top[:count].to_f / total >= 0.8
        next if existing_rule_values.include?(merchant.downcase)

        category = categories_cache[top[:category_id]]
        next unless category

        suggestions << OpenStruct.new(
          merchant_name: merchant,
          category_id: category.id,
          category_name: category.name,
          category_icon: category.icon,
          category_color: category.color,
          transaction_count: top[:count],
          match_field: 'merchant_name',
          match_type: 'exact',
          match_value: merchant
        )
      end

      suggestions.sort_by { |s| -s.transaction_count }
    end

    field :recurring_items, [Types::RecurringItemType], null: false do
      argument :active_only, Boolean, required: false, default_value: false
    end
    def recurring_items(active_only: false)
      return [] unless context[:current_user]&.household
      scope = RecurringItemPolicy::Scope.new(context[:current_user], RecurringItem).resolve
        .includes(:category, :account).order(:next_occurrence)
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

    field :net_worth_history, [Types::NetWorthSnapshotType], null: false do
      argument :months, Integer, required: false, default_value: 12
    end
    def net_worth_history(months: 12)
      return [] unless context[:current_user]&.household

      household = context[:current_user].household
      accounts = household.accounts.where(is_hidden: false)
      liability_types = %w[credit credit_card loan mortgage auto_loan student_loan personal_loan heloc other_liability]

      # Try AccountBalanceHistory first
      histories = AccountBalanceHistory.where(account: accounts)
        .where('date >= ?', months.months.ago.to_date.beginning_of_month)
        .order(:date)

      if histories.exists?
        # Group by month (use last snapshot of each month)
        by_month = histories.group_by { |h| h.date.beginning_of_month }
        by_month.sort.map do |month_date, month_histories|
          # Get latest snapshot per account in this month
          latest_per_account = month_histories.group_by(&:account_id).transform_values(&:last)
          asset_cents = 0
          liability_cents = 0
          latest_per_account.each do |account_id, hist|
            acct = accounts.find { |a| a.id == account_id }
            next unless acct
            if liability_types.include?(acct.account_type)
              liability_cents += hist.balance_cents
            else
              asset_cents += hist.balance_cents
            end
          end
          {
            date: month_date.strftime('%Y-%m'),
            assets: asset_cents / 100.0,
            liabilities: liability_cents / 100.0,
            net_worth: (asset_cents - liability_cents) / 100.0
          }
        end
      else
        # Fallback: compute from current balances (single point)
        asset_cents = accounts.reject { |a| liability_types.include?(a.account_type) }.sum(&:current_balance_cents)
        liability_cents = accounts.select { |a| liability_types.include?(a.account_type) }.sum(&:current_balance_cents)
        [{
          date: Date.current.strftime('%Y-%m'),
          assets: asset_cents / 100.0,
          liabilities: liability_cents / 100.0,
          net_worth: (asset_cents - liability_cents) / 100.0
        }]
      end
    end

    field :category_trends, [Types::CategoryTrendPointType], null: false do
      argument :category_ids, [ID], required: true
      argument :months, Integer, required: false, default_value: 6
    end
    def category_trends(category_ids:, months: 6)
      return [] unless context[:current_user]&.household

      household = context[:current_user].household
      end_date = Date.current.end_of_month
      start_date = (end_date - months.months).beginning_of_month

      categories = Category.where(id: category_ids, household_id: household.id).index_by(&:id)
      return [] if categories.empty?

      txns = household.transactions
        .where(category_id: category_ids, date: start_date..end_date)
        .where('amount_cents < 0')

      results = []
      current = start_date
      while current <= end_date
        month_end = current.end_of_month
        month_txns = txns.where(date: current..month_end)
        by_cat = month_txns.group(:category_id).sum('ABS(amount_cents)')

        category_ids.each do |cat_id|
          cat = categories[cat_id]
          next unless cat
          results << {
            month: current.strftime('%Y-%m'),
            category_id: cat_id,
            category_name: cat.name,
            amount: (by_cat[cat_id] || 0) / 100.0
          }
        end
        current = current.next_month
      end

      results
    end

    field :reports, Types::ReportsType, null: false do
      argument :months, Integer, required: false, default_value: 6
      argument :date_from, String, required: false
      argument :date_to, String, required: false
      argument :account_ids, [ID], required: false
      argument :category_ids, [ID], required: false
      argument :tag_ids, [ID], required: false
      argument :exclude_transfers, Boolean, required: false, default_value: false
    end
    def reports(months: 6, date_from: nil, date_to: nil, account_ids: nil, category_ids: nil, tag_ids: nil, exclude_transfers: false)
      return empty_reports unless context[:current_user]&.household

      household = context[:current_user].household
      end_date = date_to ? Date.parse(date_to) : Date.current.end_of_month
      start_date = date_from ? Date.parse(date_from) : (end_date - months.months).beginning_of_month

      txns = household.transactions.where(date: start_date..end_date)
      txns = txns.where(account_id: account_ids) if account_ids.present?
      txns = txns.where(category_id: category_ids) if category_ids.present?
      txns = txns.joins(:transaction_tags).where(transaction_tags: { tag_id: tag_ids }).distinct if tag_ids.present?
      txns = txns.where(is_transfer: false) if exclude_transfers

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
      spent_by_cat_report = expense_txns.group(:category_id).pluck(:category_id, Arel.sql('SUM(ABS(amount_cents))'), Arel.sql('COUNT(*)'))
      report_cat_ids = spent_by_cat_report.map(&:first).compact
      report_cats = Category.where(id: report_cat_ids).index_by(&:id)
      spending_by_cat = spent_by_cat_report.map do |cat_id, total_cents, txn_count|
        cat = report_cats[cat_id]
        {
          category_id: cat_id,
          category_name: cat&.name || "Uncategorized",
          category_icon: cat&.icon,
          category_color: cat&.color.presence || cat&.color_hex,
          amount: total_cents.to_i / 100.0,
          percentage: total_expense_cents > 0 ? (total_cents.to_i.to_f / total_expense_cents * 100).round(1) : 0,
          transaction_count: txn_count.to_i
        }
      end.sort_by { |s| -s[:amount] }

      # Monthly spending by category (for stacked chart)
      monthly_by_cat = []
      current = start_date.beginning_of_month
      while current <= end_date
        month_end = current.end_of_month
        month_expenses = expense_txns.where(date: current..month_end)
        month_by_cat = month_expenses.group(:category_id).pluck(:category_id, Arel.sql('SUM(ABS(amount_cents))'))
        month_cat_ids = month_by_cat.map(&:first).compact
        month_cats = Category.where(id: month_cat_ids).index_by(&:id)
        cats = month_by_cat.map do |cat_id, total_cents|
          cat = month_cats[cat_id]
          {
            category_id: cat_id,
            category_name: cat&.name || "Uncategorized",
            category_color: cat&.color.presence || cat&.color_hex,
            amount: total_cents.to_i / 100.0
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

    field :portfolio_history, [Types::PortfolioHistoryPointType], null: false do
      argument :account_id, ID, required: false
      argument :months, Integer, required: false, default_value: 12
    end
    def portfolio_history(account_id: nil, months: 12)
      return [] unless context[:current_user]&.household

      household = context[:current_user].household
      start_date = months.months.ago.to_date

      scope = Holding.joins(:account)
                     .where(accounts: { household_id: household.id })
                     .where('holdings.as_of_date >= ?', start_date)
                     .where('holdings.quantity > 0')
      scope = scope.where(account_id: account_id) if account_id.present?

      # Group by date, sum values
      points_by_date = {}
      scope.includes(:security).find_each do |h|
        date_key = h.as_of_date.iso8601
        points_by_date[date_key] ||= { date: date_key, total_value: 0.0, total_cost_basis: 0.0 }
        points_by_date[date_key][:total_value] += h.current_value.cents / 100.0
        points_by_date[date_key][:total_cost_basis] += h.cost_basis_total.cents / 100.0
      end

      points_by_date.values.map do |p|
        p[:gain_loss] = p[:total_value] - p[:total_cost_basis]
        p
      end.sort_by { |p| p[:date] }
    end

    def empty_portfolio
      { total_value: 0.0, total_cost_basis: 0.0, total_gain_loss: 0.0, total_gain_loss_percentage: 0.0, total_holdings_count: 0, allocations: [] }
    end

    def empty_reports
      { monthly_summary: [], spending_by_category: [], monthly_spending_by_category: [], top_merchants: [] }
    end

    def empty_dashboard
      { net_worth: 0.0, net_worth_change: 0.0, monthly_income: 0.0, monthly_expenses: 0.0, cash_flow: 0.0, spending_by_category: [], recent_transactions: [], account_balances: [], needs_review_count: 0, goals_summary: [] }
    end
  end
end
