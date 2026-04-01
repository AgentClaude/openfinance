module Types
  class WeekdayAverageType < Types::BaseObject
    field :day_of_week, Integer, null: false
    field :day_name, String, null: false
    field :average, Float, null: false
    field :total, Float, null: false
    field :count, Integer, null: false
  end
end
