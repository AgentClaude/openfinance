module Types
  class CategoryInputType < GraphQL::Schema::InputObject
    argument :name, String, required: true
    argument :icon, String, required: false
    argument :color, String, required: false
    argument :group_name, String, required: false
    argument :parent_id, ID, required: false
  end
end
