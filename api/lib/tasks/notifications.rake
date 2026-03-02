# Notification-related rake tasks
# Schedule these via cron, Sidekiq-Cron, or Heroku Scheduler

namespace :notifications do
  desc 'Check budgets and create alerts for overspending (run daily)'
  task budget_alerts: :environment do
    BudgetAlertJob.perform_later
  end

  desc 'Send reminders for upcoming bills (run daily)'
  task bill_reminders: :environment do
    BillReminderJob.perform_later
  end

  desc 'Send weekly financial digest to opted-in users (run weekly, Monday morning)'
  task weekly_digest: :environment do
    WeeklyDigestJob.perform_later
  end

  desc 'Clean up old notifications older than 90 days'
  task cleanup: :environment do
    count = Notification.where('created_at < ?', 90.days.ago).count
    Notification.cleanup_old_notifications
    puts "Cleaned up #{count} old notifications"
  end
end
