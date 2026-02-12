# BudgetItem model for OpenFinance
# Represents budgeted amounts for specific categories and months

class BudgetItem < ApplicationRecord

  # Associations
  belongs_to :budget
  belongs_to :category

  # Money attributes
  monetize :amount_cents

  # Validations
  validates :budget, presence: true
  validates :category, presence: true
  validates :month, presence: true
  validates :amount, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :category_id, uniqueness: { scope: [:budget_id, :month] }

  # Enums removed - currency is now just a string field

  # Scopes
  scope :for_month, ->(month) { where(month: month.beginning_of_month) }
  scope :current_month, -> { for_month(Date.current) }
  scope :by_category, ->(category) { where(category: category) }

  # Callbacks
  before_validation :normalize_month
  before_validation :set_currency

  # Helper methods
  def total_budgeted
    amount
  end

  def month_name
    month.strftime('%B %Y')
  end

  # API serialization
  def as_json(options = {})
    super(options.merge(
      methods: [:total_budgeted, :month_name],
      include: {
        category: { only: [:id, :name, :icon, :color, :group_name] }
      }
    ))
  end

  private

  def normalize_month
    self.month = month.beginning_of_month if month.present?
  end

  def set_currency
    self.currency ||= budget.household.users.first&.get_preference('default_currency') || 'USD'
  end
end