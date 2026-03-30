# frozen_string_literal: true

module Types
  class TaxEstimateType < Types::BaseObject
    field :gross_income, Float, null: false
    field :adjustments, Float, null: false
    field :agi, Float, null: false
    field :deduction_amount, Float, null: false
    field :deduction_type, String, null: false
    field :taxable_income, Float, null: false
    field :federal_tax, Float, null: false
    field :self_employment_tax, Float, null: false
    field :total_estimated_tax, Float, null: false
    field :effective_rate, Float, null: false
    field :marginal_rate, Float, null: false
    field :bracket_breakdown, [Types::TaxBracketType], null: false
  end
end
