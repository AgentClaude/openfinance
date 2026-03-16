class ShareToken < ApplicationRecord
  belongs_to :user

  validates :token, presence: true, uniqueness: true
  WIDGET_TYPES = %w[net_worth spending budget].freeze

  validates :widget_type, presence: true, inclusion: { in: WIDGET_TYPES }

  before_validation :generate_token, on: :create

  scope :active, -> { where('expires_at IS NULL OR expires_at > ?', Time.current) }

  def expired?
    expires_at.present? && expires_at < Time.current
  end

  private

  def generate_token
    self.token ||= SecureRandom.urlsafe_base64(32)
  end
end
