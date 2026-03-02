# Background job for delivering notifications via various channels
# Checks user preferences before sending email

class NotificationDeliveryJob < ApplicationJob
  queue_as :notifications

  def perform(notification)
    return unless notification.is_a?(Notification)

    Rails.logger.info "Delivering notification #{notification.id}: #{notification.title}"

    deliver_email(notification) if email_enabled?(notification)

    Rails.logger.info "Notification #{notification.id} delivered successfully"
  end

  private

  def email_enabled?(notification)
    mapped_type = map_notification_type(notification.notification_type)
    return false unless mapped_type

    pref = NotificationPreference.find_by(
      user: notification.user,
      notification_type: mapped_type,
      channel: 'email'
    )

    # If no preference exists, email is off by default
    pref&.enabled? || false
  end

  def map_notification_type(type)
    case type
    when 'budget_alert' then 'budget_exceeded'
    when 'large_transaction' then 'large_transaction'
    when 'low_balance' then 'large_transaction' # grouped under same pref
    when 'goal_progress' then 'goal_milestone'
    when 'sync_error', 'account_connection' then nil # no email for these
    else nil
    end
  end

  def deliver_email(notification)
    case notification.notification_type
    when 'budget_alert'
      NotificationMailer.budget_alert(notification).deliver_later
    when 'large_transaction'
      NotificationMailer.large_transaction_alert(notification).deliver_later
    else
      NotificationMailer.notification_email(notification).deliver_later
    end
  rescue StandardError => e
    Rails.logger.error "Failed to deliver email for notification #{notification.id}: #{e.message}"
  end
end
