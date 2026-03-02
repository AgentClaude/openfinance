# Sends reminders for upcoming recurring bills
# Schedule: Run daily via Sidekiq-Cron
# Reminds 3 days before and on the day a bill is due

class BillReminderJob < ApplicationJob
  queue_as :notifications

  REMINDER_DAYS = [3, 1, 0].freeze # Days before due date to remind

  def perform
    Rails.logger.info "[BillReminder] Checking for upcoming bills"

    Household.joins(:recurring_items).distinct.find_each do |household|
      check_household_bills(household)
    rescue StandardError => e
      Rails.logger.error "[BillReminder] Failed for household #{household.id}: #{e.message}"
    end

    Rails.logger.info "[BillReminder] Complete"
  end

  private

  def check_household_bills(household)
    REMINDER_DAYS.each do |days_before|
      target_date = Date.current + days_before.days

      items = household.recurring_items
                       .active
                       .where(is_income: false)
                       .where(next_occurrence: target_date)

      items.each do |item|
        next if already_reminded?(household, item, target_date)

        send_bill_reminder(household, item, days_before)
      end
    end
  end

  def already_reminded?(household, item, target_date)
    Notification.where(
      household: household,
      notification_type: 'transaction_alert'
    ).where(
      "data->>'recurring_item_id' = ? AND data->>'reminder_date' = ?",
      item.id.to_s, target_date.to_s
    ).exists?
  end

  def send_bill_reminder(household, item, days_before)
    label = case days_before
            when 0 then 'due today'
            when 1 then 'due tomorrow'
            else "due in #{days_before} days"
            end

    household.users.each do |user|
      # Check if user has bill_due email enabled
      pref = NotificationPreference.find_by(
        user: user,
        notification_type: 'bill_due',
        channel: 'email'
      )

      # Create in-app notification always
      Notification.create!(
        user: user,
        household: household,
        title: "Bill #{label}: #{item.name}",
        body: "#{item.name} ($#{'%.2f' % item.amount}) is #{label}.",
        notification_type: 'transaction_alert',
        priority: days_before == 0 ? 'high' : 'normal',
        data: {
          recurring_item_id: item.id,
          reminder_date: (Date.current + days_before.days).to_s,
          days_before: days_before,
          amount: item.amount_cents
        }
      )

      # Send email if enabled
      if pref&.enabled?
        NotificationMailer.bill_reminder(user, item).deliver_later
      end
    end
  end
end
