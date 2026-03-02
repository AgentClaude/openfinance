# Background job for delivering notifications via various channels
# Handles in-app (already created), email, and future push notifications

class NotificationDeliveryJob < ApplicationJob
  queue_as :notifications

  def perform(notification)
    Rails.logger.info "Delivering notification #{notification.id}: #{notification.title}"

    deliver_email(notification) if email_enabled?(notification)

    Rails.logger.info "Notification #{notification.id} delivered successfully"
  end

  private

  def email_enabled?(notification)
    # Map notification type to preference type
    pref_type = case notification.notification_type
                when 'budget_alert' then 'budget_exceeded'
                when 'transaction_alert' then 'bill_due'
                when 'goal_progress' then 'goal_milestone'
                when 'large_transaction' then 'large_transaction'
                else return false
                end

    pref = notification.user.notification_preferences
      .find_by(notification_type: pref_type, channel: 'email')

    pref&.enabled || false
  end

  def deliver_email(notification)
    NotificationMailer.alert_email(notification).deliver_now
  rescue StandardError => e
    Rails.logger.error "Email delivery failed for notification #{notification.id}: #{e.message}"
  end
end
