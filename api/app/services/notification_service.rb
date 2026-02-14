class NotificationService
  def self.notify(user:, type:, title:, body: nil, priority: 'normal', data: {})
    return unless should_notify?(user, type)

    Notification.create!(
      user: user,
      household: user.household,
      title: title,
      body: body,
      notification_type: type,
      priority: priority,
      data: data
    )
  end

  def self.budget_exceeded(user:, category:, spent_cents:, budget_cents:)
    pct = (spent_cents.to_f / budget_cents * 100).round(0)
    notify(
      user: user,
      type: 'budget_alert',
      title: "Budget exceeded: #{category.name}",
      body: "You've spent #{pct}% of your #{category.name} budget ($#{'%.2f' % (spent_cents / 100.0)} of $#{'%.2f' % (budget_cents / 100.0)}).",
      priority: pct >= 120 ? 'high' : 'normal',
      data: { category_id: category.id, spent_cents: spent_cents, budget_cents: budget_cents, percentage: pct }
    )
  end

  def self.bill_upcoming(user:, recurring_item:, days_until:)
    notify(
      user: user,
      type: 'transaction_alert',
      title: "Bill due soon: #{recurring_item.name}",
      body: "#{recurring_item.name} is due in #{days_until} #{'day'.pluralize(days_until)}.",
      priority: days_until <= 1 ? 'high' : 'normal',
      data: { recurring_item_id: recurring_item.id, days_until: days_until }
    )
  end

  def self.goal_milestone(user:, goal:, percentage:)
    notify(
      user: user,
      type: 'goal_progress',
      title: "Goal milestone: #{goal.name}",
      body: "You've reached #{percentage}% of your #{goal.name} goal!",
      priority: percentage >= 100 ? 'high' : 'normal',
      data: { goal_id: goal.id, percentage: percentage }
    )
  end

  def self.large_transaction(user:, transaction:, threshold_cents: 50000)
    amount = transaction.amount_cents.abs / 100.0
    notify(
      user: user,
      type: 'large_transaction',
      title: "Large transaction: $#{'%.2f' % amount}",
      body: "#{transaction.name || 'Transaction'} for $#{'%.2f' % amount} on #{transaction.account&.name}.",
      priority: 'high',
      data: { transaction_id: transaction.id, amount_cents: transaction.amount_cents.abs }
    )
  end

  private

  def self.should_notify?(user, type)
    # Map notification_type enum values to preference types
    pref_type = case type
                when 'budget_alert' then 'budget_exceeded'
                when 'transaction_alert' then 'bill_due'
                when 'goal_progress' then 'goal_milestone'
                when 'large_transaction' then 'large_transaction'
                else return true # allow types without preference mapping
                end

    pref = user.notification_preferences.find_by(notification_type: pref_type, channel: 'in_app')
    pref.nil? || pref.enabled
  end
end
