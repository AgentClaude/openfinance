module Types
  class TagInputType < GraphQL::Schema::InputObject
    argument :name, String, required: true
    argument :color, String, required: false
  end
end
