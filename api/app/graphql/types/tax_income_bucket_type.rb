# frozen_string_literal: true

module Types
  class TaxIncomeBucketType < Types::BaseObject
    field :type, String, null: false
    field :label, String, null: false
    field :amount, Float, null: false
    field :transaction_count, Integer, null: false
    field :percentage, Float, null: false
    field :top_sources, [Types::TaxTopSourceType], null: false
  end
end
