module Types
  class CategoryHeatmapType < Types::BaseObject
    field :category_id, ID, null: false
    field :category_name, String, null: false
    field :category_icon, String, null: true
    field :category_color, String, null: true
    field :months, [Types::CategoryMonthAmountType], null: false
  end
end
