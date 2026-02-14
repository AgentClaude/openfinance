class Invitation < ApplicationRecord
  belongs_to :household
  belongs_to :invited_by, class_name: 'User'

  validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :role, presence: true, inclusion: { in: %w[owner member advisor] }
  validates :status, presence: true, inclusion: { in: %w[pending accepted declined expired] }
  validates :token, presence: true, uniqueness: true
  validates :expires_at, presence: true

  enum :status, { pending: 'pending', accepted: 'accepted', declined: 'declined', expired: 'expired' }
  enum :role, { owner: 'owner', member: 'member', advisor: 'advisor' }, prefix: :role

  scope :active, -> { pending.where('expires_at > ?', Time.current) }

  before_validation :generate_token, on: :create
  before_validation :set_expiration, on: :create

  def expired?
    expires_at < Time.current
  end

  def accept!(user)
    return false if expired? || !pending?

    transaction do
      update!(status: 'accepted', accepted_at: Time.current)
      household.add_member(user, role)
    end
    true
  end

  private

  def generate_token
    self.token ||= SecureRandom.urlsafe_base64(32)
  end

  def set_expiration
    self.expires_at ||= 7.days.from_now
  end
end
