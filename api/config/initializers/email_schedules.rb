# Schedule recurring email notification jobs via Sidekiq.
# These jobs are idempotent — safe to run multiple times.
#
# In production, trigger via system cron or Sidekiq periodic jobs:
#   Weekly digest:  Every Monday 8am  → WeeklyDigestJob.perform_later
#   Bill reminders: Daily 8am        → BillReminderJob.perform_later
#   Budget alerts:  Daily 6pm        → BudgetAlertJob.perform_later
#
# Or via rails runner:
#   rails runner "WeeklyDigestJob.perform_later"
#   rails runner "BillReminderJob.perform_later"
#   rails runner "BudgetAlertJob.perform_later"

Rails.application.config.after_initialize do
  if defined?(Sidekiq) && Sidekiq.server?
    Rails.logger.info "Email notification jobs available: WeeklyDigestJob, BillReminderJob, BudgetAlertJob"
  end
end
