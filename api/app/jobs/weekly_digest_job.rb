# frozen_string_literal: true

class WeeklyDigestJob < ApplicationJob
  queue_as :default

  def perform(user_id = nil)
    if user_id
      send_digest_for(User.find(user_id))
    else
      send_all_digests
    end
  end

  private

  def send_all_digests
    User.includes(:household, :notification_preferences).find_each do |user|
      next unless user.household
      next unless digest_enabled?(user)

      send_digest_for(user)
    rescue StandardError => e
      Rails.logger.error("[WeeklyDigest] Failed for user #{user.id}: #{e.message}")
    end
  end

  def send_digest_for(user)
    service = WeeklyDigestService.new(user)
    digest_data = service.call
    return unless digest_data

    WeeklyDigestMailer.weekly_digest(user, digest_data).deliver_now
    Rails.logger.info("[WeeklyDigest] Sent to #{user.email}")
  end

  def digest_enabled?(user)
    pref = user.notification_preferences.find_by(
      notification_type: 'weekly_digest',
      channel: 'email'
    )
    # Default: enabled if no preference exists
    pref.nil? || pref.enabled?
  end
end
