# Service for sending email notifications based on user preferences.
# Checks notification_preferences before sending any email.

class EmailNotificationService
  # Send an email for a notification if the user has email enabled for that type
  def self.deliver_alert(notification)
    user = notification.user
    pref_type = map_notification_type(notification.notification_type)
    return unless email_enabled?(user, pref_type)

    NotificationMailer.alert_email(notification).deliver_later
  end

  # Check budget spending and send alerts for categories over threshold
  def self.check_budget_alerts(household)
    month = Date.current.beginning_of_month
    budget = household.budgets.first
    return unless budget

    items = BudgetItem.where(budget: budget, month: month).includes(:category)
    return if items.empty?

    household.users.each do |user|
      next unless email_enabled?(user, 'budget_exceeded')

      items.each do |item|
        next unless item.category
        next if item.amount_cents <= 0

        spent_cents = household.transactions
          .where(category_id: item.category_id, date: month..month.end_of_month)
          .where('amount_cents < 0')
          .sum(:amount_cents).abs

        pct = (spent_cents.to_f / item.amount_cents * 100).round(1)

        # Alert at 90% and 100% thresholds
        next unless pct >= 90

        # Avoid duplicate alerts: check if we already sent one today for this category
        already_sent = Notification.where(
          user: user,
          notification_type: 'budget_alert',
          created_at: Date.current.all_day
        ).where("data->>'category_id' = ?", item.category_id.to_s).exists?
        next if already_sent

        # Create in-app notification
        notification = NotificationService.budget_exceeded(
          user: user,
          category: item.category,
          spent_cents: spent_cents,
          budget_cents: item.amount_cents
        )

        # Send email
        NotificationMailer.budget_alert_email(user, item, spent_cents / 100.0, pct).deliver_later
      end
    end
  end

  # Check for upcoming bills and send reminders
  def self.check_bill_reminders(household)
    upcoming = household.recurring_items
      .where(is_active: true)
      .where('next_occurrence BETWEEN ? AND ?', Date.current, 3.days.from_now.to_date)
      .includes(:category)

    return if upcoming.empty?

    household.users.each do |user|
      next unless email_enabled?(user, 'bill_due')

      # Avoid duplicate: check if we sent bill reminder today
      already_sent = Notification.where(
        user: user,
        notification_type: 'transaction_alert',
        created_at: Date.current.all_day
      ).where("data->>'type' = 'bill_reminder_batch'").exists?
      next if already_sent

      # Create in-app notifications for each bill
      upcoming.each do |item|
        days_until = (item.next_occurrence - Date.current).to_i
        NotificationService.bill_upcoming(user: user, recurring_item: item, days_until: days_until)
      end

      # Send single batch email
      NotificationMailer.bill_reminder_email(user, upcoming.to_a).deliver_later

      # Track that we sent the batch
      Notification.create!(
        user: user,
        household: household,
        title: "Bill reminders sent",
        body: "#{upcoming.size} upcoming bills",
        notification_type: 'transaction_alert',
        priority: 'low',
        is_read: true,
        data: { type: 'bill_reminder_batch', count: upcoming.size }
      )
    end
  end

  # Generate and send weekly digest for all users in a household
  def self.send_weekly_digest(household)
    week_end = Date.current
    week_start = week_end - 6.days

    household.users.each do |user|
      next unless email_enabled?(user, 'weekly_digest')

      digest_data = build_digest_data(household, week_start, week_end)
      NotificationMailer.weekly_digest(user, digest_data).deliver_later
    end
  end

  private

  def self.email_enabled?(user, notification_type)
    pref = user.notification_preferences.find_by(
      notification_type: notification_type,
      channel: 'email'
    )
    # Default: email is disabled unless explicitly enabled
    pref&.enabled == true
  end

  def self.map_notification_type(type)
    case type
    when 'budget_alert' then 'budget_exceeded'
    when 'transaction_alert' then 'bill_due'
    when 'goal_progress' then 'goal_milestone'
    when 'large_transaction' then 'large_transaction'
    else type
    end
  end

  def self.build_digest_data(household, week_start, week_end)
    txns = household.transactions.where(date: week_start..week_end)
    accounts = household.accounts.where(is_hidden: false)

    income_cents = txns.where('amount_cents > 0').sum(:amount_cents)
    expense_cents = txns.where('amount_cents < 0').sum(:amount_cents).abs
    cash_flow_cents = income_cents - expense_cents

    # Net worth
    liability_types = %w[credit credit_card loan mortgage auto_loan student_loan personal_loan heloc other_liability]
    asset_cents = accounts.reject { |a| liability_types.include?(a.account_type) }.sum(&:current_balance_cents)
    liability_cents = accounts.select { |a| liability_types.include?(a.account_type) }.sum(&:current_balance_cents)
    net_worth_cents = asset_cents - liability_cents

    # Top spending categories
    expense_by_cat = txns.where('amount_cents < 0')
      .group(:category_id)
      .pluck(:category_id, Arel.sql('SUM(ABS(amount_cents))'), Arel.sql('COUNT(*)'))
    cat_ids = expense_by_cat.map(&:first).compact
    cats = Category.where(id: cat_ids).index_by(&:id)
    top_categories = expense_by_cat.sort_by { |_, total, _| -total.to_i }.first(5).map do |cat_id, total, count|
      { name: cats[cat_id]&.name || 'Uncategorized', amount: total.to_i / 100.0, count: count.to_i }
    end

    # Budget status
    month = Date.current.beginning_of_month
    budget = household.budgets.first
    budget_status = nil
    if budget
      items = BudgetItem.where(budget: budget, month: month).includes(:category)
      if items.any?
        budgeted_cents = items.sum(&:amount_cents)
        month_expense_cents = household.transactions
          .where(date: month..month.end_of_month)
          .where('amount_cents < 0').sum(:amount_cents).abs

        over_budget = items.filter_map do |item|
          next unless item.category && item.amount_cents > 0
          spent = household.transactions
            .where(category_id: item.category_id, date: month..month.end_of_month)
            .where('amount_cents < 0').sum(:amount_cents).abs
          pct = (spent.to_f / item.amount_cents * 100).round(0)
          next unless pct > 100
          { name: item.category.name, spent: spent / 100.0, budgeted: item.amount_cents / 100.0, pct: pct }
        end

        budget_status = {
          budgeted: budgeted_cents / 100.0,
          spent: month_expense_cents / 100.0,
          remaining: (budgeted_cents - month_expense_cents) / 100.0,
          over_budget: over_budget
        }
      end
    end

    # Upcoming bills (next 7 days)
    upcoming_bills = household.recurring_items
      .where(is_active: true)
      .where('next_occurrence BETWEEN ? AND ?', Date.current, 7.days.from_now.to_date)
      .includes(:category)
      .order(:next_occurrence)
      .map do |item|
        { name: item.name, amount: item.amount_cents.abs / 100.0, due_date: item.next_occurrence }
      end

    {
      week_start: week_start,
      week_end: week_end,
      income: income_cents / 100.0,
      expenses: expense_cents / 100.0,
      cash_flow: cash_flow_cents / 100.0,
      net_worth: net_worth_cents / 100.0,
      net_worth_change: nil, # TODO: compare to last week's snapshot
      top_categories: top_categories,
      budget_status: budget_status,
      upcoming_bills: upcoming_bills,
      transaction_count: txns.count
    }
  end
end
