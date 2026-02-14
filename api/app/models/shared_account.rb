# frozen_string_literal: true

class SharedAccount < ApplicationRecord
  belongs_to :account
  belongs_to :shared_with_user, class_name: 'User'
  belongs_to :shared_by_user, class_name: 'User'

  validates :permission_level, presence: true, inclusion: { in: %w[view edit admin] }
  validates :account_id, uniqueness: { scope: :shared_with_user_id, message: 'already shared with this user' }
  validate :cannot_share_with_owner

  scope :for_user, ->(user) { where(shared_with_user_id: user.id) }

  private

  def cannot_share_with_owner
    return unless account && shared_with_user

    if account.household_id == shared_with_user.household_id
      errors.add(:shared_with_user, 'is already in the same household')
    end
  end
end
