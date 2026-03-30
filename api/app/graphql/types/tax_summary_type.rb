# frozen_string_literal: true

module Types
  class TaxSummaryType < Types::BaseObject
    description 'Tax summary for a household over a given year'

    field :year, Integer, null: false
    field :filing_status, String, null: false
    field :income_summary, Types::TaxIncomeSummaryType, null: false
    field :deduction_summary, Types::TaxDeductionSummaryType, null: false
    field :tax_estimate, Types::TaxEstimateType, null: false
    field :quarterly_breakdown, [Types::TaxQuarterType], null: false
    field :category_details, [Types::TaxCategoryDetailType], null: false
    field :tips, [Types::TaxTipType], null: false
  end
end
