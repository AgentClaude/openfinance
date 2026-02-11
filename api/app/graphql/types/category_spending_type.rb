module Types
  class CategorySpendingType < Types::BaseObject
    field :category_id, ID, null: true
    field :category_name, String, null: false
    field :amount, Float, null: false
    field :percentage, Float, null: true
    field :color, String, null: true
  end
end
