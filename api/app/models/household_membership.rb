# HouseholdMembership model for OpenFinance
# Handles many-to-many relationship between users and households

class HouseholdMembership < ApplicationRecord
  # Associations
  belongs_to :user
  belongs_to :household

  # Validations
  validates :user, presence: true
  validates :household, presence: true
  validates :role, presence: true, inclusion: { in: %w[owner member advisor] }
  validates :user_id, uniqueness: { scope: :household_id, message: "is already a member of this household" }

  # Enums
  enum :role, { owner: 'owner', member: 'member', advisor: 'advisor' }

  # Scopes
  scope :owners, -> { where(role: 'owner') }
  scope :members, -> { where(role: 'member') }
  scope :advisors, -> { where(role: 'advisor') }
  scope :active, -> { joins(:user).where(users: { locked_at: nil }) }

  # Callbacks
  before_validation :set_default_role, on: :create
  validate :user_cannot_be_member_of_own_primary_household
  validate :household_must_have_at_least_one_owner, on: :destroy

  # Permission methods
  def can_manage_household?
    owner?
  end

  def can_manage_accounts?
    owner? || member?
  end

  def can_view_transactions?
    true # All members can view transactions
  end

  def can_edit_transactions?
    owner? || member?
  end

  def can_manage_budgets?
    owner? || member?
  end

  def can_manage_goals?
    owner? || member?
  end

  def can_invite_members?
    owner?
  end

  def can_remove_members?
    owner?
  end

  def readonly_access?
    advisor?
  end

  # Display methods
  def role_display
    role.titleize
  end

  def display_name
    user.display_name
  end

  def joined_at
    created_at
  end

  # API serialization
  def as_json(options = {})
    super(options.merge(
      include: {
        user: {
          only: [:id, :name, :email],
          methods: [:display_name, :avatar_url]
        }
      },
      methods: [:role_display, :joined_at]
    ))
  end

  private

  def set_default_role
    self.role ||= 'member'
  end

  def user_cannot_be_member_of_own_primary_household
    if user&.household_id == household_id
      errors.add(:household, "cannot add user as member of their own primary household")
    end
  end

  def household_must_have_at_least_one_owner
    if owner? && household.household_memberships.owners.count == 1
      errors.add(:base, "Household must have at least one owner")
      throw(:abort)
    end
  end
end