# Background job for delivering notifications via various channels.
# Checks user preferences and sends via email if enabled.

class NotificationDeliveryJob < ApplicationJob
  queue_as :notifications

  def perform(notification)
    return unless notification.is_a?(Notification)

    Rails.logger.info "Delivering notification #{notification.id}: #{notification.title}"

    deliver_email(notification) if email_enabled?(notification)

    Rails.logger.info "Notification #{notification.id} delivery complete"
  end

  private

  def email_enabled?(notification)
    pref_type = preference_type_for(notification.notification_type)
    return false unless pref_type

    pref = notification.user.notification_preferences
                        .find_by(notification_type: pref_type, channel: 'email')
    pref&.enabled || false
  end

  def preference_type_for(notification_type)
    case notification_type
    when 'budget_alert' then 'budget_exceeded'
    when 'transaction_alert' then 'bill_due'
    when 'goal_progress' then 'goal_milestone'
    when 'large_transaction' then 'large_transaction'
    else nil
    end
  end

  def deliver_email(notification)
    NotificationMailer.notification_email(notification).deliver_later
    Rails.logger.info "Email queued for notification #{notification.id}"
  rescue => e
    Rails.logger.error "Email delivery failed for notification #{notification.id}: #{e.message}"
  end
end
