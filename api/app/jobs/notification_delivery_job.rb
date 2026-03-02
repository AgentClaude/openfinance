# Background job for delivering notifications via email based on user preferences
class NotificationDeliveryJob < ApplicationJob
  queue_as :notifications

  # Map notification_type to mailer method
  MAILER_MAP = {
    'budget_alert' => :deliver_budget_alert,
    'large_transaction' => :deliver_large_transaction,
    'sync_error' => :deliver_sync_error
  }.freeze

  def perform(notification)
    return unless notification.is_a?(Notification)

    user = notification.user
    return unless user

    # Check if email is enabled for this notification type
    pref = user.notification_preferences.find_by(
      notification_type: map_to_preference_type(notification.notification_type),
      channel: 'email'
    )

    # Only send email if preference exists and is enabled
    if pref&.enabled?
      handler = MAILER_MAP[notification.notification_type]
      send(handler, notification) if handler
    end

    Rails.logger.info "Notification #{notification.id} processed: #{notification.title}"
  rescue => e
    Rails.logger.error "Notification delivery failed for #{notification.id}: #{e.message}"
  end

  private

  def map_to_preference_type(notification_type)
    case notification_type
    when 'budget_alert' then 'budget_exceeded'
    when 'transaction_alert' then 'bill_due'
    when 'large_transaction' then 'large_transaction'
    else notification_type
    end
  end

  def deliver_budget_alert(notification)
    data = notification.data || {}
    BudgetAlertMailer.budget_exceeded(
      notification.user,
      data['category_name'] || 'Unknown',
      (data['amount_spent'].to_i / 100.0),
      (data['budget_amount'].to_i / 100.0),
      data['percentage'].to_i
    ).deliver_later
  end

  def deliver_large_transaction(notification)
    # Large transaction emails can be added later
    Rails.logger.info "Large transaction notification #{notification.id} — email not yet implemented"
  end

  def deliver_sync_error(notification)
    # Sync error emails can be added later
    Rails.logger.info "Sync error notification #{notification.id} — email not yet implemented"
  end
end
