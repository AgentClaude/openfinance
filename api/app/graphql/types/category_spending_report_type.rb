module Types
  class CategorySpendingReportType < Types::BaseObject
    field :category_id, ID, null: true
    field :category_name, String, null: false
    field :category_icon, String, null: true
    field :category_color, String, null: true
    field :amount, Float, null: false
    field :percentage, Float, null: false
    field :transaction_count, Integer, null: false
  end
end
