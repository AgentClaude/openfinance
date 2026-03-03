# Checks for upcoming and overdue recurring bills, creates notifications.
# Run daily via Sidekiq-cron or scheduled job.
#
# Reminder schedule:
#   - 3 days before due → normal priority
#   - 1 day before due  → normal priority
#   - Due today          → high priority
#   - Overdue            → high priority (only once)

class BillReminderJob < ApplicationJob
  queue_as :default

  REMINDER_WINDOWS = [
    { days: 3, priority: 'normal', label: 'in 3 days' },
    { days: 1, priority: 'normal', label: 'tomorrow' },
    { days: 0, priority: 'high',   label: 'today' },
  ].freeze

  def perform
    Rails.logger.info "[BillReminderJob] Checking for upcoming bills..."

    households_with_bills = Household.joins(:recurring_items)
                                     .where(recurring_items: { is_active: true })
                                     .distinct

    total_sent = 0

    households_with_bills.find_each do |household|
      household.users.find_each do |user|
        next unless bill_reminders_enabled?(user)

        total_sent += send_reminders_for(user, household)
      end
    end

    Rails.logger.info "[BillReminderJob] Sent #{total_sent} bill reminders"
  end

  private

  def send_reminders_for(user, household)
    sent = 0
    today = Date.current

    active_bills = household.recurring_items.active.expenses
                            .where.not(next_occurrence: nil)

    # Upcoming reminders (3 days, 1 day, today)
    REMINDER_WINDOWS.each do |window|
      target_date = today + window[:days].days
      due_bills = active_bills.where(next_occurrence: target_date)

      due_bills.each do |bill|
        next if already_reminded?(user, bill, window[:days])

        create_reminder(user, bill, window)
        sent += 1
      end
    end

    # Overdue bills (past due, not yet reminded as overdue)
    overdue_bills = active_bills.where('next_occurrence < ?', today)
    overdue_bills.each do |bill|
      next if already_reminded?(user, bill, -1) # -1 signals overdue

      days_overdue = (today - bill.next_occurrence).to_i
      NotificationService.notify(
        user: user,
        type: 'transaction_alert',
        title: "Overdue bill: #{bill.name}",
        body: "#{bill.name} ($#{'%.2f' % bill.amount}) was due #{days_overdue} #{'day'.pluralize(days_overdue)} ago.",
        priority: 'high',
        data: { recurring_item_id: bill.id, days_overdue: days_overdue, reminder_type: 'overdue' }
      )
      sent += 1
    end

    sent
  end

  def create_reminder(user, bill, window)
    label = window[:label]
    NotificationService.notify(
      user: user,
      type: 'transaction_alert',
      title: "Bill due #{label}: #{bill.name}",
      body: "#{bill.name} ($#{'%.2f' % bill.amount}) is due #{label}.",
      priority: window[:priority],
      data: {
        recurring_item_id: bill.id,
        days_until: window[:days],
        due_date: bill.next_occurrence.to_s,
        reminder_type: 'upcoming'
      }
    )
  end

  def already_reminded?(user, bill, days_marker)
    # Check if we already sent a reminder for this bill at this interval today
    user.notifications
        .where(notification_type: 'transaction_alert')
        .where('created_at >= ?', Date.current.beginning_of_day)
        .where("data->>'recurring_item_id' = ?", bill.id.to_s)
        .where("(data->>'days_until' = ? OR data->>'reminder_type' = ?)",
               days_marker.to_s,
               days_marker < 0 ? 'overdue' : 'upcoming')
        .exists?
  end

  def bill_reminders_enabled?(user)
    pref = user.notification_preferences.find_by(
      notification_type: 'bill_due',
      channel: 'in_app'
    )
    # Default to enabled if no preference set
    pref.nil? || pref.enabled
  end
end
