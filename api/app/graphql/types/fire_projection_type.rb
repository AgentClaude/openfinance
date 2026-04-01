module Types
  class FireProjectionType < Types::BaseObject
    field :year, Integer, null: false
    field :age, Integer, null: false
    field :portfolio_value, Float, null: false
    field :fire_number, Float, null: false
    field :is_fire_reached, Boolean, null: false
  end
end
