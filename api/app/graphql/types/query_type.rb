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

    field :referrals, [Types::ReferralType], null: false, connection: false, max_page_size: 100
    def referrals
      return [] unless context[:current_user]
      context[:current_user].referrals_given.includes(:referred_user).order(created_at: :desc)
    end

    field :household_members, [Types::HouseholdMemberType], null: false, connection: false, max_page_size: 50
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

    # Public query — no auth required — for the accept invitation page
    # Public query — no auth required — for the referral landing page
    field :referral_code_info, Types::ReferralCodeInfoType, null: false do
      argument :code, String, required: true
    end
    def referral_code_info(code:)
      result = Referrals::LookupCodeService.call(code: code)
      result.data
    end

    field :invitation_by_token, Types::InvitationPreviewType, null: true do
      argument :token, String, required: true
    end
    def invitation_by_token(token:)
      invitation = Invitation.includes(:household, :invited_by).find_by(token: token)
      return nil unless invitation
      invitation
    end

    field :household_invitations, [Types::InvitationType], null: false, connection: false, max_page_size: 50
    def household_invitations
      return [] unless context[:current_user]&.household
      context[:current_user].household.invitations.pending.where('expires_at > ?', Time.current).order(created_at: :desc)
    end

    field :goals, [Types::GoalType], null: false, connection: false, max_page_size: 100 do
      argument :active_only, Boolean, required: false, default_value: false
    end
    def goals(active_only: false)
      return [] unless context[:current_user]&.household
      scope = GoalPolicy::Scope.new(context[:current_user], Goal).resolve.order(:target_date)
      scope = scope.where(is_active: true, is_achieved: false) if active_only
      scope
    end

    field :accounts, [Types::AccountType], null: false, connection: false, max_page_size: 100
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

    field :account_balance_history, [Types::AccountBalanceHistoryType], null: false, connection: false, max_page_size: 500 do
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

    field :account_connections, [Types::AccountConnectionType], null: false, connection: false, max_page_size: 50
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

    field :categories, [Types::CategoryType], null: false, connection: false, max_page_size: 100 do
      argument :include_hidden, Boolean, required: false, default_value: false
    end
    def categories(include_hidden: false)
      return [] unless context[:current_user]&.household
      scope = CategoryPolicy::Scope.new(context[:current_user], Category).resolve
        .where(parent_id: nil)
      scope = scope.where(is_hidden: false) unless include_hidden
      scope.order(:display_order, :name)
    end

    field :plaid_category_mappings, [Types::PlaidCategoryMappingType], null: false, connection: false, max_page_size: 200
    def plaid_category_mappings
      return [] unless context[:current_user]&.household
      context[:current_user].household.plaid_category_mappings
        .includes(:category)
        .order(:plaid_primary, :plaid_detailed)
    end

    field :plaid_primary_categories, [String], null: false, connection: false, max_page_size: 100,
      description: 'List of all Plaid personal finance primary categories'
    def plaid_primary_categories
      PlaidCategoryMapping::PLAID_PRIMARY_CATEGORIES
    end

    field :tags, [Types::TagType], null: false, connection: false, max_page_size: 100
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

    field :investment_transactions, [Types::InvestmentTransactionType], null: false, connection: false, max_page_size: 500 do
      argument :account_id, ID, required: false
      argument :security_id, ID, required: false
      argument :transaction_type, String, required: false
      argument :year, Integer, required: false
      argument :limit, Integer, required: false, default_value: 100
    end
    def investment_transactions(account_id: nil, security_id: nil, transaction_type: nil, year: nil, limit: 100)
      return [] unless context[:current_user]&.household

      scope = InvestmentTransaction.joins(:account)
                .where(accounts: { household_id: context[:current_user].household.id })
                .includes(:security)
      scope = scope.for_account(account_id) if account_id.present?
      scope = scope.for_security(security_id) if security_id.present?
      scope = scope.where(transaction_type: transaction_type) if transaction_type.present?
      scope = scope.in_year(year) if year.present?
      scope.recent.limit([limit, 500].min)
    end

    field :dividend_summary, Types::DividendSummaryType, null: false do
      argument :year, Integer, required: false
      argument :account_id, ID, required: false
    end
    def dividend_summary(year: Date.current.year, account_id: nil)
      return { total_dividends: 0.0, by_security: [], by_month: [], transaction_count: 0 } unless context[:current_user]&.household

      InvestmentTransaction.dividend_summary(context[:current_user].household, year: year, account_id: account_id)
    end

    field :investment_income_summary, Types::InvestmentIncomeSummaryType, null: false do
      argument :year, Integer, required: false
      argument :account_id, ID, required: false
    end
    def investment_income_summary(year: Date.current.year, account_id: nil)
      return { total_income: 0.0, dividends: 0.0, interest: 0.0, capital_gains: 0.0 } unless context[:current_user]&.household

      InvestmentTransaction.income_summary(context[:current_user].household, year: year, account_id: account_id)
    end

    field :holdings, [Types::HoldingType], null: false, connection: false, max_page_size: 500 do
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

    field :notifications, [Types::NotificationType], null: false, connection: false, max_page_size: 100 do
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

    field :notification_preferences, [Types::NotificationPreferenceType], null: false, connection: false, max_page_size: 50
    def notification_preferences
      return [] unless context[:current_user]
      NotificationPreference.defaults_for(context[:current_user])
    end

    field :activity_feed, [Types::ActivityEventType], null: false, connection: false, max_page_size: 100 do
      argument :limit, Integer, required: false, default_value: 50
      argument :since, GraphQL::Types::ISO8601DateTime, required: false
    end
    def activity_feed(limit: 50, since: nil)
      return [] unless context[:current_user]&.household
      scope = context[:current_user].household.activity_events.recent.includes(:user)
      scope = scope.since(since) if since.present?
      scope.limit([limit, 100].min)
    end

    field :api_keys, [Types::ApiKeyType], null: false, connection: false, max_page_size: 50
    def api_keys
      return [] unless context[:current_user]
      context[:current_user].api_keys.order(created_at: :desc)
    end

    field :share_tokens, [Types::ShareTokenType], null: false, connection: false, max_page_size: 50
    def share_tokens
      return [] unless context[:current_user]
      context[:current_user].share_tokens.active.order(created_at: :desc)
    end

    field :merchant_mappings, [Types::MerchantMappingType], null: false, connection: false, max_page_size: 200
    def merchant_mappings
      return [] unless context[:current_user]&.household
      context[:current_user].household.merchant_mappings.order(:raw_pattern)
    end

    field :balance_adjustments, [Types::BalanceAdjustmentType], null: false, connection: false, max_page_size: 100 do
      argument :account_id, ID, required: true
    end
    def balance_adjustments(account_id:)
      return [] unless context[:current_user]&.household
      account = AccountPolicy::Scope.new(context[:current_user], Account).resolve.find_by(id: account_id)
      return [] unless account
      account.balance_adjustments.ordered
    end

    field :categorization_rules, [Types::CategorizationRuleType], null: false, connection: false, max_page_size: 200
    def categorization_rules
      return [] unless context[:current_user]&.household
      CategorizationRulePolicy::Scope.new(context[:current_user], CategorizationRule).resolve
        .by_priority.includes(:category)
    end

    field :suggested_categorization_rules, [Types::SuggestedRuleType], null: false, connection: false, max_page_size: 100,
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

    field :recurring_items, [Types::RecurringItemType], null: false, connection: false, max_page_size: 100 do
      argument :active_only, Boolean, required: false, default_value: false
    end
    def recurring_items(active_only: false)
      return [] unless context[:current_user]&.household
      scope = RecurringItemPolicy::Scope.new(context[:current_user], RecurringItem).resolve
        .includes(:category, :account).order(:next_occurrence)
      scope = scope.active if active_only
      scope
    end

    field :budget, [Types::BudgetItemType], null: false, connection: false, max_page_size: 200 do
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
        category_groups: category_groups,
        budget_mode: budget.budget_mode,
        spending_target: budget.spending_target_cents / 100.0
      }
    end

    field :budget_settings, Types::BudgetSettingsType, null: true
    def budget_settings
      household = context[:current_user]&.household
      return nil unless household
      budget = household.budgets.first
      return OpenStruct.new(budget_mode: 'per_category', spending_target: 0.0) unless budget
      OpenStruct.new(
        budget_mode: budget.budget_mode,
        spending_target: budget.spending_target_cents / 100.0
      )
    end

    field :net_worth_history, [Types::NetWorthSnapshotType], null: false, connection: false, max_page_size: 100 do
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

    field :category_trends, [Types::CategoryTrendPointType], null: false, connection: false, max_page_size: 200 do
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

    field :benchmark_comparison, Types::BenchmarkComparisonType, null: false do
      argument :benchmark_symbol, String, required: false, default_value: "SPY"
      argument :months, Integer, required: false, default_value: 12
      argument :account_id, ID, required: false
    end
    def benchmark_comparison(benchmark_symbol: "SPY", months: 12, account_id: nil)
      empty = { benchmark_name: nil, benchmark_symbol: benchmark_symbol, period_months: months,
                portfolio_return: 0, benchmark_return: 0, alpha: 0, outperforming: false, data_points: [] }
      return empty unless context[:current_user]&.household

      result = Benchmarks::ComparisonService.new(
        household: context[:current_user].household,
        benchmark_symbol: benchmark_symbol,
        months: months,
        account_id: account_id
      ).call

      result.except(:success, :error)
    end

    field :portfolio_history, [Types::PortfolioHistoryPointType], null: false, connection: false, max_page_size: 500 do
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

    field :financial_health, Types::FinancialHealthType, null: false,
      description: 'Financial health score (0-100) with component breakdown and recommendations'
    def financial_health
      result = Analytics::FinancialHealthService.call(household: context[:current_user]&.household)
      return { score: 0, grade: 'F', components: [], recommendations: [] } if result.failure?

      result.data
    end

    field :spending_insights, Types::SpendingInsightsResultType, null: false,
      description: 'AI-powered spending insights: anomalies, budget projections, subscription changes, and savings opportunities'
    def spending_insights
      return { insights: [], generated_at: Time.current.iso8601, count: 0 } unless context[:current_user]&.household

      result = Analytics::SpendingInsightsService.call(household: context[:current_user].household)
      return { insights: [], generated_at: Time.current.iso8601, count: 0 } if result.failure?

      result.data
    end

    # ── Cash Flow Forecast ─────────────────────────────────────────
    field :cash_flow_forecast, Types::CashFlowForecastType, null: false,
      description: 'Projected cash flow based on recurring items and historical spending' do
      argument :days, Integer, required: false, default_value: 90
      argument :include_variable_spending, Boolean, required: false, default_value: true
    end
    def cash_flow_forecast(days:, include_variable_spending:)
      household = context[:current_user]&.household
      return empty_forecast unless household

      result = Analytics::CashFlowForecastService.call(
        household: household,
        days: days,
        include_variable_spending: include_variable_spending
      )
      return empty_forecast if result.failure?

      result.data
    end

    # ── Annual Summary ─────────────────────────────────────────────
    field :annual_summary, Types::AnnualSummaryType, null: false,
      description: 'Comprehensive annual financial summary with income, spending, savings, trends, and highlights' do
      argument :year, Integer, required: false
    end
    def annual_summary(year: nil)
      household = context[:current_user]&.household
      return empty_annual_summary unless household

      result = Analytics::AnnualSummaryService.call(household: household, year: year)
      return empty_annual_summary if result.failure?

      result.data
    end

    # ── Subscription & Plans ──────────────────────────────────────
    field :plans, [Types::PlanType], null: false, connection: false, max_page_size: 20,
      description: "All available subscription plans"
    def plans
      Plan.visible
    end

    field :my_subscription, Types::SubscriptionType, null: true,
      description: "Current household subscription"
    def my_subscription
      return nil unless context[:current_user]&.household
      context[:current_user].household.subscription
    end

    # ── Tax Summary ────────────────────────────────────────────────
    field :tax_summary, Types::TaxSummaryType, null: false,
      description: 'Tax summary with income classification, deductions, and estimated liability' do
      argument :year, Integer, required: false, description: 'Tax year (defaults to current year)'
      argument :filing_status, String, required: false, description: 'Filing status: single, married, head_of_household'
    end
    def tax_summary(year: nil, filing_status: nil)
      household = context[:current_user]&.household
      return empty_tax_summary unless household

      result = Tax::SummaryService.call(household: household, year: year, filing_status: filing_status)
      return empty_tax_summary if result.failure?

      result.data
    end

    # ── Monthly Recap ─────────────────────────────────────────────
    field :monthly_recap, Types::MonthlyRecapType, null: false,
      description: 'Comprehensive monthly financial recap with income, expenses, savings, budget performance, and comparisons' do
      argument :month, String, required: false, description: 'Month in YYYY-MM format (defaults to current month)'
    end
    def monthly_recap(month: nil)
      household = context[:current_user]&.household
      return empty_monthly_recap unless household

      result = Analytics::MonthlyRecapService.call(household: household, month: month)
      return empty_monthly_recap if result.failure?

      result.data
    end

    # ── FIRE Calculator ──────────────────────────────────────────────
    field :fire_calculator, Types::FireCalculatorType, null: false,
      description: 'FIRE (Financial Independence, Retire Early) calculator with projections and scenarios' do
      argument :current_age, Integer, required: false
      argument :retirement_age, Integer, required: false
      argument :annual_return_rate, Float, required: false
      argument :withdrawal_rate, Float, required: false
      argument :inflation_rate, Float, required: false
    end
    def fire_calculator(current_age: nil, retirement_age: nil, annual_return_rate: nil, withdrawal_rate: nil, inflation_rate: nil)
      household = context[:current_user]&.household
      empty = {
        summary: { fire_number: 0, coast_fire_number: 0, coast_fire_age: nil, years_to_fire: nil, fire_age: nil,
                   savings_rate: 0, monthly_savings: 0, progress_percent: 0, current_age: current_age || 30,
                   retirement_age: retirement_age || 65, withdrawal_rate: withdrawal_rate || 4.0,
                   annual_return_rate: annual_return_rate || 7.0, inflation_rate: inflation_rate || 3.0 },
        financials: { monthly_income: 0, monthly_expenses: 0, monthly_savings: 0, annual_income: 0,
                      annual_expenses: 0, annual_savings: 0, invested_assets: 0, total_net_worth: 0 },
        projections: [], scenarios: [], milestones: [], tips: []
      }
      return empty unless household

      result = Analytics::FireCalculatorService.call(
        household: household,
        current_age: current_age,
        retirement_age: retirement_age,
        annual_return_rate: annual_return_rate,
        withdrawal_rate: withdrawal_rate,
        inflation_rate: inflation_rate
      )
      return empty if result.failure?

      result.data
    end

    # ── Spending Heatmap ────────────────────────────────────────────
    field :spending_heatmap, Types::SpendingHeatmapType, null: false,
      description: 'Daily spending heatmap with weekday averages, category breakdown, streaks, and stats' do
      argument :year, Integer, required: false, description: 'Year to display (defaults to current year)'
    end
    def spending_heatmap(year: nil)
      household = context[:current_user]&.household
      return empty_spending_heatmap unless household

      result = Analytics::SpendingHeatmapService.call(household: household, year: year)
      return empty_spending_heatmap if result.failure?

      result.data
    end

    # ── Savings Rate & Income Allocation ─────────────────────────────
    field :savings_rate, Types::SavingsRateType, null: false,
      description: 'Savings rate trends, 50/30/20 allocation analysis, and income breakdown' do
      argument :months, Integer, required: false, default_value: 12, description: 'Number of months to analyze (3-36)'
    end
    def savings_rate(months: 12)
      household = context[:current_user]&.household
      empty = {
        summary: { current_savings_rate: 0, average_savings_rate: 0, best_month: nil, worst_month: nil,
                   trend_direction: 'stable', percentile: 10, months_analyzed: 0, total_saved: 0, average_monthly_savings: 0 },
        monthly_trends: [], allocation: { needs: { amount: 0, percent: 0, target_percent: 50, status: 'good' },
          wants: { amount: 0, percent: 0, target_percent: 30, status: 'good' },
          savings: { amount: 0, percent: 0, target_percent: 20, status: 'good' },
          other_expenses: { amount: 0, percent: 0 }, avg_monthly_income: 0 },
        income_sources: [], expense_allocation: [], streaks: { positive_savings_months: 0, above_20_percent_months: 0, total_months: 0 },
        recommendations: []
      }
      return empty unless household

      result = Analytics::SavingsRateService.call(household: household, months: months)
      return empty if result.failure?

      result.data
    end

    # ── Spending Comparison ────────────────────────────────────────
    field :spending_comparison, Types::SpendingComparisonType, null: false,
      description: 'Compare spending between two time periods with category and merchant breakdowns' do
      argument :period_a_start, String, required: true, description: 'Start date of period A (YYYY-MM-DD)'
      argument :period_a_end, String, required: true, description: 'End date of period A (YYYY-MM-DD)'
      argument :period_b_start, String, required: true, description: 'Start date of period B (YYYY-MM-DD)'
      argument :period_b_end, String, required: true, description: 'End date of period B (YYYY-MM-DD)'
    end
    def spending_comparison(period_a_start:, period_a_end:, period_b_start:, period_b_end:)
      household = context[:current_user]&.household
      empty = {
        period_a: '', period_b: '', period_a_start: period_a_start, period_a_end: period_a_end,
        period_b_start: period_b_start, period_b_end: period_b_end,
        totals: { period_a_income: 0, period_b_income: 0, income_change: 0, income_change_percent: 0,
                  period_a_expenses: 0, period_b_expenses: 0, expenses_change: 0, expenses_change_percent: 0,
                  period_a_net: 0, period_b_net: 0, net_change: 0,
                  period_a_transaction_count: 0, period_b_transaction_count: 0 },
        category_comparison: [], merchant_comparison: [], daily_curves: []
      }
      return empty unless household

      result = Analytics::SpendingComparisonService.call(
        household: household,
        period_a_start: period_a_start,
        period_a_end: period_a_end,
        period_b_start: period_b_start,
        period_b_end: period_b_end
      )
      return empty if result.failure?

      result.data
    end

    # ── Subscription Tracker ────────────────────────────────────────
    field :subscription_tracker, Types::SubscriptionTrackerType, null: false,
      description: 'Subscription tracker with cost analysis, category breakdown, price changes, and savings opportunities'
    def subscription_tracker
      household = context[:current_user]&.household
      empty = {
        subscriptions: [], summary: { total_monthly: 0.0, total_annual: 0.0, total_daily: 0.0,
          subscription_count: 0, most_expensive: nil, cheapest: nil, average_monthly: 0.0 },
        category_breakdown: [], price_changes: [], savings_opportunities: [],
        cost_per_day: 0.0, generated_at: Time.current.iso8601
      }
      return empty unless household

      result = Analytics::SubscriptionTrackerService.call(household: household)
      return empty if result.failure?

      result.data
    end

    # ── Debt Payoff Planner ──────────────────────────────────────────
    field :debt_payoff_plan, Types::DebtPayoffPlanType, null: true,
      description: 'Debt payoff plan comparing snowball, avalanche, and minimum-only strategies' do
      argument :extra_payment_cents, Integer, required: false, default_value: 0
    end
    def debt_payoff_plan(extra_payment_cents:)
      household = context[:current_user]&.household
      return nil unless household

      result = Debt::PayoffPlannerService.call(
        household: household,
        extra_payment_cents: extra_payment_cents
      )
      return nil if result.failure?

      result.data
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

    def empty_forecast
      {
        starting_balance: 0.0, ending_balance: 0.0, forecast_days: 0,
        total_projected_income: 0.0, total_projected_expenses: 0.0, net_cash_flow: 0.0,
        min_balance: 0.0, min_balance_date: nil, max_balance: 0.0, max_balance_date: nil,
        daily_projections: [], events: [], warnings: []
      }
    end

    def empty_portfolio
      { total_value: 0.0, total_cost_basis: 0.0, total_gain_loss: 0.0, total_gain_loss_percentage: 0.0, total_holdings_count: 0, allocations: [] }
    end

    def empty_reports
      { monthly_summary: [], spending_by_category: [], monthly_spending_by_category: [], top_merchants: [] }
    end

    def empty_annual_summary
      {
        year: Date.current.year,
        income: { total: 0.0, monthly_average: 0.0 },
        spending: { total: 0.0, monthly_average: 0.0, daily_average: 0.0 },
        savings: { total: 0.0, rate: 0.0 },
        net_worth_change: { start_of_year: 0.0, end_of_period: 0.0, change: 0.0, change_percentage: 0.0 },
        monthly_trends: [],
        top_categories: [],
        top_merchants: [],
        budget_performance: { months_on_budget: 0, months_over_budget: 0, total_months: 0 },
        highlights: { biggest_expense: nil, biggest_income: nil, most_frequent_merchant: nil, biggest_spending_month: nil, most_frugal_month: nil, goals_achieved: 0 },
        transaction_count: 0,
        days_tracked: 0
      }
    end

    def empty_monthly_recap
      {
        month: Date.current.strftime('%Y-%m'),
        income: { total: 0.0, previous_month: 0.0, change: 0.0, change_percentage: 0.0, top_sources: [] },
        expenses: { total: 0.0, previous_month: 0.0, change: 0.0, change_percentage: 0.0, daily_average: 0.0, transaction_count: 0 },
        savings: { amount: 0.0, rate: 0.0, previous_amount: 0.0, previous_rate: 0.0 },
        net_worth: { current: 0.0, start_of_month: 0.0, change: 0.0, change_percentage: 0.0, assets: 0.0, liabilities: 0.0 },
        budget_performance: { has_budget: false, total_budgeted: 0.0, total_spent: 0.0, remaining: 0.0, on_track: true, categories: [] },
        category_breakdown: [],
        top_merchants: [],
        recurring_summary: { total_recurring_expenses: 0.0, total_recurring_income: 0.0, bills_due_count: 0, bills_paid_count: 0, upcoming: [] },
        notable_transactions: { largest_expense: nil, largest_income: nil, unusual_transactions: [] },
        comparison: { income_change: 0.0, expense_change: 0.0, savings_change: 0.0, transaction_count: 0, previous_transaction_count: 0 },
        daily_spending: []
      }
    end

    def empty_tax_summary
      {
        year: Date.current.year,
        filing_status: 'single',
        income_summary: { total: 0.0, buckets: [] },
        deduction_summary: { standard_deduction: 15_000.0, itemized_total: 0.0, should_itemize: false, recommended_deduction: 15_000.0, buckets: [] },
        tax_estimate: { gross_income: 0.0, adjustments: 0.0, agi: 0.0, deduction_amount: 15_000.0, deduction_type: 'standard', taxable_income: 0.0, federal_tax: 0.0, self_employment_tax: 0.0, total_estimated_tax: 0.0, effective_rate: 0.0, marginal_rate: 10.0, bracket_breakdown: [] },
        quarterly_breakdown: [],
        category_details: [],
        tips: []
      }
    end

    def empty_spending_heatmap
      {
        year: Date.current.year,
        daily_spending: [],
        weekday_averages: (0..6).map { |d| { day_of_week: d, day_name: %w[Sunday Monday Tuesday Wednesday Thursday Friday Saturday][d], average: 0.0, total: 0.0, count: 0 } },
        monthly_totals: [],
        category_heatmap: [],
        stats: { total_spent: 0.0, days_tracked: 0, spending_days: 0, no_spend_days: 0, daily_average: 0.0, max_day_amount: 0.0, max_day_date: nil, min_spending_day_amount: 0.0 },
        streaks: { longest_no_spend_days: 0, longest_no_spend_start: nil, longest_no_spend_end: nil, current_no_spend_streak: 0 }
      }
    end

    def empty_dashboard
      { net_worth: 0.0, net_worth_change: 0.0, monthly_income: 0.0, monthly_expenses: 0.0, cash_flow: 0.0, spending_by_category: [], recent_transactions: [], account_balances: [], needs_review_count: 0, goals_summary: [] }
    end
  end
end
