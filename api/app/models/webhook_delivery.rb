class WebhookDelivery < ApplicationRecord
  belongs_to :webhook_subscription

  scope :recent, -> { order(created_at: :desc).limit(50) }
  scope :successful, -> { where(success: true) }
  scope :failed, -> { where(success: false) }
end
