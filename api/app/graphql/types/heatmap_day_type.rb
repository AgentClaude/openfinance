module Types
  class HeatmapDayType < Types::BaseObject
    field :date, String, null: false
    field :amount, Float, null: false
    field :day_of_week, Integer, null: false
    field :week, Integer, null: false
  end
end
