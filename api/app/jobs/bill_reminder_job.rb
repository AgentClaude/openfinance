# Sends email reminders for bills due in the next 3 days
class BillReminderJob < ApplicationJob
  queue_as :default

  REMINDER_DAYS = 3

  def perform
    User.includes(:household, notification_preferences: []).find_each do |user|
      next unless bill_reminder_enabled?(user)
      next unless user.household.present?

      bills = upcoming_bills(user.household)
      next if bills.empty?

      BillReminderMailer.upcoming_bills(user, bills.to_a).deliver_later

      # Create in-app notifications too
      bills.each do |bill|
        next if recent_notification_exists?(user, bill)

        Notification.create!(
          user: user,
          household: user.household,
          title: "Bill due: #{bill.name}",
          body: "#{bill.name} — $#{'%.2f' % (bill.amount_cents.abs / 100.0)} due #{bill.next_occurrence.strftime('%b %d')}",
          notification_type: 'transaction_alert',
          priority: bill.next_occurrence <= Date.tomorrow ? 'high' : 'normal',
          data: { recurring_item_id: bill.id, amount: bill.amount_cents, due_date: bill.next_occurrence.to_s }
        )
      end

      Rails.logger.info "Bill reminders sent to user #{user.id}: #{bills.size} bills"
    rescue => e
      Rails.logger.error "Failed bill reminders for user #{user.id}: #{e.message}"
    end
  end

  private

  def bill_reminder_enabled?(user)
    pref = user.notification_preferences.find_by(notification_type: 'bill_due', channel: 'email')
    pref.nil? || pref.enabled?
  end

  def upcoming_bills(household)
    RecurringItem.where(household_id: household.id, is_active: true)
                 .where('next_occurrence BETWEEN ? AND ?', Date.current, REMINDER_DAYS.days.from_now)
                 .order(:next_occurrence)
  end

  def recent_notification_exists?(user, bill)
    Notification.where(user: user, notification_type: 'transaction_alert')
                .where('created_at > ?', 24.hours.ago)
                .where("data->>'recurring_item_id' = ?", bill.id.to_s)
                .exists?
  end
end
