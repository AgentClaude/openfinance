require 'resolv'
require 'ipaddr'

class WebhookSubscription < ApplicationRecord
  belongs_to :user
  has_many :webhook_deliveries, dependent: :destroy

  SUPPORTED_EVENTS = %w[
    transaction.created
    transaction.updated
    account.balance_updated
    budget.exceeded
    bill.upcoming
    bill.overdue
    goal.achieved
  ].freeze

  validates :url, presence: true, format: { with: /\Ahttps:\/\/.+/i, message: 'must be an HTTPS URL' }
  validates :secret, presence: true
  validates :events, presence: true
  validate :events_are_valid
  validate :url_not_internal

  before_validation :generate_secret, on: :create

  scope :active, -> { where(is_active: true) }
  scope :for_event, ->(event) { active.where("? = ANY(events)", event) }

  MAX_FAILURES = 10

  def disable_if_failing!
    return unless failure_count >= MAX_FAILURES

    update!(is_active: false, last_error: "Disabled after #{MAX_FAILURES} consecutive failures")
  end

  def record_success!
    update!(failure_count: 0, last_triggered_at: Time.current)
  end

  def record_failure!(error)
    increment!(:failure_count)
    update!(last_failed_at: Time.current, last_error: error.to_s.truncate(255))
    disable_if_failing!
  end

  def signing_key
    secret
  end

  private

  def generate_secret
    self.secret ||= "whsec_#{SecureRandom.hex(32)}"
  end

  def url_not_internal
    return if url.blank?

    uri = URI.parse(url)
    ip = IPAddr.new(Resolv.getaddress(uri.host))
    if ip.private? || ip.loopback? || ip.link_local?
      errors.add(:url, "must not point to internal/private addresses")
    end
  rescue URI::InvalidURIError, Resolv::ResolvError, IPAddr::InvalidAddressError
    errors.add(:url, "is not a valid URL")
  end

  def events_are_valid
    return if events.blank?

    invalid = events - SUPPORTED_EVENTS
    if invalid.any?
      errors.add(:events, "contains unsupported events: #{invalid.join(', ')}")
    end
  end
end
