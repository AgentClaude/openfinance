# frozen_string_literal: true

module Types
  class TaxBracketType < Types::BaseObject
    field :rate, Float, null: false
    field :range_min, Float, null: false
    field :range_max, Float, null: true
    field :taxable_amount, Float, null: false
    field :tax, Float, null: false
  end
end
