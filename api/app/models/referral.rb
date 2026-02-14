class Referral < ApplicationRecord
  belongs_to :referrer, class_name: 'User'
  belongs_to :referred_user, class_name: 'User'

  validates :referral_code, presence: true
  validates :status, inclusion: { in: %w[pending completed rewarded] }
  validates :referred_user_id, uniqueness: { scope: :referrer_id }

  scope :completed, -> { where(status: 'completed') }
  scope :pending, -> { where(status: 'pending') }
  scope :rewarded, -> { where(status: 'rewarded') }

  def complete!
    update!(status: 'completed')
  end

  def mark_rewarded!
    update!(status: 'rewarded', rewarded_at: Time.current)
  end
end
