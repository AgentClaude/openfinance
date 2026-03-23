# Plan model for OpenFinance
# Represents subscription tiers (Free, Pro, Team)

class Plan < ApplicationRecord
  # Associations
  has_many :subscriptions, dependent: :restrict_with_error

  # Validations
  validates :name, presence: true, uniqueness: true
  validates :slug, presence: true, uniqueness: true
  validates :price_cents, numericality: { greater_than_or_equal_to: 0 }
  validates :annual_price_cents, numericality: { greater_than_or_equal_to: 0 }
  validates :max_accounts, numericality: { greater_than_or_equal_to: 0 }
  validates :max_transactions, numericality: { greater_than_or_equal_to: 0 }

  # Scopes
  scope :active, -> { where(is_active: true) }
  scope :ordered, -> { order(:position) }
  scope :visible, -> { active.ordered }

  # Helper methods
  def free?
    price_cents.zero?
  end

  def monthly_price
    price_cents / 100.0
  end

  def annual_price
    annual_price_cents / 100.0
  end

  def annual_monthly_price
    return 0 if annual_price_cents.zero?
    (annual_price_cents / 12.0 / 100.0).round(2)
  end

  def annual_savings_percentage
    return 0 if price_cents.zero? || annual_price_cents.zero?
    monthly_total = price_cents * 12
    ((1 - annual_price_cents.to_f / monthly_total) * 100).round(0)
  end

  def feature_list
    features_hash = features || {}
    enabled = []
    enabled << "#{max_accounts == 0 ? 'Unlimited' : max_accounts} connected accounts"
    enabled << "#{max_transactions == 0 ? 'Unlimited' : max_transactions} transactions/month"
    enabled << "Reports & analytics" if has_reports
    enabled << "Budgets" if has_budgets
    enabled << "Goals tracking" if has_goals
    enabled << "Investment tracking" if has_investments
    enabled << "Recurring transaction detection" if has_recurring
    enabled << "CSV/OFX import" if has_csv_import
    enabled << "API access" if has_api_access
    enabled << "Collaboration" if has_collaboration
    enabled << "Priority support" if has_priority_support
    enabled
  end
end
