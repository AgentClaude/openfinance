# RecurringItem model for OpenFinance
# Tracks recurring transactions and subscriptions

class RecurringItem < ApplicationRecord

  # Associations
  belongs_to :household
  belongs_to :account, optional: true
  belongs_to :category, optional: true

  # Money attributes
  monetize :expected_amount_cents, allow_nil: true

  # Validations
  validates :household, presence: true
  validates :merchant_name, presence: true, length: { minimum: 1, maximum: 255 }
  validates :frequency, inclusion: { in: %w[weekly biweekly monthly quarterly yearly] }

  # Enums
  enum :frequency, { 
    weekly: 'weekly',
    biweekly: 'biweekly', 
    monthly: 'monthly',
    quarterly: 'quarterly',
    yearly: 'yearly'
  }
  # Currency enum removed - currency is now just a string field

  # Scopes
  scope :active, -> { where(is_active: true) }
  scope :inactive, -> { where(is_active: false) }
  scope :income, -> { where(is_income: true) }
  scope :expenses, -> { where(is_income: false) }
  scope :auto_detected, -> { where(is_auto_detected: true) }
  scope :manual, -> { where(is_auto_detected: false) }
  scope :due_soon, -> { where('next_expected_date <= ?', 7.days.from_now) }

  # Callbacks
  before_validation :set_defaults

  # Helper methods
  def frequency_days
    case frequency
    when 'weekly' then 7
    when 'biweekly' then 14
    when 'monthly' then 30
    when 'quarterly' then 90
    when 'yearly' then 365
    end
  end

  def due_soon?
    next_expected_date && next_expected_date <= 7.days.from_now.to_date
  end

  def overdue?
    next_expected_date && next_expected_date < Date.current
  end

  def days_until_due
    return 0 unless next_expected_date
    (next_expected_date - Date.current).to_i
  end

  def estimated_monthly_amount
    return 0 unless expected_amount

    case frequency
    when 'weekly' then expected_amount * 4.33
    when 'biweekly' then expected_amount * 2.17
    when 'monthly' then expected_amount
    when 'quarterly' then expected_amount / 3
    when 'yearly' then expected_amount / 12
    end
  end

  # API serialization
  def as_json(options = {})
    super(options.merge(
      methods: [
        :due_soon?, :overdue?, :days_until_due, :estimated_monthly_amount
      ],
      include: {
        account: { only: [:id, :name, :account_type] },
        category: { only: [:id, :name, :icon, :color] }
      }
    ))
  end

  private

  def set_defaults
    self.is_income ||= false
    self.is_auto_detected ||= false
    self.is_active ||= true
    self.currency ||= household&.users&.first&.get_preference('default_currency') || 'USD'
  end
end