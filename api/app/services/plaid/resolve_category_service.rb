class Plaid::ResolveCategoryService < ApplicationService
  attr_accessor :household, :personal_finance_category

  validates :household, presence: true

  def call
    return validation_failure(self) unless valid?
    return success(category: nil) unless personal_finance_category

    primary = normalize_key(personal_finance_category['primary'])
    detailed = normalize_key(personal_finance_category['detailed'])

    # 1. Try detailed match first (most specific)
    if detailed.present?
      mapping = PlaidCategoryMapping.for_household(household)
                                    .find_by(plaid_primary: primary, plaid_detailed: detailed)
      return success(category: mapping.category) if mapping
    end

    # 2. Fall back to primary match
    mapping = PlaidCategoryMapping.for_household(household)
                                  .find_by(plaid_primary: primary, plaid_detailed: nil)
    return success(category: mapping.category) if mapping

    # 3. No mapping found — try categorization rules as last resort
    category = try_categorization_rules
    success(category: category)
  end

  private

  def normalize_key(value)
    return nil if value.blank?
    value.to_s.upcase.strip
  end

  def try_categorization_rules
    # If there's a merchant name in the transaction context, check rules
    nil
  end
end
