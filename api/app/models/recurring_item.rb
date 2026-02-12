class RecurringItem < ApplicationRecord
  belongs_to :household
  belongs_to :account, optional: true
  belongs_to :category, optional: true

  validates :household, presence: true
  validates :name, presence: true, length: { minimum: 1, maximum: 255 }
  validates :frequency, inclusion: { in: %w[weekly biweekly monthly quarterly yearly] }
  validates :amount_cents, presence: true

  scope :active, -> { where(is_active: true) }
  scope :inactive, -> { where(is_active: false) }
  scope :income, -> { where(is_income: true) }
  scope :expenses, -> { where(is_income: false) }
  scope :auto_detected, -> { where(is_auto_detected: true) }
  scope :upcoming, -> { where('next_occurrence <= ?', 30.days.from_now).order(:next_occurrence) }

  before_validation :set_defaults

  def amount
    (amount_cents || 0) / 100.0
  end

  def average_amount
    (average_amount_cents || amount_cents || 0) / 100.0
  end

  def estimated_monthly_amount
    case frequency
    when 'weekly' then amount * 4.33
    when 'biweekly' then amount * 2.17
    when 'monthly' then amount
    when 'quarterly' then amount / 3.0
    when 'yearly' then amount / 12.0
    else amount
    end
  end

  def due_soon?
    next_occurrence && next_occurrence <= 7.days.from_now.to_date
  end

  def overdue?
    next_occurrence && next_occurrence < Date.current
  end

  def days_until_due
    return nil unless next_occurrence
    (next_occurrence - Date.current).to_i
  end

  private

  def set_defaults
    self.is_income = false if is_income.nil?
    self.is_auto_detected = false if is_auto_detected.nil?
    self.is_active = true if is_active.nil?
    self.currency ||= 'USD'
    self.start_date ||= Date.current
    self.frequency_interval ||= 1
  end
end
