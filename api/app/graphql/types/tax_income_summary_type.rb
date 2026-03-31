# frozen_string_literal: true

module Types
  class TaxIncomeSummaryType < Types::BaseObject
    field :total, Float, null: false
    field :buckets, [Types::TaxIncomeBucketType], null: false
  end
end
