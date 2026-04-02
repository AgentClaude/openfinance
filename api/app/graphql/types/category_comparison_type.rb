module Types
  class CategoryComparisonType < Types::BaseObject
    field :category_id, ID, null: true
    field :category_name, String, null: false
    field :category_icon, String, null: true
    field :category_color, String, null: true
    field :period_a_amount, Float, null: false
    field :period_b_amount, Float, null: false
    field :change, Float, null: false
    field :change_percent, Float, null: false
  end
end
