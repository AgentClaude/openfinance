class ApiKey < ApplicationRecord
  belongs_to :user

  validates :key, presence: true, uniqueness: true
  validates :name, presence: true, length: { minimum: 1, maximum: 100 }

  scope :active, -> { where(revoked_at: nil) }
  scope :revoked, -> { where.not(revoked_at: nil) }

  before_validation :generate_key, on: :create

  def revoked?
    revoked_at.present?
  end

  def revoke!
    update!(revoked_at: Time.current)
  end

  def touch_last_used!
    update_column(:last_used_at, Time.current)
  end

  private

  def generate_key
    self.key ||= SecureRandom.hex(32)
  end
end
