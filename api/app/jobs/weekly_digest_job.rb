# Sends weekly financial digest emails to all users who have it enabled
# Schedule: Run every Monday morning via Sidekiq-Cron or similar

class WeeklyDigestJob < ApplicationJob
  queue_as :notifications

  def perform
    Rails.logger.info "Starting weekly digest generation"

    sent_count = 0
    User.includes(:household, :notification_preferences).find_each do |user|
      next unless user.household
      next unless digest_enabled?(user)

      begin
        NotificationMailer.weekly_digest(user).deliver_later
        sent_count += 1
        Rails.logger.info "Queued weekly digest for #{user.email}"
      rescue => e
        Rails.logger.error "Failed to queue digest for #{user.email}: #{e.message}"
      end
    end

    Rails.logger.info "Weekly digest complete: #{sent_count} emails queued"
  end

  private

  def digest_enabled?(user)
    pref = NotificationPreference.find_by(
      user: user,
      notification_type: 'weekly_digest',
      channel: 'email'
    )
    # Default to true if no preference exists (opt-out model for digest)
    pref.nil? || pref.enabled?
  end
end
