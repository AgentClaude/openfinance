class MerchantNameMapping < ApplicationRecord
  belongs_to :household

  validates :raw_pattern, presence: true, length: { minimum: 1, maximum: 500 }
  validates :clean_name, presence: true, length: { minimum: 1, maximum: 255 }
  validates :match_type, inclusion: { in: %w[contains exact starts_with ends_with] }
  validates :raw_pattern, uniqueness: { scope: [:household_id, :match_type], message: "already exists for this match type" }

  scope :active, -> { where(is_active: true) }

  def matches?(merchant_name)
    return false if merchant_name.blank?

    case match_type
    when 'contains'
      merchant_name.downcase.include?(raw_pattern.downcase)
    when 'exact'
      merchant_name.downcase == raw_pattern.downcase
    when 'starts_with'
      merchant_name.downcase.start_with?(raw_pattern.downcase)
    when 'ends_with'
      merchant_name.downcase.end_with?(raw_pattern.downcase)
    else
      false
    end
  end
end
