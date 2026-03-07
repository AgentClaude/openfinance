class WebhookEvent < ApplicationRecord
  belongs_to :webhook_subscription

  DELIVERY_STATUSES = %w[pending delivered failed].freeze

  validates :event_type, presence: true, inclusion: { in: WebhookSubscription::SUPPORTED_EVENTS }
  validates :delivery_status, presence: true, inclusion: { in: DELIVERY_STATUSES }
  validates :attempt, numericality: { greater_than: 0 }

  scope :pending, -> { where(delivery_status: "pending") }
  scope :delivered, -> { where(delivery_status: "delivered") }
  scope :failed, -> { where(delivery_status: "failed") }
  scope :recent, -> { order(created_at: :desc) }

  def delivered!(status_code:, response_body: nil, response_time_ms: nil)
    update!(
      delivery_status: "delivered",
      status_code: status_code,
      response_body: response_body&.truncate(1000),
      response_time_ms: response_time_ms,
      delivered_at: Time.current
    )
  end

  def failed!(error_message:, status_code: nil, response_body: nil, response_time_ms: nil)
    update!(
      delivery_status: "failed",
      error_message: error_message,
      status_code: status_code,
      response_body: response_body&.truncate(1000),
      response_time_ms: response_time_ms
    )
  end
end
