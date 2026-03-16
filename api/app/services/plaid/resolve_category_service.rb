class Plaid::ResolveCategoryService < ApplicationService
  attr_accessor :household, :personal_finance_category, :preloaded_mappings

  validates :household, presence: true

  def call
    return validation_failure(self) unless valid?
    return success(category: nil) unless personal_finance_category

    primary = normalize_key(personal_finance_category['primary'])
    detailed = normalize_key(personal_finance_category['detailed'])
    mappings = preloaded_mappings || PlaidCategoryMapping.for_household(household).includes(:category).to_a

    # 1. Try detailed match first (most specific)
    if detailed.present?
      mapping = mappings.find { |m| m.plaid_primary == primary && m.plaid_detailed == detailed }
      return success(category: mapping.category) if mapping
    end

    # 2. Fall back to primary match
    mapping = mappings.find { |m| m.plaid_primary == primary && m.plaid_detailed.nil? }
    return success(category: mapping.category) if mapping

    # 3. No mapping found
    success(category: nil)
  end

  private

  def normalize_key(value)
    return nil if value.blank?
    value.to_s.upcase.strip
  end
end
