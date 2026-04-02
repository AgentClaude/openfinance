module Types
  class DailyCurvePointType < Types::BaseObject
    field :day, Integer, null: false
    field :period_a_cumulative, Float, null: true
    field :period_b_cumulative, Float, null: true
  end
end
