module Types
  class ForecastDayType < Types::BaseObject
    field :date, String, null: false
    field :balance, Float, null: false
    field :income, Float, null: false
    field :expenses, Float, null: false
    field :net, Float, null: false
    field :event_count, Integer, null: false
  end
end
