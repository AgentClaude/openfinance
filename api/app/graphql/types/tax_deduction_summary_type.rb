# frozen_string_literal: true

module Types
  class TaxDeductionSummaryType < Types::BaseObject
    field :standard_deduction, Float, null: false
    field :itemized_total, Float, null: false
    field :should_itemize, Boolean, null: false
    field :recommended_deduction, Float, null: false
    field :buckets, [Types::TaxDeductionBucketType], null: false
  end
end
