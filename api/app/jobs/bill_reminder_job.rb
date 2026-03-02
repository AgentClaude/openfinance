# Sends email reminders for upcoming bills (due within 3 days).
# Schedule: daily morning via Sidekiq-Cron.
class BillReminderJob < ApplicationJob
  queue_as :mailers

  REMINDER_DAYS = 3

  def perform
    User.joins(:notification_preferences)
        .where(notification_preferences: { notification_type: 'bill_due', channel: 'email', enabled: true })
        .distinct
        .find_each do |user|
      next unless user.household

      upcoming = user.household.recurring_items
        .where(is_active: true)
        .where('next_occurrence BETWEEN ? AND ?', Date.current, Date.current + REMINDER_DAYS.days)
        .order(:next_occurrence)

      next if upcoming.empty?

      items = upcoming.map do |item|
        { name: item.name, amount: item.amount_cents.abs, due_date: item.next_occurrence }
      end

      # Also create in-app notifications
      upcoming.each do |item|
        days_until = (item.next_occurrence - Date.current).to_i
        NotificationService.bill_upcoming(user: user, recurring_item: item, days_until: days_until)
      end

      NotificationMailer.bill_reminder(user, items).deliver_later
    rescue => e
      Rails.logger.error "BillReminderJob failed for user #{user.id}: #{e.message}"
    end
  end
end
