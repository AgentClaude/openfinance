# Sends weekly financial digest emails to all users who have the preference enabled.
# Intended to run every Sunday morning via Sidekiq-Cron or similar scheduler.

class WeeklyDigestJob < ApplicationJob
  queue_as :notifications

  def perform
    Rails.logger.info "[WeeklyDigest] Starting weekly digest for all households"

    Household.find_each do |household|
      next if household.users.empty?

      EmailNotificationService.send_weekly_digest(household)
      Rails.logger.info "[WeeklyDigest] Sent digest for household #{household.id}"
    rescue => e
      Rails.logger.error "[WeeklyDigest] Failed for household #{household.id}: #{e.message}"
    end

    Rails.logger.info "[WeeklyDigest] Complete"
  end
end
