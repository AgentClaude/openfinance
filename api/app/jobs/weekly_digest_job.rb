# Sends weekly financial digest emails to all users who have the preference enabled
class WeeklyDigestJob < ApplicationJob
  queue_as :default

  def perform
    Rails.logger.info '[WeeklyDigest] Starting weekly digest delivery'
    sent = 0
    skipped = 0

    User.includes(:household, :notification_preferences).find_each do |user|
      next unless user.household
      next unless digest_enabled?(user)

      begin
        service = WeeklyDigestService.new(user)
        data = service.call
        next unless data

        DigestMailer.weekly_digest(user, data).deliver_now
        sent += 1
        Rails.logger.info "[WeeklyDigest] Sent digest to #{user.email}"
      rescue StandardError => e
        skipped += 1
        Rails.logger.error "[WeeklyDigest] Failed for #{user.email}: #{e.message}"
      end
    end

    Rails.logger.info "[WeeklyDigest] Complete: #{sent} sent, #{skipped} failed"
  end

  private

  def digest_enabled?(user)
    pref = user.notification_preferences.find_by(notification_type: 'weekly_digest', channel: 'email')
    # Default to enabled if no preference exists
    pref.nil? || pref.enabled
  end
end
