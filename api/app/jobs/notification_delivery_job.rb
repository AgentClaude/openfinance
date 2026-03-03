# Delivers notifications via configured channels (in_app, email, push).
# Checks user preferences before sending through each channel.

class NotificationDeliveryJob < ApplicationJob
  queue_as :notifications

  def perform(notification)
    return unless notification.is_a?(Notification)

    user = notification.user
    return unless user

    Rails.logger.info "[NotificationDelivery] Delivering notification #{notification.id}: #{notification.title}"

    deliver_email(user, notification) if email_enabled?(user, notification)
    # Future: deliver_push(user, notification) if push_enabled?(user, notification)

    Rails.logger.info "[NotificationDelivery] Notification #{notification.id} delivered"
  end

  private

  def deliver_email(user, notification)
    return if user.email.blank?

    case notification.notification_type
    when 'transaction_alert'
      if notification.data&.dig('recurring_item_id').present?
        NotificationMailer.bill_reminder(user, notification).deliver_later
      else
        NotificationMailer.alert_email(notification).deliver_later
      end
    when 'budget_alert', 'large_transaction', 'sync_error', 'low_balance', 'goal_progress'
      NotificationMailer.alert_email(notification).deliver_later
    else
      Rails.logger.info "[NotificationDelivery] No email template for type: #{notification.notification_type}"
    end
  rescue => e
    Rails.logger.error "[NotificationDelivery] Email delivery failed: #{e.message}"
  end

  def email_enabled?(user, notification)
    pref_type = preference_type_for(notification.notification_type)
    return false unless pref_type

    pref = user.notification_preferences.find_by(
      notification_type: pref_type,
      channel: 'email'
    )
    pref&.enabled == true
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
end
