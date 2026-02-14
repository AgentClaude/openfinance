module Types
  class SplitInputType < GraphQL::Schema::InputObject
    argument :amount, Float, required: true
    argument :category_id, ID, required: false
    argument :description, String, required: false
  end
end
