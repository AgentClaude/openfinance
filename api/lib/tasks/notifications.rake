namespace :notifications do
  desc "Run all notification checks (budget alerts, bill reminders, large transactions)"
  task check: :environment do
    NotificationSchedulerJob.new.perform
  end

  desc "Clean up old notifications (older than 90 days)"
  task cleanup: :environment do
    count = Notification.where("created_at < ?", 90.days.ago).count
    Notification.cleanup_old_notifications
    puts "Cleaned up #{count} old notifications"
  end
end
