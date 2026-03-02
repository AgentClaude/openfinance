# Sends weekly financial digest emails to all users who have the preference enabled
# Schedule: Every Monday at 8:00 AM (user's timezone, or UTC by default)

class WeeklyDigestJob < ApplicationJob
  queue_as :default

  def perform
    User.joins(:household).distinct.find_each do |user|
      next unless digest_enabled?(user)

      result = Reports::WeeklyDigestService.call(household: user.household)
      next unless result.success?

      WeeklyDigestMailer.digest_email(user, result.data[:digest]).deliver_later
    rescue StandardError => e
      Rails.logger.error("[WeeklyDigestJob] Failed for user #{user.id}: #{e.message}")
    end
  end

  private

  def digest_enabled?(user)
    pref = user.notification_preferences.find_by(notification_type: 'weekly_digest', channel: 'email')
    # Default to enabled if no preference exists
    pref.nil? || pref.enabled?
  end
end
