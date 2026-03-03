# Creates notifications for upcoming bills (recurring items due within N days).
# Designed to run daily via Sidekiq-cron or scheduler.
class BillReminderJob < ApplicationJob
  queue_as :notifications

  REMIND_DAYS = 3 # Remind 3 days before due

  def perform
    Household.find_each do |household|
      check_bills_for(household)
    end
  end

  private

  def check_bills_for(household)
    upcoming = household.recurring_items
      .where(is_active: true)
      .where(item_type: "expense")
      .where("next_occurrence BETWEEN ? AND ?", Date.current, Date.current + REMIND_DAYS.days)

    upcoming.each do |item|
      days_until = (item.next_occurrence - Date.current).to_i
      alert_key = "bill_due_#{item.id}_#{item.next_occurrence}"

      household.users.each do |user|
        next unless notification_enabled?(user, "bill_due")
        next if already_notified?(user, alert_key)

        title = days_until == 0 ?
          "Bill due today: #{item.name}" :
          "Bill due in #{days_until} #{'day'.pluralize(days_until)}: #{item.name}"

        body = "#{item.name} — #{format_currency(item.amount_cents)} due #{item.next_occurrence.strftime('%b %d')}."

        priority = days_until == 0 ? "high" : "normal"

        Notification.create!(
          user: user,
          household: household,
          title: title,
          body: body,
          notification_type: "transaction_alert",
          priority: priority,
          data: {
            alert_key: alert_key,
            recurring_item_id: item.id,
            amount_cents: item.amount_cents,
            due_date: item.next_occurrence.iso8601,
            days_until: days_until
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
    "$#{'%.2f' % (cents.abs / 100.0)}"
  end
end
