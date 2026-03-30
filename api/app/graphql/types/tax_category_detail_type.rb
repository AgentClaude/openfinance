# frozen_string_literal: true

module Types
  class TaxCategoryDetailType < Types::BaseObject
    field :category_id, ID, null: true
    field :category_name, String, null: false
    field :category_icon, String, null: true
    field :group_name, String, null: true
    field :is_income, Boolean, null: false
    field :tax_classification, String, null: false
    field :income_amount, Float, null: false
    field :expense_amount, Float, null: false
    field :transaction_count, Integer, null: false
  end
end
