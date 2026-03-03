# Checks for upcoming bills and creates notifications for them
# Designed to run daily via Sidekiq-cron or similar scheduler

class BillReminderJob < ApplicationJob
  queue_as :default

  REMINDER_DAYS = [7, 3, 1, 0].freeze  # Days before due date to notify

  def perform
    User.includes(:household).find_each do |user|
      next unless bill_notifications_enabled?(user)
      next unless user.household

      check_upcoming_bills(user)
    rescue StandardError => e
      Rails.logger.error "Bill reminder check failed for user #{user.id}: #{e.message}"
    end
  end

  private

  def bill_notifications_enabled?(user)
    pref = user.notification_preferences.find_by(notification_type: 'bill_due', channel: 'in_app')
    pref.nil? || pref.enabled
  end

  def check_upcoming_bills(user)
    household = user.household
    today = Date.current

    household.recurring_items.where(is_active: true).find_each do |item|
      next unless item.next_occurrence

      days_until = (item.next_occurrence - today).to_i
      next unless REMINDER_DAYS.include?(days_until)
      next if already_notified?(user, item, days_until)

      NotificationService.bill_upcoming(
        user: user,
        recurring_item: item,
        days_until: days_until
      )
    end
  end

  def already_notified?(user, item, days_until)
    # Prevent duplicate notifications for the same bill + day
    user.notifications
        .where(notification_type: 'transaction_alert')
        .where('created_at > ?', 12.hours.ago)
        .where("data->>'recurring_item_id' = ?", item.id.to_s)
        .where("data->>'days_until' = ?", days_until.to_s)
        .exists?
  end
end
