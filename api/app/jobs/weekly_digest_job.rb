# Sends weekly financial digest emails to all users with the preference enabled
# Designed to run every Monday morning via Sidekiq-cron or scheduled task
class WeeklyDigestJob < ApplicationJob
  queue_as :default

  def perform
    Rails.logger.info "[WeeklyDigest] Starting weekly digest delivery"

    users_to_notify.each do |user|
      deliver_digest(user)
    rescue => e
      Rails.logger.error "[WeeklyDigest] Failed for user #{user.id}: #{e.message}"
    end

    Rails.logger.info "[WeeklyDigest] Completed"
  end

  private

  def users_to_notify
    # Users who have email digest enabled (or all users if no preference set yet)
    User.joins(:household).distinct.select do |user|
      pref = user.notification_preferences.find_by(notification_type: 'weekly_digest', channel: 'email')
      pref.nil? || pref.enabled? # Default to sending if no preference exists
    end
  end

  def deliver_digest(user)
    service = WeeklyDigestService.new(user)
    data = service.generate
    return unless data

    # Skip if no transactions this week
    return if data[:spending_summary][:count].zero? && data[:income_summary][:count].zero?

    DigestMailer.weekly_digest(user, data).deliver_later
    Rails.logger.info "[WeeklyDigest] Queued digest for #{user.email}"
  end
end
