class MerchantMapping < ApplicationRecord
  belongs_to :household
  validates :raw_pattern, presence: true, length: { maximum: 500 }
  validates :clean_name, presence: true, length: { maximum: 255 }
  validates :match_type, inclusion: { in: %w[contains exact starts_with] }
  validates :raw_pattern, uniqueness: { scope: :household_id }
  scope :active, -> { where(is_active: true) }
  def matches?(text)
    return false if text.blank? || !is_active?
    case match_type
    when 'contains' then text.downcase.include?(raw_pattern.downcase)
    when 'exact' then text.downcase == raw_pattern.downcase
    when 'starts_with' then text.downcase.start_with?(raw_pattern.downcase)
    else false
    end
  end
end
