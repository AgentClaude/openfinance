module Types
  class TagType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :color, String, null: true
    field :household_id, ID, null: false

    def color
      object.color_hex
    end
  end
end
