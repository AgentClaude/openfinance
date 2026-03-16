class PlaidCategoryMapping < ApplicationRecord
  belongs_to :category
  belongs_to :household

  validates :plaid_primary, presence: true
  validates :plaid_primary, uniqueness: { scope: [:household_id, :plaid_detailed] }

  scope :for_household, ->(household) { where(household: household) }
  scope :defaults, -> { where(is_default: true) }
  scope :custom, -> { where(is_default: false) }

  # Plaid Personal Finance Categories (primary level)
  PLAID_PRIMARY_CATEGORIES = %w[
    INCOME
    TRANSFER_IN
    TRANSFER_OUT
    LOAN_PAYMENTS
    BANK_FEES
    ENTERTAINMENT
    FOOD_AND_DRINK
    GENERAL_MERCHANDISE
    HOME_IMPROVEMENT
    MEDICAL
    PERSONAL_CARE
    GENERAL_SERVICES
    GOVERNMENT_AND_NON_PROFIT
    TRANSPORTATION
    TRAVEL
    RENT_AND_UTILITIES
  ].freeze
end
