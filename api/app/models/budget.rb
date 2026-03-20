# Budget model for OpenFinance
# Represents a budgeting configuration for a household

class Budget < ApplicationRecord
  # Associations
  belongs_to :household
  has_many :budget_items, dependent: :destroy
  has_many :categories, through: :budget_items

  # Validations
  validates :household, presence: true
  validates :name, presence: true, length: { minimum: 1, maximum: 255 }
  validates :period_type, inclusion: { in: %w[monthly weekly yearly] }
  validates :budget_mode, inclusion: { in: %w[per_category flex] }
  validates :spending_target_cents, numericality: { greater_than_or_equal_to: 0 }

  monetize :spending_target_cents

  # Scopes
  scope :active, -> { where(is_active: true) }
  scope :inactive, -> { where(is_active: false) }
  scope :by_type, ->(type) { where(period_type: type) }

  # Callbacks
  before_create :set_as_active_if_first
  after_update :ensure_single_active_budget

  # API serialization
  def as_json(options = {})
    super(options.merge(
      include: {
        budget_items: {
          include: {
            category: { only: [:id, :name, :icon, :color, :group_name] }
          }
        }
      }
    ))
  end

  private

  def set_as_active_if_first
    self.is_active = true if household.budgets.empty?
  end

  def ensure_single_active_budget
    if is_active? && saved_change_to_is_active?
      household.budgets.where.not(id: id).update_all(is_active: false)
    end
  end
end