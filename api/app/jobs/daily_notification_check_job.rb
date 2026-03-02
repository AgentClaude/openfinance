# Daily job that checks for budget alerts and upcoming bill reminders.
# Runs once per day, checks all households.

class DailyNotificationCheckJob < ApplicationJob
  queue_as :notifications

  def perform
    Rails.logger.info "[DailyNotificationCheck] Starting daily checks"

    Household.find_each do |household|
      next if household.users.empty?

      EmailNotificationService.check_budget_alerts(household)
      EmailNotificationService.check_bill_reminders(household)
    rescue => e
      Rails.logger.error "[DailyNotificationCheck] Failed for household #{household.id}: #{e.message}"
    end

    Rails.logger.info "[DailyNotificationCheck] Complete"
  end
end
