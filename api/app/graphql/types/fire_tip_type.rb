module Types
  class FireTipType < Types::BaseObject
    field :category, String, null: false
    field :title, String, null: false
    field :description, String, null: false
  end
end
