# CategorizationRule model for OpenFinance
# Rules for automatic transaction categorization

class CategorizationRule < ApplicationRecord
  # Associations
  belongs_to :household
  belongs_to :category

  # Validations
  validates :household, presence: true
  validates :category, presence: true
  validates :match_field, inclusion: { in: %w[merchant_name description amount] }
  validates :match_type, inclusion: { in: %w[contains exact starts_with ends_with regex] }
  validates :match_value, presence: true, length: { minimum: 1, maximum: 500 }
  validates :priority, numericality: { greater_than_or_equal_to: 0 }

  # Scopes
  scope :active, -> { where(is_active: true) }
  scope :by_priority, -> { order(:priority, :created_at) }
  scope :for_field, ->(field) { where(match_field: field) }

  # Callbacks
  before_validation :set_default_priority

  # Helper methods
  def matches?(transaction)
    return false unless is_active?

    field_value = transaction.send(match_field)
    return false if field_value.blank?

    case match_type
    when 'contains'
      field_value.to_s.downcase.include?(match_value.downcase)
    when 'exact'
      field_value.to_s.downcase == match_value.downcase
    when 'starts_with'
      field_value.to_s.downcase.starts_with?(match_value.downcase)
    when 'ends_with'
      field_value.to_s.downcase.ends_with?(match_value.downcase)
    when 'regex'
      Regexp.new(match_value, Regexp::IGNORECASE).match?(field_value.to_s)
    else
      false
    end
  rescue RegexpError
    false
  end

  def display_rule
    "#{match_field.humanize} #{match_type.humanize} '#{match_value}'"
  end

  # API serialization
  def as_json(options = {})
    super(options.merge(
      methods: [:display_rule],
      include: {
        category: { only: [:id, :name, :icon, :color] }
      }
    ))
  end

  private

  def set_default_priority
    self.priority ||= 0
  end
end