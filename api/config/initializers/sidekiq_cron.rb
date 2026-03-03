# Sidekiq-Cron scheduled jobs
# Runs after Sidekiq is initialized

if defined?(Sidekiq::Cron)
  Rails.application.config.after_initialize do
    Sidekiq::Cron::Job.load_from_hash(
      'weekly_digest' => {
        'class' => 'WeeklyDigestJob',
        'cron' => '0 9 * * 1',  # Every Monday at 9:00 AM UTC
        'description' => 'Send weekly financial digest emails'
      },
      'notification_check' => {
        'class' => 'NotificationSchedulerJob',
        'cron' => '0 */6 * * *',  # Every 6 hours
        'description' => 'Check for budget alerts, bill reminders, etc.'
      },
      'bill_reminders' => {
        'class' => 'BillReminderJob',
        'cron' => '0 8 * * *',  # Daily at 8 AM
        'description' => 'Check for upcoming/overdue bills and send reminders'
      }
    )
  end
end
