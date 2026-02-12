class CategorizationRule < ApplicationRecord
  belongs_to :household
  belongs_to :category

  validates :household, presence: true
  validates :category, presence: true
  validates :match_field, inclusion: { in: %w[merchant_name description amount] }
  validates :match_type, inclusion: { in: %w[contains exact starts_with ends_with regex] }
  validates :match_value, presence: true, length: { minimum: 1, maximum: 500 }
  validates :priority, numericality: { greater_than_or_equal_to: 0 }

  scope :active, -> { where(is_active: true) }
  scope :by_priority, -> { order(priority: :desc, created_at: :asc) }

  before_validation :set_defaults

  def matches?(transaction)
    return false unless is_active?

    field_value = case match_field
                  when 'merchant_name' then transaction.merchant_name
                  when 'description' then transaction.name
                  when 'amount' then transaction.amount_cents.to_s
                  end
    return false if field_value.blank?

    case match_type
    when 'contains'
      field_value.to_s.downcase.include?(match_value.downcase)
    when 'exact'
      field_value.to_s.downcase == match_value.downcase
    when 'starts_with'
      field_value.to_s.downcase.start_with?(match_value.downcase)
    when 'ends_with'
      field_value.to_s.downcase.end_with?(match_value.downcase)
    when 'regex'
      Regexp.new(match_value, Regexp::IGNORECASE).match?(field_value.to_s)
    else
      false
    end
  rescue RegexpError
    false
  end

  private

  def set_defaults
    self.priority ||= 0
    self.match_field ||= 'merchant_name'
    self.match_type ||= 'contains'
    self.rule_type ||= match_field
    self.conditions ||= { match_type: match_type, match_value: match_value }
    self.name ||= "#{match_field} #{match_type} '#{match_value}'"
  end
end
