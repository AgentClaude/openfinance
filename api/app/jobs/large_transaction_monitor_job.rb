# Detects large transactions and creates notifications.
# Called after transaction sync or can run periodically.
class LargeTransactionMonitorJob < ApplicationJob
  queue_as :notifications

  # Default threshold: $500. Could be made user-configurable.
  DEFAULT_THRESHOLD_CENTS = 50_000

  def perform(household_id = nil)
    if household_id
      household = Household.find(household_id)
      check_for(household)
    else
      Household.find_each { |h| check_for(h) }
    end
  end

  private

  def check_for(household)
    # Check transactions from last 24 hours
    recent = household.transactions
      .where("created_at > ?", 24.hours.ago)
      .where("ABS(amount_cents) >= ?", DEFAULT_THRESHOLD_CENTS)

    recent.each do |txn|
      alert_key = "large_txn_#{txn.id}"

      household.users.each do |user|
        next unless notification_enabled?(user, "large_transaction")
        next if already_notified?(user, alert_key)

        Notification.create!(
          user: user,
          household: household,
          title: "Large transaction: #{format_currency(txn.amount_cents.abs)}",
          body: "#{txn.name} on #{txn.account.name} (#{txn.date.strftime('%b %d')}).",
          notification_type: "large_transaction",
          priority: "high",
          data: {
            alert_key: alert_key,
            transaction_id: txn.id,
            account_id: txn.account_id,
            amount_cents: txn.amount_cents,
            description: txn.name
          }
        )
      end
    end
  end

  def already_notified?(user, alert_key)
    user.notifications
      .where("data->>'alert_key' = ?", alert_key)
      .exists?
  end

  def notification_enabled?(user, type)
    pref = user.notification_preferences.find_by(notification_type: type, channel: "in_app")
    pref.nil? || pref.enabled
  end

  def format_currency(cents)
    "$#{'%.2f' % (cents / 100.0)}"
  end
end
