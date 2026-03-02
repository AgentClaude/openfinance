# Background job for delivering notifications via email.
# Called automatically when a notification is created (via after_create callback).
# Checks user preferences before sending.

class NotificationDeliveryJob < ApplicationJob
  queue_as :notifications

  def perform(notification)
    Rails.logger.info "[NotificationDelivery] Delivering notification #{notification.id}: #{notification.title}"

    # Send email if user has email enabled for this notification type
    EmailNotificationService.deliver_alert(notification)

    Rails.logger.info "[NotificationDelivery] Notification #{notification.id} processed"
  rescue => e
    Rails.logger.error "[NotificationDelivery] Failed for notification #{notification.id}: #{e.message}"
  end
end
