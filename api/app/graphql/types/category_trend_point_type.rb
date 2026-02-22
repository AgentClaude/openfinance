module Types
  class CategoryTrendPointType < Types::BaseObject
    field :month, String, null: false
    field :category_id, ID, null: false
    field :category_name, String, null: false
    field :amount, Float, null: false
  end
end
