# frozen_string_literal: true

module Types
  class TaxQuarterType < Types::BaseObject
    field :quarter, String, null: false
    field :start_date, String, null: false
    field :end_date, String, null: false
    field :estimated_payment_due, String, null: false
    field :income, Float, null: false
    field :deductible_expenses, Float, null: false
    field :transaction_count, Integer, null: false
  end
end
