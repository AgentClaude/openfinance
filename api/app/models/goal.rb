# Goal model for OpenFinance
# Represents savings and financial goals

class Goal < ApplicationRecord

  # Associations
  belongs_to :household

  # Money attributes
  monetize :target_amount_cents
  monetize :current_amount_cents

  # Validations
  validates :household, presence: true
  validates :name, presence: true, length: { minimum: 1, maximum: 255 }
  validates :target_amount, presence: true, numericality: { greater_than: 0 }
  validates :current_amount, numericality: { greater_than_or_equal_to: 0 }
  validates :target_date, presence: true
  validates :icon, length: { maximum: 50 }, allow_blank: true
  validates :color, format: { with: /\A#[0-9a-fA-F]{6}\z/ }, allow_blank: true

  validate :target_date_in_future

  # Enums removed - currency is now just a string field

  # Scopes
  scope :active, -> { where(is_completed: false) }
  scope :completed, -> { where(is_completed: true) }
  scope :by_target_date, -> { order(:target_date) }
  scope :overdue, -> { where(is_completed: false).where('target_date < ?', Date.current) }

  # Callbacks
  before_validation :set_defaults
  before_save :check_completion_status

  # Helper methods
  def progress_percentage
    return 0 if target_amount.zero?
    [(current_amount / target_amount * 100).round(2), 100].min
  end

  def amount_remaining
    [target_amount - current_amount, 0].max
  end

  def days_remaining
    return 0 if target_date < Date.current
    (target_date - Date.current).to_i
  end

  def overdue?
    !is_completed? && target_date < Date.current
  end

  def on_track?
    return true if completed_at.present?
    return false if overdue?
    
    days_total = (target_date - created_at.to_date).to_i
    days_elapsed = (Date.current - created_at.to_date).to_i
    expected_progress = days_elapsed.to_f / days_total * 100
    
    progress_percentage >= expected_progress
  end

  def monthly_target_to_complete
    return 0 if is_completed? || days_remaining.zero?
    
    months_remaining = days_remaining / 30.0
    amount_remaining / months_remaining
  end

  # API serialization
  def as_json(options = {})
    super(options.merge(
      methods: [
        :progress_percentage, :amount_remaining, :days_remaining,
        :overdue?, :on_track?, :monthly_target_to_complete
      ]
    ))
  end

  private

  def set_defaults
    self.current_amount ||= 0
    self.currency ||= household&.users&.first&.get_preference('default_currency') || 'USD'
    self.color ||= generate_color
    self.icon ||= '🎯'
  end

  def check_completion_status
    was_completed = is_completed?
    self.is_completed = current_amount >= target_amount
    
    if is_completed? && !was_completed
      self.completed_at = Time.current
    elsif !is_completed? && was_completed
      self.completed_at = nil
    end
  end

  def target_date_in_future
    if target_date.present? && target_date <= Date.current && new_record?
      errors.add(:target_date, 'must be in the future')
    end
  end

  def generate_color
    colors = %w[#FF6B6B #4ECDC4 #45B7D1 #FFA07A #98D8C8 #F7DC6F #BB8FCE #85C1E9]
    colors[name.to_s.sum % colors.length]
  end
end