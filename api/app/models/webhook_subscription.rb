class WebhookSubscription < ApplicationRecord
  belongs_to :user
  belongs_to :household
  has_many :webhook_events, dependent: :destroy

  SUPPORTED_EVENTS = %w[
    transaction.created
    transaction.updated
    transaction.deleted
    account.created
    account.updated
    account.synced
    budget.exceeded
    budget.updated
    recurring.due
    recurring.overdue
    goal.milestone
  ].freeze

  validates :url, presence: true, format: { with: /\Ahttps:\/\/.+/i, message: "must use HTTPS" }
  validates :name, presence: true, length: { minimum: 1, maximum: 100 }
  validates :secret, presence: true
  validates :events, presence: true
  validate :events_are_supported
  validate :url_not_internal

  before_validation :generate_secret, on: :create

  scope :active, -> { where(is_active: true, disabled_at: nil) }
  scope :for_event, ->(event_type) { active.where("? = ANY(events)", event_type) }

  def active?
    is_active && disabled_at.nil?
  end

  def disable!(reason: nil)
    update!(is_active: false, disabled_at: Time.current)
  end

  def record_success!
    update!(failure_count: 0, last_triggered_at: Time.current)
  end

  def record_failure!
    new_count = failure_count + 1
    if new_count >= 10
      disable!(reason: "Too many consecutive failures")
    else
      update!(failure_count: new_count, last_triggered_at: Time.current)
    end
  end

  def sign_payload(payload_json)
    OpenSSL::HMAC.hexdigest("SHA256", secret, payload_json)
  end

  private

  def generate_secret
    self.secret ||= "whsec_#{SecureRandom.hex(24)}"
  end

  def events_are_supported
    return if events.blank?

    unsupported = events - SUPPORTED_EVENTS
    if unsupported.any?
      errors.add(:events, "contains unsupported events: #{unsupported.join(', ')}")
    end
  end

  def url_not_internal
    return if url.blank?

    begin
      uri = URI.parse(url)
      return errors.add(:url, "must use HTTPS") unless uri.scheme == "https"

      ip = IPAddr.new(Resolv.getaddress(uri.host))
      if ip.private? || ip.loopback? || ip.link_local?
        errors.add(:url, "must not point to internal/private addresses")
      end
    rescue URI::InvalidURIError
      errors.add(:url, "is not a valid URL")
    rescue Resolv::ResolvError
      # Can't resolve — that's OK, we'll fail on delivery
    rescue IPAddr::InvalidAddressError
      # Not an IP — hostname is fine
    end
  end
end
