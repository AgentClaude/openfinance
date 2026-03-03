# Background job for delivering notifications via email
# Checks user preferences before sending

class NotificationDeliveryJob < ApplicationJob
  queue_as :notifications

  def perform(notification)
    return unless notification.is_a?(Notification)

    user = notification.user
    return unless user

    Rails.logger.info "Processing notification #{notification.id}: #{notification.title}"

    # Check if user has email enabled for this notification type
    pref_type = map_notification_type(notification.notification_type)
    if pref_type && email_enabled?(user, pref_type)
      deliver_email(notification)
    end

    Rails.logger.info "Notification #{notification.id} processing complete"
  end

  private

  def map_notification_type(type)
    case type
    when 'budget_alert' then 'budget_exceeded'
    when 'transaction_alert' then 'bill_due'
    when 'large_transaction' then 'large_transaction'
    when 'goal_progress' then 'goal_milestone'
    else nil
    end
  end

  def email_enabled?(user, pref_type)
    pref = NotificationPreference.find_by(user: user, notification_type: pref_type, channel: 'email')
    pref&.enabled? || false
  end

  def deliver_email(notification)
    NotificationMailer.alert_email(notification).deliver_later
    Rails.logger.info "Queued email for notification #{notification.id} to #{notification.user.email}"
  rescue => e
    Rails.logger.error "Failed to queue email for notification #{notification.id}: #{e.message}"
  end
end
