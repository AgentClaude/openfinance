class WeeklyDigestJob < ApplicationJob
  queue_as :default

  def self.safe_perform_later(*)
    perform_later(*)
  rescue => e
    Rails.logger.warn("WeeklyDigestJob enqueue failed: #{e.message}")
  end

  def perform
    users = User.where.not(household_id: nil)
    users.find_each do |user|
      next unless digest_enabled?(user)

      service = WeeklyDigestService.new(user)
      digest_data = service.generate
      next unless digest_data

      DigestMailer.weekly_digest(user, digest_data).deliver_now
      Rails.logger.info("Weekly digest sent to #{user.email}")
    rescue => e
      Rails.logger.error("Weekly digest failed for user #{user.id}: #{e.message}")
      raise if Rails.env.test?
    end
  end

  private

  def digest_enabled?(user)
    pref = user.notification_preferences.find_by(
      notification_type: 'weekly_digest',
      channel: 'email'
    )
    # Default to false — user must opt in
    pref&.enabled? || false
  end
end
