# Orchestrates all notification checks. Run daily (or more frequently).
# Can be triggered via: NotificationSchedulerJob.perform_later
# Or via rake: rails notifications:check
class NotificationSchedulerJob < ApplicationJob
  queue_as :notifications

  def perform
    Rails.logger.info "[NotificationScheduler] Starting notification checks..."

    run_job("BudgetAlertJob") { BudgetAlertJob.new.perform }
    run_job("BillReminderJob") { BillReminderJob.new.perform }
    run_job("LargeTransactionMonitorJob") { LargeTransactionMonitorJob.new.perform }

    Rails.logger.info "[NotificationScheduler] All notification checks complete."
  end

  private

  def run_job(name)
    Rails.logger.info "[NotificationScheduler] Running #{name}..."
    yield
    Rails.logger.info "[NotificationScheduler] #{name} complete."
  rescue => e
    Rails.logger.error "[NotificationScheduler] #{name} failed: #{e.message}"
    Rails.logger.error e.backtrace&.first(5)&.join("\n")
  end
end
