module Types
  class CategoryType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :icon, String, null: true
    field :color, String, null: true
    field :group_name, String, null: true
    field :is_system, Boolean, null: false
    field :household_id, ID, null: true
    field :parent_id, ID, null: true
    field :children, [Types::CategoryType], null: false

    def color
      object.color.presence || object.color_hex
    end

    def children
      Category.where(parent_id: object.id).order(:display_order, :name)
    end
  end
end
